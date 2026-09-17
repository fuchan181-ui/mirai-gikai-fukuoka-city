import type { ModerationStatus } from "@mirai-gikai/shared/moderation/status";
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
import type { ModerationCaseInput } from "../cases/moderation";
import { stringList } from "./entry-values";
import { buildJudgeState } from "./state";
import type { Judge, JudgeRun, ModerationJudgeOutput } from "./types";

/**
 * 判定の前提となるポリシー。state に置いて全カテゴリで共有する。
 *
 * 同じ前提をカテゴリごとの criteria に書き写すとトークンが膨らむため、
 * 前提は state、境界は各 criteria と役割を分ける（公式ドキュメントの
 * 「state に関連するポリシーを置く」パターン）。
 *
 * 文言は既存プロンプトの「重要な注意」「スコアリング基準」から転記した。
 * 本番プロンプトを変えるときはここも揃えること。
 */
export const MODERATION_EVALUATION_POLICY = {
  purpose: "AIインタビューで収集した市民意見を、公開する前にモデレーションする",
  stance: stringList(
    "議案への賛成・反対の意見表明は、表現がどれだけ強くても該当しない",
    "政策批判や行政への改善要望は、個人攻撃でない限り該当しない",
    "感情的な表現があっても、政策への真摯な意見であれば該当しない",
    "市民の多様な意見を尊重しつつ、明らかに不適切な内容だけを検出する"
  ),
  severity_meaning: {
    ng: "公開に適さない内容が含まれている",
    warning: "注意が必要な表現があるが、意見としての価値はある",
    ok: "問題なし。通常の市民意見として適切",
  },
} as const;

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
 *
 * `criteria` は公式ドキュメントの「Structured Noul criteria」に従い
 * `{ what, examples }` の構造で書く。例文は**評価ケース本文から独立させる**
 * こと。評価ケースの焼き直しを例文に書くとモデルが答えをそのまま読めてしまい、
 * 一致率が過大評価される（`criteria-examples.test.ts` が機械的に検出する）。
 */
