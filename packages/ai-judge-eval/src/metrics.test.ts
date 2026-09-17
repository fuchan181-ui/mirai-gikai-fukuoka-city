import { describe, expect, it } from "vitest";
import {
  findUnstableCases,
  levelMidpoint,
  levelToScore,
  medianOf,
  severityIndex,
  summarizeCaseSpread,
  summarizeLatency,
  summarizeModeration,
  summarizeRichness,
  summarizeSpread,
} from "./metrics";

describe("severityIndex", () => {
  it("ok < warning < ng の順に大きくなる", () => {
    expect(severityIndex("ok")).toBe(0);
    expect(severityIndex("warning")).toBe(1);
    expect(severityIndex("ng")).toBe(2);
  });
});

describe("summarizeModeration", () => {
  it("全一致なら accuracy 1、見逃しも過検知も 0", () => {
    const summary = summarizeModeration([
      { caseId: "a", expected: "ok", predicted: "ok" },
      { caseId: "b", expected: "ng", predicted: "ng" },
    ]);
    expect(summary.accuracy).toBe(1);
    expect(summary.misses).toBe(0);
    expect(summary.overBlocks).toBe(0);
  });

  it("ng を ok と判定したら critical miss として記録する", () => {
    const summary = summarizeModeration([
      { caseId: "danger", expected: "ng", predicted: "ok" },
    ]);
    expect(summary.misses).toBe(1);
    expect(summary.criticalMissCaseIds).toEqual(["danger"]);
  });

  it("ok を ng と判定したら過検知として数える", () => {
    const summary = summarizeModeration([
      { caseId: "safe", expected: "ok", predicted: "ng" },
    ]);
    expect(summary.overBlocks).toBe(1);
    expect(summary.misses).toBe(0);
    expect(summary.criticalMissCaseIds).toEqual([]);
  });

  it("ng を warning と判定するのは見逃しだが critical ではない", () => {
    const summary = summarizeModeration([
      { caseId: "border", expected: "ng", predicted: "warning" },
    ]);
    expect(summary.misses).toBe(1);
    expect(summary.criticalMissCaseIds).toEqual([]);
  });

  it("混同行列を期待ラベル行・判定列で数える", () => {
    const summary = summarizeModeration([
      { caseId: "a", expected: "ok", predicted: "warning" },
      { caseId: "b", expected: "ok", predicted: "warning" },
      { caseId: "c", expected: "ng", predicted: "ok" },
    ]);
    expect(summary.confusion.ok.warning).toBe(2);
    expect(summary.confusion.ng.ok).toBe(1);
    expect(summary.confusion.ng.ng).toBe(0);
  });

  it("空配列でもゼロ除算しない", () => {
    const summary = summarizeModeration([]);
    expect(summary.accuracy).toBe(0);
    expect(summary.total).toBe(0);
  });
});

describe("levelMidpoint", () => {
  it("各レベルのスコア帯の中点を返す", () => {
    expect(levelMidpoint(0)).toBe(9.5);
    expect(levelMidpoint(2)).toBe(49.5);
    expect(levelMidpoint(4)).toBe(90);
  });
});

describe("levelToScore", () => {
  it("5 段階を 0-100 に等間隔で写す", () => {
    expect(levelToScore(0, 5)).toBe(0);
    expect(levelToScore(1, 5)).toBe(25);
    expect(levelToScore(2, 5)).toBe(50);
    expect(levelToScore(4, 5)).toBe(100);
  });

  it("小数のレベルも四捨五入して返す", () => {
    expect(levelToScore(2.5, 5)).toBe(63);
  });

  it("レベルが 1 段階以下なら 0 を返す", () => {
    expect(levelToScore(0, 1)).toBe(0);
    expect(levelToScore(0, 0)).toBe(0);
  });
});

describe("summarizeRichness", () => {
  it("レベル完全一致と±1以内を別々に数える", () => {
    const summary = summarizeRichness([
      {
        caseId: "a",
        expectedLevel: 4,
        predictedLevel: 4,
        expectedScore: 90,
        predictedScore: 85,
      },
      {
        caseId: "b",
        expectedLevel: 2,
        predictedLevel: 3,
        expectedScore: 49.5,
        predictedScore: 70,
      },
      {
        caseId: "c",
        expectedLevel: 0,
        predictedLevel: 4,
        expectedScore: 9.5,
        predictedScore: 90,
      },
    ]);
    expect(summary.exactLevel).toBe(1);
    expect(summary.withinOneLevel).toBe(2);
    expect(summary.withinOneLevelRate).toBeCloseTo(2 / 3, 5);
  });

  it("平均絶対誤差と符号付き誤差を返す", () => {
    const summary = summarizeRichness([
      {
        caseId: "a",
        expectedLevel: 2,
        predictedLevel: 3,
        expectedScore: 50,
        predictedScore: 60,
      },
      {
        caseId: "b",
        expectedLevel: 2,
        predictedLevel: 1,
        expectedScore: 50,
        predictedScore: 30,
      },
    ]);
    expect(summary.meanAbsoluteError).toBe(15);
    expect(summary.meanSignedError).toBe(-5);
  });

  it("空配列でもゼロ除算しない", () => {
    const summary = summarizeRichness([]);
    expect(summary.meanAbsoluteError).toBe(0);
    expect(summary.exactLevelRate).toBe(0);
  });
});

