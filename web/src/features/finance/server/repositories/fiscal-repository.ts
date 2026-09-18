import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { fetchAllRows } from "@/lib/supabase/fetch-all-rows";
import type {
  FiscalAmountLine,
  FiscalAmountSet,
  FiscalDecisionStage,
  FiscalYearAmounts,
} from "../../shared/types/fiscal-amount";
import {
  isVisibleClassificationScheme,
  SUPPORTED_EVENT_KINDS,
  SUPPORTED_MEASURES,
  toFiscalDecisionStage,
  toFiscalEventKind,
  toFiscalMeasure,
} from "../../shared/utils/parse-fiscal-enums";
import { findPublicReportingScopeId } from "./fiscal-reporting-scope-repository";
import { findAmountSetSources } from "./fiscal-source-repository";

type SetRevisionRow = {
  id: string;
  amount_set_id: string;
  fiscal_event_id: string;
  event_kind: string;
  revision_number: number;
  effective_on: string | null;
};

type AmountRow = {
  id: string;
  amount_set_id: string;
  classification_id: string | null;
  measure: string;
};

type AmountRevisionRow = {
  amount_id: string;
  revision_number: number;
  amount_yen: number | null;
  null_reason: string | null;
};

/** 款の canonical key・表示名と、集計軸を表す scheme。 */
type ClassificationNames = {
  keyById: Map<string, string>;
  labelById: Map<string, string>;
  schemeById: Map<string, string>;
};

/**
 * 公開済みの年度を新しい順に返す。年度の詳細は款別（primary）の金額だけを
 * 表示するため、款別の公開版がある年度に限る。節別だけがある年度を並べると、
 * 開いても金額が無い年度ができてしまう。
 */
export async function findPublishedFiscalYears(): Promise<number[]> {
  const reportingScopeId = await findPublicReportingScopeId();
  if (reportingScopeId === null) return [];

  const supabase = createAdminClient();
  const result = await fetchAllRows((from, to) =>
    supabase
      .from("fiscal_amount_set_revisions")
      .select("fiscal_year, fiscal_amount_sets!inner(amount_set_key)")
      .eq("fiscal_amount_sets.amount_set_key", "primary")
      .eq("reporting_scope_id", reportingScopeId)
      .in("event_kind", SUPPORTED_EVENT_KINDS)
      .eq("publication_state", "published")
      .eq("qa_status", "verified")
      .order("fiscal_year", { ascending: false })
      .order("id")
      .range(from, to)
  );

  if (result.error) {
    throw new Error(
      `公開済みの財政年度を取得できませんでした: ${result.error.message}`
    );
  }

  const years = new Set<number>();
  for (const row of result.data ?? []) {
    years.add(row.fiscal_year);
  }
  return [...years].sort((a, b) => b - a);
}

type FindPublishedFiscalYearAmountsOptions = {
  /**
   * 出典を読むかどうか。出典を画面に出さない一覧では、
   * 金額セット改訂ごとに連鎖する問い合わせを省くため false を渡す。
   */
  includeSources?: boolean;
};

