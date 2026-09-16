import { describe, expect, it } from "vitest";
import { buildFiscalComparison } from "./build-fiscal-comparison";
import {
  barWidthPercent,
  largestShareSentence,
  maxShareAmount,
  partialCoverageStages,
} from "./fiscal-comparison-display";
import {
  amountSet,
  expenditure2024,
  expenditure2026Proposed,
  line,
  revenue2024,
} from "./fiscal-test-fixtures";

describe("maxShareAmount", () => {
  it("構成比の基準にした段階で、いちばん大きい額を返す", () => {
    expect(maxShareAmount(expenditure2024())).toBe("34457605986");
  });

  it("その段階に款の額が1件も無ければ null を返す", () => {
    // 決算は合計だけが公開され、款ごとの額は当初予算にしか無い年度。
    const comparison = buildFiscalComparison("expenditure", {
      initialBudgetSet: amountSet({
        id: "initial",
        lines: [
          line("welfare", "民生費", "expenditure_budget", "1000"),
          line(null, null, "expenditure_budget", "1000"),
        ],
      }),
      availableBudgetSet: null,
      settlementSet: amountSet({
        id: "settlement",
        eventKind: "settlement",
        decisionStage: "not_applicable",
        lines: [line(null, null, "expenditure_actual", "1000")],
      }),
    });
    expect(comparison).not.toBeNull();
    if (comparison === null) return;
    expect(comparison.shareStage).toBe("settlement");
    expect(maxShareAmount(comparison)).toBeNull();
  });
});

describe("barWidthPercent", () => {
  it("最大の額を100として相対的な長さを返す", () => {
    expect(barWidthPercent("1000", "1000")).toBe(100);
    expect(barWidthPercent("250", "1000")).toBe(25);
  });

  // 構成比は小数第1位までしか出さないため、0.1%未満の款は「0.0%」と表示される。
  // 棒を構成比から引くと、その款の棒だけが消えてしまう。
  it("構成比が0.0%に丸められる額でも、棒の長さは0にしない", () => {
    expect(barWidthPercent("4", "10000")).toBeGreaterThan(0);
  });

  it("額や基準が無いとき、ゼロ以下のときは0を返す", () => {
    expect(barWidthPercent(null, "1000")).toBe(0);
    expect(barWidthPercent("1000", null)).toBe(0);
    expect(barWidthPercent("1000", "0")).toBe(0);
    expect(barWidthPercent("0", "1000")).toBe(0);
  });

  it("基準を超える額でも100を超えない", () => {
    expect(barWidthPercent("2000", "1000")).toBe(100);
  });
});

describe("partialCoverageStages", () => {
  it("内訳が総額に届いていない段階だけを、届いている割合つきで返す", () => {
    const stages = partialCoverageStages(expenditure2024());
    expect(stages.map((entry) => entry.stage)).toEqual([
      "initial_budget",
      "available_budget",
      "settlement",
    ]);
    expect(stages[2]).toEqual({
      stage: "settlement",
      total: "92736569118",
      covered: "51004111315",
      coveredSharePercent: 55,
    });
  });

  it("内訳が総額と一致する段階は含めない", () => {
    expect(partialCoverageStages(expenditure2026Proposed())).toEqual([]);
  });
});

describe("largestShareSentence", () => {
  it("内訳が総額と一致する年度は、全体の1位として書く", () => {
    expect(largestShareSentence(expenditure2026Proposed())).toBe(
      "支出で最も大きいのは民生費（当初予算の76.9%、300億円）です。"
    );
  });

  // 一部の款しか取り込めていない年度に「全体の1位」と書くと、嘘になる。
  it("内訳が一部だけの年度は、何を見て選んだかを文に残す", () => {
    expect(largestShareSentence(expenditure2024())).toBe(
      "公開されている内訳では、支出で最も大きいのは民生費（決算の37.2%、344億5,760万5,986円）です。"
    );
  });

  it("収入でも同じ書き方をする", () => {
    expect(largestShareSentence(revenue2024())).toBe(
      "公開されている内訳では、収入で最も大きいのは市税（決算の35.3%、341億1,313万7,665円）です。"
    );
  });
});
