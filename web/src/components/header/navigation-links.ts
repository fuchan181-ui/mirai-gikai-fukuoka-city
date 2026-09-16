import { GENERAL_QUESTIONS_ENABLED } from "@/features/general-questions/shared/constants";
import { routes } from "@/lib/routes";

/** ヘッダーから辿れる主要ページ。デスクトップ表示とメニューで共有する。 */
export const HEADER_NAVIGATION_LINKS = [
  { label: "トップ", href: routes.home() },
  { label: "議案を検索する", href: routes.billsList() },
  { label: "定例会の一覧", href: routes.gikaiSessions() },
  ...(GENERAL_QUESTIONS_ENABLED
    ? [{ label: "一般質問を見る", href: routes.generalQuestions() }]
    : []),
] as const;
