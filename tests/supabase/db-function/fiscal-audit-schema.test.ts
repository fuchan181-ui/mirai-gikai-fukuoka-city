import { describe, expect, it } from "vitest";
import { executeInTestDatabase } from "./ingestion-audit-test-database";

describe("財政coverage・分類監査schema", () => {
  it("nullを含むcoverage自然キーの重複を拒否する", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      declare scope_id uuid;
      begin
        select id into scope_id from public.fiscal_reporting_scopes
          where code = 'general_account';
        insert into public.fiscal_data_coverage (
          fiscal_year, reporting_scope_id, source_kind, data_kind
        ) values (2092, scope_id, 'budget_overview', 'amount_set');

        begin
          insert into public.fiscal_data_coverage (
            fiscal_year, reporting_scope_id, source_kind, data_kind
          ) values (2092, scope_id, 'budget_overview', 'amount_set');
          raise exception 'duplicate coverage unexpectedly succeeded';
        exception
          when unique_violation then null;
        end;
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });

  it("coverage状態と件数の矛盾を拒否する", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      declare scope_id uuid; coverage_id uuid;
      begin
        select id into scope_id from public.fiscal_reporting_scopes
          where code = 'general_account';
        insert into public.fiscal_data_coverage (
          fiscal_year, reporting_scope_id, source_kind, data_kind
        ) values (2091, scope_id, 'budget_overview', 'classification')
          returning id into coverage_id;

        begin
          insert into public.fiscal_data_coverage_observations (
            coverage_id, fiscal_year, reporting_scope_id,
            source_kind, data_kind, observation_key, state,
            record_presence, expected_count, matched_count
          ) values (
            coverage_id, 2091, scope_id, 'budget_overview',
            'classification', 'invalid-absence', 'collected',
            'absent', 1, 0
          );
          raise exception 'invalid coverage matrix unexpectedly succeeded';
        exception
          when check_violation then null;
        end;
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });

  it("coverageの代表的な正常状態を区別して保持する", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      declare scope_id uuid; coverage_id uuid;
      begin
        select id into scope_id from public.fiscal_reporting_scopes
          where code = 'general_account';
        insert into public.fiscal_data_coverage (
          fiscal_year, reporting_scope_id, source_kind, data_kind
        ) values (2088, scope_id, 'budget_overview', 'amount_set')
          returning id into coverage_id;
        insert into public.fiscal_data_coverage_observations (
          coverage_id, fiscal_year, reporting_scope_id,
          source_kind, data_kind, observation_key, state,
          record_presence, expected_count, matched_count
        ) values
          (coverage_id, 2088, scope_id, 'budget_overview', 'amount_set',
            'present', 'collected', 'present', 1, 1),
          (coverage_id, 2088, scope_id, 'budget_overview', 'amount_set',
            'absent', 'collected', 'absent', 0, 0),
          (coverage_id, 2088, scope_id, 'budget_overview', 'amount_set',
            'partial', 'partial', 'present', 2, 1),
          (coverage_id, 2088, scope_id, 'budget_overview', 'amount_set',
            'not-applicable', 'not_applicable', 'unknown', null, null),
          (coverage_id, 2088, scope_id, 'budget_overview', 'amount_set',
            'unavailable', 'source_unavailable', 'unknown', null, null),
          (coverage_id, 2088, scope_id, 'budget_overview', 'amount_set',
            'error', 'error', 'unknown', null, null);
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });

  it("coverageとmappingの公開行をdraftから開始させる", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      declare
        scope_id uuid;
        coverage_id uuid;
        mapping_id uuid;
      begin
        select id into scope_id from public.fiscal_reporting_scopes
          where code = 'general_account';
        insert into public.fiscal_data_coverage (
          fiscal_year, reporting_scope_id, source_kind, data_kind
        ) values (2090, scope_id, 'budget_overview', 'amount_set')
          returning id into coverage_id;

        begin
          insert into public.fiscal_data_coverage_observations (
            coverage_id, fiscal_year, reporting_scope_id,
            source_kind, data_kind, observation_key, state,
            record_presence, expected_count, matched_count,
            observed_at, qa_status, publication_state,
            reviewed_by, reviewed_at
          ) values (
            coverage_id, 2090, scope_id, 'budget_overview',
            'amount_set', 'publish-attempt', 'collected',
            'present', 1, 1, now(), 'verified', 'published',
            gen_random_uuid(), now()
          );
          raise exception 'coverage publication unexpectedly succeeded';
        exception
          when others then
            if sqlerrm not like '%must start as draft%' then raise; end if;
        end;

        insert into public.fiscal_classification_mappings (
          scheme, mapping_key
        ) values ('purpose', 'test-map') returning id into mapping_id;
        begin
          insert into public.fiscal_classification_mapping_revisions (
            mapping_id, scheme, revision_number, relation_kind,
            effective_fiscal_year, qa_status, publication_state,
            reviewed_by, reviewed_at
          ) values (
            mapping_id, 'purpose', 1, 'rename', 2090,
            'verified', 'published', gen_random_uuid(), now()
          );
          raise exception 'mapping publication unexpectedly succeeded';
        exception
          when others then
            if sqlerrm not like '%must start as draft%' then raise; end if;
        end;
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });

  it("mapping memberを同じschemeの分類だけに制限する", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      declare mapping_id uuid; revision_id uuid; classification_id uuid;
      begin
        insert into public.fiscal_classification_mappings (
          scheme, mapping_key
        ) values ('purpose', 'scheme-check') returning id into mapping_id;
        insert into public.fiscal_classification_mapping_revisions (
          mapping_id, scheme, revision_number, relation_kind,
          effective_fiscal_year
        ) values (mapping_id, 'purpose', 1, 'rename', 2089)
          returning id into revision_id;
        insert into public.fiscal_classifications (scheme, canonical_key)
        values ('nature', 'wrong-scheme') returning id into classification_id;

        begin
          insert into public.fiscal_classification_mapping_members (
            mapping_revision_id, mapping_id, scheme,
            classification_id, direction, member_order
          ) values (
            revision_id, mapping_id, 'purpose',
            classification_id, 'from', 1
          );
          raise exception 'cross-scheme member unexpectedly succeeded';
        exception
          when foreign_key_violation then null;
        end;
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });

  it("新しい安定正本と監査snapshotを追記専用にする", () => {
    const result = executeInTestDatabase(`
      select string_agg(event_object_table || ':' || trigger_name, E'\n')
      from information_schema.triggers
      where event_object_schema = 'public'
        and event_object_table in (
          'fiscal_data_coverage',
          'fiscal_data_coverage_observations',
          'fiscal_classification_source_occurrences',
          'fiscal_classification_sources',
          'fiscal_classification_mappings',
          'fiscal_classification_mapping_revisions',
          'fiscal_event_bill_link_source_occurrences',
          'fiscal_event_bill_link_sources'
        );
    `);

    expect(result).toContain("fiscal_data_coverage:");
    expect(result).toContain("fiscal_data_coverage_observations:");
    expect(result).toContain("fiscal_classification_sources:");
    expect(result).toContain("fiscal_event_bill_link_sources:");
  });

  it("新しいcoverage正本と観測の変更・削除・truncateを拒否する", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      declare scope_id uuid; coverage_id uuid; observation_id uuid;
      begin
        select id into scope_id from public.fiscal_reporting_scopes
          where code = 'general_account';
        insert into public.fiscal_data_coverage (
          fiscal_year, reporting_scope_id, source_kind, data_kind
        ) values (2087, scope_id, 'budget_overview', 'amount_set')
          returning id into coverage_id;
        insert into public.fiscal_data_coverage_observations (
          coverage_id, fiscal_year, reporting_scope_id,
          source_kind, data_kind, observation_key, state,
          record_presence, expected_count, matched_count
        ) values (
          coverage_id, 2087, scope_id, 'budget_overview',
          'amount_set', 'immutable', 'collected', 'present', 1, 1
        ) returning id into observation_id;

        begin
          update public.fiscal_data_coverage
          set data_kind = 'classification' where id = coverage_id;
          raise exception 'stable update unexpectedly succeeded';
        exception
          when others then
            if sqlerrm not like '%stable identity is append-only%' then raise; end if;
        end;
        begin
          delete from public.fiscal_data_coverage_observations
          where id = observation_id;
          raise exception 'audit delete unexpectedly succeeded';
        exception
          when others then
            if sqlerrm not like '%publication history is append-only%' then raise; end if;
        end;
        begin
          truncate public.fiscal_classification_mapping_sources;
          raise exception 'audit truncate unexpectedly succeeded';
        exception
          when others then
            if sqlerrm not like '%audit snapshot is append-only%' then raise; end if;
        end;
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });

  it("資料種別ルールでeventとdecision stageの組合せを制約する", () => {
    const result = executeInTestDatabase(`
      begin;
      do $$
      begin
        insert into public.fiscal_source_kind_event_rules (
          event_kind, decision_stage, source_kind, may_be_primary,
          rationale, reviewed_by, reviewed_at
        ) values (
          'available_budget_snapshot', 'not_applicable', 'budget_overview',
          true,
          '予算概要は当初予算案の一次資料', gen_random_uuid(), now()
        );
        insert into public.fiscal_source_kind_event_rules (
          event_kind, decision_stage, source_kind, may_be_primary,
          rationale
        ) values (
          'settlement', 'not_applicable', 'budget_overview', false,
          '予算概要は決算の一次資料ではない'
        );

        begin
          insert into public.fiscal_source_kind_event_rules (
            event_kind, decision_stage, source_kind, may_be_primary,
            rationale
          ) values (
            'settlement', 'proposed', 'settlement_report', false,
            '無効な段階'
          );
          raise exception 'invalid event stage unexpectedly succeeded';
        exception
          when check_violation then null;
        end;

        begin
          insert into public.fiscal_source_kind_event_rules (
            event_kind, decision_stage, source_kind, may_be_primary,
            rationale
          ) values (
            'settlement', 'not_applicable', 'execution_report', true,
            'レビュー情報不足'
          );
          raise exception 'unreviewed primary rule unexpectedly succeeded';
        exception
          when check_violation then null;
        end;
      end;
      $$;
      select 'ok';
      rollback;
    `);

    expect(result).toContain("ROLLBACK");
  });
});
