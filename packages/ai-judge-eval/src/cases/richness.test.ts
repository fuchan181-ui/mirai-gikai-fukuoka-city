import { describe, expect, it } from "vitest";
import { RICHNESS_CASES, RICHNESS_LEVELS, toRichnessLevel } from "./richness";

describe("RICHNESS_LEVELS", () => {
  it("0-100 を隙間なく 5 分割している", () => {
    expect(RICHNESS_LEVELS[0].min).toBe(0);
    expect(RICHNESS_LEVELS[RICHNESS_LEVELS.length - 1].max).toBe(100);

    for (let i = 1; i < RICHNESS_LEVELS.length; i += 1) {
      expect(RICHNESS_LEVELS[i].min).toBe(RICHNESS_LEVELS[i - 1].max + 1);
    }
  });
});

describe("toRichnessLevel", () => {
  it("スコア帯の境界をどちらのレベルにも取り違えない", () => {
    expect(toRichnessLevel(0)).toBe(0);
    expect(toRichnessLevel(19)).toBe(0);
    expect(toRichnessLevel(20)).toBe(1);
    expect(toRichnessLevel(39)).toBe(1);
    expect(toRichnessLevel(40)).toBe(2);
    expect(toRichnessLevel(59)).toBe(2);
    expect(toRichnessLevel(60)).toBe(3);
    expect(toRichnessLevel(79)).toBe(3);
    expect(toRichnessLevel(80)).toBe(4);
    expect(toRichnessLevel(100)).toBe(4);
  });

  it("範囲外はクランプする", () => {
    expect(toRichnessLevel(-10)).toBe(0);
    expect(toRichnessLevel(120)).toBe(4);
  });
});

describe("RICHNESS_CASES", () => {
  it("id が重複しない", () => {
    const ids = RICHNESS_CASES.map((testCase) => testCase.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("0〜4 のすべてのレベルを 1 件ずつ含む", () => {
    const levels = RICHNESS_CASES.map((testCase) => testCase.expected).sort();
    expect(levels).toEqual([0, 1, 2, 3, 4]);
  });

  it("すべてのケースに note と会話ログがある", () => {
    for (const testCase of RICHNESS_CASES) {
      expect(testCase.note.length).toBeGreaterThan(0);
      expect(testCase.input.messages.length).toBeGreaterThan(0);
    }
  });
});
