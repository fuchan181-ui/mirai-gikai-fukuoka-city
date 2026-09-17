/**
 * 判定ケースの入力。モデレーションと情報充実度で同じ形を使う。
 *
 * 本番の `buildModerationPrompt` / `buildContentRichnessPrompt` と
 * TypeSafe の `systemOne` に渡す `state` の双方がこの形を受ける。
 */
export type JudgeCaseInput = {
  summary: string | null;
  opinions: Array<{ title: string; content: string }> | null;
  roleDescription: string | null;
  messages: Array<{ role: string; content: string }>;
};
