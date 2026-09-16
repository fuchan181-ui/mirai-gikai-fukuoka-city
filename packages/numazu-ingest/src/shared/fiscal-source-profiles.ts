export type FiscalSourceKind =
  | "budget_overview"
  | "execution_report"
  | "settlement_report"
  | "major_measures"
  | "fiscal_comparison"
  | "public_accounting";

export type FiscalParserKind =
  | "metadata_only"
  | "general_budget_2026"
  | "council_budget_2026"
  | "settlement_overview_2024"
  | "major_measures_2024";

export type FiscalSourceProfile = {
  profileKey: string;
  profileVersion: string;
  parserName: string;
  parserVersion: string;
  sourceKind: FiscalSourceKind;
  seriesCode: string;
  fiscalYear: number;
  title: string;
  url: string;
  expectedMediaType: "application/pdf";
  parserKind: FiscalParserKind;
};

const PROFILE_VERSION = "1.0.0";
const DEFAULT_PARSER_VERSION = "1.0.0";

/**
 * parserVersion は「どの実装で解析したか」の記録ではなく、`prepareFiscalSource`
 * が完了済み解析を再利用してよいかを判定する profile 単位の再解析キーである。
 * 同じ parserKind は同じ実装で解析するため版は様式ごとに1つだけ持ち、
 * 抽出結果が変わる改修をしたらここを上げて対象様式を再解析させる。
 */
const PARSER_VERSIONS: Record<FiscalParserKind, string> = {
  metadata_only: DEFAULT_PARSER_VERSION,
  general_budget_2026: "1.1.0",
  council_budget_2026: DEFAULT_PARSER_VERSION,
  settlement_overview_2024: DEFAULT_PARSER_VERSION,
  major_measures_2024: "1.1.0",
};

/**
 * 沼津市は同じ様式の財政資料を年度ごとのディレクトリで公開している。
 * parserは年度を引数に取るため、様式（parserKind）を共有し、年度とURLだけを
 * profileで分ける。存在しない年度（令和4年度以前の予算概要、令和7年度の決算）は
 * 資料が公開された時点で追加する。
 */
