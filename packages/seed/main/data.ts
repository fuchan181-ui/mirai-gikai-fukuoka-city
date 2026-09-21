import type { Database } from "@mirai-gikai/supabase";

type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
type FactionStanceInsert =
  Database["public"]["Tables"]["faction_stances"]["Insert"];
type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
type BillsTagsInsert = Database["public"]["Tables"]["bills_tags"]["Insert"];
type CouncilSessionInsert =
  Database["public"]["Tables"]["council_sessions"]["Insert"];
type FactionInsert = Database["public"]["Tables"]["factions"]["Insert"];
type CommitteeInsert = Database["public"]["Tables"]["committees"]["Insert"];
type InterviewConfigInsert =
  Database["public"]["Tables"]["interview_configs"]["Insert"];
type InterviewQuestionInsert =
  Database["public"]["Tables"]["interview_questions"]["Insert"];
type InterviewSessionInsert =
  Database["public"]["Tables"]["interview_sessions"]["Insert"];
type InterviewMessageInsert =
  Database["public"]["Tables"]["interview_messages"]["Insert"];
type InterviewReportInsert =
  Database["public"]["Tables"]["interview_report"]["Insert"];

// 定例会データ（枚方市議会）
export const councilSessions: CouncilSessionInsert[] = [
  {
    name: "令和8年 第3回定例月議会（9月）",
    slug: "r8-9",
    council_url: "https://www.city.hirakata.osaka.jp/site/gikai/",
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    is_active: true,
  },
  {
    name: "令和8年 第2回定例月議会（6月）",
    slug: "r8-6",
    council_url: "https://www.city.hirakata.osaka.jp/site/gikai/",
    start_date: "2026-06-01",
    end_date: "2026-06-25",
    is_active: false,
  },
];

// 会派データ（枚方市議会 2026年時点）
export const factions: FactionInsert[] = [
  {
    name: "mirai",
    display_name: "みらい",
    sort_order: 1,
    is_active: true,
  },
  {
    name: "ishin-hirakata",
    display_name: "大阪維新の会 枚方市議会議員団",
    sort_order: 2,
    is_active: true,
  },
  {
    name: "komei-hirakata",
    display_name: "公明党議員団",
    sort_order: 3,
    is_active: true,
  },
  {
    name: "jimin-mushozoku",
    display_name: "自由民主党・無所属の会",
    sort_order: 4,
    is_active: true,
  },
  {
    name: "rengo-shimin",
    display_name: "連合市民の会",
    sort_order: 5,
    is_active: true,
  },
  {
    name: "kyosan-hirakata",
    display_name: "日本共産党議員団",
    sort_order: 6,
    is_active: true,
  },
  {
    name: "inochi",
    display_name: "命を守る政治の会",
    sort_order: 7,
    is_active: true,
  },
  {
    name: "mushozoku",
    display_name: "無所属",
    sort_order: 8,
    is_active: true,
  },
];

// 委員会データ（枚方市議会 常任委員会）
export const committees: CommitteeInsert[] = [
  {
    name: "総務常任委員会",
    description:
      "危機管理、市長公室、総合政策、総務、観光にぎわい、財政などについての審査",
    sort_order: 1,
    is_active: true,
  },
  {
    name: "教育子育て常任委員会",
    description: "子ども未来部、教育委員会、学校教育、子育て支援についての審査",
    sort_order: 2,
    is_active: true,
  },
  {
    name: "市民福祉常任委員会",
    description: "市民生活、保健福祉、地域包括ケア、医療などについての審査",
    sort_order: 3,
    is_active: true,
  },
  {
    name: "建設環境常任委員会",
    description:
      "都市計画、駅周辺整備、道路河川、上下水道、環境保全などについての審査",
    sort_order: 4,
    is_active: true,
  },
];

// タグデータ
export const tags: TagInsert[] = [
  {
    label: "子育て・教育",
    description: "子育て支援、学校教育、医療費助成などに関する議案",
    featured_priority: 1,
  },
  {
    label: "まちづくり・環境",
    description: "駅前再整備、都市計画、環境保全、防災に関する議案",
    featured_priority: 2,
  },
  {
    label: "福祉・医療",
    description: "地域福祉、高齢者支援、地域包括ケアに関する議案",
    featured_priority: 3,
  },
];

