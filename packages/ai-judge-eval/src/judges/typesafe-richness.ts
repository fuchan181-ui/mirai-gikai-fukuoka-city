import { score, TypeSafeClient } from "@typesafe-ai/sdk";
import {
  type RichnessCaseInput,
  type RichnessLevel,
  toRichnessLevel,
} from "../cases/richness";
import { levelToScore } from "../metrics";
import { buildJudgeState } from "./state";
import type { Judge, JudgeRun, RichnessJudgeOutput } from "./types";

/**
 * 既存のスコアリング基準（0-19 / 20-39 / 40-59 / 60-79 / 80-100）を
 * そのまま Score の criteria にしたもの。低い方から並べる。
 */
export const RICHNESS_LEVEL_CRITERIA = [
  "不足 — ほとんど有用な情報が得られていない",
  "やや不足 — 意見が抽象的で、議案の検討に活用しづらい",
  "普通 — 基本的な意見は述べられているが、具体性や深掘りが不足",
  "充実 — 主要な論点が明確で、一定の具体性・提案がある",
  "非常に充実 — 具体的な事例・数値・影響分析・改善提案が豊富に含まれている",
] as const;

/**
 * 合成に使う次元と重み。
 *
 * 既存実装は `total` もモデルに直接聞いていたが、ここでは次元スコアから
 * コード側で合成する。重みを変えても再推論が要らないのが狙い。
 *
 * `label` / `description` は `buildContentRichnessInstructions` の
 * 次元定義からそのまま転記したもの。文言を変えると比較条件がずれるので、
 * 本番プロンプト側を変えるときはここも揃えること。
 */
export const RICHNESS_DIMENSIONS = [
  {
    key: "clarity",
    weight: 0.25,
    label: "論点の明確さ",
    description: "議論のポイントがはっきり浮かび上がっているか",
  },
  {
    key: "specificity",
    weight: 0.25,
    label: "具体性",
    description: "暮らしや現場の実感、具体的な事例・場所・数値が得られたか",
  },
  {
    key: "impact",
    weight: 0.25,
    label: "影響への言及",
    description: "市民の生活や地域、関係者への影響について情報が得られたか",
  },
  {
    key: "constructiveness",
    weight: 0.25,
    label: "提案の広がり",
    description: "課題の指摘に加え、改善の方向性や代替案が含まれているか",
  },
] as const;

export type RichnessDimensionKey = (typeof RICHNESS_DIMENSIONS)[number]["key"];

/**
 * 次元別レベル（0〜4）を重み付き平均して 0-100 の総合スコアにする純粋関数。
 *
 * 重みの正規化は「値が入っている次元のみ」で行う。一部の次元が欠けた入力で
 * 分母だけ全次元分を数えると、欠落が静かに減点になって原因が追いにくいため。
 */
export function composeRichnessTotal(
  levels: Record<string, number>,
  dimensions: ReadonlyArray<{
    key: string;
    weight: number;
  }> = RICHNESS_DIMENSIONS
): number {
  const present = dimensions.filter(
    (dimension) => levels[dimension.key] !== undefined
  );
  const totalWeight = present.reduce((sum, dimension) => {
    return sum + dimension.weight;
  }, 0);
  if (totalWeight === 0) return 0;

  const weighted = present.reduce((sum, dimension) => {
    return sum + (levels[dimension.key] ?? 0) * dimension.weight;
  }, 0);

  const maxLevel = RICHNESS_LEVEL_CRITERIA.length - 1;
  if (maxLevel === 0) return 0;
  return Math.round((weighted / totalWeight / maxLevel) * 100);
}

/**
 * 写像に必要な最小の形。SDK の `ScoreResponse` をそのまま渡せる。
 * 応答型に依存させないことで、応答を組み立てるテストが SDK の
 * 必須フィールドに引きずられない。
 */
export type ScoreAnswer = {
  readonly score: number;
  readonly confidence: number;
};

/** TypeSafe の応答（question 名 → score 応答）。 */
export type RichnessAnswers = Readonly<Record<string, ScoreAnswer>>;

export type RichnessComposition = {
  /** 次元ごとのレベル（0〜4） */
  levels: Record<string, number>;
  /** 次元ごとの 0-100 スコア */
  dimensions: Record<string, number>;
  total: number;
  level: RichnessLevel;
  confidence: number | null;
};

/**
 * 応答を次元スコアと総合スコアに写す純粋関数。
 *
 * 次元の欠落は 0 点として扱わず、質問の配線ミスとして落とす。
 * ここを純粋関数に切り出してあるので、API を呼ばずに写像を検証できる。
 */
export function composeRichnessFromAnswers(
  answers: RichnessAnswers
): RichnessComposition {
  const levels: Record<string, number> = {};
  const dimensions: Record<string, number> = {};
  const confidences: number[] = [];

  for (const dimension of RICHNESS_DIMENSIONS) {
    const answer = answers[dimension.key];
    if (!answer) {
      throw new Error(
        `TypeSafe の応答に次元 "${dimension.key}" がありません。質問の配線を確認してください。`
      );
    }
    levels[dimension.key] = answer.score;
    dimensions[dimension.key] = levelToScore(
      answer.score,
      RICHNESS_LEVEL_CRITERIA.length
    );
    confidences.push(answer.confidence);
  }

  const total = composeRichnessTotal(levels);
  const confidence =
    confidences.length > 0
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : null;

  return {
    levels,
    dimensions,
    total,
    level: toRichnessLevel(total),
    confidence,
  };
}

/**
 * 4 次元を 1 リクエストでまとめて Score し、total はコード側で合成する。
 */
export function createTypeSafeRichnessJudge(options: {
  apiKey: string;
  modelName?: string;
}): Judge<RichnessCaseInput, RichnessJudgeOutput> {
  const client = new TypeSafeClient({ apiKey: options.apiKey });
  const modelName = options.modelName;

  const questions = Object.fromEntries(
    RICHNESS_DIMENSIONS.map((dimension) => [
      dimension.key,
      score(
        `このインタビューの「${dimension.label}」（${dimension.description}）はどの水準か`,
        RICHNESS_LEVEL_CRITERIA
      ),
    ])
  );

  return {
    id: `typesafe:${modelName ?? "default"}`,
    async run(input): Promise<JudgeRun<RichnessJudgeOutput>> {
      const startedAt = Date.now();
      const result = await client.systemOne({
        state: buildJudgeState(input),
        questions,
        ...(modelName ? { model: modelName } : {}),
      });

      const composition = composeRichnessFromAnswers(result.answers);

      return {
        output: {
          total: composition.total,
          level: composition.level,
          dimensions: composition.dimensions,
          confidence: composition.confidence,
        },
        meta: {
          model: result.model,
          latencyMs: Date.now() - startedAt,
          usage: {
            inputTokens: result.usage.input_tokens,
            outputTokens: result.usage.output_tokens,
          },
        },
      };
    },
  };
}
