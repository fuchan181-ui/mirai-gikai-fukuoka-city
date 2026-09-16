import { readFileSync } from "node:fs";
import { join } from "node:path";

/** 第14回定例会の開会中（2026-09-16）に取得した「本会議のお知らせ」 */
export const PAGE_HTML = readFileSync(
  join(import.meta.dirname, "oshirase-2026-14.html"),
  "utf-8"
);

/** ページ見出しから読む、会期開始の年と月 */
export const SESSION = { sessionStartYear: 2026, sessionStartMonth: 9 };

/** 市は将来分の議事報告をコメントとして先置きし、当日に公開する */
export function publishCommentedReports(html: string): string {
  return html.replaceAll("<!--", "").replaceAll("-->", "");
}

/** 議事報告1件分のマークアップ */
export function reportBlock(heading: string, body: string): string {
  return `<div class="h3_main">\n<h3>${heading}</h3></div>\n<p>${body}</p>`;
}

/** 議事報告だけを持つ最小のページ */
export function buildPage(reports: string[]): string {
  return [
    '<h2 class="h2_main">第14回（令和8年9月）定例会</h2>',
    '<a name="houkoku"></a>',
    '<h2 class="h2_main">議事報告</h2>',
    ...reports,
    '<div id="inform"><p>このページに関するお問い合わせ先</p></div>',
  ].join("\n");
}
