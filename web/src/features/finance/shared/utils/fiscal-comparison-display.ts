import {
  FISCAL_COMPARISON_STAGE_LABELS,
  type FiscalComparison,
  type FiscalComparisonStage,
  hasPartialCoverageAt,
  largestRowOf,
} from "./build-fiscal-comparison";
import {
  calculateSharePercent,
  formatSharePercent,
  formatYenWithUnits,
} from "./format-yen";

/**
 * 画面に出すための計算。金額そのものは変えず、
 * 「どこまでを順位と言ってよいか」だけを決める。
 */

/** 内訳の合計が総額に届いていない段階。届いている段階は含めない。 */
export type FiscalPartialStage = {
  stage: FiscalComparisonStage;
  total: string;
  covered: string;
  coveredSharePercent: number | null;
};

export function partialCoverageStages(
  comparison: FiscalComparison
): FiscalPartialStage[] {
  return comparison.stages.flatMap((stage) => {
    if (!hasPartialCoverageAt(comparison, stage)) return [];
    const total = comparison.totals[stage];
    if (total === null) return [];
    const covered = comparison.covered[stage];
    return [
      {
        stage,
        total,
        covered,
        coveredSharePercent: calculateSharePercent(covered, total),
      },
    ];
  });
}

/**
 * 一覧に出す「いちばん大きい款」の一文。
 * 内訳が総額の一部しか無い年度は、全体の1位と言い切らず、
 * 何を見て選んだかを文の中に残す。比を出せない年度は null。
 */
export function largestShareSentence(
  comparison: FiscalComparison
): string | null {
  const largest = largestRowOf(comparison);
  const amountYen = largest?.amounts[comparison.shareStage] ?? null;
  if (largest === null || amountYen === null) return null;

  const subject = comparison.kind === "expenditure" ? "支出" : "収入";
  const coverageLead = hasPartialCoverageAt(comparison, comparison.shareStage)
    ? "公開されている内訳では、"
    : "";
  return `${coverageLead}${subject}で最も大きいのは${largest.label}（${
    FISCAL_COMPARISON_STAGE_LABELS[comparison.shareStage]
  }の${formatSharePercent(largest.sharePercent)}、${formatYenWithUnits(
    amountYen
  )}）です。`;
}
