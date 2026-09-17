import { describe, expect, it } from "vitest";
import { MODERATION_CASES } from "./cases/moderation";
import { RICHNESS_CASES } from "./cases/richness";
import {
  createDryRunModerationJudge,
  createDryRunRichnessJudge,
} from "./judges/factory";
import type {
  ModerationJudgeOutput,
  RichnessJudgeOutput,
} from "./judges/types";
import { type RunRecord, runCases } from "./runs";
import { buildModerationSection, buildRichnessSection } from "./sections";

const MODERATION_OUTPUT = (
  status: ModerationJudgeOutput["status"]
): ModerationJudgeOutput => ({
  status,
  score: null,
  confidence: 0.5,
  categoryProbabilities: { spam: 0.9 },
  triggeredCategories: [],
  reasoning: null,
});

const RICHNESS_OUTPUT = (total: number): RichnessJudgeOutput => ({
  total,
  level: 2,
  dimensions: { clarity: 50 },
  confidence: 0.5,
});

function run<T>(caseId: string, attempt: number, output: T): RunRecord<T> {
  return {
    caseId,
    attempt,
    output,
    meta: { model: "fake", latencyMs: 10 },
  };
}

describe("buildModerationSection", () => {
  it("ケース行と混同行列を出力する", async () => {
    const judge = createDryRunModerationJudge("openai");
    const { runs } = await runCases({
      judge,
      cases: MODERATION_CASES,
      repeat: 1,
    });
    const section = buildModerationSection({
      judgeId: judge.id,
      cases: MODERATION_CASES,
      runs,
      repeat: 1,
    });

    expect(section).toContain("dry-run:openai:moderation");
    expect(section).toContain("重大な見逃し（ng→ok）: 0 件");
    expect(section).toContain("混同行列");
    expect(section).not.toContain("判定のぶれ");
  });

  it("反復で判定が変わったケースを列挙する", () => {
    const testCase = MODERATION_CASES[0];
    const section = buildModerationSection({
      judgeId: "typesafe:jev-latest",
      cases: [testCase],
      runs: [
        run(testCase.id, 1, MODERATION_OUTPUT("ok")),
        run(testCase.id, 2, MODERATION_OUTPUT("ng")),
      ],
      repeat: 2,
    });

    expect(section).toContain(
      `判定のぶれ（2 回反復）: 1/1 ケースで判定が変化 — ${testCase.id}`
    );
  });
});

describe("buildRichnessSection", () => {
  it("反復のぶれはケースごとの標準偏差で測る（ケース間の差を混ぜない）", () => {
    const [first, second] = RICHNESS_CASES;
    const section = buildRichnessSection({
      judgeId: "typesafe:jev-latest",
      cases: [first, second],
      runs: [
        run(first.id, 1, RICHNESS_OUTPUT(50)),
        run(first.id, 2, RICHNESS_OUTPUT(70)),
        run(second.id, 1, RICHNESS_OUTPUT(10)),
        run(second.id, 2, RICHNESS_OUTPUT(10)),
      ],
      repeat: 2,
    });

    // 全ケースを混ぜると 27.4 点になるが、ケース別なら (10 + 0) / 2 = 5.0 点
    expect(section).toContain(
      "判定のぶれ（2 回反復）: ケース別標準偏差 平均 5.0 点 / 最大 10.0 点"
    );
  });

  it("反復 1 回のときはぶれの行を出さない", async () => {
    const judge = createDryRunRichnessJudge("typesafe");
    const { runs } = await runCases({
      judge,
      cases: RICHNESS_CASES,
      repeat: 1,
    });
    const section = buildRichnessSection({
      judgeId: judge.id,
      cases: RICHNESS_CASES,
      runs,
      repeat: 1,
    });

    expect(section).toContain("dry-run:typesafe:richness");
    expect(section).not.toContain("判定のぶれ");
  });
});