export const fiscalSourceProfiles = [
  {
    profileKey: "budget-overview-2026-general-account",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-general-budget-2026",
    parserVersion: PARSER_VERSIONS.general_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-general-account",
    fiscalYear: 2026,
    title: "令和8年度 一般会計",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2026/gaiyousho/pdf/s-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "general_budget_2026",
  },
  {
    profileKey: "budget-overview-2025-general-account",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-general-budget-2025",
    parserVersion: PARSER_VERSIONS.general_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-general-account",
    fiscalYear: 2025,
    title: "令和7年度 一般会計",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2025/gaiyousho/pdf/s-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "general_budget_2026",
  },
  {
    profileKey: "budget-overview-2024-general-account",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-general-budget-2024",
    parserVersion: PARSER_VERSIONS.general_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-general-account",
    fiscalYear: 2024,
    title: "令和6年度 一般会計",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2024/gaiyousho/pdf/s-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "general_budget_2026",
  },
  {
    profileKey: "budget-overview-2023-general-account",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-general-budget-2023",
    parserVersion: PARSER_VERSIONS.general_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-general-account",
    fiscalYear: 2023,
    title: "令和5年度 一般会計",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2023/gaiyousho/pdf/s-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "general_budget_2026",
  },
  {
    profileKey: "budget-overview-2026-council-expense",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-council-budget-2026",
    parserVersion: PARSER_VERSIONS.council_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-council-expense",
    fiscalYear: 2026,
    title: "令和8年度 議会費",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2026/gaiyousho/pdf/i-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "council_budget_2026",
  },
  {
    profileKey: "budget-overview-2025-council-expense",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-council-budget-2025",
    parserVersion: PARSER_VERSIONS.council_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-council-expense",
    fiscalYear: 2025,
    title: "令和7年度 議会費",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2025/gaiyousho/pdf/i-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "council_budget_2026",
  },
  {
    profileKey: "budget-overview-2024-council-expense",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-council-budget-2024",
    parserVersion: PARSER_VERSIONS.council_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-council-expense",
    fiscalYear: 2024,
    title: "令和6年度 議会費",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2024/gaiyousho/pdf/i-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "council_budget_2026",
  },
  {
    profileKey: "budget-overview-2023-council-expense",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-council-budget-2023",
    parserVersion: PARSER_VERSIONS.council_budget_2026,
    sourceKind: "budget_overview",
    seriesCode: "budget-overview-council-expense",
    fiscalYear: 2023,
    title: "令和5年度 議会費",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/yosan2023/gaiyousho/pdf/i-1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "council_budget_2026",
  },
  {
    profileKey: "settlement-overview-2024",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-settlement-overview-2024",
    parserVersion: PARSER_VERSIONS.settlement_overview_2024,
    sourceKind: "settlement_report",
    seriesCode: "settlement-overview",
    fiscalYear: 2024,
    title: "令和6年度 決算の概要",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2024/pdf/gaiyou.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "settlement_overview_2024",
  },
  {
    profileKey: "settlement-overview-2023",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-settlement-overview-2023",
    parserVersion: PARSER_VERSIONS.settlement_overview_2024,
    sourceKind: "settlement_report",
    seriesCode: "settlement-overview",
    fiscalYear: 2023,
    title: "令和5年度 決算の概要",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2023/pdf/gaiyou.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "settlement_overview_2024",
  },
  {
    profileKey: "settlement-overview-2022",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-settlement-overview-2022",
    parserVersion: PARSER_VERSIONS.settlement_overview_2024,
    sourceKind: "settlement_report",
    seriesCode: "settlement-overview",
    fiscalYear: 2022,
    title: "令和4年度 決算の概要",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2022/pdf/gaiyou.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "settlement_overview_2024",
  },
  {
    profileKey: "settlement-overview-2021",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-settlement-overview-2021",
    parserVersion: PARSER_VERSIONS.settlement_overview_2024,
    sourceKind: "settlement_report",
    seriesCode: "settlement-overview",
    fiscalYear: 2021,
    title: "令和3年度 決算の概要",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2021/pdf/gaiyou.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "settlement_overview_2024",
  },
  {
    profileKey: "settlement-overview-2020",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-settlement-overview-2020",
    parserVersion: PARSER_VERSIONS.settlement_overview_2024,
    sourceKind: "settlement_report",
    seriesCode: "settlement-overview",
    fiscalYear: 2020,
    title: "令和2年度 決算の概要",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2020/pdf/gaiyou.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "settlement_overview_2024",
  },
  {
    profileKey: "major-measures-2024-fiscal",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-major-measures-2024",
    parserVersion: PARSER_VERSIONS.major_measures_2024,
    sourceKind: "major_measures",
    seriesCode: "major-measures-fiscal",
    fiscalYear: 2024,
    title: "令和6年度 主要な施策の成果等報告書 第1章 財政",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2024/pdf_houkoku/1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "major_measures_2024",
  },
  {
    profileKey: "major-measures-2023-fiscal",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-major-measures-2023",
    parserVersion: PARSER_VERSIONS.major_measures_2024,
    sourceKind: "major_measures",
    seriesCode: "major-measures-fiscal",
    fiscalYear: 2023,
    title: "令和5年度 市政報告書 第1章 財政",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2023/pdf_houkoku/1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "major_measures_2024",
  },
  {
    profileKey: "major-measures-2022-fiscal",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-major-measures-2022",
    parserVersion: PARSER_VERSIONS.major_measures_2024,
    sourceKind: "major_measures",
    seriesCode: "major-measures-fiscal",
    fiscalYear: 2022,
    title: "令和4年度 市政報告書 第1章 財政",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2022/pdf_houkoku/1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "major_measures_2024",
  },
  {
    profileKey: "major-measures-2021-fiscal",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-major-measures-2021",
    parserVersion: PARSER_VERSIONS.major_measures_2024,
    sourceKind: "major_measures",
    seriesCode: "major-measures-fiscal",
    fiscalYear: 2021,
    title: "令和3年度 市政報告書 第1章 財政",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2021/pdf_houkoku/1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "major_measures_2024",
  },
  {
    profileKey: "major-measures-2020-fiscal",
    profileVersion: PROFILE_VERSION,
    parserName: "numazu-fiscal-major-measures-2020",
    parserVersion: PARSER_VERSIONS.major_measures_2024,
    sourceKind: "major_measures",
    seriesCode: "major-measures-fiscal",
    fiscalYear: 2020,
    title: "令和2年度 市政報告書 第1章 財政",
    url: "https://www.city.numazu.shizuoka.jp/shisei/gyozaisei/finance/kessan2020/pdf_houkoku/1.pdf",
    expectedMediaType: "application/pdf",
    parserKind: "major_measures_2024",
  },
] as const satisfies readonly FiscalSourceProfile[];

export function findFiscalSourceProfile(
  profileKey: string
): FiscalSourceProfile | null {
  return (
    fiscalSourceProfiles.find((profile) => profile.profileKey === profileKey) ??
    null
  );
}
