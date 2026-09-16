import { describe, expect, it } from "vitest";
import { executeInTestDatabase } from "./ingestion-audit-test-database";

type FixtureIds = {
  sourceId: string;
  sourceVersionId: string;
  runId: string;
  parseRunId: string;
  contentHash: string;
};

const PRIMARY: FixtureIds = {
  sourceId: "31000000-0000-0000-0000-000000000001",
  sourceVersionId: "31000000-0000-0000-0000-000000000002",
  runId: "31000000-0000-0000-0000-000000000003",
  parseRunId: "31000000-0000-0000-0000-000000000004",
  contentHash: "sha256:fiscal-apply-test",
};

const SECONDARY: FixtureIds = {
  sourceId: "31000000-0000-0000-0000-000000000101",
  sourceVersionId: "31000000-0000-0000-0000-000000000102",
  runId: "31000000-0000-0000-0000-000000000103",
  parseRunId: "31000000-0000-0000-0000-000000000104",
  contentHash: "sha256:fiscal-apply-test-secondary",
};

const TERTIARY: FixtureIds = {
  sourceId: "31000000-0000-0000-0000-000000000201",
  sourceVersionId: "31000000-0000-0000-0000-000000000202",
  runId: "31000000-0000-0000-0000-000000000203",
  parseRunId: "31000000-0000-0000-0000-000000000204",
  contentHash: "sha256:fiscal-apply-test-tertiary",
};

const REVIEWER_ID = "31000000-0000-0000-0000-000000000099";
const MATCHED_TARGET_ID = "31000000-0000-0000-0000-000000000098";
const FISCAL_YEAR = 2091;
const EARLIER_FISCAL_YEAR = 2090;
const SERIES_CODE = "fiscal-apply-test-series";
const SECONDARY_SERIES_CODE = "fiscal-apply-test-series-secondary";
const TITLE = "令和73年度予算概要";
const SOURCE_URL = "https://example.com/fiscal-apply-test.pdf";

function ingestionFixtureSql(
  ids: FixtureIds,
  options: { retainArtifact?: boolean } = {}
): string {
  const retainArtifact = options.retainArtifact ?? true;
  return `
    insert into public.ingestion_sources (id, source, url) values (
      '${ids.sourceId}', 'fiscal_apply_test_${ids.sourceId.slice(-3)}',
      '${SOURCE_URL}'
    );
    insert into public.ingestion_source_versions (
      id, ingestion_source_id, content_hash, fetched_at
    ) values (
      '${ids.sourceVersionId}', '${ids.sourceId}', '${ids.contentHash}', now()
    );
    ${
      retainArtifact
        ? `select public.transition_ingestion_source_version_retention(
      '${ids.sourceVersionId}', 'retained', '${REVIEWER_ID}',
      'fiscal apply fixture', 'fiscal-apply-test/${ids.sourceId.slice(-3)}.pdf'
    );`
        : ""
    }
    insert into public.ingestion_runs (id, source) values (
      '${ids.runId}', 'fiscal_apply_test_${ids.sourceId.slice(-3)}'
    );
    insert into public.ingestion_parse_runs (
      id, ingestion_run_id, source_version_id, parser_name,
      parser_version, configuration_hash
    ) values (
      '${ids.parseRunId}', '${ids.runId}', '${ids.sourceVersionId}',
      'fiscal-apply-test', '1.0.0', '${ids.contentHash}:config'
    );
  `;
}

function batchIdSql(ids: FixtureIds): string {
  return `(select id from public.fiscal_import_batches
    where parse_run_id = '${ids.parseRunId}')`;
}

function jsonLiteral(value: unknown): string {
  return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
}

function documentMetadataRow(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    record_kind: "document_metadata",
    source_record_key: "document",
    content_fingerprint: "sha256:document",
    change_kind: "new",
    matched_target_id: null,
    parsed_payload: {
      sourceKind: "budget_overview",
      fiscalYear: FISCAL_YEAR,
      seriesCode: SERIES_CODE,
      title: TITLE,
      url: SOURCE_URL,
      ...overrides,
    },
    validation_results: [],
  };
}

