-- 財政の公開正本を守るレジストリ整合トリガーは、権限を剥奪した
-- fiscal_expected_source_version_references を読む。呼び出し元（service_role）の
-- 権限で実行すると参照できず、公開反映がすべて失敗する。
-- refresh_fiscal_source_registry() と同じく security definer で実行し、
-- 所有ロールの権限でビューを参照する。

create or replace function public.enforce_fiscal_registry_completeness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    with expected as (
      select * from public.fiscal_expected_source_version_references
    ), actual as (
      select consumer_type, consumer_id, evidence_table, evidence_id,
        source_version_id
      from public.published_source_version_references
      where consumer_type = 'fiscal_data' and released_at is null
    )
    select 1
    from (
      (select * from expected except select * from actual)
      union all
      (select * from actual except select * from expected)
    ) mismatch
  ) then
    raise exception 'fiscal parser evidence and source registry must match';
  end if;
  return null;
end;
$$;

revoke all on function public.enforce_fiscal_registry_completeness()
  from public, anon, authenticated, service_role;
