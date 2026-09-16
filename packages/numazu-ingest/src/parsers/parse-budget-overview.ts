import {
  EXPENDITURE_PURPOSE_CLASSIFICATIONS,
  type FiscalSourceClassification,
  PURPOSE_SCHEME,
  REVENUE_SCHEME,
  REVENUE_SOURCE_CLASSIFICATIONS,
} from "../shared/fiscal-classifications";
import type { ParsedFiscalStagingRecord } from "../shared/utils/build-fiscal-staging";
import { compactFiscalText as compact } from "../shared/utils/compact-fiscal-text";
import { formatFiscalYearLabel } from "../shared/utils/fiscal-year-label";
import { parseFiscalInteger } from "../shared/utils/parse-fiscal-amount-value";
import {
  buildFiscalAmountRecord,
  type FiscalParserResult,
} from "./fiscal-parser-types";

/** 増減率は "88,450.0" のように桁区切りを含む。 */
const PUBLISHED_RATIO_PATTERN = /^-?\d[\d,]*\.\d$/;

function failure(message: string): FiscalParserResult {
  return {
    records: [],
    validationSummary: [
      {
        ruleCode: "budget_overview_validation_failed",
        severity: "hard_error",
        message,
      },
    ],
  };
}

type AmountClassification = FiscalSourceClassification & { scheme: string };

function classificationAt(
  classifications: readonly FiscalSourceClassification[],
  index: number,
  scheme: string
): AmountClassification {
  const entry = classifications[index];
  // 款数と並び順は照合済みで、ここへ来る時点で必ず存在する。
  // 添字アクセスの型を絞るためのガードとして残す。
  if (!entry) throw new Error("classification index out of range");
  return { label: entry.label, key: entry.key, scheme };
}

function amountRecord(options: {
  fiscalYear: number;
  amount: bigint;
  sourceValueText: string;
  page: number;
  revenue?: boolean;
  classification?: AmountClassification;
}): ParsedFiscalStagingRecord {
  return buildFiscalAmountRecord({
    fiscalYear: options.fiscalYear,
    eventKind: "initial_budget",
    decisionStage: "proposed",
    measure: options.revenue ? "revenue_budget" : "expenditure_budget",
    amountYen: options.amount * 1000n,
    sourceValueText: options.sourceValueText,
    sourceValueNumeric: options.amount.toString(),
    sourceUnit: "thousand_yen",
    sourcePrecisionYen: 1000,
    sourcePage: options.page,
    sourceTable: `一般会計 歳${options.revenue ? "入" : "出"}`,
    ...(options.classification
      ? {
          classificationKey: options.classification.key,
          classificationScheme: options.classification.scheme,
          sourceClassificationLabel: options.classification.label,
        }
      : {}),
  });
}

// 全6列を確認してから当年度・前年度・増減額を取り出す。
type ComparisonRow = {
  amounts: [bigint, bigint, bigint];
  sourceValueText: string;
  publishedMetrics: {
    compositionRatio: string;
    previousCompositionRatio: string;
    changeRate: string;
  };
};

type ComparisonTable = {
  rows: { label: string; values: ComparisonRow }[];
  total: ComparisonRow;
};

function comparisonRow(text: string): ComparisonRow | null {
  const cells = text
    .trim()
    .replace(/△\s*/g, "-")
    .replace(/千円|%|％/g, "")
    .trim()
    .split(/\s+/);
  if (
    cells.length !== 6 ||
    ![1, 3, 5].every((i) => PUBLISHED_RATIO_PATTERN.test(cells[i] ?? ""))
  )
    return null;
  const current = parseFiscalInteger(cells[0] ?? "");
  const previous = parseFiscalInteger(cells[2] ?? "");
  const change = parseFiscalInteger(cells[4] ?? "");
  if (
    current === null ||
    previous === null ||
    change === null ||
    current < 0n ||
    previous < 0n ||
    current - previous !== change
  )
    return null;
  return {
    amounts: [current, previous, change],
    sourceValueText: cells[0],
    publishedMetrics: {
      compositionRatio: cells[1],
      previousCompositionRatio: cells[3],
      changeRate: cells[5],
    },
  };
}

