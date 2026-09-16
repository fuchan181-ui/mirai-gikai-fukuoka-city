import { parseFiscalInteger } from "../shared/utils/parse-fiscal-amount-value";
import {
  buildFiscalAmountRecord,
  type FiscalParserResult,
} from "./fiscal-parser-types";

function compact(text: string): string {
  return text.normalize("NFKC").replace(/\s/g, "");
}

function failure(message: string): FiscalParserResult {
  return {
    records: [],
    validationSummary: [
      {
        ruleCode: "budget_2026_validation_failed",
        severity: "hard_error",
        message,
      },
    ],
  };
}

function amountRecord(
  value: bigint,
  sourceValueText: string,
  page: number,
  council: boolean,
  revenue = false
) {
  return buildFiscalAmountRecord({
    fiscalYear: 2026,
    eventKind: "initial_budget",
    decisionStage: "proposed",
    measure: revenue ? "revenue_budget" : "expenditure_budget",
    amountYen: value * 1000n,
    sourceValueText,
    sourceValueNumeric: value.toString(),
    sourceUnit: "thousand_yen",
    sourcePrecisionYen: 1000,
    sourcePage: page,
    sourceTable: council
      ? "一般会計 議会費"
      : `一般会計 歳${revenue ? "入" : "出"}`,
    ...(council
      ? {
          classificationKey: "council_expense",
          sourceClassificationLabel: "議会費",
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

function comparisonRow(text: string): ComparisonRow | null {
  const cells = text
    .trim()
    .replace(/△\s*/g, "-")
    .replace(/千円|%|％/g, "")
    .trim()
    .split(/\s+/);
  if (
    cells.length !== 6 ||
    ![1, 3, 5].every((i) => /^-?\d+\.\d$/.test(cells[i] ?? ""))
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

function parseComparisonPage(page: string, side: "入" | "出", count: number) {
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
    rows.length !== count ||
    totals.length !== 1 ||
    rows.some((row, i) => row.index !== i + 1 || !row.values)
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
  return { rows, total };
}

export function parseGeneralBudget2026(text: string): FiscalParserResult {
  const pages = text.replace(/\f\s*$/, "").split("\f");
  const identity = compact(pages[0] ?? "");
  if (
    pages.length !== 2 ||
    !identity.includes("令和8年度歳入歳出予算款別前年度比較表") ||
    !identity.includes("(1)一般会計")
  )
    return failure("令和8年度一般会計の年度・表題・ページ構造を確認できません");
  const revenue = parseComparisonPage(pages[0], "入", 23);
  const expenditure = parseComparisonPage(pages[1], "出", 13);
  if (
    !revenue ||
    !expenditure ||
    revenue.total.amounts[0] !== expenditure.total.amounts[0]
  )
    return failure("歳入歳出表の列・単位・款別合計・前年度差額が一致しません");
  const council = expenditure.rows[0];
  if (council.label !== "議会費" || !council.values)
    return failure("歳出第1款の議会費を確認できません");
  const records = [
    amountRecord(
      revenue.total.amounts[0],
      revenue.total.sourceValueText,
      1,
      false,
      true
    ),
    amountRecord(
      expenditure.total.amounts[0],
      expenditure.total.sourceValueText,
      2,
      false
    ),
    amountRecord(
      council.values.amounts[0],
      council.values.sourceValueText,
      2,
      true
    ),
  ];
  for (const [index, row] of [
    revenue.total,
    expenditure.total,
    council.values,
  ].entries()) {
    records[index].parsedPayload.publishedMetrics = row.publishedMetrics;
  }
  return {
    records,
    validationSummary: [
      {
        ruleCode: "budget_2026_control_totals_passed",
        severity: "info",
        message:
          "歳入23款・歳出13款の合計、前年度差額、歳入歳出の一致を確認しました",
      },
    ],
  };
}

export function parseCouncilBudget2026(text: string): FiscalParserResult {
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
  const lines = text.split("\n");
  const totalLines = lines.filter((line) => /^1議会費\d/.test(compact(line)));
  const totals = totalLines.map((line) =>
    parseFiscalInteger(
      line.match(/^\s*1\s*議\s*会\s*費\s+([\d,]+)(?=\s|$)/)?.[1] ?? ""
    )
  );
  if (
    totals.length !== 3 ||
    totals[0] === null ||
    totals.some((value) => value !== totals[0])
  )
    return failure("議会費の款・項・目の合計が一致しません");
  const read = (label: string) => {
    const pattern = new RegExp(`^\\s*${[...label].join("\\s*")}\\s+(\\S+)`);
    const matches = lines
      .map((line) => line.match(pattern))
      .filter((match) => match !== null);
    return matches.length === 1 ? parseFiscalInteger(matches[0][1]) : null;
  };
  const general = read("○一般経費");
  const project = read("○事業費");
  const components = [
    "人件費",
    "物件費",
    "報償費",
    "委託料",
    "負担金",
    "交付金",
  ].map((label) => read(`・${label}`));
  if (
    general === null ||
    project === null ||
    components.some((value) => value === null) ||
    components.reduce<bigint>((sum, value) => sum + (value ?? 0n), 0n) !==
      general ||
    general + project !== totals[0] ||
    read("・議会活性化推進事業費") !== project
  )
    return failure("議会費の一般経費・事業費と内訳合計が一致しません");
  const sourceValueText = totalLines[0].match(
    /^\s*1\s*議\s*会\s*費\s+([\d,]+)(?=\s|$)/
  )?.[1];
  if (!sourceValueText) return failure("議会費の原金額を確認できません");
  const record = amountRecord(totals[0], sourceValueText, 1, true);
  record.parsedPayload.evidenceRole = "corroborating";
  return {
    records: [record],
    validationSummary: [
      {
        ruleCode: "budget_2026_council_totals_passed",
        severity: "info",
        message: "議会費の款・項・目、一般経費6項目と事業費を突合しました",
      },
      {
        ruleCode: "budget_2026_year_from_profile",
        severity: "warning",
        message:
          "年度印字のない詳細PDFです。令和8年度の公式URLを固定したprofileに基づき、公開前に一般会計比較表との照合が必要です",
      },
    ],
  };
}
