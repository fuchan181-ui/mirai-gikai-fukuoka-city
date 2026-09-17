import { describe, expect, it } from "vitest";
import { RICHNESS_LEVELS } from "../cases/richness";
import {
  composeRichnessFromAnswers,
  composeRichnessTotal,
  RICHNESS_DIMENSIONS,
  RICHNESS_LEVEL_CRITERIA,
  type RichnessAnswers,
} from "./typesafe-richness";

describe("RICHNESS_LEVEL_CRITERIA", () => {
  it("既存実装と同じ 5 段階を持つ", () => {
    expect(RICHNESS_LEVEL_CRITERIA.length).toBe(RICHNESS_LEVELS.length);
  });
});

describe("RICHNESS_DIMENSIONS", () => {
  it("キーが重複せず、重みの合計が 1 になる", () => {
    const keys = RICHNESS_DIMENSIONS.map((dimension) => dimension.key);
    expect(new Set(keys).size).toBe(keys.length);

    const totalWeight = RICHNESS_DIMENSIONS.reduce(
      (sum, dimension) => sum + dimension.weight,
      0
    );
    expect(totalWeight).toBeCloseTo(1, 10);
  });
});

describe("composeRichnessTotal", () => {
  it("全次元が最低レベルなら 0", () => {
    expect(
      composeRichnessTotal({
        clarity: 0,
        specificity: 0,
        impact: 0,
        constructiveness: 0,
      })
    ).toBe(0);
  });

  it("全次元が最高レベルなら 100", () => {
    expect(
      composeRichnessTotal({
        clarity: 4,
        specificity: 4,
        impact: 4,
        constructiveness: 4,
      })
    ).toBe(100);
  });

  it("全次元が中間レベルなら 50", () => {
    expect(
      composeRichnessTotal({
        clarity: 2,
        specificity: 2,
        impact: 2,
        constructiveness: 2,
      })
    ).toBe(50);
  });

  it("重みの偏りを反映する", () => {
    const dimensions = [
      { key: "heavy", weight: 3 },
      { key: "light", weight: 1 },
    ] as const;
    expect(composeRichnessTotal({ heavy: 4, light: 0 }, dimensions)).toBe(75);
  });

  it("値のない次元は分母から除く", () => {
    const dimensions = [
      { key: "a", weight: 1 },
      { key: "b", weight: 1 },
    ] as const;
    expect(composeRichnessTotal({ a: 4 }, dimensions)).toBe(100);
  });

  it("重みの合計が 0 なら 0", () => {
    expect(composeRichnessTotal({ a: 4 }, [{ key: "a", weight: 0 }])).toBe(0);
  });

  it("レベルが小数でも丸めて返す", () => {
    expect(
      composeRichnessTotal({
        clarity: 3,
        specificity: 2,
        impact: 2,
        constructiveness: 2,
      })
    ).toBe(56);
  });
});

describe("composeRichnessFromAnswers", () => {
  const buildAnswers = (
    scores: Record<string, number>,
    confidence = 0.8
  ): RichnessAnswers => {
    const answers: Record<string, { score: number; confidence: number }> = {};
    for (const dimension of RICHNESS_DIMENSIONS) {
      answers[dimension.key] = {
        score: scores[dimension.key] ?? 0,
        confidence,
      };
    }
    return answers;
  };

  it("次元スコアと総合スコア・レベルを組み立てる", () => {
    const composition = composeRichnessFromAnswers(
      buildAnswers({
        clarity: 4,
        specificity: 4,
        impact: 4,
        constructiveness: 4,
      })
    );

    expect(composition.levels).toEqual({
      clarity: 4,
      specificity: 4,
      impact: 4,
      constructiveness: 4,
    });
    expect(composition.dimensions).toEqual({
      clarity: 100,
      specificity: 100,
      impact: 100,
      constructiveness: 100,
    });
    expect(composition.total).toBe(100);
    expect(composition.level).toBe(4);
    expect(composition.confidence).toBeCloseTo(0.8, 5);
  });

  it("次元ごとの確信度を平均する", () => {
    const answers: Record<string, { score: number; confidence: number }> = {};
    RICHNESS_DIMENSIONS.forEach((dimension, index) => {
      answers[dimension.key] = {
        score: 2,
        confidence: index === 0 ? 1 : 0,
      };
    });

    const composition = composeRichnessFromAnswers(answers);
    expect(composition.confidence).toBeCloseTo(0.25, 5);
  });

  it("応答に無い次元は配線ミスとして落とす", () => {
    const answers = buildAnswers({ clarity: 1 });
    delete (answers as Record<string, unknown>).impact;

    expect(() => composeRichnessFromAnswers(answers)).toThrow(
      /"impact" がありません/
    );
  });
});