function parseComparisonPage(
  page: string,
  side: "入" | "出",
  classifications: readonly FiscalSourceClassification[]
): ComparisonTable | null {
  const normalized = compact(page);
  if (
    !normalized.includes(`歳${side}`) ||
    !normalized.includes("本年度前年度比較") ||
    !normalized.includes("予算額構成比予算額構成比増減額増減率") ||
    !normalized.includes("千円")
  )
    return null;
  const lines = page.split("\n");
  const rows = lines.flatMap((line) => {
    const match = line.match(/^\s*(\d+)\s+([^\d]+?)\s+(\d[\d,]*\s+.*)$/);
    return match
      ? [
          {
            index: Number(match[1]),
            label: compact(match[2]),
            values: comparisonRow(match[3]),
          },
        ]
      : [];
  });
  const totals = lines.filter((line) =>
    compact(line).startsWith(`歳${side}合計`)
  );
  if (
    rows.length !== classifications.length ||
    totals.length !== 1 ||
    rows.some(
      (row, i) =>
        row.index !== i + 1 ||
        row.label !== classifications[i]?.label ||
        !row.values
    )
  )
    return null;
  const total = comparisonRow(
    totals[0].replace(new RegExp(`^\\s*歳\\s*${side}\\s*合\\s*計\\s*`), "")
  );
  if (
    !total ||
    [0, 1, 2].some(
      (column) =>
        rows.reduce(
          (sum, row) => sum + (row.values?.amounts[column] ?? 0n),
          0n
        ) !== total.amounts[column]
    )
  )
    return null;
  return {
    rows: rows.flatMap((row) =>
      row.values ? [{ label: row.label, values: row.values }] : []
    ),
    total,
  };
}

function withPublishedMetrics(
  record: ParsedFiscalStagingRecord,
  row: ComparisonRow
): ParsedFiscalStagingRecord {
  record.parsedPayload.publishedMetrics = row.publishedMetrics;
  return record;
}

/**
 * 歳入歳出予算款別前年度比較表から当年度の款別内訳を読む。
 * 表題・ページ構成は年度で変わらないため、年度はprofileから受け取って照合する。
 */
export function parseGeneralBudget(
  text: string,
  fiscalYear: number
): FiscalParserResult {
  const fiscalYearLabel = formatFiscalYearLabel(fiscalYear);
  const pages = text.replace(/\f\s*$/, "").split("\f");
  const identity = compact(pages[0] ?? "");
  if (
    pages.length !== 2 ||
    !identity.includes(`${fiscalYearLabel}歳入歳出予算款別前年度比較表`) ||
    !identity.includes("(1)一般会計")
  )
    return failure(
      `${fiscalYearLabel}一般会計の年度・表題・ページ構造を確認できません`
    );
  const revenue = parseComparisonPage(
    pages[0],
    "入",
    REVENUE_SOURCE_CLASSIFICATIONS
  );
  const expenditure = parseComparisonPage(
    pages[1],
    "出",
    EXPENDITURE_PURPOSE_CLASSIFICATIONS
  );
  if (
    !revenue ||
    !expenditure ||
    revenue.total.amounts[0] !== expenditure.total.amounts[0]
  )
    return failure("歳入歳出表の列・単位・款別合計・前年度差額が一致しません");
  const records = [
    withPublishedMetrics(
      amountRecord({
        fiscalYear,
        amount: revenue.total.amounts[0],
        sourceValueText: revenue.total.sourceValueText,
        page: 1,
        revenue: true,
      }),
      revenue.total
    ),
    withPublishedMetrics(
      amountRecord({
        fiscalYear,
        amount: expenditure.total.amounts[0],
        sourceValueText: expenditure.total.sourceValueText,
        page: 2,
      }),
      expenditure.total
    ),
    ...expenditure.rows.map((row, index) =>
      withPublishedMetrics(
        amountRecord({
          fiscalYear,
          amount: row.values.amounts[0],
          sourceValueText: row.values.sourceValueText,
          page: 2,
          classification: classificationAt(
            EXPENDITURE_PURPOSE_CLASSIFICATIONS,
            index,
            PURPOSE_SCHEME
          ),
        }),
        row.values
      )
    ),
    ...revenue.rows.map((row, index) =>
      withPublishedMetrics(
        amountRecord({
          fiscalYear,
          amount: row.values.amounts[0],
          sourceValueText: row.values.sourceValueText,
          page: 1,
          revenue: true,
          classification: classificationAt(
            REVENUE_SOURCE_CLASSIFICATIONS,
            index,
            REVENUE_SCHEME
          ),
        }),
        row.values
      )
    ),
  ];
  return {
    records,
    validationSummary: [
      {
        ruleCode: "general_budget_control_totals_passed",
        severity: "info",
        message:
          "歳入23款・歳出13款の合計、前年度差額、歳入歳出の一致を確認しました",
      },
      {
        ruleCode: "general_budget_classification_breakdown_extracted",
        severity: "info",
        message: `歳入${REVENUE_SOURCE_CLASSIFICATIONS.length}款・歳出${EXPENDITURE_PURPOSE_CLASSIFICATIONS.length}款の内訳を分類キー付きで抽出しました`,
      },
    ],
  };
}

type CouncilExpenseBreakdown = {
  general: bigint;
  project: bigint;
  generalItemCount: number;
  projectItemCount: number;
};

function sumAmounts(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}

