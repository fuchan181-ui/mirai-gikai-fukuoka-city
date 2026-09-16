import { describe, expect, it } from "vitest";
import {
  buildFiscalComparison,
  fiscalComparisonDescription,
  hasPartialCoverageAt,
  largestRowOf,
} from "./build-fiscal-comparison";
import {
  expenditure2024Sources,
  expenditure2026ProposedSources,
  line,
  amountSet as set,
} from "./fiscal-test-fixtures";

describe("buildFiscalComparison", () => {
  it("款ごとに当初予算・予算現額・決算を1行へまとめ、構成比の段階の大きい順に並べる", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    expect(comparison).not.toBeNull();
    expect(comparison?.stages).toEqual([
      "initial_budget",
      "available_budget",
      "settlement",
    ]);
    expect(comparison?.rows.map((row) => row.classificationKey)).toEqual([
      "welfare",
      "civil_engineering",
      "council_expense",
      "reserve_fund",
    ]);
    expect(comparison?.rows[0]?.amounts).toEqual({
      initial_budget: "30308896000",
      available_budget: "36060256000",
      settlement: "34457605986",
    });
  });

  it("構成比は決算の合計に対する割合で出す", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    expect(comparison?.shareStage).toBe("settlement");
    // 34,457,605,986 ÷ 92,736,569,118 = 37.156…%。画面と同じく小数第1位へ四捨五入する。
    expect(comparison?.rows[0]?.sharePercent).toBe(37.2);
  });

  it("執行率は決算 ÷ 予算現額で出す", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    expect(comparison?.progressLabel).toBe("執行率");
    expect(comparison?.rows[0]?.progressPercent).toBe(95.6);
    expect(comparison?.rows[1]?.progressPercent).toBe(69.3);
    expect(comparison?.rows[3]?.progressPercent).toBe(0);
  });

  it("予算現額が未公開の款は執行率を出さない", () => {
    const sources = expenditure2024Sources();
    const comparison = buildFiscalComparison("expenditure", {
      ...sources,
      availableBudgetSet: null,
    });
    expect(comparison?.rows[0]?.progressPercent).toBeNull();
    expect(comparison?.rows[0]?.amounts.available_budget).toBeNull();
    expect(comparison?.stages).toEqual(["initial_budget", "settlement"]);
    expect(comparison?.shareStage).toBe("settlement");
  });

  it("決算が無い年度は当初予算だけを並べ、構成比の分母もそこに置く", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2026ProposedSources()
    );
    expect(comparison?.stages).toEqual(["initial_budget"]);
    expect(comparison?.shareStage).toBe("initial_budget");
    expect(comparison?.rows.map((row) => row.label)).toEqual([
      "民生費",
      "教育費",
    ]);
    expect(comparison?.rows[0]?.sharePercent).toBe(76.9);
    expect(comparison?.totalProgressPercent).toBeNull();
  });

  it("内訳が総額に届いていない段階を、部分的な内訳として示す", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    expect(comparison).not.toBeNull();
    if (comparison === null) return;
    expect(hasPartialCoverageAt(comparison, "settlement")).toBe(true);
    expect(hasPartialCoverageAt(comparison, "initial_budget")).toBe(true);
    expect(comparison.covered.settlement).toBe("51004111315");
    expect(comparison.totals.settlement).toBe("92736569118");
  });

  it("内訳が総額と一致する段階は、部分的とはみなさない", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2026ProposedSources()
    );
    expect(comparison).not.toBeNull();
    if (comparison === null) return;
    expect(hasPartialCoverageAt(comparison, "initial_budget")).toBe(false);
  });

  it("款の説明を分類キーから付ける", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    expect(comparison?.rows[0]?.description).toContain("福祉");
  });

  it("歳入では収入率として計算し、決算の合計を構成比の分母にする", () => {
    const revenue = buildFiscalComparison("revenue", {
      initialBudgetSet: set({
        id: "revenue-initial",
        lines: [
          line("city_tax", "市税", "revenue_budget", "34300000000"),
          line(null, null, "revenue_budget", "87960000000"),
        ],
      }),
      availableBudgetSet: set({
        id: "revenue-available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [
          line("city_tax", "市税", "revenue_budget", "33500000000"),
          line(null, null, "revenue_budget", "106430416000"),
        ],
      }),
      settlementSet: set({
        id: "revenue-settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [
          line("city_tax", "市税", "revenue_actual", "34113137665"),
          line(null, null, "revenue_actual", "96520466136"),
        ],
      }),
    });
    expect(revenue?.progressLabel).toBe("収入率");
    expect(revenue?.rows[0]?.progressPercent).toBe(101.8);
    expect(revenue?.rows[0]?.sharePercent).toBe(35.3);
    expect(revenue?.rows[0]?.description).toContain("税金");
  });

  it("金額が1件も無ければ null を返す", () => {
    expect(
      buildFiscalComparison("expenditure", {
        initialBudgetSet: null,
        availableBudgetSet: null,
        settlementSet: null,
      })
    ).toBeNull();
  });
});