/** 指定年度の公開済み金額セットと出典を読み出す。 */
export async function findPublishedFiscalYearAmounts(
  fiscalYear: number,
  options: FindPublishedFiscalYearAmountsOptions = {}
): Promise<FiscalYearAmounts> {
  const empty: FiscalYearAmounts = {
    fiscalYear,
    amountSets: [],
    sources: [],
  };

  const reportingScopeId = await findPublicReportingScopeId();
  if (reportingScopeId === null) return empty;

  const setRevisions = await findLatestPublishedSetRevisions(
    fiscalYear,
    reportingScopeId
  );
  if (setRevisions.length === 0) return empty;

  const setIds = setRevisions.map((revision) => revision.amount_set_id);
  const setRevisionIds = setRevisions.map((revision) => revision.id);
  const eventIds = [
    ...new Set(setRevisions.map((revision) => revision.fiscal_event_id)),
  ];

  const [setFacts, amounts] = await Promise.all([
    findSetFacts(setIds, eventIds),
    findAmounts(setIds),
  ]);

  const amountIds = amounts.map((amount) => amount.id);
  const classificationIds = [
    ...new Set(
      amounts
        .map((amount) => amount.classification_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const [latestRevisionByAmountId, classificationNames] = await Promise.all([
    findLatestAmountRevisions(setRevisionIds, amountIds),
    findClassificationNames(classificationIds, fiscalYear),
  ]);

  const linesBySetId = buildLinesBySetId(
    amounts,
    latestRevisionByAmountId,
    classificationNames
  );

  const amountSets: FiscalAmountSet[] = setRevisions.flatMap((revision) => {
    const eventKind = toFiscalEventKind(revision.event_kind);
    if (!eventKind) return [];
    const decisionStage = setFacts.decisionStageBySetId.get(
      revision.amount_set_id
    );
    if (!decisionStage) return [];
    const lines = linesBySetId.get(revision.amount_set_id);
    // 金額が1行も無いセットは、何も示せないので画面に出さない。
    if (!lines || lines.length === 0) return [];
    return [
      {
        id: revision.amount_set_id,
        fiscalYear,
        eventKind,
        decisionStage,
        asOfDate:
          setFacts.asOfDateByEventId.get(revision.fiscal_event_id) ?? null,
        effectiveOn: revision.effective_on,
        lines,
      },
    ];
  });

  const sources =
    options.includeSources === false
      ? []
      : await findAmountSetSources(setRevisionIds);

  return { fiscalYear, amountSets, sources };
}

/**
 * 指定年度の公開済み金額セット改訂を読み、セットごとの最新改訂だけを返す。
 * 古い改訂を混ぜると、同じ金額を二重に数えてしまう。同じイベント・議決段階に
 * は節別集計のような別の集計軸も並ぶため、この画面が読む款別（primary）の
 * 公開版だけを読む。
 */
async function findLatestPublishedSetRevisions(
  fiscalYear: number,
  reportingScopeId: string
): Promise<SetRevisionRow[]> {
  const supabase = createAdminClient();
  const result = await fetchAllRows((from, to) =>
    supabase
      .from("fiscal_amount_set_revisions")
      .select(`
        id,
        amount_set_id,
        fiscal_event_id,
        event_kind,
        revision_number,
        effective_on,
        fiscal_amount_sets!inner (amount_set_key)
      `)
      .eq("fiscal_amount_sets.amount_set_key", "primary")
      .eq("reporting_scope_id", reportingScopeId)
      .in("event_kind", SUPPORTED_EVENT_KINDS)
      .eq("publication_state", "published")
      .eq("qa_status", "verified")
      .eq("fiscal_year", fiscalYear)
      .order("id")
      .range(from, to)
  );

  if (result.error) {
    throw new Error(
      `公開済みの金額セットを取得できませんでした: ${result.error.message}`
    );
  }

  const latestByAmountSetId = new Map<string, SetRevisionRow>();
  for (const row of result.data ?? []) {
    const current = latestByAmountSetId.get(row.amount_set_id);
    if (!current || current.revision_number < row.revision_number) {
      latestByAmountSetId.set(row.amount_set_id, row);
    }
  }
  return [...latestByAmountSetId.values()];
}

/** 議決段階と、予算現額のような「基準日時点」の金額に必要な基準日を返す。 */
async function findSetFacts(
  setIds: string[],
  eventIds: string[]
): Promise<{
  decisionStageBySetId: Map<string, FiscalDecisionStage>;
  asOfDateByEventId: Map<string, string | null>;
}> {
  const supabase = createAdminClient();
  const [amountSetResult, eventResult] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("fiscal_amount_sets")
        .select("id, decision_stage")
        .in("id", setIds)
        .order("id")
        .range(from, to)
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("fiscal_events")
        .select("id, as_of_date")
        .in("id", eventIds)
        .order("id")
        .range(from, to)
    ),
  ]);

  if (amountSetResult.error || eventResult.error) {
    throw new Error(
      `金額の構成を取得できませんでした: ${
        amountSetResult.error?.message ?? eventResult.error?.message
      }`
    );
  }

  const decisionStageBySetId = new Map<string, FiscalDecisionStage>();
  for (const row of amountSetResult.data ?? []) {
    const decisionStage = toFiscalDecisionStage(row.decision_stage);
    if (decisionStage) decisionStageBySetId.set(row.id, decisionStage);
  }

  const asOfDateByEventId = new Map<string, string | null>();
  for (const row of eventResult.data ?? []) {
    asOfDateByEventId.set(row.id, row.as_of_date);
  }

  return { decisionStageBySetId, asOfDateByEventId };
}

/** 金額セットに属する金額の行を返す。 */
async function findAmounts(setIds: string[]): Promise<AmountRow[]> {
  const supabase = createAdminClient();
  const result = await fetchAllRows((from, to) =>
    supabase
      .from("fiscal_amounts")
      .select("id, amount_set_id, classification_id, measure")
      .in("amount_set_id", setIds)
      .in("measure", SUPPORTED_MEASURES)
      .order("id")
      .range(from, to)
  );

  if (result.error) {
    throw new Error(
      `金額の構成を取得できませんでした: ${result.error.message}`
    );
  }
  return result.data ?? [];
}