type AmountRowOptions = {
  sourceRecordKey?: string;
  changeKind?: string;
  matchedTargetId?: string | null;
  validationResults?: Record<string, unknown>[];
  payload?: Record<string, unknown>;
};

function amountRow(options: AmountRowOptions = {}): Record<string, unknown> {
  const sourceRecordKey = options.sourceRecordKey ?? "amount:assembly";
  return {
    record_kind: "amount",
    source_record_key: sourceRecordKey,
    content_fingerprint: `sha256:${sourceRecordKey}`,
    change_kind: options.changeKind ?? "new",
    matched_target_id: options.matchedTargetId ?? null,
    parsed_payload: {
      eventKind: "initial_budget",
      decisionStage: "proposed",
      measure: "expenditure_budget",
      sourceUnit: "yen",
      amountYen: "1000",
      classificationKey: "assembly",
      sourceClassificationLabel: "議会費",
      classificationScheme: "purpose",
      ...options.payload,
    },
    validation_results: options.validationResults ?? [],
  };
}

function saveBatchSql(
  ids: FixtureIds,
  rows: Record<string, unknown>[],
  options: { sourceKind?: string; fiscalYear?: number | null } = {}
): string {
  return `select public.save_fiscal_staging(
    '${ids.sourceVersionId}',
    '${ids.parseRunId}',
    '${options.sourceKind ?? "budget_overview"}',
    'fiscal-apply-test',
    '1.0.0',
    ${options.fiscalYear === undefined ? FISCAL_YEAR : options.fiscalYear}
      ::smallint,
    ${jsonLiteral(rows)},
    ${rows.length},
    '[]'::jsonb,
    'completed',
    now()
  );`;
}

function verifyRecordsSql(ids: FixtureIds): string {
  return `
    update public.fiscal_staging_records
    set qa_status = 'verified', reviewed_by = '${REVIEWER_ID}',
      reviewed_at = now()
    where batch_id = ${batchIdSql(ids)};
  `;
}

function approveCallSql(ids: FixtureIds): string {
  return `public.approve_fiscal_import_batch(
    ${batchIdSql(ids)}, '${REVIEWER_ID}'
  )`;
}

function applyCallSql(ids: FixtureIds): string {
  return `public.apply_verified_fiscal_staging(
    ${batchIdSql(ids)}, '${REVIEWER_ID}'
  )`;
}

function preparedBatchSql(
  ids: FixtureIds,
  rows: Record<string, unknown>[] = [
    documentMetadataRow(),
    amountRow(),
    amountRow({
      sourceRecordKey: "amount:total",
      payload: {
        classificationKey: null,
        sourceClassificationLabel: null,
        classificationScheme: null,
        amountYen: null,
        nullReason: "not_published",
      },
    }),
  ]
): string {
  return `
    ${ingestionFixtureSql(ids)}
    ${saveBatchSql(ids, rows)}
    ${verifyRecordsSql(ids)}
  `;
}

function expectRaiseSql(statement: string, expectedMessage: string): string {
  return `
    do $block$
    begin
      begin
        ${statement};
        raise exception 'unexpectedly succeeded';
      exception when others then
        if sqlerrm not like '%${expectedMessage}%' then raise; end if;
      end;
    end;
    $block$;
  `;
}

