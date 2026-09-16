import {
  FISCAL_COMPARISON_STAGE_LABELS,
  type FiscalComparison,
  type FiscalComparisonStage,
  hasPartialCoverageAt,
  largestRowOf,
} from "./build-fiscal-comparison";
import {
  calculateSharePercent,
  compareYen,
  formatSharePercent,
  formatYenWithUnits,
  parseYen,
  ZERO,
} from "./format-yen";

/**
 * 画面に出すための計算。金額そのものは変えず、
 * 「どの額を基準に棒を引くか」「どこまでを順位と言ってよいか」だけを決める。
 */

/** 棒の長さを 0.01% 単位で求めるための倍率。 */
const BASIS_POINTS = BigInt("10000");

/** 構成比の基準にした段階で、いちばん大きい額。1件も無ければ null。 */
export function maxShareAmount(comparison: FiscalComparison): string | null {
  let max: string | null = null;
  for (const row of comparison.rows) {
    const amountYen = row.amounts[comparison.shareStage];
    if (amountYen === null) continue;
    if (max === null || compareYen(amountYen, max) > 0) max = amountYen;
  }
  return max;
}

/**
 * 棒の長さ。最大の額を基準にした相対値（0〜100）。
 * 構成比の分母が未公開でも額だけで決まるため、合計が出せない年度も棒が消えない。
 * 画面の構成比は小数第1位までしか出さないが、棒は 0.01% 単位で残す。
 */
export function barWidthPercent(
  amountYen: string | null,
  maxAmountYen: string | null
): number {
  if (amountYen === null || maxAmountYen === null) return 0;
  const max = parseYen(maxAmountYen);
  const amount = parseYen(amountYen);
  if (max <= ZERO || amount <= ZERO) return 0;
  return Math.min(Number((amount * BASIS_POINTS) / max) / 100, 100);
}

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
