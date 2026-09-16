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
