import { findFiscalClassificationDescription } from "../constants/fiscal-classification-descriptions";
import type {
  FiscalAmountSet,
  FiscalDecisionStage,
  FiscalMeasure,
} from "../types/fiscal-amount";
import { totalLineOf } from "./build-fiscal-summary";
import {
  calculateExecutionRate,
  calculateSharePercent,
  compareYen,
  parseYen,
  ZERO,
} from "./format-yen";

/** 予算から決算までの段階。画面の列と対応する。 */
export type FiscalComparisonStage =
  | "initial_budget"
  | "available_budget"
  | "settlement";

export const FISCAL_COMPARISON_STAGE_ORDER: FiscalComparisonStage[] = [
  "initial_budget",
  "available_budget",
  "settlement",
];

/** 支出か収入か。率の呼び方（執行率・収入率）だけが変わる。 */
export type FiscalComparisonKind = "expenditure" | "revenue";

/** 画面に出す段階の名前。表の見出しと要約で同じ語を使うため、ここに集約する。 */
export const FISCAL_COMPARISON_STAGE_LABELS: Record<
  FiscalComparisonStage,
  string
> = {
  initial_budget: "当初予算",
  available_budget: "予算現額",
  settlement: "決算",
};

/**
 * 款ごとの金額を段階をまたいで並べた1行。
 * ある段階だけ未公開の款は、額を推測せず null のまま持つ。
 */
export type FiscalComparisonRow = {
  classificationKey: string;
  label: string;
  /** その款が何のお金か。対応表に無ければ null。 */
  description: string | null;
  amounts: Record<FiscalComparisonStage, string | null>;
  /** 構成比の基準になる段階に対する割合。 */
  sharePercent: number | null;
  /** 決算 ÷ 予算現額。決められないときは null。 */
  progressPercent: number | null;
};

export type FiscalComparison = {
  kind: FiscalComparisonKind;
  /** 表示する段階。金額が1件も無い段階は列に入れない。 */
  stages: FiscalComparisonStage[];
  rows: FiscalComparisonRow[];
  totals: Record<FiscalComparisonStage, string | null>;
  /** 内訳として並べた款の合計。総額の一部しか取れていない段階を見分けるために持つ。 */
  covered: Record<FiscalComparisonStage, string>;
  /** 構成比の分母に使った段階。 */
  shareStage: FiscalComparisonStage;
  totalProgressPercent: number | null;
  /** 支出なら「執行率」、収入なら「収入率」。 */
  progressLabel: string;
  /** 当初予算額の議決段階。まだ議決されていない案を「決まった額」と書かないために持つ。 */
  decisionStage: FiscalDecisionStage | null;
  /** 予算現額の基準日。年度末以外の基準日を画面に出すために渡す。 */
  availableBudgetAsOfDate: string | null;
};

export type FiscalComparisonSources = {
  initialBudgetSet: FiscalAmountSet | null;
  availableBudgetSet: FiscalAmountSet | null;
  settlementSet: FiscalAmountSet | null;
};

type ClassificationAmount = { label: string; amountYen: string };

/** 合計行を除いた款別の金額。額や款名が未公開の行は、内訳に置けないため落とす。 */
function classificationAmounts(
  amountSet: FiscalAmountSet | null,
  measure: FiscalMeasure
): Map<string, ClassificationAmount> {
  const amounts = new Map<string, ClassificationAmount>();
  if (amountSet === null) return amounts;
  for (const line of amountSet.lines) {
    if (line.measure !== measure) continue;
    if (line.classificationKey === null || line.label === null) continue;
    if (line.amountYen === null) continue;
    amounts.set(line.classificationKey, {
      label: line.label,
      amountYen: line.amountYen,
    });
  }
  return amounts;
}

function totalYenOf(
  amountSet: FiscalAmountSet | null,
  measure: FiscalMeasure
): string | null {
  return (
    (amountSet === null
      ? undefined
      : totalLineOf(amountSet, measure)?.amountYen) ?? null
  );
}

/**
 * 歳入と歳出で、予算と決算の金額の種類が入れ替わる。
 * 取り違えると別の意味の額を同じ表に並べてしまうため、対応をここ1か所に持つ。
 */