describe("summarizeLatency", () => {
  it("中央値と p90 を返す", () => {
    const summary = summarizeLatency([100, 200, 300, 400, 500]);
    expect(summary.medianMs).toBe(300);
    expect(summary.p90Ms).toBe(500);
    expect(summary.count).toBe(5);
  });

  it("要素が 1 件でも破綻しない", () => {
    const summary = summarizeLatency([42]);
    expect(summary.medianMs).toBe(42);
    expect(summary.p90Ms).toBe(42);
  });

  it("空配列では 0 を返す", () => {
    expect(summarizeLatency([])).toEqual({
      count: 0,
      medianMs: 0,
      p90Ms: 0,
    });
  });
});

describe("summarizeSpread", () => {
  it("平均と標準偏差を返す", () => {
    const spread = summarizeSpread([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(spread.mean).toBe(5);
    expect(spread.standardDeviation).toBeCloseTo(2, 5);
  });
});

describe("medianOf / summarizeLatency（偶数個）", () => {
  it("奇数個は中央の値、偶数個は中央 2 つの平均を返す", () => {
    expect(medianOf([100, 200, 300])).toBe(200);
    expect(medianOf([100, 300])).toBe(200);
    expect(medianOf([100, 200, 300, 400])).toBe(250);
    expect(medianOf([])).toBe(0);
  });

  it("16 件（偶数）でも下側に偏らない", () => {
    const samples = Array.from({ length: 16 }, (_, index) => (index + 1) * 100);
    const summary = summarizeLatency(samples);
    // 8 番目と 9 番目の平均。下側をそのまま返す実装だと 800ms になる
    expect(summary.medianMs).toBe(850);
  });
});

describe("summarizeCaseSpread", () => {
  it("ケースごとに標準偏差を取る（ケース間の内容差を混ぜない）", () => {
    const spread = summarizeCaseSpread([
      { caseId: "level-0", value: 0 },
      { caseId: "level-4", value: 100 },
      { caseId: "level-0", value: 0 },
      { caseId: "level-4", value: 100 },
    ]);

    expect(spread.meanStandardDeviation).toBe(0);
    expect(spread.maxStandardDeviation).toBe(0);
    expect(spread.cases.map((entry) => entry.caseId)).toEqual([
      "level-0",
      "level-4",
    ]);
  });

  it("同じケース内の変化を検出する", () => {
    const spread = summarizeCaseSpread([
      { caseId: "a", value: 40 },
      { caseId: "a", value: 60 },
      { caseId: "b", value: 10 },
      { caseId: "b", value: 10 },
    ]);

    expect(spread.cases[0]).toEqual({
      caseId: "a",
      count: 2,
      mean: 50,
      standardDeviation: 10,
    });
    expect(spread.meanStandardDeviation).toBe(5);
    expect(spread.maxStandardDeviation).toBe(10);
  });

  it("1 回しか実行できなかったケースは平均から除き、件数で知らせる", () => {
    const spread = summarizeCaseSpread([
      { caseId: "a", value: 40 },
      { caseId: "a", value: 60 },
      { caseId: "b", value: 10 },
    ]);

    expect(spread.meanStandardDeviation).toBe(10);
    expect(spread.maxStandardDeviation).toBe(10);
    expect(spread.singleSampleCases).toBe(1);
    expect(spread.cases).toHaveLength(2);
  });

  it("空配列では 0 を返す", () => {
    expect(summarizeCaseSpread([])).toEqual({
      cases: [],
      meanStandardDeviation: 0,
      maxStandardDeviation: 0,
      singleSampleCases: 0,
    });
  });
});

describe("findUnstableCases", () => {
  it("ラベルが変わったケースだけを返す", () => {
    const result = findUnstableCases([
      { caseId: "a", label: "ok" },
      { caseId: "a", label: "warning" },
      { caseId: "b", label: "ok" },
      { caseId: "b", label: "ok" },
    ]);

    expect(result.caseIds).toEqual(["a"]);
    expect(result.changedCount).toBe(1);
    expect(result.totalCases).toBe(2);
  });

  it("すべて同じなら変化なし", () => {
    const result = findUnstableCases([
      { caseId: "a", label: "ng" },
      { caseId: "a", label: "ng" },
    ]);

    expect(result.caseIds).toEqual([]);
    expect(result.changedCount).toBe(0);
  });
});

describe("summarizeRichness レベル単位の誤差", () => {
  it("スコアの目盛りに依存せず、レベル差だけを測る", () => {
    const summary = summarizeRichness([
      {
        caseId: "exact",
        expectedLevel: 4,
        predictedLevel: 4,
        // 帯の中点と線形換算のずれで、スコア上は 10 点ずれている
        expectedScore: 90,
        predictedScore: 100,
      },
      {
        caseId: "over",
        expectedLevel: 0,
        predictedLevel: 2,
        expectedScore: 9.5,
        predictedScore: 50,
      },
    ]);

    expect(summary.meanAbsoluteError).toBeGreaterThan(0);
    expect(summary.meanAbsoluteLevelError).toBe(1);
    expect(summary.meanSignedLevelError).toBe(1);
  });
});