/** 金額ごとの最新改訂を返す。対象が無いときは問い合わせない。 */
async function findLatestAmountRevisions(
  setRevisionIds: string[],
  amountIds: string[]
): Promise<Map<string, AmountRevisionRow>> {
  if (amountIds.length === 0) return new Map();

  const supabase = createAdminClient();
  const result = await fetchAllRows((from, to) =>
    supabase
      .from("fiscal_amount_revisions")
      .select("amount_id, revision_number, amount_yen, null_reason")
      .in("amount_set_revision_id", setRevisionIds)
      .in("amount_id", amountIds)
      .order("amount_id")
      .order("id")
      .range(from, to)
  );

  if (result.error) {
    throw new Error(
      `金額の改訂を取得できませんでした: ${result.error.message}`
    );
  }

  const latestByAmountId = new Map<string, AmountRevisionRow>();
  for (const row of result.data ?? []) {
    const current = latestByAmountId.get(row.amount_id);
    if (!current || current.revision_number < row.revision_number) {
      latestByAmountId.set(row.amount_id, row);
    }
  }
  return latestByAmountId;
}

/** 款の canonical key と、その年度に有効な表示名を返す。 */
async function findClassificationNames(
  classificationIds: string[],
  fiscalYear: number
): Promise<ClassificationNames> {
  const names: ClassificationNames = {
    keyById: new Map(),
    labelById: new Map(),
    schemeById: new Map(),
  };
  if (classificationIds.length === 0) return names;

  const supabase = createAdminClient();
  const [classificationResult, revisionResult] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("fiscal_classifications")
        .select("id, canonical_key, scheme")
        .in("id", classificationIds)
        .order("id")
        .range(from, to)
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("fiscal_classification_revisions")
        .select("classification_id, display_label, revision_number")
        .in("classification_id", classificationIds)
        .eq("publication_state", "published")
        .eq("qa_status", "verified")
        .lte("valid_from_fiscal_year", fiscalYear)
        .or(
          `valid_to_fiscal_year.is.null,valid_to_fiscal_year.gte.${fiscalYear}`
        )
        .order("revision_number", { ascending: false })
        .order("id")
        .range(from, to)
    ),
  ]);

  if (classificationResult.error || revisionResult.error) {
    throw new Error(
      `款の表示名を取得できませんでした: ${
        classificationResult.error?.message ?? revisionResult.error?.message
      }`
    );
  }

  for (const row of classificationResult.data ?? []) {
    names.keyById.set(row.id, row.canonical_key);
    names.schemeById.set(row.id, row.scheme);
  }
  for (const row of revisionResult.data ?? []) {
    // 同じ款に複数の改訂が当たるときは、いちばん新しい改訂の表示名を使う。
    if (names.labelById.has(row.classification_id)) continue;
    names.labelById.set(row.classification_id, row.display_label);
  }

  return names;
}

/** 金額セットごとに、画面へ出す金額の行を組み立てる。 */
function buildLinesBySetId(
  amounts: AmountRow[],
  latestRevisionByAmountId: Map<string, AmountRevisionRow>,
  classificationNames: ClassificationNames
): Map<string, FiscalAmountLine[]> {
  const linesBySetId = new Map<string, FiscalAmountLine[]>();
  for (const amount of amounts) {
    const revision = latestRevisionByAmountId.get(amount.id);
    if (!revision) continue;
    const measure = toFiscalMeasure(amount.measure);
    if (!measure) continue;
    const classificationId = amount.classification_id;
    const classificationScheme =
      classificationId === null
        ? null
        : (classificationNames.schemeById.get(classificationId) ?? null);
    // 節別集計のような別の集計軸は款の表に混ぜない。分類を持たない合計行
    // など、scheme が分からない行はこれまでどおり残す。
    if (!isVisibleClassificationScheme(classificationScheme)) continue;
    const line: FiscalAmountLine = {
      classificationKey:
        classificationId === null
          ? null
          : (classificationNames.keyById.get(classificationId) ?? null),
      label:
        classificationId === null
          ? null
          : (classificationNames.labelById.get(classificationId) ?? null),
      measure,
      amountYen:
        revision.amount_yen === null ? null : String(revision.amount_yen),
      nullReason: revision.null_reason,
    };
    const lines = linesBySetId.get(amount.amount_set_id);
    if (lines) {
      lines.push(line);
    } else {
      linesBySetId.set(amount.amount_set_id, [line]);
    }
  }
  return linesBySetId;
}