export function fiscalMeasurePairOf(kind: FiscalComparisonKind): {
  budget: FiscalMeasure;
  actual: FiscalMeasure;
} {
  return kind === "expenditure"
    ? { budget: "expenditure_budget", actual: "expenditure_actual" }
    : { budget: "revenue_budget", actual: "revenue_actual" };
}

/** 段階ごとの値引き当て。表示する段階を決めるのにも使う。 */
function stageAmounts(
  sources: FiscalComparisonSources,
  kind: FiscalComparisonKind
): Record<FiscalComparisonStage, Map<string, ClassificationAmount>> {
  const { budget, actual } = fiscalMeasurePairOf(kind);
  return {
    initial_budget: classificationAmounts(sources.initialBudgetSet, budget),
    available_budget: classificationAmounts(sources.availableBudgetSet, budget),
    settlement: classificationAmounts(sources.settlementSet, actual),
  };
}

function totalFor(
  sources: FiscalComparisonSources,
  kind: FiscalComparisonKind,
  stage: FiscalComparisonStage
): string | null {
  const { budget, actual } = fiscalMeasurePairOf(kind);
  switch (stage) {
    case "initial_budget":
      return totalYenOf(sources.initialBudgetSet, budget);
    case "available_budget":
      return totalYenOf(sources.availableBudgetSet, budget);
    case "settlement":
      return totalYenOf(sources.settlementSet, actual);
  }
}

/**
 * 並べ替えの優先順。構成比の基準にした段階を先に見て、
 * 残りは決算 → 予算現額 → 当初予算で補う。
 */
function comparisonSortStages(
  shareStage: FiscalComparisonStage
): FiscalComparisonStage[] {
  return [
    shareStage,
    ...FISCAL_COMPARISON_STAGE_ORDER.filter((stage) => stage !== shareStage),
  ];
}

/**
 * 金額の大きい順。額が未公開の款は、その段階の額がある款より後ろに回す。
 * どの段階でも決まらないときは款名で決める。
 */
function compareRows(
  a: FiscalComparisonRow,
  b: FiscalComparisonRow,
  stages: FiscalComparisonStage[]
): number {
  for (const stage of stages) {
    const left = a.amounts[stage];
    const right = b.amounts[stage];
    if (left === null || right === null) {
      if (left !== right) return left === null ? 1 : -1;
      continue;
    }
    const byAmount = compareYen(right, left);
    if (byAmount !== 0) return byAmount;
  }
  return a.label.localeCompare(b.label, "ja");
}

/**
 * 款ごとに「当初予算 → 予算現額 → 決算」を並べ、予算がどう使われたかを1つの表で見せる。
 * 歳入と歳出で金額の意味が違うため、measure はどちらか一方だけを読む。
 * 1件も金額が無いときは null を返す。
 */
