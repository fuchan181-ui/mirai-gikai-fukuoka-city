import { describe, expect, it } from "vitest";
import { buildFiscalComparison } from "./build-fiscal-comparison";
import { buildFiscalPlainSummary } from "./build-fiscal-plain-summary";
import {
  amountSet as set,
  expenditure2024,
  expenditure2026Proposed,
  line,
  revenue2024,
} from "./fiscal-test-fixtures";

describe("buildFiscalPlainSummary", () => {
  it("予算現額と決算がある年度は、執行率と上位3款を文にする", () => {
    const summary = buildFiscalPlainSummary({
      fiscalYear: 2024,
      expenditure: expenditure2024(),
      revenue: null,
    });
    expect(summary.sentences[0]).toBe(
      "令和6年度は、年度末の予算現額 1,064億3,041万6,000円のうち、927億3,656万9,118円を支出しました（執行率 87.1%）。"
    );
    expect(summary.sentences[1]).toBe(
      "公開されている内訳では、支出で最も大きいのは民生費 344億5,760万5,986円（支出全体の37.2%）で、次に土木費 160億9,698万8,873円（支出全体の17.4%）、議会費 4億4,951万6,456円（支出全体の0.5%）が続きます。"
    );
  });

  it("収入がある年度は、受け入れた額と最も大きい項目を文にする", () => {
    const summary = buildFiscalPlainSummary({
      fiscalYear: 2024,
      expenditure: null,
      revenue: revenue2024(),
    });
    expect(summary.sentences).toEqual([
      "収入では、965億2,046万6,136円を受け入れました。",
      "公開されている内訳では、収入で最も大きいのは市税 341億1,313万7,665円（収入全体の35.3%）です。",
    ]);
  });

  it("決算が無い年度は当初予算案として書き、議決前であることも添える", () => {
    const summary = buildFiscalPlainSummary({
      fiscalYear: 2026,
      expenditure: expenditure2026Proposed(),
      revenue: null,
    });
    expect(summary.sentences).toEqual([
      "令和8年度の当初予算案では、歳出に390億円を計上しています。",
      "この予算案は、まだ議会で議決されていません。",
      "支出の内訳は、民生費 300億円（支出予算全体の76.9%）、教育費 90億円（支出予算全体の23.1%）です。",
    ]);
  });

  it("年度末より前の基準日は、年度末の予算現額と呼ばない", () => {
    const comparison = buildFiscalComparison("expenditure", {
      initialBudgetSet: null,
      availableBudgetSet: set({
        id: "available-mid-year",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2024-09-30",
        lines: [
          line("welfare", "民生費", "expenditure_budget", "100000000"),
          line(null, null, "expenditure_budget", "100000000"),
        ],
      }),
      settlementSet: set({
        id: "settlement-mid-year",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [
          line("welfare", "民生費", "expenditure_actual", "80000000"),
          line(null, null, "expenditure_actual", "80000000"),
        ],
      }),
    });

    const summary = buildFiscalPlainSummary({
      fiscalYear: 2024,
      expenditure: comparison,
      revenue: null,
    });
    expect(summary.sentences[0]).toBe(
      "令和6年度は、予算現額 1億円のうち、8,000万円を支出しました（執行率 80.0%）。"
    );
  });

  // 要約が当初予算、内訳が予算現額を読むと、割合の分母が文から消えてしまう。
  it("予算現額だけがある年度は、要約と内訳を同じ段階でそろえる", () => {
    const comparison = buildFiscalComparison("expenditure", {
      initialBudgetSet: set({
        id: "initial",
        lines: [
          line("welfare", "民生費", "expenditure_budget", "100000000"),
          line(null, null, "expenditure_budget", "100000000"),
        ],
      }),
      availableBudgetSet: set({
        id: "available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [
          line("welfare", "民生費", "expenditure_budget", "200000000"),
          line(null, null, "expenditure_budget", "200000000"),
        ],
      }),
      settlementSet: null,
    });

    const summary = buildFiscalPlainSummary({
      fiscalYear: 2024,
      expenditure: comparison,
      revenue: null,
    });
    expect(summary.sentences).toEqual([
      "令和6年度は、補正を反映した予算現額で、歳出に2億円を計上しています。",
      "支出の内訳は、民生費 2億円（支出予算全体の100.0%）です。",
    ]);
  });

  it("決算が無い年度は、収入も予算の段階を言い分ける", () => {
    const revenueLines = [
      line("city_tax", "市税", "revenue_budget", "34300000000"),
      line(null, null, "revenue_budget", "87960000000"),
    ];
    const revised = buildFiscalComparison("revenue", {
      initialBudgetSet: set({ id: "revenue-initial", lines: revenueLines }),
      availableBudgetSet: set({
        id: "revenue-available",
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        asOfDate: "2025-03-31",
        lines: [
          line("city_tax", "市税", "revenue_budget", "35000000000"),
          line(null, null, "revenue_budget", "90000000000"),
        ],
      }),
      settlementSet: null,
    });
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

    expect(
      buildFiscalPlainSummary({
        fiscalYear: 2024,
        expenditure: null,
        revenue: revised,
      }).sentences[0]
    ).toBe("収入は、補正を反映した予算現額で900億円を見込んでいます。");
    expect(
      buildFiscalPlainSummary({
        fiscalYear: 2024,
        expenditure: null,
        revenue: passed,
      }).sentences[0]
    ).toBe("収入は、当初予算で879億6,000万円を見込んでいます。");
    expect(
      buildFiscalPlainSummary({
        fiscalYear: 2024,
        expenditure: null,
        revenue: proposed,
      }).sentences[0]
    ).toBe("収入は、当初予算案で879億6,000万円を見込んでいます。");
  });

  it("比較できる金額が無ければ文を作らない", () => {
    const summary = buildFiscalPlainSummary({
      fiscalYear: 2024,
      expenditure: null,
      revenue: null,
    });
    expect(summary.sentences).toEqual([]);
  });
});
