import type { ModerationStatus } from "@mirai-gikai/shared/moderation/status";
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type { ModerationCaseInput } from "../cases/moderation";
import { buildJudgeState } from "./state";
import type { Judge, JudgeRun, ModerationJudgeOutput } from "./types";

/**
 * 既存プロンプトの 13 カテゴリを、カテゴリごとの yes/no 判定に分解したもの。
 *
 * `severity` は「そのカテゴリが該当したときにどの公開ステータスまで引き上げるか」。
 * 既存実装の 0-100 スコアでは表現できなかった「カテゴリごとの重み」を
 * コード側のデータとして持たせるのがこの分解の狙い。
 *
 * 割り当ての根拠は既存プロンプトの記述そのもの:
 * 「70-100（ng）= 公開に適さない内容が含まれている」に相当するカテゴリを ng、
 * 「30-69（warning）= 注意が必要だが意見としての価値はある」に相当するものを
 * warning とする。反対意見・政策批判を ok に留める方針は
 * `noul` の criteria.false 側に文章として埋め込んでいる。
 */
export const MODERATION_CATEGORIES = [
  {
    key: "personal_info",
    severity: "ng",
    instructions:
      "この文章は、本人または第三者の氏名・住所・電話番号・勤務先など、個人を特定しうる情報を開示しているか",
  },
  {
    key: "illegal_activity",
    severity: "ng",
    instructions:
      "この文章は、犯罪行為の実行・勧誘・教唆、または違法行為の方法の提示にあたる内容を含むか",
  },
  {
    key: "ip_infringement",
    severity: "ng",
    instructions:
      "この文章は、第三者の著作物や商標を無断で引用・転載するなど、知的財産権を侵害するおそれのある内容を含むか",
  },
  {
    key: "self_harm_threat",
    severity: "ng",
    instructions:
      "この文章は、自殺・自傷行為の助長、または他者への危害の予告・示唆を含むか",
  },
  {
    key: "obscene_violent",
    severity: "ng",
    instructions:
      "この文章は、性的な内容、過度に暴力的・猟奇的な表現、動物虐待の示唆を含むか",
  },
  {
    key: "defamation",
    severity: "ng",
    instructions:
      "この文章は、特定の個人・団体を名指しして、根拠なく誹謗中傷し、または人格を否定する攻撃的表現で批判しているか",
  },
  {
    key: "hate_speech",
    severity: "ng",
    instructions:
      "この文章は、人種・民族・国籍・性別・性的指向・宗教・障がい・職業等に基づく差別的表現、または排斥の扇動を含むか",
  },
  {
    key: "insensitive",
    severity: "warning",
    instructions:
      "この文章は、災害・事故等の被害者に対する配慮を著しく欠く内容を含むか",
  },
  {
    key: "irrelevant",
    severity: "ng",
    instructions:
      "この文章は、議案や市政のテーマと全く関係のない内容（明らかな脱線、私的なやり取り）が主となっているか",
  },
  {
    key: "misinformation",
    severity: "ng",
    instructions:
      "この文章は、明らかに事実に反する情報、または社会的混乱を招くおそれのある偽情報を含むか",
  },
  {
    key: "spam",
    severity: "ng",
    instructions:
      "この文章は、無意味な文字列の繰り返し、テスト入力、意図的な妨害行為にあたるか",
  },
  {
    key: "commercial",
    severity: "ng",
    instructions:
      "この文章は、特定の商品・サービスの宣伝を主目的とする内容、または URL 等による商業的な誘導を含むか",
  },
  {
    key: "impersonation",
    severity: "warning",
    instructions:
      "この文章は、公的機関・著名人・専門家等になりすまして意見を述べているか",
  },
] as const satisfies ReadonlyArray<{
  key: string;
  severity: ModerationStatus;
  instructions: string;
}>;

export type ModerationCategoryKey =
  (typeof MODERATION_CATEGORIES)[number]["key"];

/**
 * カテゴリ別の確率をステータスに畳む際の方針。
 *
 * 見逃し（不適切な内容の公開）と過検知（適切な意見の非公開）はコストが
 * 非対称なので、閾値を分ける。既存実装の 30/70 固定閾値では表現できなかった
 * 部分で、ここが TypeSafe 化の主な狙い。
 */
