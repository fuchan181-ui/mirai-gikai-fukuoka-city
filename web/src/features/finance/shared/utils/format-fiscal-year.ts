const REIWA_FIRST_YEAR = 2019;

/**
 * 西暦の会計年度を和暦の表記にする。
 * 例: 2026 -> `令和8年度`、2019 -> `令和元年度`。
 */
export function formatFiscalYear(fiscalYear: number): string {
  const reiwaYear = fiscalYear - REIWA_FIRST_YEAR + 1;
  if (reiwaYear === 1) return "令和元年度";
  if (reiwaYear < 1) return `${fiscalYear}年度`;
  return `令和${reiwaYear}年度`;
}

/** 西暦のまま併記するときの表記。 */
export function formatFiscalYearWithGregorian(fiscalYear: number): string {
  return `${formatFiscalYear(fiscalYear)}（${fiscalYear}年度）`;
}

/**
 * 基準日が年度末（翌年3月31日）かどうか。会計年度は4月1日から翌年3月31日まで。
 * 年度末より前の基準日の額を「年度末の予算現額」と呼ぶと、事実と食い違う。
 */
export function isFiscalYearEnd(
  asOfDate: string | null,
  fiscalYear: number
): boolean {
  return asOfDate === `${fiscalYear + 1}-03-31`;
}
