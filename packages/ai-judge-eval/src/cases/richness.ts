import type { JudgeCaseInput } from "./input";

/**
 * 情報充実度（content_richness）の評価ケース。
 *
 * レベル定義は `@mirai-gikai/shared/content-richness/instructions` の
 * スコアリング基準（0-19 / 20-39 / 40-59 / 60-79 / 80-100）をそのまま使う。
 * 期待値は既存 LLM の出力ではなく、その基準を読んで人手で付けた正解ラベル。
 *
 * ラベルは判定結果に合わせて動かさない。レベルの 1 段差（レベル 2 と 3 など）は
 * 基準の文言上どちらとも読めるため、出力に寄せて直すと答え合わせになる。
 * 判定が割れるケースは note に「境界」と明記し、±1 レベル以内で評価する。
 */
export type RichnessCaseInput = JudgeCaseInput;

/** 既存実装と同じ 5 段階のレベル番号（0 が最も低い）。 */
export type RichnessLevel = 0 | 1 | 2 | 3 | 4;

export const RICHNESS_LEVELS = [
  { level: 0, min: 0, max: 19, label: "不足" },
  { level: 1, min: 20, max: 39, label: "やや不足" },
  { level: 2, min: 40, max: 59, label: "普通" },
  { level: 3, min: 60, max: 79, label: "充実" },
  { level: 4, min: 80, max: 100, label: "非常に充実" },
] as const;

/** 0-100 のスコアを既存実装と同じレベル番号に落とす。 */
export function toRichnessLevel(score: number): RichnessLevel {
  const clamped = Math.min(100, Math.max(0, score));
  for (const entry of RICHNESS_LEVELS) {
    if (clamped <= entry.max) return entry.level;
  }
  return 4;
}

export type RichnessCase = {
  id: string;
  /** このケースで確かめたいこと */
  note: string;
  expected: RichnessLevel;
  input: RichnessCaseInput;
};

function buildInput(params: {
  title: string;
  content: string;
  roleDescription?: string | null;
  utterances?: string[];
}): RichnessCaseInput {
  const messages: Array<{ role: string; content: string }> = [
    {
      role: "assistant",
      content:
        "この議案について、暮らしや地域への影響をふまえてお考えを聞かせてください。",
    },
  ];
  for (const utterance of params.utterances ?? [params.content]) {
    messages.push({ role: "user", content: utterance });
  }

  return {
    summary: params.title,
    opinions: [{ title: params.title, content: params.content }],
    roleDescription: params.roleDescription ?? null,
    messages,
  };
}

export const RICHNESS_CASES: RichnessCase[] = [
  {
    id: "rich-4-very-rich",
    note: "具体的事例・数値・影響分析・改善提案が揃っている",
    expected: 4,
    input: buildInput({
      title: "空き家対策条例に賛成。解体費用の補助を拡充してほしい",
      content:
        "私の住む西間門地区では、ここ5年で空き家が17軒増えました。自治会で数えたので数字は正確です。隣の空き家からは毎年夏に大量の蚊が発生し、近所の子どもが刺されています。庭木が電線に触れそうで、台風のたびに停電の不安があります。昨年は市の補助金を使って1軒解体されましたが、実際にかかった費用は280万円で、補助は40万円でした。持家の高齢者には残りを払う余力がありません。提案として、解体費用の補助上限を100万円に引き上げ、固定資産税の猶予と組み合わせてはどうでしょうか。また、空き家を地域の集会所や短期滞在施設として活用する場合に補助率を上乗せする仕組みも考えられます。空き家バンクへの登録件数も現在12件と少ないので、登録の手続きをオンライン化すべきです。",
      roleDescription: "西間門地区の自治会役員を12年務める70代",
    }),
  },
  {
    id: "rich-3-rich",
    note: "主要な論点が明確で一定の具体性と提案がある（レベル3/4の境界）",
    expected: 3,
    input: buildInput({
      title: "子育て支援の拡充は必要だが財源の説明が足りない",
      content:
        "第2子の保育料が無償になるのはありがたいですが、第1子は対象外のままで、上の子の負担は変わりません。わが家は保育料に毎月4万2千円かかっており、無償化されるのは下の子だけなので効果は限定的です。対象を第1子まで広げるか、所得に応じた段階制にしてほしいです。財源については、市の説明では基金を取り崩すとありますが、それが何年もつのか示されていません。",
      roleDescription: "3歳と1歳の子どもを育てる共働き世帯",
    }),
  },
  {
    id: "rich-2-normal",
    note: "基本的な意見はあるが具体性・深掘りが不足",
    expected: 2,
    input: buildInput({
      title: "公園の整備について",
      content:
        "近くの公園は遊具が古くて危ないので、直してほしいです。子どもが遊べる場所が減っているのは問題だと思います。予算をつけてほしいです。",
      roleDescription: "小学生の子どもを持つ保護者",
    }),
  },
  {
    id: "rich-1-somewhat-thin",
    note: "意見が抽象的で検討に活かしづらい（レベル0/1の境界）",
    expected: 1,
    input: buildInput({
      title: "もっと良くしてほしい",
      content:
        "なんとなくですが、市政はもっと頑張ってほしいです。市民のことを考えてほしいと思います。",
      roleDescription: "沼津市在住",
    }),
  },
  {
    id: "rich-0-none",
    note: "有用な情報がほとんど得られていない",
    expected: 0,
    input: buildInput({
      title: "特になし",
      content: "よくわかりません。",
      roleDescription: null,
    }),
  },
];
