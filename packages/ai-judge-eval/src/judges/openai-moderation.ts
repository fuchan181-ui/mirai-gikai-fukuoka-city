import { DEFAULT_MODERATION_MODEL } from "@mirai-gikai/shared/ai/models";
import { resolveOpenAiModel } from "@mirai-gikai/shared/ai/resolve-model";
import { buildModerationPrompt } from "@mirai-gikai/shared/moderation/build-prompt";
import { moderationResultSchema } from "@mirai-gikai/shared/moderation/schemas";
import { determineModerationStatus } from "@mirai-gikai/shared/moderation/status";
import { generateObject } from "ai";
import type { ModerationCaseInput } from "../cases/moderation";
import type { Judge, JudgeRun, ModerationJudgeOutput } from "./types";

/**
 * 本番と同じ経路（`evaluateModerationScore` と同一のプロンプト・スキーマ・
 * モデル・閾値）で判定する。比較の基準側なので、実装を変えてはいけない。
 */
export function createOpenAiModerationJudge(options: {
  apiKey: string;
  modelName?: string;
}): Judge<ModerationCaseInput, ModerationJudgeOutput> {
  const modelName = options.modelName ?? DEFAULT_MODERATION_MODEL;

  return {
    id: `openai:${modelName.split("/").pop() ?? modelName}`,
    async run(input): Promise<JudgeRun<ModerationJudgeOutput>> {
      const { system, user } = buildModerationPrompt(input);
      const startedAt = Date.now();

      const { object, usage } = await generateObject({
        model: resolveOpenAiModel(modelName, { apiKey: options.apiKey }),
        schema: moderationResultSchema,
        system,
        messages: [{ role: "user", content: user }],
      });

      return {
        output: {
          status: determineModerationStatus(object.score),
          score: object.score,
          confidence: null,
          categoryProbabilities: null,
          triggeredCategories: null,
          reasoning: object.reasoning,
        },
        meta: {
          model: modelName,
          latencyMs: Date.now() - startedAt,
          usage: {
            inputTokens: usage.inputTokens ?? 0,
            outputTokens: usage.outputTokens ?? 0,
          },
        },
      };
    },
  };
}
