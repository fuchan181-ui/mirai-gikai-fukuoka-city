/**
 * AIモデルの識別子を一元管理する定数（Vercel AI Gateway形式）
 */
export const AI_MODELS = {
  // --- OpenAI ---
  gpt4o: "openai/gpt-4o",
  gpt4o_mini: "openai/gpt-4o-mini",
  gpt4_1: "openai/gpt-4.1",
  gpt4_1_mini: "openai/gpt-4.1-mini",
  gpt4_1_nano: "openai/gpt-4.1-nano",
  o3_mini: "openai/o3-mini",
  o4_mini: "openai/o4-mini",
  gpt5: "openai/gpt-5",
  gpt5_mini: "openai/gpt-5-mini",
  gpt5_nano: "openai/gpt-5-nano",
  gpt5_chat: "openai/gpt-5-chat",
  gpt5_1_instant: "openai/gpt-5.1-instant",
  gpt5_1_thinking: "openai/gpt-5.1-thinking",
  gpt5_2: "openai/gpt-5.2",
  gpt5_4_mini_fast: "openai/gpt-5.4-mini-fast",
  gpt5_6_sol: "openai/gpt-5.6-sol",
  gpt5_6_terra: "openai/gpt-5.6-terra",
  gpt5_6_luna: "openai/gpt-5.6-luna",
  // --- Google ---
  gemini3_flash: "google/gemini-3-flash",
  gemini3_flash_preview: "google/gemini-3-flash-preview",
  gemini3_1_flash_lite_preview: "google/gemini-3.1-flash-lite-preview",
  gemini3_1_pro_preview: "google/gemini-3.1-pro-preview",
  gemma4_26b_a4b: "google/gemma-4-26b-a4b-it",
  // --- Anthropic ---
  claude_haiku_4_5: "anthropic/claude-haiku-4.5",
  claude_sonnet_4_6: "anthropic/claude-sonnet-4.6",
  claude_sonnet_5: "anthropic/claude-sonnet-5",
  claude_opus_4_6: "anthropic/claude-opus-4.6",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

const KNOWN_MODELS: ReadonlySet<string> = new Set(Object.values(AI_MODELS));

/** 文字列が AI_MODELS に登録済みのモデルIDかどうかを判定する。 */
export function isKnownModel(model: string): model is AiModel {
  return KNOWN_MODELS.has(model);
}

/**
 * インタビューチャットのデフォルトモデル。
 *
 * OpenAI API を直接呼ぶため、OpenAI のモデルであること。
 * 他プロバイダを指定すると resolveOpenAiModel が落ちる。
 */
export const DEFAULT_INTERVIEW_CHAT_MODEL = AI_MODELS.gpt5_6_luna;

/** AIチャット（議案ページ・トップ）のデフォルトモデル */
export const DEFAULT_CHAT_MODEL = AI_MODELS.gpt5_6_luna;
/*
 * 判定系タスクのデフォルトモデルは `gpt-5.6-luna` に統一する。
 *
 * 旧既定の `gpt-5.2` は上流がタスクごとに既定を分離した際の値で、
 * 本サービスで使うモデルとしては許可されていない。判定系は入力が
 * 長く呼び出し回数も多いため、単価が安い点も選定理由になる
 * （単価は `ai/model-pricing.ts` を参照）。TypeSafe 版の判定との
 * 比較測定（`packages/ai-judge-eval/`）も同じモデルで行った。
 */
/** モデレーション評価のデフォルトモデル */
export const DEFAULT_MODERATION_MODEL = AI_MODELS.gpt5_6_luna;
/** コンテンツ充実度評価のデフォルトモデル */
export const DEFAULT_CONTENT_RICHNESS_MODEL = AI_MODELS.gpt5_6_luna;
/** 意見バックフィル（再抽出）のデフォルトモデル */
export const DEFAULT_OPINION_BACKFILL_MODEL = AI_MODELS.gpt5_6_luna;
