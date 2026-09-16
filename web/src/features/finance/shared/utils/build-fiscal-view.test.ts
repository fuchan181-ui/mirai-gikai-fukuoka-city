import { describe, expect, it } from "vitest";
import type { FiscalAmountSet, FiscalMeasure } from "../types/fiscal-amount";
import {
  buildFiscalYearHighlights,
  buildFiscalYearView,
  initialBudgetBreakdownDescription,
  isFiscalYearEnd,
  pickAmountSet,
  totalOf,
} from "./build-fiscal-view";

function amountSet(
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

function totalLine(amountYen: string, measure: FiscalMeasure) {
  return {
    classificationKey: null,
    label: null,
    measure,
    amountYen,
    nullReason: null,
  };
}

describe("pickAmountSet", () => {
  it("可決後の金額セットを提案段階より優先する", () => {
    const proposed = amountSet({
      id: "proposed",
      decisionStage: "proposed",
      lines: [totalLine("1000", "expenditure_budget")],
    });
    const passed = amountSet({
      id: "passed",
      decisionStage: "passed",
      lines: [totalLine("1000", "expenditure_budget")],
    });

    expect(
      pickAmountSet([proposed, passed], "initial_budget", "expenditure_budget")
        ?.id
    ).toBe("passed");
  });

  it("種別や金額種別が合わないものは選ばない", () => {
    expect(
      pickAmountSet(
        [
          amountSet({
            id: "settlement",
            lines: [totalLine("900", "expenditure_actual")],
          }),
        ],
        "initial_budget",
        "expenditure_budget"
      )
    ).toBeNull();
  });

  it("歳入と歳出が同居するセットでも、指定した種類のセットとして選ぶ", () => {
    const mixed = amountSet({
      id: "mixed",
      lines: [
        totalLine("1000", "revenue_budget"),
        totalLine("1200", "expenditure_budget"),
      ],
    });

    expect(pickAmountSet([mixed], "initial_budget", "revenue_budget")?.id).toBe(
      "mixed"
    );
    expect(
      pickAmountSet([mixed], "initial_budget", "expenditure_budget")?.id
    ).toBe("mixed");
  });

  it("同じ議決段階のセットが複数あるときは、基準日が最も新しいものを選ぶ", () => {
    const midYear = amountSet({
      id: "snapshot-mid-year",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      asOfDate: "2024-09-30",
      lines: [totalLine("1050", "expenditure_budget")],
    });
    const yearEnd = amountSet({
      id: "snapshot-year-end",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      asOfDate: "2025-03-31",
      lines: [totalLine("1100", "expenditure_budget")],
    });

    // 入力順を入れ替えても選ばれるセットが変わらないことを見る。
    for (const sets of [
      [midYear, yearEnd],
      [yearEnd, midYear],
    ]) {
      expect(
        pickAmountSet(sets, "available_budget_snapshot", "expenditure_budget")
          ?.id
      ).toBe("snapshot-year-end");
    }
  });

  it("基準日を持つセットを、持たないセットより優先する", () => {
    const undated = amountSet({
      id: "snapshot-undated",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      lines: [totalLine("1000", "expenditure_budget")],
    });
    const dated = amountSet({
      id: "snapshot-dated",
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      asOfDate: "2025-03-31",
      lines: [totalLine("1100", "expenditure_budget")],
    });

    for (const sets of [
      [undated, dated],
      [dated, undated],
    ]) {
      expect(
        pickAmountSet(sets, "available_budget_snapshot", "expenditure_budget")
          ?.id
      ).toBe("snapshot-dated");
    }
  });
});

describe("isFiscalYearEnd", () => {
  it("翌年3月31日だけを年度末として扱う", () => {
    expect(isFiscalYearEnd("2025-03-31", 2024)).toBe(true);
    expect(isFiscalYearEnd("2024-09-30", 2024)).toBe(false);
    expect(isFiscalYearEnd(null, 2024)).toBe(false);
  });
});

describe("totalOf", () => {
  it("合計行が無ければ null を返す", () => {
    expect(totalOf(null, "expenditure_budget")).toBeNull();
    expect(
      totalOf(amountSet({ id: "empty" }), "expenditure_budget")
    ).toBeNull();
    expect(
      totalOf(
        amountSet({
          id: "with",
          lines: [totalLine("500", "expenditure_budget")],
        }),
        "expenditure_budget"
      )
    ).toBe("500");
  });

  it("指定した種類の合計だけを返す", () => {
    const mixed = amountSet({
      id: "mixed",
      lines: [
        totalLine("1000", "revenue_budget"),
        totalLine("1200", "expenditure_budget"),
      ],
    });

    expect(totalOf(mixed, "revenue_budget")).toBe("1000");
    expect(totalOf(mixed, "expenditure_budget")).toBe("1200");
  });
});

describe("buildFiscalYearView", () => {
  it("公開された段階だけを要点カードにし、基準日を保持する", () => {
    const view = buildFiscalYearView(2024, [
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

    expect(view.highlights.map((highlight) => highlight.key)).toEqual([
      "expenditure-budget",
      "available-budget",
    ]);
    expect(view.highlights[1].asOfDate).toBe("2025-03-31");
    expect(view.highlights.map((highlight) => highlight.decisionStage)).toEqual(
      ["passed", "not_applicable"]
    );
  });

  it("議決前の当初予算は、決めた額ではなく提案中の案として印を付ける", () => {
    const view = buildFiscalYearView(2026, [
      amountSet({
        id: "budget",
        fiscalYear: 2026,
        decisionStage: "proposed",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
    ]);

    expect(view.highlights[0].decisionStage).toBe("proposed");
    expect(view.highlights[0].note).toContain("議決されていません");
    expect(view.expenditureBudget?.decisionStage).toBe("proposed");
  });

  it("初期予算のセットに歳入と歳出が同居していても取り違えない", () => {
    const view = buildFiscalYearView(2026, [
      amountSet({
        id: "budget",
        fiscalYear: 2026,
        decisionStage: "proposed",
        lines: [
          totalLine("1000", "revenue_budget"),
          totalLine("1200", "expenditure_budget"),
          {
            classificationKey: "city-tax",
            label: "市税",
            measure: "revenue_budget" as const,
            amountYen: "1000",
            nullReason: null,
          },
          {
            classificationKey: "welfare",
            label: "民生費",
            measure: "expenditure_budget" as const,
            amountYen: "1200",
            nullReason: null,
          },
        ],
      }),
    ]);

    expect(view.revenueBudget?.items.map((item) => item.label)).toEqual([
      "市税",
    ]);
    expect(view.expenditureBudget?.items.map((item) => item.label)).toEqual([
      "民生費",
    ]);
    expect(view.timeline[0].amountYen).toBe("1200");
  });

  it("値が無い段階は 0円 のカードを作らない", () => {
    const view = buildFiscalYearView(2026, [
      amountSet({
        id: "budget",
        fiscalYear: 2026,
        decisionStage: "proposed",
        lines: [totalLine("1000", "expenditure_budget")],
      }),
    ]);

    expect(view.highlights).toHaveLength(1);
    expect(
      view.highlights.some((highlight) => highlight.amountYen === "0")
    ).toBe(false);
    expect(view.expenditureActual).toBeNull();
  });

  it("額が未公開の段階も、0円の内訳を作らず「未公開」として残す", () => {
    const view = buildFiscalYearView(2026, [
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
    ]);

    expect(view.highlights).toHaveLength(1);
    expect(view.highlights[0].amountYen).toBeNull();
    expect(view.expenditureBudget?.items).toEqual([]);
  });
});

describe("buildFiscalYearHighlights", () => {
  it("年度末より前の基準日を「年度末の予算現額」と呼ばない", () => {
    const highlights = buildFiscalYearHighlights(2024, [
      amountSet({
        id: "snapshot",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2024-09-30",
        lines: [totalLine("1050", "expenditure_budget")],
      }),
    ]);

    expect(highlights[0].label).toBe("予算現額");
    expect(highlights[0].note).toContain("基準日時点");
  });

  it("年度末の基準日は年度末として示す", () => {
    const highlights = buildFiscalYearHighlights(2024, [
      amountSet({
        id: "snapshot",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [totalLine("1100", "expenditure_budget")],
      }),
    ]);

    expect(highlights[0].label).toBe("年度末の予算現額");
    expect(highlights[0].note).toContain("年度末時点");
  });
});

describe("initialBudgetBreakdownDescription", () => {
  it("提案中は、まだ議決されていないと明記する", () => {
    const description = initialBudgetBreakdownDescription(
      "proposed",
      "何にいくら使う"
    );

    expect(description).toContain("提案されている案");
    expect(description).toContain("議決されていません");
  });

  it("可決後は、決めた額として説明する", () => {
    const description = initialBudgetBreakdownDescription(
      "passed",
      "何にいくら使う"
    );

    expect(description).toContain("決めた");
    expect(description).not.toContain("議決されていません");
  });
});
