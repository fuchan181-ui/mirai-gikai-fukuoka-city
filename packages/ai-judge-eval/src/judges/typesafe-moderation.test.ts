import { describe, expect, it } from "vitest";
import {
  combineCategoryProbabilities,
  MODERATION_CATEGORIES,
  type ModerationAnswers,
  readCategoryProbabilities,
  TYPESAFE_MODERATION_POLICY,
} from "./typesafe-moderation";

describe("MODERATION_CATEGORIES", () => {
  it("キーが重複しない", () => {
    const keys = MODERATION_CATEGORIES.map((category) => category.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ng と warning の両方の severity を持つ", () => {
    const severities = new Set(
      MODERATION_CATEGORIES.map((category) => category.severity)
    );
    expect(severities).toEqual(new Set(["ng", "warning"]));
  });

  it("全カテゴリが構造化された instructions と criteria を持つ", () => {
    for (const category of MODERATION_CATEGORIES) {
      expect(category.instructions.question.length).toBeGreaterThan(0);
      expect(category.instructions.focus.length).toBeGreaterThan(0);
      for (const side of ["true", "false"] as const) {
        expect(category.criteria[side].what.length).toBeGreaterThan(0);
        expect(category.criteria[side].examples.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("combineCategoryProbabilities", () => {
  it("どのカテゴリも閾値未満なら ok", () => {
    const result = combineCategoryProbabilities({ defamation: 0.1 });
    expect(result.status).toBe("ok");
    expect(result.triggered).toEqual([]);
  });

  it("ng カテゴリが閾値ちょうどなら ng になる（境界）", () => {
    const result = combineCategoryProbabilities({
      defamation: TYPESAFE_MODERATION_POLICY.ngThreshold,
    });
    expect(result.status).toBe("ng");
  });

  it("ng カテゴリが閾値をわずかに下回れば ok のまま", () => {
    const result = combineCategoryProbabilities({
      defamation: TYPESAFE_MODERATION_POLICY.ngThreshold - 0.001,
    });
    expect(result.status).toBe("ok");
  });

  it("warning カテゴリだけが発火したら warning", () => {
    const result = combineCategoryProbabilities({
      insensitive: TYPESAFE_MODERATION_POLICY.warningThreshold,
    });
    expect(result.status).toBe("warning");
  });

  it("warning と ng が同時に発火したら ng を優先する", () => {
    const result = combineCategoryProbabilities({
      insensitive: 0.9,
      defamation: 0.4,
    });
    expect(result.status).toBe("ng");
    expect(result.triggered.map((entry) => entry.key)).toEqual([
      "insensitive",
      "defamation",
    ]);
  });

  it("発火カテゴリを確率の高い順に並べる", () => {
    const result = combineCategoryProbabilities({
      defamation: 0.4,
      hate_speech: 0.8,
      spam: 0.6,
    });
    expect(result.triggered.map((entry) => entry.key)).toEqual([
      "hate_speech",
      "spam",
      "defamation",
    ]);
  });

  it("未知のキーは無視する", () => {
    const result = combineCategoryProbabilities({ unknown_category: 1 });
    expect(result.status).toBe("ok");
    expect(result.triggered).toEqual([]);
  });

  it("閾値を注入すると判定が変わる", () => {
    const probabilities = { defamation: 0.4 };
    expect(combineCategoryProbabilities(probabilities).status).toBe("ng");
    expect(
      combineCategoryProbabilities(probabilities, {
        ngThreshold: 0.5,
        warningThreshold: 0.5,
      }).status
    ).toBe("ok");
  });
});

describe("readCategoryProbabilities", () => {
  const buildAnswers = (
    overrides: Record<string, number> = {}
  ): ModerationAnswers => {
    const answers: Record<string, { noul: number }> = {};
    for (const category of MODERATION_CATEGORIES) {
      answers[category.key] = { noul: overrides[category.key] ?? 0.01 };
    }
    return answers;
  };

  it("全カテゴリの確率を取り出す", () => {
    const probabilities = readCategoryProbabilities(
      buildAnswers({ spam: 0.9, defamation: 0.4 })
    );

    expect(Object.keys(probabilities)).toHaveLength(
      MODERATION_CATEGORIES.length
    );
    expect(probabilities.spam).toBe(0.9);
    expect(probabilities.defamation).toBe(0.4);
    expect(probabilities.hate_speech).toBe(0.01);
  });

  it("応答に無いカテゴリは配線ミスとして落とす", () => {
    const answers = buildAnswers();
    delete (answers as Record<string, unknown>).spam;

    expect(() => readCategoryProbabilities(answers)).toThrow(
      /"spam" がありません/
    );
  });
});