describe("largestRowOf", () => {
  it("構成比の基準にした段階で、最も大きい款を返す", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    expect(comparison).not.toBeNull();
    if (comparison === null) return;

    expect(largestRowOf(comparison)?.classificationKey).toBe("welfare");
  });

  it("決算の額が大きい款より、構成比の段階で大きい款を選ぶ", () => {
    const comparison = buildFiscalComparison("expenditure", {
      initialBudgetSet: null,
      availableBudgetSet: set({
        id: "available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [
          line("welfare", "民生費", "expenditure_budget", "100"),
          line("education", "教育費", "expenditure_budget", "900"),
          line(null, null, "expenditure_budget", "1000"),
        ],
      }),
      // 決算は款の額だけが先に取れていて、合計はまだ公開されていない。
      settlementSet: set({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [
          line("welfare", "民生費", "expenditure_actual", "5000"),
          line(null, null, "expenditure_actual", null),
        ],
      }),
    });
    if (comparison === null) throw new Error("比較表を作れませんでした");

    expect(comparison.shareStage).toBe("available_budget");
    // 決算の額が大きい民生費ではなく、構成比の基準である予算現額が大きい教育費を選ぶ。
    // 表の並びも同じ段階に揃える。
    expect(comparison.rows.map((row) => row.classificationKey)).toEqual([
      "education",
      "welfare",
    ]);
    expect(largestRowOf(comparison)?.classificationKey).toBe("education");
  });

  it("構成比の基準にした段階に額が無い款は選ばない", () => {
    const comparison = buildFiscalComparison("expenditure", {
      initialBudgetSet: null,
      availableBudgetSet: set({
        id: "available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [
          line("welfare", "民生費", "expenditure_budget", "100"),
          line(null, null, "expenditure_budget", "100"),
        ],
      }),
      // 決算は款の額だけが先に取れていて、合計はまだ公開されていない。
      settlementSet: set({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [
          line("civil_engineering", "土木費", "expenditure_actual", "900"),
        ],
      }),
    });
    if (comparison === null) throw new Error("比較表を作れませんでした");

    expect(comparison.shareStage).toBe("available_budget");
    // 額の大きい土木費ではなく、構成比を出せる民生費を選ぶ。
    expect(largestRowOf(comparison)?.classificationKey).toBe("welfare");
  });
});

describe("fiscalComparisonDescription", () => {
  it("決算まで並ぶ年度は、予算から決算までを示すと書く", () => {
    const comparison = buildFiscalComparison(
      "expenditure",
      expenditure2024Sources()
    );
    if (comparison === null) throw new Error("比較表を作れませんでした");

    const description = fiscalComparisonDescription(comparison);
    expect(description).toContain("当初予算から決算まで");
    expect(description).not.toContain("議決されていません");
  });

  it("決算が無い年度は、並ぶ段階に合わせて書き分ける", () => {
    const proposed = buildFiscalComparison(
      "expenditure",
      expenditure2026ProposedSources()
    );
    if (proposed === null) throw new Error("比較表を作れませんでした");

    expect(fiscalComparisonDescription(proposed)).toContain(
      "議決されていません"
    );
    expect(fiscalComparisonDescription(proposed)).not.toContain("決算");
  });

  it("歳入では、収入の見込みと実績の言葉で書く", () => {
    const revenueLines = [
      line("city_tax", "市税", "revenue_budget", "34300000000"),
      line(null, null, "revenue_budget", "87960000000"),
    ];
    const passed = buildFiscalComparison("revenue", {
      initialBudgetSet: set({ id: "revenue-passed", lines: revenueLines }),
      availableBudgetSet: null,
      settlementSet: null,
    });
    const proposed = buildFiscalComparison("revenue", {
      initialBudgetSet: set({
        id: "revenue-proposed",
        decisionStage: "proposed",
        lines: revenueLines,
      }),
      availableBudgetSet: null,
      settlementSet: null,
    });
    if (passed === null || proposed === null) {
      throw new Error("比較表を作れませんでした");
    }

    expect(fiscalComparisonDescription(passed)).toContain("収入");
    expect(fiscalComparisonDescription(passed)).not.toContain(
      "議決されていません"
    );
    expect(fiscalComparisonDescription(proposed)).toContain(
      "議決されていません"
    );
  });
});