export const bills: BillInsert[] = [
  {
    name: "枚方市子ども医療費助成条例の一部改正",
    status: "in_committee",
    status_note: "教育子育て常任委員会で審査中",
    published_at: "2026-09-05T09:00:00+09:00",
    publish_status: "published",
    is_featured: true,
  },
  {
    name: "枚方市駅周辺再整備基本方針に基づく都市基盤整備事業",
    status: "approved",
    status_note: "本会議で可決",
    published_at: "2026-09-08T10:00:00+09:00",
    publish_status: "published",
    is_featured: true,
  },
  {
    name: "枚方市地域包括ケアシステム推進条例",
    status: "approved",
    status_note: "本会議で可決",
    published_at: "2026-09-10T10:00:00+09:00",
    publish_status: "published",
    is_featured: true,
  },
  {
    name: "枚方市学校給食の充実に関する条例",
    status: "approved",
    status_note: "本会議で可決、順次実施",
    published_at: "2026-06-15T09:00:00+09:00",
    publish_status: "published",
    is_featured: false,
  },
  {
    name: "枚方市防災・減災まちづくり基本条例の一部改正",
    status: "rejected",
    status_note: "本会議で否決",
    published_at: "2026-06-20T10:00:00+09:00",
    publish_status: "published",
    is_featured: false,
  },
];

// 議案とタグの関連付け
export function createBillsTags(
  insertedBills: { id: string; name: string }[],
  insertedTags: { id: string; label: string }[]
): Omit<BillsTagsInsert, "id" | "created_at">[] {
  const billTagMap: { [billName: string]: string[] } = {
    "枚方市子ども医療費助成条例の一部改正": ["子育て・教育"],
    "枚方市駅周辺再整備基本方針に基づく都市基盤整備事業": ["まちづくり・環境"],
    "枚方市地域包括ケアシステム推進条例": ["福祉・医療"],
    "枚方市学校給食の充実に関する条例": ["子育て・教育"],
    "枚方市防災・減災まちづくり基本条例の一部改正": ["まちづくり・環境"],
  };

  const billsTags: Omit<BillsTagsInsert, "id" | "created_at">[] = [];

  for (const bill of insertedBills) {
    const tagLabels = billTagMap[bill.name] || [];
    for (const tagLabel of tagLabels) {
      const tag = insertedTags.find((t) => t.label === tagLabel);
      if (tag) {
        billsTags.push({
          bill_id: bill.id,
          tag_id: tag.id,
        });
      }
    }
  }

  return billsTags;
}

// 会派見解データ（みらい会派）
const factionStancesData: Omit<
  FactionStanceInsert,
  "bill_id" | "faction_id"
>[] = [
  {
    type: "for",
    comment: `子どもの医療費助成の拡充は、子育て世代の経済的負担を軽減し、枚方市における安心して子育てができる環境づくりに不可欠な施策です。

近隣自治体との均衡や定住促進の観点からも早期の実施を支持します。`,
  },
  {
    type: "for",
    comment: `枚方市駅周辺の再整備は、枚方市の未来のにぎわいと地域経済の活性化を牽引する極めて重要なプロジェクトです。

市民や来訪者にとって歩きやすく利便性の高い駅前空間の形成を強く後押しします。`,
  },
  {
    type: "for",
    comment: `高齢化が進む中、地域包括ケアシステムの推進は枚方市にとって喫緊の課題です。

医療・介護・予防・住まい・生活支援が切れ目なく連携する体制の整備は、市民一人ひとりの安心な暮らしを支えます。`,
  },
  {
    type: "for",
    comment: `学校給食の充実は、子どもの健やかな成長と食育の推進を支える重要な施策です。

地元食材の活用や栄養バランスの取れた温かい給食の提供により、教育環境の向上を期待します。`,
  },
  {
    type: "against",
    comment: `防災・減災対策の強化は重要ですが、今回の改正案における市民・民間事業者への一律の義務付けは過度な負担となる懸念があります。

まずは行政による基盤整備と実効性のある支援策の具体化を先行させるべきです。`,
  },
];

export function createFactionStances(
  insertedBills: { id: string; name: string }[],
  miraiFactionId: string
): FactionStanceInsert[] {
  return factionStancesData.map((stance, index) => ({
    ...stance,
    bill_id: insertedBills[index]?.id || "",
    faction_id: miraiFactionId,
  }));
}

