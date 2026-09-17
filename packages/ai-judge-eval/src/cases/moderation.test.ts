import { describe, expect, it } from "vitest";
import { MODERATION_CATEGORIES } from "../judges/typesafe-moderation";
import { MODERATION_CASES } from "./moderation";

describe("MODERATION_CASES", () => {
  it("id が重複しない", () => {
    const ids = MODERATION_CASES.map((testCase) => testCase.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ok / warning / ng のすべての期待ラベルを含む", () => {
    const labels = new Set(
      MODERATION_CASES.map((testCase) => testCase.expected)
    );
    expect(labels).toEqual(new Set(["ok", "warning", "ng"]));
  });

  it("ng を ok と誤判定したときの影響が測れるよう、ng が複数ある", () => {
    const ngCases = MODERATION_CASES.filter(
      (testCase) => testCase.expected === "ng"
    );
    expect(ngCases.length).toBeGreaterThanOrEqual(5);
  });

  it("13 カテゴリすべてを 1 件以上で測っている", () => {
    const covered = new Set(
      MODERATION_CASES.flatMap((testCase) => testCase.covers ?? [])
    );
    for (const category of MODERATION_CATEGORIES) {
      expect(covered.has(category.key)).toBe(true);
    }
  });

  it("covers に書いたカテゴリは実在する", () => {
    const keys = new Set(MODERATION_CATEGORIES.map((category) => category.key));
    for (const testCase of MODERATION_CASES) {
      for (const key of testCase.covers ?? []) {
        expect(keys.has(key)).toBe(true);
      }
    }
  });

  it("すべてのケースに note と会話ログがある", () => {
    for (const testCase of MODERATION_CASES) {
      expect(testCase.note.length).toBeGreaterThan(0);
      expect(testCase.input.messages.length).toBeGreaterThan(0);
      expect(testCase.input.opinions?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
