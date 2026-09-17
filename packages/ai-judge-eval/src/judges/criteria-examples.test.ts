import { describe, expect, it } from "vitest";
import { MODERATION_CASES } from "../cases/moderation";
import { MODERATION_CATEGORIES } from "./typesafe-moderation";

/**
 * criteria の例文と評価ケース本文の重なり具合。
 *
 * TypeSafe はプロンプト（`instructions` / `criteria`）で判定基準を渡すため、
 * 例文に評価ケースの本文を書いてしまうと、モデルは判定ではなく「書いてある
 * 答えを読む」ことができてしまう。そうなると一致率は過大評価になり、
 * 実データでの精度を何も語らなくなる。
 *
 * 例文は境界を説明するために必要なので、無関係な題材で書きながら
 * **評価ケースと同じ長い文字列は使わない**ことを機械的に保証する。
 */
function longestCommonSubstringLength(a: string, b: string): number {
  let best = 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] !== b[j - 1]) continue;
      cur[j] = prev[j - 1] + 1;
      if (cur[j] > best) best = cur[j];
    }
    prev = cur;
  }
  return best;
}

/**
 * 例文で違反とする重なりの長さ（この文字数以上で違反）。
 * 日本語の接続表現（「ようにしてほしい」= 8 文字）は通し、焼き直しは落とす。
 */
const MIN_VIOLATING_EXAMPLE_OVERLAP = 9;
/** `what` は定義文なので例文より緩くするが、ケースの転記は落とす。 */
const MIN_VIOLATING_WHAT_OVERLAP = 12;

type CriteriaField = { label: string; text: string; limit: number };

function collectCriteriaFields(): CriteriaField[] {
  const fields: CriteriaField[] = [];
  for (const category of MODERATION_CATEGORIES) {
    for (const side of ["true", "false"] as const) {
      const entry = category.criteria[side];
      fields.push({
        label: `${category.key}.${side}.what`,
        text: entry.what,
        limit: MIN_VIOLATING_WHAT_OVERLAP,
      });
      entry.examples.forEach((example, index) => {
        fields.push({
          label: `${category.key}.${side}.examples[${index}]`,
          text: example,
          limit: MIN_VIOLATING_EXAMPLE_OVERLAP,
        });
      });
    }
  }
  return fields;
}

/**
 * ケース側の全文。`opinions` だけでなく `summary` とユーザー発話も含める。
 * 判定器に渡る state（`buildJudgeState` と同じ範囲）を対象にしないと、
 * 発話だけに本文を書いたケースでガードが静かにすり抜ける。
 */
function caseBodies(): Array<{ id: string; body: string }> {
  return MODERATION_CASES.flatMap((testCase) => {
    const input = testCase.input;
    const texts = [
      input.summary,
      ...(input.opinions ?? []).map((opinion) => opinion.content),
      ...input.messages
        .filter((message) => message.role === "user")
        .map((message) => message.content),
    ];
    return texts
      .filter((text): text is string => typeof text === "string")
      .map((text, index) => ({
        id: `${testCase.id}[${index}]`,
        body: text,
      }));
  });
}

describe("MODERATION_CATEGORIES の criteria", () => {
  it("例文が評価ケース本文の焼き直しになっていない", () => {
    const violations: string[] = [];
    for (const field of collectCriteriaFields()) {
      for (const testCase of caseBodies()) {
        const overlap = longestCommonSubstringLength(field.text, testCase.body);
        if (overlap < field.limit) continue;
        violations.push(
          `${field.label} と ${testCase.id} が ${overlap} 文字一致（上限 ${field.limit - 1}）: "${field.text}"`
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it("13 カテゴリすべてが true / false の例文を持つ", () => {
    for (const category of MODERATION_CATEGORIES) {
      expect(category.criteria.true.examples.length).toBeGreaterThan(0);
      expect(category.criteria.false.examples.length).toBeGreaterThan(0);
    }
  });
});

describe("longestCommonSubstringLength", () => {
  it("連続一致の最長を返す", () => {
    expect(longestCommonSubstringLength("abcd", "xbcd")).toBe(3);
    expect(longestCommonSubstringLength("abcd", "wxyz")).toBe(0);
    expect(longestCommonSubstringLength("", "abc")).toBe(0);
  });
});