export const TYPESAFE_MODERATION_POLICY = {
  /** ng 相当カテゴリの発火閾値。見逃しのコストが高いので低く取る */
  ngThreshold: 0.35,
  /** warning 相当カテゴリの発火閾値 */
  warningThreshold: 0.5,
} as const;

export type ModerationCombinationResult = {
  status: ModerationStatus;
  /** 閾値を超えたカテゴリ（確率の高い順） */
  triggered: Array<{ key: string; probability: number }>;
};

/**
 * カテゴリ別確率を公開ステータスに畳む純粋関数。
 * 閾値はここに閉じているので、テストで境界を固定できる。
 */
export function combineCategoryProbabilities(
  probabilities: Record<string, number>,
  policy: {
    ngThreshold: number;
    warningThreshold: number;
  } = TYPESAFE_MODERATION_POLICY
): ModerationCombinationResult {
  const triggered: Array<{ key: string; probability: number }> = [];
  let status: ModerationStatus = "ok";

  for (const category of MODERATION_CATEGORIES) {
    const probability = probabilities[category.key];
    if (probability === undefined) continue;

    const threshold =
      category.severity === "ng" ? policy.ngThreshold : policy.warningThreshold;
    if (probability < threshold) continue;

    triggered.push({ key: category.key, probability });
    if (category.severity === "ng") status = "ng";
    else if (status === "ok") status = "warning";
  }

  triggered.sort((a, b) => b.probability - a.probability);
  return { status, triggered };
}

/**
 * 写像に必要な最小の形。SDK の `NoulResponse` をそのまま渡せる。
 * 応答型に依存させないことで、応答を組み立てるテストが SDK の
 * 必須フィールドに引きずられない。
 */
export type NoulAnswer = { readonly noul: number };

/** TypeSafe の応答（question 名 → noul 応答）。 */
export type ModerationAnswers = Readonly<Record<string, NoulAnswer>>;

/**
 * 応答からカテゴリ別確率を取り出す純粋関数。
 *
 * 応答に無いカテゴリを黙って 0 と扱うと、質問の配線ミスが「問題なし」に
 * 化けてしまう。見つからない場合は設定ミスとして落とす。
 */
export function readCategoryProbabilities(
  answers: ModerationAnswers
): Record<string, number> {
  const probabilities: Record<string, number> = {};
  for (const category of MODERATION_CATEGORIES) {
    const answer = answers[category.key];
    if (!answer) {
      throw new Error(
        `TypeSafe の応答にカテゴリ "${category.key}" がありません。質問の配線を確認してください。`
      );
    }
    probabilities[category.key] = answer.noul;
  }
  return probabilities;
}

/**
 * 13 カテゴリを 1 リクエストで並列に判定する（speculative fan-out は不要で、
 * 全カテゴリが常に評価対象）。
 */
export function createTypeSafeModerationJudge(options: {
  apiKey: string;
  modelName?: string;
  policy?: { ngThreshold: number; warningThreshold: number };
}): Judge<ModerationCaseInput, ModerationJudgeOutput> {
  const client = new TypeSafeClient({ apiKey: options.apiKey });
  const modelName = options.modelName;
  const policy = options.policy ?? TYPESAFE_MODERATION_POLICY;

  const questions = Object.fromEntries(
    MODERATION_CATEGORIES.map((category) => [
      category.key,
      noul(category.instructions, {
        true: "この文章はこのカテゴリに該当する",
        false:
          "この文章はこのカテゴリに該当しない。議案への賛成・反対の意見表明や、行政への政策批判・改善要望は、表現が強く感情的であっても個人攻撃でない限り該当しない",
      }),
    ])
  );

  return {
    id: `typesafe:${modelName ?? "default"}`,
    async run(input): Promise<JudgeRun<ModerationJudgeOutput>> {
      const startedAt = Date.now();
      const result = await client.systemOne({
        state: buildJudgeState(input),
        questions,
        ...(modelName ? { model: modelName } : {}),
      });

      const probabilities = readCategoryProbabilities(result.answers);
      const combined = combineCategoryProbabilities(probabilities, policy);

      return {
        output: {
          status: combined.status,
          score: null,
          confidence: null,
          categoryProbabilities: probabilities,
          triggeredCategories: combined.triggered,
          reasoning: null,
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