// インタビュー設定を作成（最初の議案用）
export function createInterviewConfig(
  insertedBills: { id: string; name: string }[]
): Omit<InterviewConfigInsert, "id" | "created_at" | "updated_at"> | null {
  const targetBill = insertedBills[0];
  if (!targetBill) return null;

  return {
    bill_id: targetBill.id,
    name: "デフォルト設定",
    status: "public",
    themes: ["賛否", "理由"],
    knowledge_source: `この議案についてあなたの意見を聞かせてください。`,
  };
}

// インタビュー質問を作成
export function createInterviewQuestions(
  interviewConfigId: string
): Omit<InterviewQuestionInsert, "id" | "created_at" | "updated_at">[] {
  return [
    {
      interview_config_id: interviewConfigId,
      question: "この議案に賛成ですか？反対ですか？",
      follow_up_guide: "ユーザーの立場を明確にしてください。",
      quick_replies: ["賛成", "反対", "どちらでもない"],
      question_order: 1,
    },
    {
      interview_config_id: interviewConfigId,
      question: "その理由を教えてください。",
      follow_up_guide: "具体的な理由を引き出してください。",
      quick_replies: null,
      question_order: 2,
    },
  ];
}

// インタビューセッションを作成（5パターン × 20回 = 100件）
export function createInterviewSessions(
  interviewConfigId: string
): Omit<InterviewSessionInsert, "id" | "created_at" | "updated_at">[] {
  const now = new Date();
  const sessions: Omit<
    InterviewSessionInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  for (let i = 0; i < 20; i++) {
    const baseOffset = i * 86400000 * 3; // 3日ずつずらす

    // パターン1: 完了 + レポートあり（賛成）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 1).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 3600000).toISOString(),
      completed_at: new Date(now.getTime() - baseOffset - 3000000).toISOString(),
    });

    // パターン2: 完了 + レポートあり（反対）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 2).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 7200000).toISOString(),
      completed_at: new Date(now.getTime() - baseOffset - 6600000).toISOString(),
    });

    // パターン3: 完了 + レポートあり（中立）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 3).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 10800000).toISOString(),
      completed_at: new Date(now.getTime() - baseOffset - 10200000).toISOString(),
    });

    // パターン4: 完了したけどレポート未作成
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 4).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 14400000).toISOString(),
      completed_at: new Date(now.getTime() - baseOffset - 13800000).toISOString(),
    });

    // パターン5: 進行中（未完了、レポートなし）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 5).padStart(12, "0")}`,
      started_at: new Date(now.getTime() - baseOffset - 1800000).toISOString(),
      completed_at: null,
    });
  }

  return sessions;
}

// インタビューメッセージを作成（5パターンをループ）
export function createInterviewMessages(
  sessionIds: string[]
): Omit<InterviewMessageInsert, "id" | "created_at">[] {
  const conversations = [
    // パターン1: 賛成（完了 + レポートあり）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "賛成です" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "なぜなら賛成だからです。市民のためになると思います。",
      },
      {
        role: "assistant" as const,
        content: "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン2: 反対（完了 + レポートあり）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "反対です" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "財源が不明確だと思います。",
      },
      {
        role: "assistant" as const,
        content: "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン3: どちらでもない（完了 + レポートあり）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "どちらでもないです" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "もっと情報が必要だと思います。",
      },
      {
        role: "assistant" as const,
        content: "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン4: 完了したけどレポート未作成
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "賛成です" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "良い議案だと思います。",
      },
      {
        role: "assistant" as const,
        content: "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン5: 進行中（途中で離脱）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      {
        role: "user" as const,
        content: "うーん、ちょっと考えさせてください",
      },
    ],
  ];

  const messages: Omit<InterviewMessageInsert, "id" | "created_at">[] = [];

  sessionIds.forEach((sessionId, sessionIndex) => {
    const patternIndex = sessionIndex % 5;
    const conversation = conversations[patternIndex];
    conversation.forEach((msg) => {
      messages.push({
        interview_session_id: sessionId,
        role: msg.role,
        content: msg.content,
      });
    });
  });

  return messages;
}

