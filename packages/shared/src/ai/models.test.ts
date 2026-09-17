import { describe, expect, it } from "vitest";
import {
  AI_MODELS,
  DEFAULT_CONTENT_RICHNESS_MODEL,
  DEFAULT_MODERATION_MODEL,
  DEFAULT_OPINION_BACKFILL_MODEL,
  isKnownModel,
} from "./models";

describe("isKnownModel", () => {
  it("AI_MODELS に登録済みのIDは true", () => {
    expect(isKnownModel(AI_MODELS.gpt5_2)).toBe(true);
    expect(isKnownModel("anthropic/claude-sonnet-4.6")).toBe(true);
  });

  it("未登録のIDは false", () => {
    expect(isKnownModel("openai/gpt-3.5-turbo")).toBe(false);
    expect(isKnownModel("")).toBe(false);
    expect(isKnownModel("not-a-model")).toBe(false);
  });
});

describe("判定系タスクのデフォルトモデル", () => {
  it("モデレーションは gpt-5.6-luna を使う", () => {
    expect(DEFAULT_MODERATION_MODEL).toBe(AI_MODELS.gpt5_6_luna);
  });

  it("コンテンツ充実度は gpt-5.6-luna を使う", () => {
    expect(DEFAULT_CONTENT_RICHNESS_MODEL).toBe(AI_MODELS.gpt5_6_luna);
  });

  it("意見バックフィルは gpt-5.6-luna を使う", () => {
    expect(DEFAULT_OPINION_BACKFILL_MODEL).toBe(AI_MODELS.gpt5_6_luna);
  });
});
