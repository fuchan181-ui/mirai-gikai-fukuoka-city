import { DEFAULT_CONTENT_RICHNESS_MODEL } from "@mirai-gikai/shared/ai/models";
import { MODERATION_CASES } from "../cases/moderation";
import { RICHNESS_CASES } from "../cases/richness";
import { levelMidpoint } from "../metrics";
import type { JudgeKind, Options } from "../options";
import { createOpenAiModerationJudge } from "./openai-moderation";
import { createOpenAiRichnessJudge } from "./openai-richness";
import type {
  Judge,
  ModerationJudgeOutput,
  RichnessJudgeOutput,
} from "./types";
import { createTypeSafeModerationJudge } from "./typesafe-moderation";
import { createTypeSafeRichnessJudge } from "./typesafe-richness";

export type ModerationCase = (typeof MODERATION_CASES)[number];
export type RichnessCase = (typeof RICHNESS_CASES)[number];

export function requireApiKey(name: string, kind: JudgeKind): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} が未設定です。${kind} 判定を実行するには設定してください。\n` +
        "片方だけを指定する場合は --judge を使ってください。"
    );
  }
  return value;
}

/**
 * API を呼ばずに配線だけ検証するダミー判定器。
 * 期待ラベルをそのまま返すので、レポートが「全一致」になるのが正常。
 */
export function createDryRunModerationJudge(
  kind: JudgeKind
): Judge<ModerationCase["input"], ModerationJudgeOutput> {
  return {
    id: `dry-run:${kind}:moderation`,
    async run(input) {
      const byContent = MODERATION_CASES.find(
        (testCase) => testCase.input === input
      );
      return {
        output: {
          status: byContent?.expected ?? "ok",
          score: null,
          confidence: 0.9,
          categoryProbabilities: {},
          triggeredCategories: [],
          reasoning: null,
        },
        meta: { model: "dry-run", latencyMs: 1 },
      };
    },
  };
}

export function createDryRunRichnessJudge(
  kind: JudgeKind
): Judge<RichnessCase["input"], RichnessJudgeOutput> {
  return {
    id: `dry-run:${kind}:richness`,
    async run(input) {
      const byContent = RICHNESS_CASES.find(
        (testCase) => testCase.input === input
      );
      const level = byContent?.expected ?? 0;
      return {
        output: {
          total: levelMidpoint(level),
          level,
          dimensions: {},
          confidence: 0.9,
        },
        meta: { model: "dry-run", latencyMs: 1 },
      };
    },
  };
}

/** 判定器を追加したときに、分岐の更新漏れを型エラーにする。 */
function assertNeverJudgeKind(value: never): never {
  throw new Error(`未対応の判定器です: ${String(value)}`);
}

export function buildModerationJudge(
  kind: JudgeKind,
  options: Options
): Judge<ModerationCase["input"], ModerationJudgeOutput> {
  if (options.dryRun) return createDryRunModerationJudge(kind);

  switch (kind) {
    case "openai":
      return createOpenAiModerationJudge({
        apiKey: requireApiKey("OPENAI_API_KEY", kind),
        modelName: options.openaiModel ?? undefined,
      });
    case "typesafe":
      return createTypeSafeModerationJudge({
        apiKey: requireApiKey("TYPESAFE_API_KEY", kind),
        modelName: options.typesafeModel ?? undefined,
      });
    default:
      return assertNeverJudgeKind(kind);
  }
}

export function buildRichnessJudge(
  kind: JudgeKind,
  options: Options
): Judge<RichnessCase["input"], RichnessJudgeOutput> {
  if (options.dryRun) return createDryRunRichnessJudge(kind);

  switch (kind) {
    case "openai":
      return createOpenAiRichnessJudge({
        apiKey: requireApiKey("OPENAI_API_KEY", kind),
        modelName: options.openaiModel ?? DEFAULT_CONTENT_RICHNESS_MODEL,
      });
    case "typesafe":
      return createTypeSafeRichnessJudge({
        apiKey: requireApiKey("TYPESAFE_API_KEY", kind),
        modelName: options.typesafeModel ?? undefined,
      });
    default:
      return assertNeverJudgeKind(kind);
  }
}
