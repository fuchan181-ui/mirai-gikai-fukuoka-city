import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { fetchAllRows } from "@/lib/supabase/fetch-all-rows";
import type { FiscalSourceRef } from "../../shared/types/fiscal-amount";

/** null を落としつつ重複を除く。0件なら、以降の問い合わせを打ち切れる。 */
function uniqueStrings(values: (string | null)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => value !== null)),
  ];
}

/**
 * 金額セットの根拠になっている公式資料を返す。
 * 出典は金額セット改訂に紐づくため、改訂 ID を受け取って辿る。
 */
export async function findAmountSetSources(
  amountSetRevisionIds: string[]
): Promise<FiscalSourceRef[]> {
  if (amountSetRevisionIds.length === 0) return [];
  const supabase = createAdminClient();

  const sourceResult = await fetchAllRows((from, to) =>
    supabase
      .from("fiscal_amount_set_sources")
      .select("edition_observation_id")
      .in("amount_set_revision_id", amountSetRevisionIds)
      .eq("qa_status", "verified")
      .order("id")
      .range(from, to)
  );
  if (sourceResult.error) {
    throw new Error(
      `金額の出典を取得できませんでした: ${sourceResult.error.message}`
    );
  }

  const observationIds = uniqueStrings(
    (sourceResult.data ?? []).map((row) => row.edition_observation_id)
  );
  if (observationIds.length === 0) return [];

  const observationResult = await fetchAllRows((from, to) =>
    supabase
      .from("fiscal_source_document_edition_observations")
      .select("title, publisher, published_at, source_version_id")
      .in("id", observationIds)
      .eq("publication_state", "published")
      .order("id")
      .range(from, to)
  );
  if (observationResult.error) {
    throw new Error(
      `資料の書誌情報を取得できませんでした: ${observationResult.error.message}`
    );
  }

  const sourceVersionIds = uniqueStrings(
    (observationResult.data ?? []).map((row) => row.source_version_id)
  );
  if (sourceVersionIds.length === 0) return [];

  const sourceVersionResult = await fetchAllRows((from, to) =>
    supabase
      .from("ingestion_source_versions")
      .select("id, fetched_at, ingestion_source_id")
      .in("id", sourceVersionIds)
      .order("id")
      .range(from, to)
  );
  if (sourceVersionResult.error) {
    throw new Error(
      `資料の取得日時を取得できませんでした: ${sourceVersionResult.error.message}`
    );
  }

  const versionById = new Map(
    (sourceVersionResult.data ?? []).map((row) => [row.id, row])
  );
  const ingestionSourceIds = uniqueStrings(
    (sourceVersionResult.data ?? []).map((row) => row.ingestion_source_id)
  );
  if (ingestionSourceIds.length === 0) return [];

  const ingestionSourceResult = await fetchAllRows((from, to) =>
    supabase
      .from("ingestion_sources")
      .select("id, url")
      .in("id", ingestionSourceIds)
      .order("id")
      .range(from, to)
  );
  if (ingestionSourceResult.error) {
    throw new Error(
      `資料のURLを取得できませんでした: ${ingestionSourceResult.error.message}`
    );
  }
  const urlById = new Map(
    (ingestionSourceResult.data ?? []).map((row) => [row.id, row.url])
  );

  const sources: FiscalSourceRef[] = [];
  for (const observation of observationResult.data ?? []) {
    const version = versionById.get(observation.source_version_id);
    const url = version ? urlById.get(version.ingestion_source_id) : undefined;
    if (!url) continue;
    sources.push({
      title: observation.title,
      url,
      publisher: observation.publisher,
      fetchedAt: version?.fetched_at ?? null,
      publishedAt: observation.published_at,
    });
  }

  return sources.sort((a, b) => a.title.localeCompare(b.title, "ja"));
}
