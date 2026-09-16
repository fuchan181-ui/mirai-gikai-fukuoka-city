/**
 * ページレイアウトに関するユーティリティ
 *
 * TOP・議案一覧・議案詳細を「メインページ」として扱い、
 * - DifficultySelectorを表示
 * - チャットサイドバー用のオフセットレイアウトを使用
 */

/** メインページ（TOP、議案一覧、議案詳細）かどうかを判定 */
export function isMainPage(pathname: string): boolean {
  // トップページ
  if (pathname === "/") return true;
  // 議案一覧ページ
  if (pathname === "/bills") return true;
  // 議案詳細ページ（/bills/[id]）- サブパスは除外
  if (/\/bills\/[^/]+$/.test(pathname)) return true;
  return false;
}

/**
 * 幅を絞らず、画面の広さを使うページかどうかを判定
 *
 * 財政ページは款ごとの表や棒グラフを並べるため、列が折り返さないよう
 * 本文に画面幅を使う。読み物としての行長は、各ページの見出し・本文側で
 * `max-w-3xl` などを付けて調整する。
 */
export function isWidePage(pathname: string): boolean {
  // 財政ページ（/finance, /finance/[年度]）
  return pathname === "/finance" || pathname.startsWith("/finance/");
}

/** インタビューチャットページかどうかを判定 */
export function isInterviewPage(pathname: string): boolean {
  // /bills/[id]/interview/chat
  return /\/bills\/[^/]+\/interview\/chat$/.test(pathname);
}

/** インタビューセクション（LP・チャット含む）かどうかを判定 */
export function isInterviewSection(pathname: string): boolean {
  // /bills/[id]/interview 以下すべて
  return /\/bills\/[^/]+\/interview(\/|$)/.test(pathname);
}

/** インタビューページからbillIdを抽出 */
export function extractBillIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/bills\/([^/]+)/);
  return match ? match[1] : null;
}