export const MODERATION_CATEGORIES = [
  {
    key: "personal_info",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、本人または第三者の氏名・住所・電話番号・勤務先など、個人を特定できる情報が書かれているか",
      focus:
        "特定の個人に結びつく具体情報だけを数える。市区町村名・組織名・部署名・公職の役職だけでは該当しない",
    },
    criteria: {
      true: {
        what: "氏名・住所・電話番号・勤務先など、その人に結びつく具体情報がいずれか書かれている。氏名がなくても単独で個人を特定できる情報なら該当する",
        examples: stringList(
          "市役所の木村さんという職員が、自宅の電話に何度もかけてくる",
          "議事録に、苦情を出した人の住所がそのまま載っている"
        ),
      },
      false: {
        what: "個人を特定できる具体情報がない",
        examples: stringList(
          "市役所の担当者の対応が遅い",
          "職員の説明が分かりにくい"
        ),
      },
    },
  },
  {
    key: "illegal_activity",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、犯罪行為の実行・勧誘・教唆、または違法行為の方法の提示が含まれるか",
      focus:
        "違法行為のやり方や回避策を広めようとする内容を数える。制度への批判や違反の指摘は該当しない",
    },
    criteria: {
      true: {
        what: "違法行為を勧めたり、その方法を具体的に示したりしている",
        examples: stringList(
          "メーターを細工して使用量を少なく見せる裏技を教えます",
          "許可なく河川敷の砂を取って売る方法をまとめました"
        ),
      },
      false: {
        what: "違法行為の勧誘や方法の提示がない。違反の指摘や制度への批判にとどまる",
        examples: stringList(
          "無許可の看板が放置されている。市はもっと取り締まるべき",
          "違法状態のままの農地転用が止まらない"
        ),
      },
    },
  },
  {
    key: "ip_infringement",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、第三者の著作物や商標を権利者の許諾なく複製・転載している内容が含まれるか",
      focus:
        "まとまった量をそのまま載せているかを数える。出所を示した短い引用や、権利処理を問いただす意見は該当しない",
    },
    criteria: {
      true: {
        what: "歌詞・文章・画像などの著作物を、許諾なくまとまった量そのまま載せている",
        examples: stringList(
          "市販されている小説の一節を何ページ分もそのまま載せます",
          "雑誌の記事をスキャンして全文貼り付けました"
        ),
      },
      false: {
        what: "引用の範囲を超えた転載がない。出所を示した短い言及や、権利処理を問う意見にとどまる",
        examples: stringList(
          "市民ホールのポスターは有名な画家の作品にそっくりだ。許諾を得ているのか確認してほしい",
          "広報誌に載っていた写真は出典が示されていない"
        ),
      },
    },
  },
  {
    key: "self_harm_threat",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、自殺・自傷行為の助長、または他者への危害の予告・示唆が含まれるか",
      focus:
        "行為をほのめかす・促す内容を数える。制度への不満や強い抗議の表現だけでは該当しない",
    },
    criteria: {
      true: {
        what: "自傷や他者への危害を予告・示唆・助長している",
        examples: stringList(
          "この決定がされたら、もう生きている意味がない",
          "担当者を懲らしめてやる。家まで行くからな"
        ),
      },
      false: {
        what: "自傷や危害の示唆がない",
        examples: stringList(
          "この計画には絶対に納得できない",
          "先行きが心配で気が重い"
        ),
      },
    },
  },
  {
    key: "obscene_violent",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、性的な内容、過度に暴力的・猟奇的な表現、動物虐待の示唆が含まれるか",
      focus:
        "残虐さや性的描写そのものを数える。事故や災害の事実の記述、抽象的な怒りの表現は該当しない",
    },
    criteria: {
      true: {
        what: "残虐な行為や性的内容を具体的に描写・示唆している",
        examples: stringList(
          "捕まえたら半殺しにしてやると言っておいてほしい",
          "路上で犬を蹴り上げる動画が投稿されていて、見るに耐えない"
        ),
      },
      false: {
        what: "残虐・性的な描写がない",
        examples: stringList(
          "料金の算定根拠が分からない",
          "説明会の案内が届いていない"
        ),
      },
    },
  },
  {
    key: "defamation",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、特定の個人を名指しまたは役職で指して、根拠なく誹謗中傷し、人格を否定する内容が含まれるか",
      focus:
        "批判の対象が政策ではなく人となりに向いているかを分ける。政策や対応への強い批判は該当しない",
    },
    criteria: {
      true: {
        what: "特定できる相手の人格・能力・品位を否定している。根拠のない犯罪の疑いを述べている",
        examples: stringList(
          "教育長は無能で、何も考えていない",
          "あの課長は業者から金を受け取っているとしか思えない"
        ),
      },
      false: {
        what: "批判の対象が政策・制度・対応であり、人の人格や品位への攻撃になっていない",
        examples: stringList(
          "説明が曖昧で、判断の根拠が見えない",
          "市の対応は市民の理解を得られていない"
        ),
      },
    },
  },
  {
    key: "hate_speech",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、属性に基づく差別的表現、または排斥の扇動が含まれるか",
      focus:
        "出身・国籍・人種・性別・性的指向・宗教・障がい・職業などの属性を理由にした扱いを数える",
    },
    criteria: {
      true: {
        what: "属性を理由に集団を貶めたり、地域から排除するよう求めている",
        examples: stringList(
          "あの地区から来た人は信用できないから、相手にしないほうがいい",
          "障がいのある人が同じ町内に引っ越してくるのは困る"
        ),
      },
      false: {
        what: "属性に基づく差別や排斥の表現がない",
        examples: stringList(
          "外国語対応の窓口を増やすより、他の施策を優先すべきだ",
          "多文化共生の予算の使い方に疑問がある"
        ),
      },
    },
  },
  {
    key: "insensitive",
    severity: "warning",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、災害・事故等の被害者への配慮を著しく欠く内容が含まれるか",
      focus:
        "被害そのものを揶揄したり、被害者の落ち度として片づけたりする表現を数える",
    },
    criteria: {
      true: {
        what: "被害者を揶揄し、または被害を当然の結果として扱っている",
        examples: stringList(
          "山で遭難した人は自業自得だと思う",
          "あの火事も本人たちの不注意のせいだろう"
        ),
      },
      false: {
        what: "被害者への配慮を欠く表現がない。災害や事故の事実に触れるだけにとどまる",
        examples: stringList(
          "台風で屋根が壊れた世帯への補助を早く出してほしい",
          "被災した事業者が立ち直れるように支援してほしい"
        ),
      },
    },
  },
  {
    key: "irrelevant",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` の主たる内容が、議案や市政のテーマと関係のない話題になっているか",
      focus:
        "内容の中心がどこにあるかで判断する。議案に関係する具体例や体験談は該当しない",
    },
    criteria: {
      true: {
        what: "議案や市政と無関係な私的な話題が中心になっている",
        examples: stringList(
          "今朝は犬の散歩で近所の人と話し込んでしまった。紅葉もきれいだった",
          "最近ハマっている料理の話ですが、煮込みのコツは弱火です"
        ),
      },
      false: {
        what: "議案や市政についての意見が中心になっている",
        examples: stringList(
          "証明書の発行に時間がかかるので、待ち時間を短くしてほしい",
          "市のイベントの告知が分かりにくい"
        ),
      },
    },
  },
  {
    key: "misinformation",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` に、明らかに事実に反する情報、または社会的混乱を招くおそれのある偽情報が含まれるか",
      focus:
        "断定的に事実を偽って伝えている内容を数える。意見・推測・懸念の表明は該当しない",
    },
    criteria: {
      true: {
        what: "存在しない制度変更や、出所のない数字を事実として断定している",
        examples: stringList(
          "来年から固定資産税が5倍になる決定が、すでに内々にされたらしい",
          "ごみ収集が来月で終了すると市が発表した"
        ),
      },
      false: {
        what: "事実の断定としての偽情報がない。意見や懸念の表明にとどまる",
        examples: stringList(
          "負担が増えないか心配している",
          "制度が変わるという話を聞いたが、本当なのか知りたい"
        ),
      },
    },
  },
  {
    key: "spam",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` が、無意味な文字列の繰り返し、テスト入力、意図的な妨害にあたるか",
      focus:
        "内容のある意見が含まれているかで判断する。短い意見や文章が拙い意見は該当しない",
    },
    criteria: {
      true: {
        what: "意味のない文字列やテスト入力が内容の大半を占めている",
        examples: stringList(
          "asdf asdf 1234 qwerty",
          "テスト送信です テスト送信です"
        ),
      },
      false: {
        what: "意味のある意見が書かれている",
        examples: stringList(
          "パスワードの再設定が分かりにくい",
          "手続きの案内が届かないので困っている"
        ),
      },
    },
  },
  {
    key: "commercial",
    severity: "ng",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` が、特定の商品・サービスの宣伝や商業的な誘導を主な目的としているか",
      focus:
        "営業や集客が目的かどうかで判断する。地域の店舗の実情を伝える意見は該当しない",
    },
    criteria: {
      true: {
        what: "自社や特定の商品の宣伝、URLへの誘導が内容の中心になっている",
        examples: stringList(
          "外壁塗装なら当社へ。今月限定で20%off。詳しくは kobo.example.jp/soudan まで",
          "引っ越しの見積もりは無料です。まずはご相談ください"
        ),
      },
      false: {
        what: "宣伝や営業が目的ではない",
        examples: stringList(
          "地元の工務店が減っていて、修繕を頼める人がいない",
          "商店街の空き店舗が目立つ"
        ),
      },
    },
  },
  {
    key: "impersonation",
    severity: "warning",
    instructions: {
      question:
        "`conversation`・`summary`・`opinions` で、発言者が公的機関・著名人・専門家等になりすまして、その立場から述べているかのように意見を述べているか",
      focus:
        "発言内容だけから経歴の真偽は判定できないので、その立場で発言していると主張し、それを意見の根拠にしているかを数える。経歴や役職への単なる言及、他者の肩書きの引用は該当しない",
    },
    criteria: {
      true: {
        what: "公的機関・著名人・専門家等の立場から述べているかのように意見を述べている",
        examples: stringList(
          "私は市議会の議長として発言します",
          "現職の教育委員として、この計画に反対がないことを保証します"
        ),
      },
      false: {
        what: "公的な立場を名乗っていない。経歴や役職への言及、他者の肩書きの引用にとどまる",
        examples: stringList(
          "前職は市の職員でした。内部の事情も知っていますが、私は一市民として意見を言います",
          "市の担当部署に問い合わせた範囲では理解できた"
        ),
      },
    },
  },
] as const satisfies ReadonlyArray<{
  key: string;
  severity: ModerationStatus;
  instructions: {
    question: string;
    focus: string;
  };
  criteria: {
    true: { what: string; examples: string[] };
    false: { what: string; examples: string[] };
  };
}>;

export type ModerationCategoryKey =
  (typeof MODERATION_CATEGORIES)[number]["key"];

/**
 * カテゴリ別の確率をステータスに畳む際の方針。
 *
 * 見逃し（不適切な内容の公開）と過検知（適切な意見の非公開）はコストが
 * 非対称なので、閾値を分ける。既存実装の 30/70 固定閾値では表現できなかった
 * 部分で、ここが TypeSafe 化の主な狙い。
 *
 * ng 側を下げるほど見逃しは減るが、政策への強い批判（水道料金改定への反対など）
 * を巻き込む。実測では 0.30 で過検知が出たため 0.35 を下限の目安とする。
 * 下げる場合は `--dry-run` ではなく評価セットで過検知を測り直すこと。
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
      noul(category.instructions, category.criteria),
    ])
  );

  return {
    id: `typesafe:${modelName ?? "default"}`,
    async run(input): Promise<JudgeRun<ModerationJudgeOutput>> {
      const startedAt = Date.now();
      const result = await client.systemOne({
        state: {
          ...buildJudgeState(input),
          evaluation_policy: MODERATION_EVALUATION_POLICY,
        },
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
