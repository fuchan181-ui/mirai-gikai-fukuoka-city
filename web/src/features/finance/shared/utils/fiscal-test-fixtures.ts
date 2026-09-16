import type {
  FiscalAmountLine,
  FiscalAmountSet,
  FiscalMeasure,
} from "../types/fiscal-amount";
import {
  buildFiscalComparison,
  type FiscalComparison,
  type FiscalComparisonKind,
  type FiscalComparisonSources,
} from "./build-fiscal-comparison";

/**
 * 財政ページのテストで使う金額セット。同じ年度の実額を何度も書き写すと、
 * 型が変わったときに片方だけ直す事故が起きるため、ここに集めて共有する。
 */

export function line(
  classificationKey: string | null,
  label: string | null,
  measure: FiscalMeasure,
  amountYen: string | null
): FiscalAmountLine {
  return { classificationKey, label, measure, amountYen, nullReason: null };
}

export function amountSet(
  overrides: Partial<FiscalAmountSet> & Pick<FiscalAmountSet, "id">
): FiscalAmountSet {
  return {
    fiscalYear: 2024,
    eventKind: "initial_budget",
    decisionStage: "passed",
    asOfDate: null,
    effectiveOn: null,
    lines: [],
    ...overrides,
  };
}

/** 令和6年度の実額を款ごとに並べたもの。合計は公式表のまま、内訳は一部だけを持つ。 */
const EXPENDITURE_2024_ROWS = [
  {
    key: "welfare",
    label: "民生費",
    initial: "30308896000",
    available: "36060256000",
    actual: "34457605986",
  },
  {
    key: "civil_engineering",
    label: "土木費",
    initial: "17654397000",
    available: "23215118000",
    actual: "16096988873",
  },
  {
    key: "council_expense",
    label: "議会費",
    initial: "460162000",
    available: "464149000",
    actual: "449516456",
  },
  {
    key: "reserve_fund",
    label: "予備費",
    initial: "100000000",
    available: "82000000",
    actual: "0",
  },
] as const;

/** 令和6年度の歳出。当初予算・年度末の予算現額・決算の3段階がそろう。 */
export function expenditure2024Sources(): FiscalComparisonSources {
  return {
    initialBudgetSet: amountSet({
      id: "initial",
      lines: [
        ...EXPENDITURE_2024_ROWS.map((row) =>
          line(row.key, row.label, "expenditure_budget", row.initial)
        ),
        line(null, null, "expenditure_budget", "87960000000"),
      ],
    }),
    availableBudgetSet: amountSet({
      id: "available",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      asOfDate: "2025-03-31",
      lines: [
        ...EXPENDITURE_2024_ROWS.map((row) =>
          line(row.key, row.label, "expenditure_budget", row.available)
        ),
        line(null, null, "expenditure_budget", "106430416000"),
      ],
    }),
    settlementSet: amountSet({
      id: "settlement",
      eventKind: "settlement",
      decisionStage: "not_applicable",
      lines: [
        ...EXPENDITURE_2024_ROWS.map((row) =>
          line(row.key, row.label, "expenditure_actual", row.actual)
        ),
        line(null, null, "expenditure_actual", "92736569118"),
      ],
    }),
  };
}

function built(
  kind: FiscalComparisonKind,
  sources: FiscalComparisonSources
): FiscalComparison {
  const comparison = buildFiscalComparison(kind, sources);
  if (comparison === null) {
    throw new Error("テスト用の金額セットが1件もありません");
  }
  return comparison;
}

export function expenditure2024(): FiscalComparison {
  return built("expenditure", expenditure2024Sources());
}

/** 令和6年度の歳入。市税だけを内訳として持ち、決算までそろう。 */
export function revenue2024(): FiscalComparison {
  return built("revenue", {
    initialBudgetSet: amountSet({
      id: "revenue-initial",
      lines: [
        line("city_tax", "市税", "revenue_budget", "34300000000"),
        line(null, null, "revenue_budget", "87960000000"),
      ],
    }),
    availableBudgetSet: amountSet({
      id: "revenue-available",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      asOfDate: "2025-03-31",
      lines: [
        line("city_tax", "市税", "revenue_budget", "33500000000"),
        line(null, null, "revenue_budget", "106430416000"),
      ],
    }),
    settlementSet: amountSet({
      id: "revenue-settlement",
      eventKind: "settlement",
      decisionStage: "not_applicable",
      lines: [
        line("city_tax", "市税", "revenue_actual", "34113137665"),
        line(null, null, "revenue_actual", "96520466136"),
      ],
    }),
  });
}

/** 決算がまだ無く、当初予算案だけが公開されている年度。 */
export function expenditure2026ProposedSources(): FiscalComparisonSources {
  return {
    initialBudgetSet: amountSet({
      id: "initial-2026",
      fiscalYear: 2026,
      decisionStage: "proposed",
      lines: [
        line("welfare", "民生費", "expenditure_budget", "30000000000"),
        line("education", "教育費", "expenditure_budget", "9000000000"),
        line(null, null, "expenditure_budget", "39000000000"),
      ],
    }),
    availableBudgetSet: null,
    settlementSet: null,
  };
}

export function expenditure2026Proposed(): FiscalComparison {
  return built("expenditure", expenditure2026ProposedSources());
}
