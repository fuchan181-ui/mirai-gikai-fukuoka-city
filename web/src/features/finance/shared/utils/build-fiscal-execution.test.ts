import { describe, expect, it } from "vitest";
import type {
  FiscalAmountLine,
  FiscalAmountSet,
  FiscalMeasure,
} from "../types/fiscal-amount";
import { buildFiscalExecution } from "./build-fiscal-execution";

function line(
  classificationKey: string | null,
  label: string | null,
  measure: FiscalMeasure,
  amountYen: string | null
): FiscalAmountLine {
  return { classificationKey, label, measure, amountYen, nullReason: null };
}

function set(
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

/** 令和6年度の実際の値を使い、款だけを絞った歳出の金額セット。 */
function fiscal2024Sets() {
  const rows = [
    {
      key: "welfare",
      label: "民生費",
      budget: "36060256000",
      actual: "34457605986",
    },
    {
      key: "council_expense",
      label: "議会費",
      budget: "464149000",
      actual: "449516456",
    },
    {
      key: "civil_engineering",
      label: "土木費",
      budget: "23215118000",
      actual: "16096988873",
    },
    { key: "reserve_fund", label: "予備費", budget: "82000000", actual: "0" },
  ];
  const totalBudget = "106430416000";
  const totalActual = "92736569118";

  return {
    initialBudgetSet: set({
      id: "initial",
      lines: [
        ...rows.map((row) =>
          line(row.key, row.label, "expenditure_budget", row.budget)
        ),
        line(null, null, "expenditure_budget", totalBudget),
      ],
    }),
    availableBudgetSet: set({
      id: "available",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      asOfDate: "2025-03-31",
      lines: [
        ...rows.map((row) =>
          line(row.key, row.label, "expenditure_budget", row.budget)
        ),
        line(null, null, "expenditure_budget", totalBudget),
      ],
    }),
    settlementSet: set({
      id: "settlement",
      eventKind: "settlement",
      decisionStage: "not_applicable",
      lines: [
        ...rows.map((row) =>
          line(row.key, row.label, "expenditure_actual", row.actual)
        ),
        line(null, null, "expenditure_actual", totalActual),
      ],
    }),
  };
}

describe("buildFiscalExecution", () => {
  it("款ごとに予算現額と決算を突き合わせ、公式公表値と同じ執行率を返す", () => {
    const execution = buildFiscalExecution(2024, fiscal2024Sets());
    if (execution === null) throw new Error("執行状況を組み立てられない");

    const council = execution.rows.find(
      (row) => row.classificationKey === "council_expense"
    );
    expect(council?.availableBudgetYen).toBe("464149000");
    expect(council?.actualYen).toBe("449516456");
    expect(council?.executionRatePercent).toBe(96.8);

    expect(execution.totalAvailableBudgetYen).toBe("106430416000");
    expect(execution.totalActualYen).toBe("92736569118");
    expect(execution.totalExecutionRatePercent).toBe(87.1);
    expect(execution.availableBudgetAsOfDate).toBe("2025-03-31");
    expect(execution.initialBudgetDecisionStage).toBe("passed");
  });

  it("支出が無い款も落とさず、執行率 0% として返す", () => {
    const execution = buildFiscalExecution(2024, fiscal2024Sets());
    const reserve = execution?.rows.find(
      (row) => row.classificationKey === "reserve_fund"
    );

    expect(reserve?.actualYen).toBe("0");
    expect(reserve?.executionRatePercent).toBe(0);
  });

  it("予算現額の大きい順に並べ、未公開の款は後ろに回す", () => {
    const execution = buildFiscalExecution(2024, {
      ...fiscal2024Sets(),
      settlementSet: set({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [
          line("welfare", "民生費", "expenditure_actual", "34457605986"),
          line("education", "教育費", "expenditure_actual", "7228712334"),
        ],
      }),
    });

    expect(execution?.rows.map((row) => row.classificationKey)).toEqual([
      "welfare",
      "civil_engineering",
      "council_expense",
      "reserve_fund",
      "education",
    ]);
    // 決算にしか無い款は、予算現額が無いため執行率を出さない。
    const education = execution?.rows.find(
      (row) => row.classificationKey === "education"
    );
    expect(education?.availableBudgetYen).toBeNull();
    expect(education?.executionRatePercent).toBeNull();
  });

  it("合計行が無い年度では、合計と全体の執行率を出さない", () => {
    const execution = buildFiscalExecution(2024, {
      initialBudgetSet: null,
      availableBudgetSet: set({
        id: "available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        lines: [line("welfare", "民生費", "expenditure_budget", "1000")],
      }),
      settlementSet: set({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [line("welfare", "民生費", "expenditure_actual", "900")],
      }),
    });

    expect(execution?.totalAvailableBudgetYen).toBeNull();
    expect(execution?.totalExecutionRatePercent).toBeNull();
    expect(execution?.rows[0].initialBudgetYen).toBeNull();
  });

  it("予算現額はあるが決算が未公開の款は、額だけ出して執行率を出さない", () => {
    const execution = buildFiscalExecution(2024, {
      initialBudgetSet: null,
      availableBudgetSet: set({
        id: "available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        lines: [line("welfare", "民生費", "expenditure_budget", "1000")],
      }),
      settlementSet: null,
    });

    expect(execution?.rows[0].availableBudgetYen).toBe("1000");
    expect(execution?.rows[0].actualYen).toBeNull();
    expect(execution?.rows[0].executionRatePercent).toBeNull();
    expect(execution?.coveredActualYen).toBe("0");
  });

  it("予算現額が 0 の款は、額を出しつつ執行率を出さない", () => {
    const execution = buildFiscalExecution(2024, {
      initialBudgetSet: null,
      availableBudgetSet: set({
        id: "available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        lines: [line("welfare", "民生費", "expenditure_budget", "0")],
      }),
      settlementSet: set({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [line("welfare", "民生費", "expenditure_actual", "100")],
      }),
    });

    expect(execution?.rows[0].executionRatePercent).toBeNull();
  });

  it("予算現額も決算も無い年度では、執行状況を作らない", () => {
    expect(
      buildFiscalExecution(2024, {
        initialBudgetSet: set({
          id: "initial",
          lines: [line("welfare", "民生費", "expenditure_budget", "1000")],
        }),
        availableBudgetSet: null,
        settlementSet: null,
      })
    ).toBeNull();
  });

  it("歳入だけの年度では、歳出の執行状況を作らない", () => {
    expect(
      buildFiscalExecution(2024, {
        initialBudgetSet: set({
          id: "initial",
          lines: [line("municipal_tax", "市税", "revenue_budget", "1000")],
        }),
        availableBudgetSet: null,
        settlementSet: null,
      })
    ).toBeNull();
  });

  it("款別の合計を、合計行の有無とは別に数える", () => {
    const execution = buildFiscalExecution(2024, fiscal2024Sets());

    expect(execution?.coveredAvailableBudgetYen).toBe("59821523000");
    expect(execution?.coveredActualYen).toBe("51004111315");
  });
});