// インタビューレポートを作成（パターン1,2,3のみ）
export function createInterviewReports(
  sessionIds: string[]
): Omit<InterviewReportInsert, "id" | "created_at" | "updated_at">[] {
  const reportTemplates = [
    {
      stance: "for" as const,
      summary: "この議案に賛成。市民のためになると考えている。",
      role: "general_citizen" as const,
      role_description: "議案の内容に賛同する枚方市民",
      opinions: [{ title: "賛成理由", content: "市民のためになる" }],
    },
    {
      stance: "against" as const,
      summary: "財源の不明確さを理由に反対。",
      role: "work_related" as const,
      role_description: "財政面を懸念する枚方市民",
      opinions: [{ title: "反対理由", content: "財源が不明確" }],
    },
    {
      stance: "neutral" as const,
      summary: "判断するにはより多くの情報が必要と考えている。",
      role: "subject_expert" as const,
      role_description: "慎重な判断を求める枚方市民",
      opinions: [{ title: "態度保留理由", content: "情報不足" }],
    },
  ];

  const reports: Omit<
    InterviewReportInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  sessionIds.forEach((sessionId, index) => {
    const patternIndex = index % 5;
    if (patternIndex < 3) {
      const loopIndex = Math.floor(index / 5);
      reports.push({
        interview_session_id: sessionId,
        ...reportTemplates[patternIndex],
        is_public_by_user: loopIndex < 5,
      });
    }
  });

  return reports;
}

// デモ用の固定ID
export const DEMO_SESSION_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_REPORT_ID = "00000000-0000-0000-0000-000000000001";

// 4種類のロールを確認するためのデモ用ID
export const DEMO_SESSION_ID_WORK = "00000000-0000-0000-0000-000000000002";
export const DEMO_SESSION_ID_DAILY = "00000000-0000-0000-0000-000000000003";
export const DEMO_SESSION_ID_CITIZEN = "00000000-0000-0000-0000-000000000004";
export const DEMO_REPORT_ID_WORK = "00000000-0000-0000-0000-000000000002";
export const DEMO_REPORT_ID_DAILY = "00000000-0000-0000-0000-000000000003";
export const DEMO_REPORT_ID_CITIZEN = "00000000-0000-0000-0000-000000000004";

// デモ用のインタビューセッション（公開、固定ID）
export function createDemoSession(
  interviewConfigId: string
): InterviewSessionInsert {
  const now = new Date();
  return {
    id: DEMO_SESSION_ID,
    interview_config_id: interviewConfigId,
    user_id: "00000000-0000-0000-0000-000000000000",
    started_at: new Date(now.getTime() - 3600000).toISOString(),
    completed_at: new Date(now.getTime() - 3000000).toISOString(),
  };
}

// デモ用のインタビューメッセージ
export function createDemoMessages(): Omit<
  InterviewMessageInsert,
  "id" | "created_at"
>[] {
  return [
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。\n\n枚方市議会で審議されている議案について、市民の皆さまのご意見をお聞かせください。この議案について、どのようにお考えですか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "user",
      content: "市政のデジタル化や、子育て支援の拡充を達成して欲しい",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "なるほど。行政サービスの効率化と子育て環境の充実を期待されているということですね。とても重要なご指摘だと思います。\n\n具体的に、枚方市のどのような手続きや支援制度が充実すると良いとお考えですか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "user",
      content:
        "子どもの医療費助成の手続きの簡素化や、オンライン申請の普及が進むと市民にとって大変助かります。",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
  ];
}

// デモ用のインタビューレポート（固定ID）
export function createDemoReport(): InterviewReportInsert {
  return {
    id: DEMO_REPORT_ID,
    interview_session_id: DEMO_SESSION_ID,
    stance: "neutral",
    summary: "期待と懸念両方がある",
    role: "subject_expert",
    role_description:
      "枚方市在住の会社員\n行政手続きや子育て支援に関心を持っている",
    opinions: [
      {
        title: "市政のデジタル化や、子育て支援の拡充を達成して欲しい",
        content:
          "子どもの医療費助成の手続きの簡素化や、オンライン申請の普及が進むと市民にとって大変助かる。",
      },
    ],
    is_public_by_user: true,
  };
}

