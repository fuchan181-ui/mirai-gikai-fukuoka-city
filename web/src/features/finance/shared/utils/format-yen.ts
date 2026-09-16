// 金額は bigint で扱う。tsconfig が ES2017 のため BigInt リテラルは使えない。
/** 0円。等値判定を各所に散らさないため、この定数を共有する。 */
export const ZERO = BigInt(0);
const TWO = BigInt(2);
const THOUSAND = BigInt(1000);

const YEN_UNITS = [
  { unit: "兆", base: BigInt("1000000000000") },
  { unit: "億", base: BigInt("100000000") },
  { unit: "万", base: BigInt("10000") },
] as const;

/** 円単位の10進文字列を bigint に変換する。Number を経由して精度を落とさない。 */
export function parseYen(value: string): bigint {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`円金額は10進整数の文字列で指定してください: ${value}`);
  }
  return BigInt(trimmed);
}

/** 円金額の大小を比べる。a が小さければ負、大きければ正、等しければ 0。 */
export function compareYen(a: string, b: string): number {
  const left = parseYen(a);
  const right = parseYen(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function groupDigits(value: bigint): string {
  const isNegative = value < ZERO;
  const digits = (isNegative ? -value : value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return isNegative ? `-${grouped}` : grouped;
}

/** 3桁区切りの円表記。表や検算の明細で使う。 */
export function formatYenExact(value: string): string {
  return `${groupDigits(parseYen(value))}円`;
}

/**
 * 兆・億・万・円に分解した読みやすい表記。
 * 例: `956億5,000万円`、`4億6,988万7,000円`、`2,422万円`。
 * 値は丸めず、0 の位だけを省く。
 */
export function formatYenWithUnits(value: string): string {
  const yen = parseYen(value);
  const isNegative = yen < ZERO;
  let rest = isNegative ? -yen : yen;
  const parts: string[] = [];

  for (const { unit, base } of YEN_UNITS) {
    const count = rest / base;
    if (count > ZERO) {
      parts.push(`${groupDigits(count)}${unit}`);
      rest -= count * base;
    }
  }

  if (rest > ZERO) {
    parts.push(`${groupDigits(rest)}円`);
  } else if (parts.length === 0) {
    parts.push("0円");
  } else {
    parts[parts.length - 1] = `${parts[parts.length - 1]}円`;
  }

  const body = parts.join("");
  return isNegative ? `-${body}` : body;
}

/**
 * 構成比を小数第1位まで（四捨五入）で返す。0〜100 の数値。
 * 合計が 0 のときは比を定義できないため null を返す。
 */
export function calculateSharePercent(
  amountYen: string,
  totalYen: string
): number | null {
  const total = parseYen(totalYen);
  if (total === ZERO) return null;
  const amount = parseYen(amountYen);
  // 0.1%単位で四捨五入する。Number へ変換する前に bigint で丸める。
  const tenths = (amount * THOUSAND * TWO + total) / (total * TWO);
  return Number(tenths) / 10;
}

export function formatSharePercent(percent: number | null): string {
  return percent === null ? "—" : `${percent.toFixed(1)}%`;
}
