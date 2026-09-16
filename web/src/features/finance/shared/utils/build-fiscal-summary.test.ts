import { describe, expect, it } from "vitest";
import type { FiscalAmountSet, FiscalMeasure } from "../types/fiscal-amount";
import { buildExpenditureTimeline, measuresOf } from "./build-fiscal-summary";

function amountSet(
  overrides: Partial<FiscalAmountSet> & Pick<FiscalAmountSet, "id">
): FiscalAmountSet {
  return {
    fiscalYear: 2026,
    eventKind: "initial_budget",
    decisionStage: "proposed",
    asOfDate: null,
    effectiveOn: null,
    lines: [],
    ...overrides,
  };
}

function totalLine(amountYen: string, measure: FiscalMeasure) {
  return {
    classificationKey: null,
    label: null,
    measure,
    amountYen,
    nullReason: null,
  };
}

describe("measuresOf", () => {
  it("同じ金額セットに同居する歳入と歳出を両方返す", () => {
    expect(
      measuresOf(
        amountSet({
          id: "mixed",
          lines: [
            totalLine("1000", "revenue_budget"),
            totalLine("1000", "expenditure_budget"),
          ],
        })
      )
    ).toEqual(["revenue_budget", "expenditure_budget"]);
  });
});

describe("buildExpenditureTimeline", () => {
  it("当初予算・予算現額・決算の順に並べる", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [totalLine("900", "expenditure_actual")],
      }),
      amountSet({
        id: "budget",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
      amountSet({
        id: "snapshot",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [totalLine("1100", "expenditure_budget")],
      }),
    ]);

    expect(steps.map((step) => step.eventKind)).toEqual([
      "initial_budget",
      "available_budget_snapshot",
      "settlement",
    ]);
    expect(steps[1].comparison).toEqual({ kind: "computed", deltaYen: "100" });
  });

  it("金額の種類が変わる段階では差額を出さない", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "budget",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
      amountSet({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [totalLine("900", "expenditure_actual")],
      }),
    ]);

    expect(steps[1].comparison).toEqual({ kind: "measure_changed" });
  });

  it("決算のセットに歳入決算が同居していても、歳出決算を選ぶ", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "budget",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
      amountSet({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [
          totalLine("700", "revenue_actual"),
          totalLine("900", "expenditure_actual"),
        ],
      }),
    ]);

    expect(steps).toHaveLength(2);
    expect(steps[1].measure).toBe("expenditure_actual");
    expect(steps[1].amountYen).toBe("900");
  });

  it("前の段階の合計が未公開なら、比較なしの理由に残す", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "budget",
        lines: [
          {
            classificationKey: null,
            label: null,
            measure: "expenditure_budget" as const,
            amountYen: null,
            nullReason: "資料に記載がない",
          },
        ],
      }),
      amountSet({
        id: "snapshot",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [totalLine("1100", "expenditure_budget")],
      }),
    ]);

    expect(steps[1].comparison).toEqual({ kind: "amount_missing" });
  });

  it("同じ段階のセットが複数あっても、基準日の古い順に並べる", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "snapshot-year-end",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [totalLine("1100", "expenditure_budget")],
      }),
      amountSet({
        id: "snapshot-mid-year",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2024-09-30",
        lines: [totalLine("1050", "expenditure_budget")],
      }),
    ]);

    expect(steps.map((step) => step.id)).toEqual([
      "snapshot-mid-year",
      "snapshot-year-end",
    ]);
    expect(steps[1].comparison).toEqual({
      kind: "computed",
      deltaYen: "50",
    });
  });

  it("歳入は支出の流れに混ぜない", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "revenue",
        lines: [totalLine("1000", "revenue_budget")],
      }),
    ]);

    expect(steps).toEqual([]);
  });

  it("最初の段階には比べる相手が無い", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "budget",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
    ]);

    expect(steps[0].comparison).toEqual({ kind: "no_previous" });
  });

  it("歳入と歳出が同居するセットからは歳出の合計だけを取る", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "mixed",
        lines: [
          totalLine("1000", "revenue_budget"),
          totalLine("1200", "expenditure_budget"),
        ],
      }),
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0].amountYen).toBe("1200");
    expect(steps[0].measure).toBe("expenditure_budget");
  });

  it("合計が未公開の段階も抜けを隠さず残す", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "budget",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
      amountSet({
        id: "snapshot",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        lines: [
          {
            classificationKey: null,
            label: null,
            measure: "expenditure_budget" as const,
            amountYen: null,
            nullReason: "資料に記載がない",
          },
        ],
      }),
    ]);

    expect(steps).toHaveLength(2);
    expect(steps[1].amountYen).toBeNull();
  });

  it("金額の行が1件も無いセットは、種類を判断できないため並べない", () => {
    const steps = buildExpenditureTimeline([
      amountSet({
        id: "snapshot",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        lines: [],
      }),
    ]);

    expect(steps).toEqual([]);
  });
});
