/** 令和元年の年度。令和N年度 = 2018 + N。 */
const REIWA_FISCAL_YEAR_OFFSET = 2018;

/**
 * 年度の令和表記を作る（例: 2025 → "令和7年度"）。
 * 公式PDFは全角数字で印字するため、照合側でNFKC正規化する前提で半角を返す。
 */
export function formatFiscalYearLabel(fiscalYear: number): string {
  const reiwaYear = fiscalYear - REIWA_FISCAL_YEAR_OFFSET;
  if (!Number.isInteger(reiwaYear) || reiwaYear < 1) {
    throw new Error(`令和の年度として扱えない値です: ${fiscalYear}`);
  }
  return `令和${reiwaYear === 1 ? "元" : reiwaYear}年度`;
}

/**
 * 全角数字や字間の空白を含むPDF本文でも年度表記を照合できるようにする。
 * 見出しは「令和 ６ 年度」のように字間へ空白が入る年度がある。
 */
export function includesFiscalYearLabel(
  text: string,
  fiscalYear: number
): boolean {
  return text
    .normalize("NFKC")
    .replace(/\s/g, "")
    .includes(formatFiscalYearLabel(fiscalYear));
}
