/**
 * 財政資料の本文を照合用に詰める。
 *
 * 公式PDFは同じ語を年度によって全角・半角・字間空白ありで印字するため、
 * 見出しや款名を照合する前段で正規化する。PDF由来のテキストは
 * セル内の改行や字間調整で空白が混ざるので、比較の前に取り除く。
 */

/** 全角を半角へ揃えたうえで空白を取り除く。款名や表題の照合に使う。 */
export function compactFiscalText(value: string): string {
  return value.normalize("NFKC").replace(/\s/g, "");
}

/**
 * 空白だけを取り除き、全角はそのまま残す。
 * 「１議会費」のように全角数字を含むリテラルと照合する箇所で使う。
 */
export function stripFiscalWhitespace(value: string): string {
  return value.replace(/\s/g, "");
}
