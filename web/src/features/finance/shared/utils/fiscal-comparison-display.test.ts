import { describe, expect, it } from "vitest";
import {
  largestShareSentence,
  partialCoverageStages,
} from "./fiscal-comparison-display";
import {
  expenditure2024,
  expenditure2026Proposed,
  revenue2024,
} from "./fiscal-test-fixtures";

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
