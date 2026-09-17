import type { ModerationStatus } from "@mirai-gikai/shared/moderation/status";
import type { RichnessLevel } from "../cases/richness";

/** 1 回の判定結果に必ず添える実行メタデータ。 */
export type JudgeRunMeta = {
  /** 応答を返した実際のモデル名（TypeSafe はエイリアスが解決された ID） */
  model: string;
  latencyMs: number;
  usage?: { inputTokens: number; outputTokens: number };
};

export type JudgeRun<TOutput> = {
  output: TOutput;
  meta: JudgeRunMeta;
};

/** 入力と出力の型を固定した判定器。OpenAI 版と TypeSafe 版を差し替え可能にする。 */
export type Judge<TInput, TOutput> = {
  /** レポートに出す識別子（例: "openai:gpt-5.2"） */
  readonly id: string;
  run(input: TInput): Promise<JudgeRun<TOutput>>;
};

export type ModerationJudgeOutput = {
  status: ModerationStatus;
  /** 0-100。TypeSafe 版はレベルから換算した値、換算不能なら null */
  score: number | null;
  /** 総合の確信度（TypeSafe 版のみ） */
  confidence: number | null;
  /** カテゴリ別の確率（TypeSafe 版のみ） */
  categoryProbabilities: Record<string, number> | null;
  /**
   * 閾値を超えて発火したカテゴリ（TypeSafe 版のみ）。
   * 閾値は判定器側の policy にあるので、レポート側で再計算しない。
   */
  triggeredCategories: Array<{ key: string; probability: number }> | null;
  /** 判定理由（OpenAI 版のみ。Jev はテキストを生成しない） */
  reasoning: string | null;
};

export type RichnessJudgeOutput = {
  /** 0-100 の総合スコア */
  total: number;
  level: RichnessLevel;
  /** 次元別のスコア（0-100） */
  dimensions: Record<string, number>;
  /** 次元別の確信度（TypeSafe 版のみ） */
  confidence: number | null;
};
