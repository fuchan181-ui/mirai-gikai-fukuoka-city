import type {
  FiscalAmountSet,
  FiscalDecisionStage,
  FiscalMeasure,
} from "../types/fiscal-amount";
import { totalLineOf } from "./build-fiscal-summary";
import {
  calculateExecutionRate,
  compareYen,
  parseYen,
  ZERO,
} from "./format-yen";

/**
 * 款ごとの予算と決算の対応。片方しか公開されていない款も落とさずに持つ。
 * 額を推測できないため、欠けている額は 0 ではなく null にし、
 * 執行率も算出しない。
 */
export type FiscalExecutionRow = {
  classificationKey: string;
  label: string;
  /** 当初予算額。未公開なら null。 */
  initialBudgetYen: string | null;
  /** 年度末の予算現額。未公開なら null。 */
  availableBudgetYen: string | null;
  /** 歳出決算額（支出済額）。未公開なら null。 */
  actualYen: string | null;
  /** 執行率（%）。分母は年度末の予算現額。決められないときは null。 */
  executionRatePercent: number | null;
};

/**
 * 款別の予算執行状況。予算現額と決算のどちらかしか無い年度でも、
 * 数字を混ぜずに並べるため、合計行の有無を額ごとに分けて持つ。
 */
export type FiscalExecution = {
  fiscalYear: number;
  rows: FiscalExecutionRow[];
  totalInitialBudgetYen: string | null;
  totalAvailableBudgetYen: string | null;
  totalActualYen: string | null;
  totalExecutionRatePercent: number | null;
  /** 内訳として並べた款の合計。総額の一部しか取れていない年度を見分けるために持つ。 */
  coveredAvailableBudgetYen: string;
  coveredActualYen: string;
  /** 予算現額の基準日。年度末以外の基準日を画面に出すために渡す。 */
  availableBudgetAsOfDate: string | null;
  /** 当初予算額の議決段階。まだ議決されていない案を「決まった額」と書かないために持つ。 */
  initialBudgetDecisionStage: FiscalDecisionStage | null;
};

export type FiscalExecutionSources = {
  initialBudgetSet: FiscalAmountSet | null;
  availableBudgetSet: FiscalAmountSet | null;
  settlementSet: FiscalAmountSet | null;
};

type ClassificationAmount = {
  label: string;
  amountYen: string;
};

/**
 * 合計行を除いた款別の金額。金額や款名が未公開の行は、
 * 内訳に置けないため落とす。
 */
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
 * 予算現額の大きい順。予算現額が未公開の款は、
 * 金額で比べられないため後ろに回す。
 */
function compareRows(a: FiscalExecutionRow, b: FiscalExecutionRow): number {
  if (a.availableBudgetYen === null || b.availableBudgetYen === null) {
    if (a.availableBudgetYen !== b.availableBudgetYen) {
      return a.availableBudgetYen === null ? 1 : -1;
    }
  } else {
    const byAmount = compareYen(b.availableBudgetYen, a.availableBudgetYen);
    if (byAmount !== 0) return byAmount;
  }
  return a.label.localeCompare(b.label, "ja");
}

/**
 * 年度末の予算現額と決算を款ごとに突き合わせる。
 * 予算現額も決算も1件も無い年度では、比較する相手が無いため null を返す。
 * 予算現額が 0 の款は率を定義できないため、額は出しつつ率は null にする。
 */
export function buildFiscalExecution(
  fiscalYear: number,
  sources: FiscalExecutionSources
): FiscalExecution | null {
  const initial = classificationAmounts(
    sources.initialBudgetSet,
    "expenditure_budget"
  );
  const available = classificationAmounts(
    sources.availableBudgetSet,
    "expenditure_budget"
  );
  const actual = classificationAmounts(
    sources.settlementSet,
    "expenditure_actual"
  );

  const classificationKeys = [
    ...new Set([...available.keys(), ...actual.keys()]),
  ];
  if (classificationKeys.length === 0) return null;

  const rows = classificationKeys
    .map((classificationKey): FiscalExecutionRow => {
      const availableBudgetYen =
        available.get(classificationKey)?.amountYen ?? null;
      const actualYen = actual.get(classificationKey)?.amountYen ?? null;
      return {
        classificationKey,
        label:
          available.get(classificationKey)?.label ??
          actual.get(classificationKey)?.label ??
          initial.get(classificationKey)?.label ??
          classificationKey,
        initialBudgetYen: initial.get(classificationKey)?.amountYen ?? null,
        availableBudgetYen,
        actualYen,
        executionRatePercent:
          availableBudgetYen === null || actualYen === null
            ? null
            : calculateExecutionRate(actualYen, availableBudgetYen),
      };
    })
    .sort(compareRows);

  let coveredAvailableBudgetYen = ZERO;
  let coveredActualYen = ZERO;
  for (const row of rows) {
    if (row.availableBudgetYen !== null) {
      coveredAvailableBudgetYen += parseYen(row.availableBudgetYen);
    }
    if (row.actualYen !== null) coveredActualYen += parseYen(row.actualYen);
  }

  const totalAvailableBudgetYen = totalYenOf(
    sources.availableBudgetSet,
    "expenditure_budget"
  );
  const totalActualYen = totalYenOf(
    sources.settlementSet,
    "expenditure_actual"
  );

  return {
    fiscalYear,
    rows,
    totalInitialBudgetYen: totalYenOf(
      sources.initialBudgetSet,
      "expenditure_budget"
    ),
    totalAvailableBudgetYen,
    totalActualYen,
    totalExecutionRatePercent:
      totalAvailableBudgetYen === null || totalActualYen === null
        ? null
        : calculateExecutionRate(totalActualYen, totalAvailableBudgetYen),
    coveredAvailableBudgetYen: coveredAvailableBudgetYen.toString(),
    coveredActualYen: coveredActualYen.toString(),
    availableBudgetAsOfDate: sources.availableBudgetSet?.asOfDate ?? null,
    initialBudgetDecisionStage: sources.initialBudgetSet?.decisionStage ?? null,
  };
}
