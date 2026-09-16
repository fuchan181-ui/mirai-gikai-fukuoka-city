import type { BillNumberKind } from "../shared/types";
import { toHalfWidthDigits } from "./normalize-wareki";

/** 議案番号の接頭辞と種別の対応。長い接頭辞を先に置く（"発議第" が "議第" に食われないように）。 */
const PREFIXES: ReadonlyArray<readonly [string, BillNumberKind]> = [
  ["発議第", "hatsugi"],
  ["請願第", "seigan"],
  ["陳情第", "chinjo"],
  ["議第", "gi"],
  ["報第", "hou"],
  ["認第", "nin"],
];

export type ParsedBillNumber = {
  /** 表記を正規化した議案番号（全角数字は半角に。例: "発議第1号"） */
  billNumber: string;
  /** 議案番号の接頭辞（例: "発議第"）。番号の範囲を別の番号へ展開するときに使う */
  prefix: string;
  kind: BillNumberKind;
  value: number;
};

/**
 * 議案番号の表記（"議第58号" / "発議第１号"）を種別と数値に分解する。
 * 先頭が議案番号でなければ null を返す。
 */
export function parseBillNumber(value: string): ParsedBillNumber | null {
  const normalized = toHalfWidthDigits(value.trim());

  for (const [prefix, kind] of PREFIXES) {
    if (!normalized.startsWith(prefix)) continue;
    const matched = normalized
      .slice(prefix.length)
      .match(/^(\d{1,4})号(?![0-9])/);
    if (!matched) continue;
    return {
      billNumber: `${prefix}${matched[1]}号`,
      prefix,
      kind,
      value: Number(matched[1]),
    };
  }

  return null;
}

/** 行の先頭が議案番号かどうか。議案審議結果PDFのレコード行の判定に使う。 */
export function startsWithBillNumber(line: string): boolean {
  return parseBillNumber(line) !== null;
}

/**
 * 先頭の議案番号を取り除いた残りを返す（"議第58号 沼津市印鑑条例の一部改正" → "沼津市印鑑条例の一部改正"）。
 * 先頭が議案番号でなければ入力をそのまま返す。
 */
export function stripBillNumberPrefix(value: string): string {
  const trimmed = value.trim();
  for (const [prefix] of PREFIXES) {
    if (!trimmed.startsWith(prefix)) continue;
    const matched = trimmed
      .slice(prefix.length)
      .match(/^[0-9\uFF10-\uFF19]{1,4}号/);
    if (!matched) continue;
    return trimmed.slice(prefix.length + matched[0].length).trim();
  }
  return trimmed;
}