export function buildFiscalComparison(
  kind: FiscalComparisonKind,
  sources: FiscalComparisonSources
): FiscalComparison | null {
  const amounts = stageAmounts(sources, kind);
  const classificationKeys = [
    ...new Set([
      ...amounts.available_budget.keys(),
      ...amounts.settlement.keys(),
      ...amounts.initial_budget.keys(),
    ]),
  ];
  if (classificationKeys.length === 0) return null;

  const totals = {
    initial_budget: totalFor(sources, kind, "initial_budget"),
    available_budget: totalFor(sources, kind, "available_budget"),
    settlement: totalFor(sources, kind, "settlement"),
  } satisfies Record<FiscalComparisonStage, string | null>;

  const stages = FISCAL_COMPARISON_STAGE_ORDER.filter(
    (stage) => totals[stage] !== null || amounts[stage].size > 0
  );
  if (stages.length === 0) return null;

  // 構成比は、決算が分かる年度は決算、まだ決算が無い年度は予算現額、
  // どちらも無ければ当初予算を分母にする。合計が未公開なら比を出さない。
  const shareStage =
    [...stages].reverse().find((stage) => totals[stage] !== null) ??
    stages[stages.length - 1];

  // 表も棒グラフも、構成比を出した段階の額が大きい順に並べる。
  const sortStages = comparisonSortStages(shareStage);
  const rows = classificationKeys
    .map((classificationKey): FiscalComparisonRow => {
      const rowAmounts = {
        initial_budget:
          amounts.initial_budget.get(classificationKey)?.amountYen ?? null,
        available_budget:
          amounts.available_budget.get(classificationKey)?.amountYen ?? null,
        settlement:
          amounts.settlement.get(classificationKey)?.amountYen ?? null,
      };
      const shareAmount = rowAmounts[shareStage];
      const shareTotal = totals[shareStage];
      const progress =
        rowAmounts.available_budget === null || rowAmounts.settlement === null
          ? null
          : calculateExecutionRate(
              rowAmounts.settlement,
              rowAmounts.available_budget
            );
      return {
        classificationKey,
        label:
          amounts.settlement.get(classificationKey)?.label ??
          amounts.available_budget.get(classificationKey)?.label ??
          amounts.initial_budget.get(classificationKey)?.label ??
          classificationKey,
        description: findFiscalClassificationDescription(classificationKey),
        amounts: rowAmounts,
        sharePercent:
          shareAmount === null || shareTotal === null
            ? null
            : calculateSharePercent(shareAmount, shareTotal),
        progressPercent: progress,
      };
    })
    .sort((a, b) => compareRows(a, b, sortStages));

  const covered = {
    initial_budget: ZERO,
    available_budget: ZERO,
    settlement: ZERO,
  } satisfies Record<FiscalComparisonStage, bigint>;
  for (const row of rows) {
    for (const stage of FISCAL_COMPARISON_STAGE_ORDER) {
      const amount = row.amounts[stage];
      if (amount !== null) covered[stage] += parseYen(amount);
    }
  }

  return {
    kind,
    stages,
    rows,
    totals,
    covered: {
      initial_budget: covered.initial_budget.toString(),
      available_budget: covered.available_budget.toString(),
      settlement: covered.settlement.toString(),
    },
    shareStage,
    totalProgressPercent:
      totals.available_budget === null || totals.settlement === null
        ? null
        : calculateExecutionRate(totals.settlement, totals.available_budget),
    progressLabel: kind === "expenditure" ? "執行率" : "収入率",
    decisionStage: sources.initialBudgetSet?.decisionStage ?? null,
    availableBudgetAsOfDate: sources.availableBudgetSet?.asOfDate ?? null,
  };
}

/**
 * その段階で、内訳として並べた款の合計が総額に届いていないか。
 * 届いていない年度の「いちばん大きい款」は、全体の1位とは言い切れない。
 */
export function hasPartialCoverageAt(
  comparison: FiscalComparison,
  stage: FiscalComparisonStage
): boolean {
  const total = comparison.totals[stage];
  return total !== null && comparison.covered[stage] !== total;
}

/**
 * 構成比の基準にした段階で、最も大きい行。
 * 表の並び順（決算を先に見る）と基準の段階がずれる年度もあるため、
 * 並び順には頼らず、その段階の額を全部見て選ぶ。
 */
export function largestRowOf(
  comparison: FiscalComparison
): FiscalComparisonRow | null {
  let largest: { row: FiscalComparisonRow; amountYen: string } | null = null;
  for (const row of comparison.rows) {
    const amountYen = row.amounts[comparison.shareStage];
    if (amountYen === null) continue;
    if (largest === null || compareYen(amountYen, largest.amountYen) > 0) {
      largest = { row, amountYen };
    }
  }
  return largest?.row ?? null;
}

/**
 * 比較表の説明文。表に並ぶ段階は年度によって違うため、
 * 「決算まである」と思い込んだ書き方をしない。
 */
export function fiscalComparisonDescription(
  comparison: FiscalComparison
): string {
  const hasSettlement = comparison.stages.includes("settlement");
  const proposed = comparison.decisionStage === "proposed";

  if (comparison.kind === "expenditure") {
    if (hasSettlement) {
      return "その年度の当初予算から決算までを款ごとに並べ、予算が何にいくら配られ、どれだけ使われたかを示します。";
    }
    return proposed
      ? "その年度の当初予算案に、何をいくら計上しているかを款ごとに並べています。まだ議会で議決されていません。"
      : "その年度の当初予算で、何にいくら使うと決めたかを款ごとに並べています。";
  }

  if (hasSettlement) {
    return "その年度の収入を、当初予算でどこからいくら見込んだかと、実際にいくら受け入れたかに分けて並べています。";
  }
  return proposed
    ? "その年度の当初予算案で、収入をどこからいくら見込んでいるかを種類ごとに並べています。まだ議会で議決されていません。"
    : "その年度の当初予算で、収入をどこからいくら見込んだかを種類ごとに並べています。";
}