// 追加のデモ用セッション（3種類のロール確認用）
export function createAdditionalDemoSessions(
  interviewConfigId: string
): InterviewSessionInsert[] {
  const now = new Date();
  return [
    {
      id: DEMO_SESSION_ID_WORK,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000010",
      started_at: new Date(now.getTime() - 7200000).toISOString(),
      completed_at: new Date(now.getTime() - 6600000).toISOString(),
    },
    {
      id: DEMO_SESSION_ID_DAILY,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000011",
      started_at: new Date(now.getTime() - 10800000).toISOString(),
      completed_at: new Date(now.getTime() - 10200000).toISOString(),
    },
    {
      id: DEMO_SESSION_ID_CITIZEN,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000012",
      started_at: new Date(now.getTime() - 14400000).toISOString(),
      completed_at: new Date(now.getTime() - 10200000).toISOString(),
    },
  ];
}

// 追加のデモ用メッセージ（3種類のロール確認用）
export function createAdditionalDemoMessages(): Omit<
  InterviewMessageInsert,
  "id" | "created_at"
>[] {
  return [
    // work_related セッション用
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "user",
      content: "子どもの医療費負担が大きいので、この議案には賛成です。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content:
        "子育て世帯としてのお立場からのご意見ですね。具体的にどのような影響がありますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "user",
      content:
        "共働きで子ども2人を育てていますが、医療費の自己負担が家計を圧迫しています。助成拡充で少しでも負担が減れば助かります。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
    // daily_life_affected セッション用
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "user",
      content: "子どもが小さいので、医療費の負担が軽くなるのは嬉しいです。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content:
        "生活への影響が大きいとのことですね。どのような場面で医療費の負担を感じますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "user",
      content:
        "風邪や怪我で小児科にかかることが多く、月に何回も通院することがあります。自己負担が積み重なると大変です。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
    // general_citizen セッション用
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "user",
      content:
        "財源が気になりますが、子育て支援として医療費助成は必要だと思います。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content:
        "財源と子育て支援のバランスを考えていらっしゃるのですね。どのような点が気になりますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "user",
      content:
        "他の行政サービスとのバランスも考えつつ、子育て世帯への支援として医療費助成は拡充すべきだと思います。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content: "ありがとうございました。ご意見を承りました。",
    },
  ];
}

// 追加のデモ用レポート（3種類のロール確認用）
export function createAdditionalDemoReports(): InterviewReportInsert[] {
  return [
    {
      id: DEMO_REPORT_ID_WORK,
      interview_session_id: DEMO_SESSION_ID_WORK,
      stance: "for",
      summary: "子育て世帯として医療費負担軽減のため賛成",
      role: "work_related",
      role_description:
        "枚方市在住の共働き世帯\n子ども2人\n医療費の負担を日常的に感じている",
      opinions: [
        {
          title: "子どもの医療費負担が大きい",
          content:
            "共働きで子ども2人を育てているが、医療費の自己負担が家計を圧迫している。助成拡充で負担が減れば助かる。",
        },
      ],
      is_public_by_user: true,
    },
    {
      id: DEMO_REPORT_ID_DAILY,
      interview_session_id: DEMO_SESSION_ID_DAILY,
      stance: "for",
      summary: "子育て中の保護者として医療費負担軽減を期待",
      role: "daily_life_affected",
      role_description:
        "枚方市在住の保護者\n小さい子ども2人の子育て中\n医療費の自己負担を日常的に感じている",
      opinions: [
        {
          title: "子どもの医療費負担が大きい",
          content:
            "風邪や怪我で小児科にかかることが多く、月に何回も通院する。自己負担が積み重なると家計に影響が大きい。",
        },
      ],
      is_public_by_user: true,
    },
    {
      id: DEMO_REPORT_ID_CITIZEN,
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      stance: "neutral",
      summary: "財源と子育て支援のバランスを考慮して判断",
      role: "general_citizen",
      role_description:
        "枚方市在住の市民\n子育て支援に関心あり\n市の財政にも関心がある",
      opinions: [
        {
          title: "財源と子育て支援のバランス",
          content:
            "他の行政サービスとのバランスも考えつつ、子育て世帯への支援として医療費助成は拡充すべきと考える。",
        },
      ],
      is_public_by_user: true,
    },
  ];
}