describe("fiscal_source_kind_event_rules", () => {
  it("一次根拠にできる資料種別と議決段階だけを初期登録する", () => {
    const output = executeInTestDatabase(`
      begin;
      do $block$
      begin
        if exists (
          select 1 from public.fiscal_source_kind_event_rules
          where not may_be_primary
        ) then
          raise exception 'rules must only register primary evidence';
        end if;
        if (
          select count(*) from public.fiscal_source_kind_event_rules
          where (event_kind, decision_stage, source_kind) in (
            ('initial_budget', 'proposed', 'budget_overview'),
            ('initial_budget', 'passed', 'budget_overview'),
            ('initial_budget', 'passed', 'major_measures'),
            ('available_budget_snapshot', 'not_applicable', 'major_measures'),
            ('available_budget_snapshot', 'not_applicable', 'execution_report'),
            ('settlement', 'not_applicable', 'settlement_report'),
            ('settlement', 'not_applicable', 'major_measures')
          )
        ) <> 7 then
          raise exception 'primary evidence rules are incomplete';
        end if;
        if exists (
          select 1 from public.fiscal_source_kind_event_rules
          where event_kind = 'settlement' and source_kind = 'budget_overview'
        ) then
          raise exception 'settlement must not accept a budget overview';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });
});

describe("approve_fiscal_import_batch()", () => {
  it("検証済みの新規候補だけを含むバッチを承認する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      do $block$
      declare
        v_status text;
      begin
        select ${approveCallSql(PRIMARY)}::text into v_status;
        if v_status <> 'approved' then
          raise exception 'unexpected approval status %', v_status;
        end if;
        if (select status::text from public.fiscal_import_batches
              where parse_run_id = '${PRIMARY.parseRunId}')
            <> 'approved' then
          raise exception 'batch was not approved';
        end if;
        if exists (
          select 1
          from public.fiscal_amount_revisions revision
          join public.fiscal_amount_set_revisions set_revision
            on set_revision.id = revision.amount_set_revision_id
          join public.fiscal_amount_sets amount_set
            on amount_set.id = set_revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where event.fiscal_year = ${FISCAL_YEAR}
        ) then
          raise exception 'approval must not write canonical amounts';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("未検証の候補が残るバッチの承認を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${ingestionFixtureSql(PRIMARY)}
      ${saveBatchSql(PRIMARY, [documentMetadataRow(), amountRow()])}
      ${expectRaiseSql(
        `perform ${approveCallSql(PRIMARY)}`,
        "must be verified before approval"
      )}
      do $block$
      begin
        if (select status::text from public.fiscal_import_batches
              where parse_run_id = '${PRIMARY.parseRunId}')
            <> 'awaiting_review' then
          raise exception 'rejected approval changed the batch status';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("hard_errorを持つ候補の承認を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY, [
        documentMetadataRow(),
        amountRow({
          validationResults: [
            {
              rule_code: "amount_control_total",
              severity: "hard_error",
              message: "合計が一致しません",
            },
          ],
        }),
      ])}
      ${expectRaiseSql(
        `perform ${approveCallSql(PRIMARY)}`,
        "fiscal staging candidates contain hard errors"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("確認待ちでないバッチの承認を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${ingestionFixtureSql(SECONDARY)}
      insert into public.fiscal_import_batches (
        id, parse_run_id, source_version_id, source_kind,
        profile_key, profile_version, fiscal_year
      ) values (
        '31000000-0000-0000-0000-000000000110',
        '${SECONDARY.parseRunId}', '${SECONDARY.sourceVersionId}',
        'budget_overview', 'fiscal-apply-test', '1.0.0', ${FISCAL_YEAR}
      );
      ${expectRaiseSql(
        `perform public.approve_fiscal_import_batch(
          '31000000-0000-0000-0000-000000000110', '${REVIEWER_ID}'
        )`,
        "must be awaiting review to approve"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("service_roleだけに実行権限を与える", () => {
    const output = executeInTestDatabase(`
      select (
        has_function_privilege(
          'service_role',
          'public.approve_fiscal_import_batch(uuid,uuid)', 'execute'
        )::text || '|' ||
        has_function_privilege(
          'anon',
          'public.approve_fiscal_import_batch(uuid,uuid)', 'execute'
        )::text || '|' ||
        has_function_privilege(
          'authenticated',
          'public.approve_fiscal_import_batch(uuid,uuid)', 'execute'
        )::text);
    `);

    expect(output).toBe("true|false|false");
  });
});

describe("apply_verified_fiscal_staging()", () => {
  it("検証済み候補を資料版・集計範囲・分類・金額の公開正本へ反映する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      do $block$
      declare
        v_result jsonb;
      begin
        select ${applyCallSql(PRIMARY)} into v_result;
        if (v_result ->> 'amountSetCount')::integer <> 1
          or (v_result ->> 'amountCount')::integer <> 2
          or (v_result ->> 'classificationCount')::integer <> 1
          or (v_result ->> 'fiscalYear')::integer <> ${FISCAL_YEAR} then
          raise exception 'unexpected apply result %', v_result;
        end if;
        if (select status::text from public.fiscal_import_batches
              where parse_run_id = '${PRIMARY.parseRunId}') <> 'applied' then
          raise exception 'batch was not marked as applied';
        end if;
        if (
          select count(*)
          from public.fiscal_source_document_edition_observations
          where publication_state = 'published' and qa_status = 'verified'
            and title = '${TITLE}' and fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'published edition observation is missing';
        end if;
        if (
          select count(*)
          from public.fiscal_reporting_scope_membership_observations
          where publication_state = 'published' and qa_status = 'verified'
            and fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'published scope membership is missing';
        end if;
        if (
          select count(*)
          from public.fiscal_classification_revisions
          where publication_state = 'published' and display_label = '議会費'
            and valid_from_fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'published classification revision is missing';
        end if;
        if (
          select count(*)
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and revision.qa_status = 'verified'
            and amount_set.decision_stage = 'proposed'
            and event.event_kind = 'initial_budget'
            and event.fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'published amount set revision is missing';
        end if;
        if (
          select count(*)
          from public.fiscal_amount_revisions revision
          join public.fiscal_amount_set_revisions set_revision
            on set_revision.id = revision.amount_set_revision_id
           and set_revision.publication_state = 'published'
          join public.fiscal_amount_sets amount_set
            on amount_set.id = set_revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.amount_yen = 1000
            and event.fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'published amount value is missing';
        end if;
        if (
          select count(*)
          from public.fiscal_amount_revisions revision
          join public.fiscal_amount_set_revisions set_revision
            on set_revision.id = revision.amount_set_revision_id
           and set_revision.publication_state = 'published'
          join public.fiscal_amount_sets amount_set
            on amount_set.id = set_revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.amount_yen is null
            and revision.null_reason = 'not_published'
            and event.fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'published null amount with a reason is missing';
        end if;
        if (
          select count(*)
          from public.fiscal_amount_evidence evidence
          join public.fiscal_amount_revisions revision
            on revision.id = evidence.amount_revision_id
          where evidence.qa_status = 'verified'
            and evidence.verified_by = '${REVIEWER_ID}'
            and evidence.source_version_id = '${PRIMARY.sourceVersionId}'
            and revision.amount_yen = 1000
            and evidence.normalized_amount_yen = 1000
        ) <> 1 then
          raise exception 'published amount evidence is missing';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("未承認のバッチと適用済みバッチの再適用を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "must be approved before apply"
      )}
      select ${approveCallSql(PRIMARY)};
      select ${applyCallSql(PRIMARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "must be approved before apply"
      )}
      do $block$
      begin
        if (
          select count(*)
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and event.fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'repeated apply duplicated published revisions';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("原本が保持されていない資料の反映を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${ingestionFixtureSql(PRIMARY, { retainArtifact: false })}
      ${saveBatchSql(PRIMARY, [documentMetadataRow(), amountRow()])}
      ${verifyRecordsSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "requires a retained source artifact"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("差分候補と一次根拠にできない資料種別を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${ingestionFixtureSql(PRIMARY)}
      ${ingestionFixtureSql(SECONDARY)}
      ${saveBatchSql(PRIMARY, [
        documentMetadataRow(),
        amountRow({
          changeKind: "changed",
          matchedTargetId: MATCHED_TARGET_ID,
        }),
      ])}
      ${verifyRecordsSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "supports verified new candidates only"
      )}
      ${saveBatchSql(
        SECONDARY,
        [
          documentMetadataRow(),
          amountRow({
            payload: {
              eventKind: "settlement",
              decisionStage: "not_applicable",
            },
          }),
        ],
        { sourceKind: "budget_overview" }
      )}
      ${verifyRecordsSql(SECONDARY)}
      select ${approveCallSql(SECONDARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(SECONDARY)}`,
        "cannot be primary evidence for settlement"
      )}
      do $block$
      begin
        if exists (
          select 1
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and event.fiscal_year = ${FISCAL_YEAR}
        ) then
          raise exception 'rejected apply published a canonical amount set';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("一次根拠を欠く突合専用の候補を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${ingestionFixtureSql(PRIMARY)}
      ${saveBatchSql(PRIMARY, [
        documentMetadataRow(),
        amountRow({ payload: { evidenceRole: "corroborating" } }),
      ])}
      ${verifyRecordsSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "requires primary evidence for initial_budget / proposed"
      )}
      do $block$
      begin
        if exists (
          select 1
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and event.fiscal_year = ${FISCAL_YEAR}
        ) then
          raise exception
            'corroborating only batch published a canonical amount set';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("同じ集計範囲の公開観測を再利用して別の議決段階を取り込む", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      select ${applyCallSql(PRIMARY)};
      ${ingestionFixtureSql(SECONDARY)}
      ${saveBatchSql(SECONDARY, [
        documentMetadataRow({ seriesCode: SECONDARY_SERIES_CODE }),
        amountRow({ payload: { decisionStage: "passed" } }),
      ])}
      ${verifyRecordsSql(SECONDARY)}
      select ${approveCallSql(SECONDARY)};
      select ${applyCallSql(SECONDARY)};
      do $block$
      begin
        if (
          select count(*)
          from public.fiscal_reporting_scope_membership_observations
          where fiscal_year = ${FISCAL_YEAR}
            and publication_state = 'published'
        ) <> 1 then
          raise exception 'published membership observation was replaced';
        end if;
        if (
          select count(distinct revision.membership_observation_id)
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and event.fiscal_year = ${FISCAL_YEAR}
        ) <> 1 then
          raise exception 'membership observation was not reused';
        end if;
        if (
          select count(*)
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and event.fiscal_year = ${FISCAL_YEAR}
            and revision.membership_observation_id is null
        ) <> 0 then
          raise exception 'published amount set lost its membership observation';
        end if;
        if (
          select count(*)
          from public.fiscal_amount_set_revisions revision
          join public.fiscal_amount_sets amount_set
            on amount_set.id = revision.amount_set_id
          join public.fiscal_events event
            on event.id = amount_set.fiscal_event_id
          where revision.publication_state = 'published'
            and event.fiscal_year = ${FISCAL_YEAR}
            and amount_set.decision_stage = 'passed'
        ) <> 1 then
          raise exception 'second decision stage was not published';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("遡った年度の分類には公開期間の終端を設定する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      select ${applyCallSql(PRIMARY)};
      ${ingestionFixtureSql(TERTIARY)}
      ${saveBatchSql(
        TERTIARY,
        [documentMetadataRow({ fiscalYear: EARLIER_FISCAL_YEAR }), amountRow()],
        { fiscalYear: EARLIER_FISCAL_YEAR }
      )}
      ${verifyRecordsSql(TERTIARY)}
      select ${approveCallSql(TERTIARY)};
      select ${applyCallSql(TERTIARY)};
      do $block$
      begin
        if (
          select count(*)
          from public.fiscal_classification_revisions revision
          join public.fiscal_classifications classification
            on classification.id = revision.classification_id
          where classification.scheme = 'purpose'
            and classification.canonical_key = 'assembly'
            and revision.publication_state = 'published'
            and revision.valid_from_fiscal_year = ${EARLIER_FISCAL_YEAR}
            and revision.valid_to_fiscal_year = ${EARLIER_FISCAL_YEAR}
        ) <> 1 then
          raise exception 'earlier classification revision window is not closed';
        end if;
        if (
          select count(*)
          from public.fiscal_classification_revisions revision
          join public.fiscal_classifications classification
            on classification.id = revision.classification_id
          where classification.scheme = 'purpose'
            and classification.canonical_key = 'assembly'
            and revision.publication_state = 'published'
        ) <> 2 then
          raise exception 'classification revision was duplicated';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("確定していない差分候補を適用しない", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY, [
        documentMetadataRow(),
        amountRow({
          changeKind: "unchanged",
          matchedTargetId: MATCHED_TARGET_ID,
        }),
      ])}
      select ${approveCallSql(PRIMARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "supports verified new candidates only"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("未対応の種別の候補が残るバッチを適用しない", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      insert into public.fiscal_staging_records (
        batch_id, record_kind, source_record_key, content_fingerprint,
        change_kind, parsed_payload, validation_results, qa_status,
        reviewed_by, reviewed_at
      ) values (
        ${batchIdSql(PRIMARY)}, 'coverage', 'coverage:general',
        'sha256:coverage', 'new', '{}'::jsonb, '[]'::jsonb, 'verified',
        '${REVIEWER_ID}', now()
      );
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "does not support every record kind"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("hard_errorが残るバッチの適用を拒否する", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      insert into public.fiscal_staging_records (
        batch_id, record_kind, source_record_key, content_fingerprint,
        change_kind, parsed_payload, validation_results, qa_status,
        reviewed_by, reviewed_at
      ) values (
        ${batchIdSql(PRIMARY)}, 'amount', 'amount:late-arrival',
        'sha256:amount:late-arrival', 'new',
        ${jsonLiteral(
          amountRow({
            sourceRecordKey: "amount:late-arrival",
          }).parsed_payload
        )}, '[
        {"rule_code": "amount_control_total", "severity": "hard_error",
         "message": "合計が一致しません"}
      ]'::jsonb, 'verified', '${REVIEWER_ID}', now()
      );
      ${expectRaiseSql(
        `perform ${applyCallSql(PRIMARY)}`,
        "fiscal staging candidates contain hard errors"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("公開済みの金額セットを入れ替えない", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      select ${applyCallSql(PRIMARY)};
      ${ingestionFixtureSql(SECONDARY)}
      ${saveBatchSql(SECONDARY, [
        documentMetadataRow({ seriesCode: SECONDARY_SERIES_CODE }),
        amountRow({ payload: { amountYen: "2000" } }),
      ])}
      ${verifyRecordsSql(SECONDARY)}
      select ${approveCallSql(SECONDARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(SECONDARY)}`,
        "published fiscal amount set cannot be replaced in place"
      )}
      do $block$
      begin
        if (
          select count(*)
          from public.fiscal_amount_revisions revision
          join public.fiscal_amount_set_revisions set_revision
            on set_revision.id = revision.amount_set_revision_id
           and set_revision.publication_state = 'published'
          where revision.amount_yen = 2000
        ) <> 0 then
          raise exception 'rejected apply published the replacement amount';
        end if;
      end;
      $block$;
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("公開済みの資料版を入れ替えない", () => {
    const output = executeInTestDatabase(`
      begin;
      ${preparedBatchSql(PRIMARY)}
      select ${approveCallSql(PRIMARY)};
      select ${applyCallSql(PRIMARY)};
      ${ingestionFixtureSql(SECONDARY)}
      ${saveBatchSql(SECONDARY, [
        documentMetadataRow(),
        amountRow({ payload: { amountYen: "2000" } }),
      ])}
      ${verifyRecordsSql(SECONDARY)}
      select ${approveCallSql(SECONDARY)};
      ${expectRaiseSql(
        `perform ${applyCallSql(SECONDARY)}`,
        "published fiscal document edition cannot be replaced in place"
      )}
      rollback;
    `);

    expect(output).toContain("ROLLBACK");
  });

  it("service_roleだけに実行権限を与える", () => {
    const output = executeInTestDatabase(`
      select (
        has_function_privilege(
          'service_role',
          'public.apply_verified_fiscal_staging(uuid,uuid)', 'execute'
        )::text || '|' ||
        has_function_privilege(
          'anon',
          'public.apply_verified_fiscal_staging(uuid,uuid)', 'execute'
        )::text || '|' ||
        has_function_privilege(
          'authenticated',
          'public.apply_verified_fiscal_staging(uuid,uuid)', 'execute'
        )::text);
    `);

    expect(output).toBe("true|false|false");
  });
});