/**
 * 議会費の内訳を読む。一般経費・事業費の区分と、その下に並ぶ費目数は年度で
 * 変わる（令和5年度の事業費は活性化推進事業費と100周年記念事業費の2件）ため、
 * 固定の費目名ではなく区分の額と費目の合計を突合する。
 */
function parseCouncilExpenseBreakdown(
  text: string
): CouncilExpenseBreakdown | null {
  let general: bigint | null = null;
  let project: bigint | null = null;
  let section: "general" | "project" | null = null;
  const generalItems: bigint[] = [];
  const projectItems: bigint[] = [];
  for (const line of text.split("\n")) {
    const normalized = compact(line);
    // 区分行は右カラムの注記と同じテキスト行に連結する年度がある。
    const sectionMatch = normalized.match(/^○(一般経費|事業費)([\d,]+)/);
    if (sectionMatch) {
      const amount = parseFiscalInteger(sectionMatch[2] ?? "");
      if (amount === null) return null;
      if (sectionMatch[1] === "一般経費") {
        general = amount;
        section = "general";
      } else {
        project = amount;
        section = "project";
      }
      continue;
    }
    // 費目は「・人件費418,900（…）」の形で並び、金額に単位記号は付かない。
    // 「市議会100周年記念事業費」のように費目名へ数字が入るため、注記を除いた
    // 行末の金額を費目額として読む。
    const itemMatch = normalized
      .replace(/[(（].*$/, "")
      .match(/^・(.+?)([\d,]+)$/);
    if (!itemMatch || section === null) continue;
    const amount = parseFiscalInteger(itemMatch[2] ?? "");
    if (amount === null) return null;
    if (section === "general") generalItems.push(amount);
    else projectItems.push(amount);
  }
  if (general === null || project === null) return null;
  if (
    generalItems.length === 0 ||
    projectItems.length === 0 ||
    sumAmounts(generalItems) !== general ||
    sumAmounts(projectItems) !== project
  )
    return null;
  return {
    general,
    project,
    generalItemCount: generalItems.length,
    projectItemCount: projectItems.length,
  };
}

/** 議会費の款行。PDFは「1 議 会 費 460,162」のように字間へ空白を入れる。 */
const COUNCIL_TOTAL_PATTERN = /^\s*1\s*議\s*会\s*費\s+([\d,]+)(?=\s|$)/;

export function parseCouncilBudget(
  text: string,
  fiscalYear: number
): FiscalParserResult {
  const fiscalYearLabel = formatFiscalYearLabel(fiscalYear);
  if (text.replace(/\f\s*$/, "").includes("\f"))
    return failure("議会費の1ページ構成を確認できません");
  const normalized = compact(text);
  // このPDFには年度が印字されないため、年度は公式URLを固定したsource profileで指定する。
  if (
    !normalized.includes("(単位千円)") ||
    !normalized.includes("本年度予算額") ||
    !normalized.includes("本年度の財源内訳") ||
    !normalized.includes("一般財源")
  )
    return failure("議会費表の見出しまたは千円単位を確認できません");
  const councilTotals = text
    .split("\n")
    .filter((line) => /^1議会費\d/.test(compact(line)))
    .flatMap((line) => {
      const amountText = COUNCIL_TOTAL_PATTERN.exec(line)?.[1];
      const amount = amountText ? parseFiscalInteger(amountText) : null;
      return amountText && amount !== null ? [{ amountText, amount }] : [];
    });
  const [councilTotal] = councilTotals;
  if (
    councilTotals.length !== 3 ||
    !councilTotal ||
    councilTotals.some((entry) => entry.amount !== councilTotal.amount)
  )
    return failure("議会費の款・項・目の合計が一致しません");
  const breakdown = parseCouncilExpenseBreakdown(text);
  if (
    !breakdown ||
    breakdown.general + breakdown.project !== councilTotal.amount
  )
    return failure("議会費の一般経費・事業費と内訳合計が一致しません");
  const record = amountRecord({
    fiscalYear,
    amount: councilTotal.amount,
    sourceValueText: councilTotal.amountText,
    page: 1,
    classification: {
      label: "議会費",
      key: "council_expense",
      scheme: PURPOSE_SCHEME,
    },
  });
  record.parsedPayload.evidenceRole = "corroborating";
  return {
    records: [record],
    validationSummary: [
      {
        ruleCode: "council_budget_totals_passed",
        severity: "info",
        message: `議会費の款・項・目、一般経費${breakdown.generalItemCount}費目と事業費${breakdown.projectItemCount}件を突合しました`,
      },
      {
        ruleCode: "council_budget_year_from_profile",
        severity: "warning",
        message: `年度印字のない詳細PDFです。${fiscalYearLabel}の公式URLを固定したprofileに基づき、公開前に一般会計比較表との照合が必要です`,
      },
    ],
  };
}
