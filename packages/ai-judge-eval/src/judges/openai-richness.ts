import { DEFAULT_CONTENT_RICHNESS_MODEL } from "@mirai-gikai/shared/ai/models";
import { resolveOpenAiModel } from "@mirai-gikai/shared/ai/resolve-model";
import { buildContentRichnessPrompt } from "@mirai-gikai/shared/content-richness/build-prompt";
import { contentRichnessResultSchema } from "@mirai-gikai/shared/content-richness/schemas";
import { generateObject } from "ai";
import { type RichnessCaseInput, toRichnessLevel } from "../cases/richness";
import type { Judge, JudgeRun, RichnessJudgeOutput } from "./types";

/**
 * 本番と同じ経路（`runSingleContentRichnessScoring` と同一のプロンプト・
 * スキーマ・モデル）で判定する比較の基準側。
 */
export function createOpenAiRichnessJudge(options: {
  apiKey: string;
  modelName?: string;
}): Judge<RichnessCaseInput, RichnessJudgeOutput> {
  const modelName = options.modelName ?? DEFAULT_CONTENT_RICHNESS_MODEL;

  return {
    id: `openai:${modelName.split("/").pop() ?? modelName}`,
    async run(input): Promise<JudgeRun<RichnessJudgeOutput>> {
      const { system, user } = buildContentRichnessPrompt(input);
      const startedAt = Date.now();

      const { object, usage } = await generateObject({
        model: resolveOpenAiModel(modelName, { apiKey: options.apiKey }),
        schema: contentRichnessResultSchema,
        system,
        messages: [{ role: "user", content: user }],
      });

      return {
        output: {
          total: object.total,
          level: toRichnessLevel(object.total),
          dimensions: {
            clarity: object.clarity,
            specificity: object.specificity,
            impact: object.impact,
            constructiveness: object.constructiveness,
          },
          confidence: null,
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
