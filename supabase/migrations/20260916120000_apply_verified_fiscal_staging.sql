-- 検証済みの財政stagingを公開正本へ反映する。
--
-- parser出力は fiscal_staging_records に不変のまま残し、QAで verified にした
-- 行だけを、資料版・集計範囲・分類・金額セット・金額根拠の正本へ写す。
-- 公開ガード（fiscal_publication_guard）を満たす順序で draft から published へ進め、
-- バッチは applied にして再適用を拒否する。
--
-- 同じ資料の差分適用（change_kind = 'changed'）と、公開済み改訂の入れ替えは
-- 後続PRで扱う。ここでは未対応の状態を明示的に失敗させる。
-- 一次根拠を持たない金額セット（corroborating だけの群）は公開できないため、
-- 公開ガードの遅延エラーではなく明示的な例外で止める。

-- 一次根拠として使える資料種別と議決段階の対応。
-- 欠落は「一次根拠にできない」を意味するため、false の行は作らない。
insert into public.fiscal_source_kind_event_rules (
  event_kind, decision_stage, source_kind, may_be_primary, rationale,
  reviewed_by, reviewed_at
) values
  (
    'initial_budget', 'proposed', 'budget_overview', true,
    '予算概要は当初予算案の款別内訳を示す公式資料で、提案段階の一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  ),
  (
    'initial_budget', 'passed', 'budget_overview', true,
    '予算概要が可決後の当初予算を示す場合の一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  ),
  (
    'initial_budget', 'passed', 'major_measures', true,
    '主要施策報告は可決済み当初予算の財源と事業額を示す一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  ),
  (
    'available_budget_snapshot', 'not_applicable', 'major_measures', true,
    '主要施策報告は年度末の予算現額を示す一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  ),
  (
    'available_budget_snapshot', 'not_applicable', 'execution_report', true,
    '執行状況報告は基準日時点の予算現額と執行額を示す一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  ),
  (
    'settlement', 'not_applicable', 'settlement_report', true,
    '決算概要は認定前の決算額を示す公式資料で、一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  ),
  (
    'settlement', 'not_applicable', 'major_measures', true,
    '主要施策報告は決算額と執行率を示す一次根拠にできる。',
    '10000000-0000-0000-0000-000000000001', now()
  )
on conflict (event_kind, decision_stage, source_kind) do nothing;

create function approve_fiscal_import_batch(
  p_batch_id uuid,
  p_reviewer_id uuid
)
returns public.fiscal_import_status_enum
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.fiscal_import_batches;
begin
  if p_batch_id is null or p_reviewer_id is null then
    raise exception 'fiscal import batch approval requires a batch and a reviewer';
  end if;

  select * into v_batch
  from public.fiscal_import_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'fiscal import batch % does not exist', p_batch_id;
  end if;
  if v_batch.status = 'approved' then
    return v_batch.status;
  end if;
  if v_batch.status <> 'awaiting_review' then
    raise exception 'fiscal import batch must be awaiting review to approve';
  end if;
  if exists (
    select 1
    from public.fiscal_staging_records record
    where record.batch_id = p_batch_id
      and (record.qa_status <> 'verified'
        or record.change_kind in ('ambiguous', 'missing'))
  ) then
    raise exception 'fiscal staging candidates must be verified before approval';
  end if;
  if exists (
    select 1
    from public.fiscal_staging_records record
    cross join lateral jsonb_array_elements(record.validation_results) item
    where record.batch_id = p_batch_id
      and item ->> 'severity' = 'hard_error'
  ) then
    raise exception 'fiscal staging candidates contain hard errors';
  end if;

  update public.fiscal_import_batches
  set status = 'approved'
  where id = p_batch_id;

  return 'approved'::public.fiscal_import_status_enum;
end;
$$;

create function apply_verified_fiscal_staging(
  p_batch_id uuid,
  p_applied_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.fiscal_import_batches;
  v_metadata jsonb;
  v_source_kind public.fiscal_source_kind_enum;
  v_fiscal_year smallint;
  v_series_code text;
  v_title text;
  v_document_id uuid;
  v_edition_id uuid;
  v_edition_key text;
  v_occurrence_id uuid;
  v_edition_observation_id uuid;
  v_scope_id uuid;
  v_account_id uuid;
  v_membership_id uuid;
  v_membership_occurrence_id uuid;
  v_membership_observation_id uuid;
  v_group record;
  v_record record;
  v_event_id uuid;
  v_amount_set_id uuid;
  v_amount_set_revision_id uuid;
  v_amount_set_occurrence_id uuid;
  v_amount_set_source_id uuid;
  v_classification_id uuid;
  v_classification_revision_id uuid;
  v_classification_occurrence_id uuid;
  v_amount_id uuid;
  v_amount_revision_id uuid;
  v_amount_occurrence_id uuid;
  v_event_kind public.fiscal_event_kind_enum;
  v_decision_stage public.fiscal_decision_stage_enum;
  v_measure public.fiscal_measure_enum;
  v_source_unit public.fiscal_source_unit_enum;
  v_as_of_date date;
  v_amount_yen bigint;
  v_null_reason public.fiscal_null_reason_enum;
  v_classification_key text;
  v_classification_scheme text;
  v_classification_label text;
  v_source_locator text;
  v_amount_count integer := 0;
  v_classification_count integer := 0;
  v_set_count integer := 0;
begin
  if p_batch_id is null or p_applied_by is null then
    raise exception 'fiscal staging apply requires a batch and an actor';
  end if;

  select * into v_batch
  from public.fiscal_import_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'fiscal import batch % does not exist', p_batch_id;
  end if;
  if v_batch.status <> 'approved' then
    raise exception 'fiscal import batch must be approved before apply';
  end if;
  if not exists (
    select 1
    from public.ingestion_source_versions source_version
    where source_version.id = v_batch.source_version_id
      and source_version.artifact_retention_state = 'retained'
  ) then
    raise exception 'fiscal staging apply requires a retained source artifact';
  end if;
  if not exists (
    select 1
    from public.ingestion_parse_runs parse_run
    where parse_run.id = v_batch.parse_run_id
      and parse_run.source_version_id = v_batch.source_version_id
      and parse_run.status = 'completed'
  ) then
    raise exception 'fiscal staging apply requires a completed parse run';
  end if;
  if exists (
    select 1
    from public.fiscal_staging_records record
    where record.batch_id = p_batch_id
      and (record.qa_status <> 'verified'
        or record.change_kind <> 'new')
  ) then
    raise exception
      'fiscal staging apply supports verified new candidates only';
  end if;
  -- 未対応の候補を黙って落とすと、資料に載っているのに公開正本に無い値ができる。
  if exists (
    select 1
    from public.fiscal_staging_records record
    where record.batch_id = p_batch_id
      and record.record_kind not in ('document_metadata', 'amount')
  ) then
    raise exception
      'fiscal staging apply does not support every record kind in the batch';
  end if;
  if exists (
    select 1
    from public.fiscal_staging_records record
    cross join lateral jsonb_array_elements(record.validation_results) item
    where record.batch_id = p_batch_id
      and item ->> 'severity' = 'hard_error'
  ) then
    raise exception 'fiscal staging candidates contain hard errors';
  end if;

  select record.parsed_payload into v_metadata
  from public.fiscal_staging_records record
  where record.batch_id = p_batch_id
    and record.record_kind = 'document_metadata';

  if v_metadata is null then
    raise exception 'fiscal staging batch requires document metadata';
  end if;

  v_source_kind := (v_metadata ->> 'sourceKind')
    ::public.fiscal_source_kind_enum;
  v_fiscal_year := (v_metadata ->> 'fiscalYear')::smallint;
  v_series_code := nullif(btrim(coalesce(v_metadata ->> 'seriesCode', '')), '');
  v_title := nullif(btrim(coalesce(v_metadata ->> 'title', '')), '');

  if v_source_kind is distinct from v_batch.source_kind then
    raise exception 'fiscal staging metadata source kind does not match batch';
  end if;
  if v_fiscal_year is distinct from v_batch.fiscal_year then
    raise exception 'fiscal staging metadata fiscal year does not match batch';
  end if;
  if v_fiscal_year is null or v_series_code is null or v_title is null then
    raise exception 'fiscal staging metadata is incomplete';
  end if;

  select scope.id into v_scope_id
  from public.fiscal_reporting_scopes scope
  where scope.code = 'general_account';
  select account.id into v_account_id
  from public.fiscal_accounts account
  where account.code = 'general';

  if v_scope_id is null or v_account_id is null then
    raise exception 'general account fiscal identity is missing';
  end if;

  -- 資料版
  select document.id into v_document_id
  from public.fiscal_source_documents document
  where document.source_kind = v_source_kind
    and document.series_code = v_series_code;

  if v_document_id is null then
    insert into public.fiscal_source_documents (source_kind, series_code)
    values (v_source_kind, v_series_code)
    returning id into v_document_id;
  end if;

  v_edition_key := 'fy' || v_fiscal_year::text;

  select edition.id into v_edition_id
  from public.fiscal_source_document_editions edition
  where edition.fiscal_source_document_id = v_document_id
    and edition.edition_key = v_edition_key;

  if v_edition_id is null then
    insert into public.fiscal_source_document_editions (
      fiscal_source_document_id, edition_key
    ) values (v_document_id, v_edition_key)
    returning id into v_edition_id;
  end if;

  if exists (
    select 1
    from public.fiscal_source_document_edition_observations observation
    where observation.edition_id = v_edition_id
      and observation.publication_state = 'published'
  ) then
    raise exception
      'published fiscal document edition cannot be replaced in place';
  end if;

  select occurrence.id into v_occurrence_id
  from public.fiscal_source_document_edition_source_occurrences occurrence
  where occurrence.ingestion_source_id = (
      select source_version.ingestion_source_id
      from public.ingestion_source_versions source_version
      where source_version.id = v_batch.source_version_id
    )
    and occurrence.source_edition_key = v_series_code || ':' || v_edition_key;

  if v_occurrence_id is null then
    insert into public.fiscal_source_document_edition_source_occurrences (
      edition_id, fiscal_source_document_id, ingestion_source_id,
      source_edition_key
    )
    select v_edition_id, v_document_id, source_version.ingestion_source_id,
      v_series_code || ':' || v_edition_key
    from public.ingestion_source_versions source_version
    where source_version.id = v_batch.source_version_id
    returning id into v_occurrence_id;
  end if;

  select observation.id into v_edition_observation_id
  from public.fiscal_source_document_edition_observations observation
  where observation.edition_source_occurrence_id = v_occurrence_id
    and observation.source_version_id = v_batch.source_version_id
    and observation.parse_run_id = v_batch.parse_run_id;

  if v_edition_observation_id is null then
    insert into public.fiscal_source_document_edition_observations (
      edition_id, fiscal_source_document_id, edition_source_occurrence_id,
      ingestion_source_id, source_version_id, parse_run_id,
      observation_revision, extraction_method, title, fiscal_year, publisher,
      source_locator
    )
    select v_edition_id, v_document_id, v_occurrence_id,
      source_version.ingestion_source_id, v_batch.source_version_id,
      v_batch.parse_run_id,
      coalesce((
        select max(observation.observation_revision)
        from public.fiscal_source_document_edition_observations observation
        where observation.edition_id = v_edition_id
      ), 0) + 1,
      'parser', v_title, v_fiscal_year, '沼津市',
      nullif(btrim(coalesce(v_metadata ->> 'url', '')), '')
    from public.ingestion_source_versions source_version
    where source_version.id = v_batch.source_version_id
    returning id into v_edition_observation_id;

    update public.fiscal_source_document_edition_observations
    set qa_status = 'verified', verified_by = p_applied_by,
      verified_at = now(), publication_state = 'reviewed'
    where id = v_edition_observation_id;
    update public.fiscal_source_document_edition_observations
    set publication_state = 'published'
    where id = v_edition_observation_id;
  end if;

  -- 集計範囲（一般会計。会計を持つため membership を必須にする）
  select membership.id into v_membership_id
  from public.fiscal_reporting_scope_memberships membership
  where membership.reporting_scope_id = v_scope_id
    and membership.fiscal_year = v_fiscal_year
    and membership.account_id = v_account_id;

  if v_membership_id is null then
    insert into public.fiscal_reporting_scope_memberships (
      reporting_scope_id, fiscal_year, account_id, member_key
    ) values (
      v_scope_id, v_fiscal_year, v_account_id,
      'account:' || v_account_id::text
    )
    returning id into v_membership_id;
  end if;

  select occurrence.id into v_membership_occurrence_id
  from public.fiscal_reporting_scope_membership_source_occurrences occurrence
  where occurrence.edition_source_occurrence_id = v_occurrence_id
    and occurrence.source_membership_key = 'account:' || v_account_id::text;

  if v_membership_occurrence_id is null then
    insert into public.fiscal_reporting_scope_membership_source_occurrences (
      membership_id, reporting_scope_id, fiscal_year, account_id,
      edition_source_occurrence_id, edition_id, ingestion_source_id,
      source_membership_key
    ) values (
      v_membership_id, v_scope_id, v_fiscal_year, v_account_id,
      v_occurrence_id, v_edition_id,
      (select source_version.ingestion_source_id
        from public.ingestion_source_versions source_version
        where source_version.id = v_batch.source_version_id),
      'account:' || v_account_id::text
    )
    returning id into v_membership_occurrence_id;
  end if;

  select observation.id into v_membership_observation_id
  from public.fiscal_reporting_scope_membership_observations observation
  where observation.membership_source_occurrence_id = v_membership_occurrence_id
    and observation.source_version_id = v_batch.source_version_id
    and observation.parse_run_id = v_batch.parse_run_id;

  -- 同じ年度・会計の公開済み金額セットが参照している集計範囲の観測は、
  -- superseded にすると公開ガードが参照不整合で失敗する。新しい資料が
  -- 同じ集計範囲を確認しているだけの場合は既存の公開観測を再利用する。
  if v_membership_observation_id is null then
    select observation.id into v_membership_observation_id
    from public.fiscal_reporting_scope_membership_observations observation
    where observation.membership_id = v_membership_id
      and observation.publication_state = 'published'
      and exists (
        select 1
        from public.fiscal_amount_set_revisions revision
        where revision.membership_observation_id = observation.id
          and revision.publication_state = 'published'
      );
  end if;

  if v_membership_observation_id is null then
    update public.fiscal_reporting_scope_membership_observations
    set publication_state = 'superseded'
    where membership_id = v_membership_id
      and publication_state = 'published';

    insert into public.fiscal_reporting_scope_membership_observations (
      membership_id, reporting_scope_id, fiscal_year, account_id,
      membership_source_occurrence_id, edition_source_occurrence_id,
      edition_observation_id, edition_id, ingestion_source_id,
      source_version_id, parse_run_id, evidence_revision, extraction_method,
      membership_role, source_member_name, display_name, source_locator
    )
    select v_membership_id, v_scope_id, v_fiscal_year, v_account_id,
      v_membership_occurrence_id, v_occurrence_id,
      v_edition_observation_id, v_edition_id,
      source_version.ingestion_source_id, v_batch.source_version_id,
      v_batch.parse_run_id, 1, 'parser', 'included', '一般会計', '一般会計',
      nullif(btrim(coalesce(v_metadata ->> 'url', '')), '')
    from public.ingestion_source_versions source_version
    where source_version.id = v_batch.source_version_id
    returning id into v_membership_observation_id;

    update public.fiscal_reporting_scope_membership_observations
    set qa_status = 'verified', verified_by = p_applied_by,
      verified_at = now(), publication_state = 'reviewed'
    where id = v_membership_observation_id;
    update public.fiscal_reporting_scope_membership_observations
    set publication_state = 'published'
    where id = v_membership_observation_id;
  end if;

  -- イベント・金額段階ごとに金額セットを作る
  for v_group in
    select
      record.parsed_payload ->> 'eventKind' as event_kind,
      record.parsed_payload ->> 'decisionStage' as decision_stage,
      nullif(record.parsed_payload ->> 'asOfDate', '') as as_of_date
    from public.fiscal_staging_records record
    where record.batch_id = p_batch_id
      and record.record_kind = 'amount'
    group by 1, 2, 3
    order by 1, 2, 3
  loop
    v_event_kind := v_group.event_kind::public.fiscal_event_kind_enum;
    v_decision_stage := v_group.decision_stage
      ::public.fiscal_decision_stage_enum;
    v_as_of_date := v_group.as_of_date::date;

    if not exists (
      select 1
      from public.fiscal_source_kind_event_rules rule
      where rule.event_kind = v_event_kind
        and rule.decision_stage = v_decision_stage
        and rule.source_kind = v_source_kind
        and rule.may_be_primary
    ) then
      raise exception
        'fiscal source kind % cannot be primary evidence for % / %',
        v_source_kind, v_event_kind, v_decision_stage;
    end if;

    -- parserの分割値や丸め値は corroborating として届く。公開する金額セットには
    -- 一次根拠の行が1件以上必要で、突合専用の資料だけでは公開できない。
    if not exists (
      select 1
      from public.fiscal_staging_records record
      where record.batch_id = p_batch_id
        and record.record_kind = 'amount'
        and record.parsed_payload ->> 'eventKind' = v_group.event_kind
        and record.parsed_payload ->> 'decisionStage' = v_group.decision_stage
        and nullif(record.parsed_payload ->> 'asOfDate', '')
          is not distinct from v_group.as_of_date
        and case
          when nullif(btrim(coalesce(
            record.parsed_payload ->> 'evidenceRole', ''
          )), '') is null then 'primary'
          else record.parsed_payload ->> 'evidenceRole'
        end = 'primary'
    ) then
      raise exception
        'fiscal staging apply requires primary evidence for % / %',
        v_event_kind, v_decision_stage;
    end if;

    select event.id into v_event_id
    from public.fiscal_events event
    where event.fiscal_year = v_fiscal_year
      and event.reporting_scope_id = v_scope_id
      and event.account_id = v_account_id
      and event.event_kind = v_event_kind
      and event.supplement_sequence is null
      and event.as_of_date is not distinct from v_as_of_date;

    if v_event_id is null then
      insert into public.fiscal_events (
        fiscal_year, reporting_scope_id, account_id, scope_membership_id,
        event_kind, as_of_date
      ) values (
        v_fiscal_year, v_scope_id, v_account_id, v_membership_id,
        v_event_kind, v_as_of_date
      )
      returning id into v_event_id;
    end if;

    select amount_set.id into v_amount_set_id
    from public.fiscal_amount_sets amount_set
    where amount_set.fiscal_event_id = v_event_id
      and amount_set.decision_stage = v_decision_stage;

    if v_amount_set_id is null then
      insert into public.fiscal_amount_sets (
        fiscal_event_id, event_kind, decision_stage
      ) values (v_event_id, v_event_kind, v_decision_stage)
      returning id into v_amount_set_id;
    end if;

    if exists (
      select 1
      from public.fiscal_amount_set_revisions revision
      where revision.amount_set_id = v_amount_set_id
        and revision.publication_state = 'published'
    ) then
      raise exception
        'published fiscal amount set cannot be replaced in place';
    end if;

    select occurrence.id into v_amount_set_occurrence_id
    from public.fiscal_amount_set_source_occurrences occurrence
    where occurrence.edition_source_occurrence_id = v_occurrence_id
      and occurrence.source_amount_set_key = 'amount-set:' || v_event_kind::text
        || ':' || v_decision_stage::text;

    if v_amount_set_occurrence_id is null then
      insert into public.fiscal_amount_set_source_occurrences (
        amount_set_id, edition_source_occurrence_id, edition_id,
        ingestion_source_id, source_amount_set_key
      )
      select v_amount_set_id, v_occurrence_id, v_edition_id,
        source_version.ingestion_source_id,
        'amount-set:' || v_event_kind::text || ':' || v_decision_stage::text
      from public.ingestion_source_versions source_version
      where source_version.id = v_batch.source_version_id
      returning id into v_amount_set_occurrence_id;
    end if;

    insert into public.fiscal_amount_set_revisions (
      amount_set_id, fiscal_event_id, event_kind, revision_number, effective_on,
      scope_membership_id, membership_observation_id, reporting_scope_id,
      fiscal_year, account_id
    ) values (
      v_amount_set_id, v_event_id, v_event_kind,
      coalesce((
        select max(revision.revision_number)
        from public.fiscal_amount_set_revisions revision
        where revision.amount_set_id = v_amount_set_id
      ), 0) + 1,
      v_as_of_date, v_membership_id, v_membership_observation_id, v_scope_id,
      v_fiscal_year, v_account_id
    )
    returning id into v_amount_set_revision_id;

    insert into public.fiscal_amount_set_sources (
      amount_set_id, amount_set_revision_id, amount_set_source_occurrence_id,
      edition_source_occurrence_id, edition_observation_id, edition_id,
      ingestion_source_id, source_version_id, parse_run_id, extraction_method,
      evidence_role, source_locator, qa_status, verified_by, verified_at
    )
    select v_amount_set_id, v_amount_set_revision_id,
      v_amount_set_occurrence_id, v_occurrence_id, v_edition_observation_id,
      v_edition_id, source_version.ingestion_source_id,
      v_batch.source_version_id, v_batch.parse_run_id, 'parser', 'primary',
      nullif(btrim(coalesce(v_metadata ->> 'url', '')), ''), 'verified',
      p_applied_by, now()
    from public.ingestion_source_versions source_version
    where source_version.id = v_batch.source_version_id
    returning id into v_amount_set_source_id;

    for v_record in
      select record.*
      from public.fiscal_staging_records record
      where record.batch_id = p_batch_id
        and record.record_kind = 'amount'
        and record.parsed_payload ->> 'eventKind' = v_group.event_kind
        and record.parsed_payload ->> 'decisionStage' = v_group.decision_stage
        and nullif(record.parsed_payload ->> 'asOfDate', '')
          is not distinct from v_group.as_of_date
      order by record.source_record_key
    loop
      if coalesce(v_record.parsed_payload ->> 'accountCode', 'general')
          <> 'general' then
        raise exception 'fiscal staging apply supports the general account only';
      end if;
      if coalesce(v_record.parsed_payload ->> 'reportingScopeCode',
          'general_account') <> 'general_account' then
        raise exception 'fiscal staging apply supports the general account scope only';
      end if;

      v_measure := (v_record.parsed_payload ->> 'measure')
        ::public.fiscal_measure_enum;
      v_source_unit := (v_record.parsed_payload ->> 'sourceUnit')
        ::public.fiscal_source_unit_enum;
      v_amount_yen := nullif(v_record.parsed_payload ->> 'amountYen', '')
        ::bigint;
      v_null_reason := nullif(
        v_record.parsed_payload ->> 'nullReason', ''
      )::public.fiscal_null_reason_enum;
      if v_measure is null or v_source_unit is null then
        raise exception 'fiscal amount % is missing required fields',
          v_record.source_record_key;
      end if;
      if (v_amount_yen is null) = (v_null_reason is null) then
        raise exception 'fiscal amount % needs either a value or a null reason',
          v_record.source_record_key;
      end if;

      v_classification_key := nullif(
        btrim(coalesce(v_record.parsed_payload ->> 'classificationKey', '')),
        ''
      );
      v_classification_label := nullif(
        btrim(coalesce(
          v_record.parsed_payload ->> 'sourceClassificationLabel', ''
        )),
        ''
      );
      v_classification_scheme := coalesce(
        nullif(btrim(coalesce(
          v_record.parsed_payload ->> 'classificationScheme', ''
        )), ''),
        'purpose'
      );
      v_classification_id := null;

      if v_classification_key is not null then
        select classification.id into v_classification_id
        from public.fiscal_classifications classification
        where classification.scheme = v_classification_scheme
          and classification.canonical_key = v_classification_key;

        if v_classification_id is null then
          insert into public.fiscal_classifications (scheme, canonical_key)
          values (v_classification_scheme, v_classification_key)
          returning id into v_classification_id;
        end if;

        select revision.id into v_classification_revision_id
        from public.fiscal_classification_revisions revision
        where revision.classification_id = v_classification_id
          and revision.publication_state = 'published'
          and revision.valid_from_fiscal_year <= v_fiscal_year
          and coalesce(revision.valid_to_fiscal_year, 32767) >= v_fiscal_year;

        if v_classification_revision_id is null then
          -- 既存の公開版より前の年度を取り込むときは、公開期間が重ならない
          -- ように次に公開済みの開始年度の直前で閉じる。
          insert into public.fiscal_classification_revisions (
            classification_id, scheme, revision_number, display_label,
            valid_from_fiscal_year, valid_to_fiscal_year
          ) values (
            v_classification_id, v_classification_scheme,
            coalesce((
              select max(revision.revision_number)
              from public.fiscal_classification_revisions revision
              where revision.classification_id = v_classification_id
            ), 0) + 1,
            coalesce(v_classification_label, v_classification_key),
            v_fiscal_year,
            (
              select (min(revision.valid_from_fiscal_year) - 1)::smallint
              from public.fiscal_classification_revisions revision
              where revision.classification_id = v_classification_id
                and revision.publication_state = 'published'
                and revision.valid_from_fiscal_year > v_fiscal_year
            )
          )
          returning id into v_classification_revision_id;

          select occurrence.id into v_classification_occurrence_id
          from public.fiscal_classification_source_occurrences occurrence
          where occurrence.edition_source_occurrence_id = v_occurrence_id
            and occurrence.scheme = v_classification_scheme
            and occurrence.source_classification_key =
              v_classification_scheme || ':' || v_classification_key;

          if v_classification_occurrence_id is null then
            insert into public.fiscal_classification_source_occurrences (
              classification_id, scheme, edition_source_occurrence_id,
              edition_id, ingestion_source_id, source_classification_key
            )
            select v_classification_id, v_classification_scheme,
              v_occurrence_id, v_edition_id,
              source_version.ingestion_source_id,
              v_classification_scheme || ':' || v_classification_key
            from public.ingestion_source_versions source_version
            where source_version.id = v_batch.source_version_id
            returning id into v_classification_occurrence_id;
          end if;

          insert into public.fiscal_classification_sources (
            classification_revision_id, classification_id, scheme,
            classification_source_occurrence_id,
            edition_source_occurrence_id, edition_observation_id, edition_id,
            ingestion_source_id, source_version_id, parse_run_id, source_code,
            source_label, observed_fiscal_year, extraction_method, qa_status,
            verified_by, verified_at
          )
          select v_classification_revision_id, v_classification_id,
            v_classification_scheme, v_classification_occurrence_id,
            v_occurrence_id, v_edition_observation_id, v_edition_id,
            source_version.ingestion_source_id, v_batch.source_version_id,
            v_batch.parse_run_id, v_classification_key,
            coalesce(v_classification_label, v_classification_key),
            v_fiscal_year, 'parser', 'verified', p_applied_by, now()
          from public.ingestion_source_versions source_version
          where source_version.id = v_batch.source_version_id;

          update public.fiscal_classification_revisions
          set qa_status = 'verified', reviewed_by = p_applied_by,
            reviewed_at = now(), publication_state = 'reviewed'
          where id = v_classification_revision_id;
          update public.fiscal_classification_revisions
          set publication_state = 'published'
          where id = v_classification_revision_id;

          v_classification_count := v_classification_count + 1;
        elsif exists (
          select 1
          from public.fiscal_classification_revisions revision
          where revision.id = v_classification_revision_id
            and revision.display_label is distinct from
              coalesce(v_classification_label, v_classification_key)
        ) then
          raise exception
            'published fiscal classification label changed for % / %',
            v_classification_scheme, v_classification_key;
        end if;
      end if;

      select amount.id into v_amount_id
      from public.fiscal_amounts amount
      where amount.amount_set_id = v_amount_set_id
        and amount.classification_id is not distinct from v_classification_id
        and amount.measure = v_measure;

      if v_amount_id is null then
        insert into public.fiscal_amounts (
          amount_set_id, created_for_amount_set_revision_id, classification_id,
          measure
        ) values (
          v_amount_set_id, v_amount_set_revision_id, v_classification_id,
          v_measure
        )
        returning id into v_amount_id;
      end if;

      insert into public.fiscal_amount_revisions (
        amount_id, amount_set_id, amount_set_revision_id, revision_number,
        amount_yen, null_reason, qa_status, verified_by, verified_at
      ) values (
        v_amount_id, v_amount_set_id, v_amount_set_revision_id,
        coalesce((
          select max(revision.revision_number)
          from public.fiscal_amount_revisions revision
          where revision.amount_id = v_amount_id
        ), 0) + 1,
        v_amount_yen, v_null_reason, 'verified', p_applied_by, now()
      )
      returning id into v_amount_revision_id;

      insert into public.fiscal_amount_source_occurrences (
        amount_id, amount_set_id, amount_set_source_occurrence_id,
        ingestion_source_id, source_amount_key
      )
      select v_amount_id, v_amount_set_id, v_amount_set_occurrence_id,
        source_version.ingestion_source_id, v_record.source_record_key
      from public.ingestion_source_versions source_version
      where source_version.id = v_batch.source_version_id
      returning id into v_amount_occurrence_id;

      insert into public.fiscal_amount_evidence (
        amount_id, amount_set_id, amount_revision_id, amount_set_revision_id,
        amount_source_occurrence_id, amount_set_source_occurrence_id,
        ingestion_source_id, amount_set_source_id, source_version_id,
        parse_run_id, evidence_revision, source_value_text,
        source_value_numeric, source_unit, normalized_amount_yen,
        normalized_null_reason, source_page, source_table, qa_status,
        verified_by, verified_at
      )
      select v_amount_id, v_amount_set_id, v_amount_revision_id,
        v_amount_set_revision_id, v_amount_occurrence_id,
        v_amount_set_occurrence_id, source_version.ingestion_source_id,
        v_amount_set_source_id, v_batch.source_version_id,
        v_batch.parse_run_id, 1,
        nullif(btrim(coalesce(v_record.parsed_payload ->> 'sourceValueText',
          '')), ''),
        nullif(btrim(coalesce(v_record.parsed_payload ->> 'sourceValueNumeric',
          '')), '')::numeric,
        v_source_unit, v_amount_yen, v_null_reason,
        nullif(btrim(coalesce(v_record.parsed_payload ->> 'sourcePage', '')), ''),
        nullif(btrim(coalesce(v_record.parsed_payload ->> 'sourceTable', '')), ''),
        'verified', p_applied_by, now()
      from public.ingestion_source_versions source_version
      where source_version.id = v_batch.source_version_id;

      v_amount_count := v_amount_count + 1;
    end loop;

    update public.fiscal_amount_set_revisions
    set qa_status = 'verified', reviewed_by = p_applied_by, reviewed_at = now(),
      publication_state = 'reviewed'
    where id = v_amount_set_revision_id;
    update public.fiscal_amount_set_revisions
    set publication_state = 'published'
    where id = v_amount_set_revision_id;

    v_set_count := v_set_count + 1;
  end loop;

  if v_amount_count = 0 then
    raise exception 'fiscal staging batch has no amount candidates to apply';
  end if;

  update public.fiscal_import_batches
  set status = 'applied'
  where id = p_batch_id;

  return jsonb_build_object(
    'batchId', p_batch_id,
    'sourceDocumentId', v_document_id,
    'editionObservationId', v_edition_observation_id,
    'amountSetCount', v_set_count,
    'amountCount', v_amount_count,
    'classificationCount', v_classification_count,
    'fiscalYear', v_fiscal_year
  );
end;
$$;

revoke all on function approve_fiscal_import_batch(uuid, uuid)
  from public, anon, authenticated;
revoke all on function apply_verified_fiscal_staging(uuid, uuid)
  from public, anon, authenticated;
grant execute on function approve_fiscal_import_batch(uuid, uuid)
  to service_role;
grant execute on function apply_verified_fiscal_staging(uuid, uuid)
  to service_role;

comment on function approve_fiscal_import_batch(uuid, uuid) is
  '検証済みの財政staging候補だけを含むバッチを公開反映可能な状態へ進める。';
comment on function apply_verified_fiscal_staging(uuid, uuid) is
  '検証済みの財政stagingを資料版・集計範囲・分類・金額の公開正本へ反映する。';
