/** 元のASCIIから誤写像先までの差。 */
const MISENCODED_OFFSET = 0x3eac;
/** 誤写像の対象。U+3ECC（空白）〜U+3EE5（"9"）が該当する。 */
const MISENCODED_PATTERN = /[\u3ecc-\u3ee5]/g;

/**
 * 一部の年度の予算概要PDFは、pdftotext が数字と記号を CJK統合漢字拡張A
 * (U+3ECC〜U+3EE5) へ誤写像する。元のASCIIから 0x3EAC ずれた位置に並ぶため、
 * 解析前に差し引いて戻す。令和6年度の一般会計・議会費PDFで発生を確認している。
 */
export function normalizeMisencodedPdfAscii(value: string): string {
  return value.replace(MISENCODED_PATTERN, (character) =>
    String.fromCharCode(character.charCodeAt(0) - MISENCODED_OFFSET)
  );
}
