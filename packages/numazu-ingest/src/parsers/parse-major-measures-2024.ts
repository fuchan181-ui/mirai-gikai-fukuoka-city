import { EXPENDITURE_PURPOSE_CLASSIFICATIONS } from "../shared/fiscal-classifications";
import {
  calculateRoundedPercent,
  convertFiscalAmountToYen,
  parseFiscalInteger,
} from "../shared/utils/parse-fiscal-amount-value";
import {
  buildFiscalAmountRecord,
  type FiscalParserResult,
} from "./fiscal-parser-types";

const FISCAL_YEAR = 2024;

/** 歳出表の1行が持つセル数。当初予算額・構成比・予算現額・構成比・決算額・構成比・執行率。 */
const EXPENDITURE_COLUMN_COUNT = 7;

function compact(value: string): string {
  return value.replace(/\s/g, "");
}

function numericCells(line: string): string[] {
  return line.match(/[△▲-]?\d[\d,]*(?:\.\d+)?/g) ?? [];
}

function parseYenCell(value: string | undefined): bigint | null {
  return value === undefined ? null : parseFiscalInteger(value);
}

type RelevantPages = {
  budgetPageIndex: number;
  expenditurePageIndex: number;
};

type ExpenditureRow = {
  classificationKey: string;
  label: string;
  /** 当初予算額・構成比・予算現額・構成比・決算額・構成比・執行率の7セル。 */
  cells: string[];
  initial: bigint;
  current: bigint;
  actual: bigint;
};

type ExpenditureTable = {
  rows: ExpenditureRow[];
  total: {
    cells: string[];
    initial: bigint;
    current: bigint;
    actual: bigint;
  };
};

function findRelevantPages(pages: string[]): RelevantPages | null {
  const budgetPageIndex = pages.findIndex((page) => {
    const normalized = compact(page);
    return (
      normalized.includes("一般会計の当初予算規模") &&
      normalized.includes("最終予算額")
    );
  });
  const expenditurePageIndex = pages.findIndex((page) => {
    const normalized = compact(page);
    return (
      normalized.includes("当初予算額予算現額決算額") &&
      normalized.includes("１議会費") &&
      normalized.includes("執行率")
    );
  });
  return budgetPageIndex >= 0 && expenditurePageIndex >= 0
    ? { budgetPageIndex, expenditurePageIndex }
    : null;
}

function parseBudgetControlTotals(page: string): {
  initial: bigint | null;
  current: bigint | null;
} {
  const normalized = compact(page);
  const initialSource = normalized.match(
    /一般会計の当初予算規模は([\d,]+)千円/
  )?.[1];
  const currentSource = normalized.match(/最終予算額は([\d,]+)千円/)?.[1];
  return {
    initial: initialSource
      ? convertFiscalAmountToYen(initialSource, "thousand_yen")
      : null,
    current: currentSource
      ? convertFiscalAmountToYen(currentSource, "thousand_yen")
      : null,
  };
}

/**
 * 歳出表の款行を読む。先頭の款番号、数字を含まない款名、続く金額セルに分ける。
 * 公式表の款名に数字は入らないため、最初の数字の手前までを款名として扱う。
 * 番号の全角・半角は表によって変わるため、番号だけ正規化して比較する。
 * 金額セルは空白で区切られているため、空白を除く前の行から取り出す。
 * 空白を除いてから数字を拾うと、隣り合う金額が1つの数字に繋がる。
 */
function parseExpenditureRow(
  line: string
): { index: number; label: string; cells: string[] } | null {
  const trimmed = line.replace(/^[\s　]+/, "");
  const indexSource = trimmed.match(/^([0-9０-９]{1,2})/)?.[1];
  if (!indexSource) return null;
  const index = Number(indexSource.normalize("NFKC"));
  if (!Number.isInteger(index)) return null;
  const rest = trimmed.slice(indexSource.length);
  const labelSource = rest.match(/^([^\d０-９]+)/)?.[1];
  if (!labelSource) return null;
  return {
    index,
    label: compact(labelSource),
    cells: numericCells(rest.slice(labelSource.length)),
  };
}

type ExpenditureTableResult =
  | { status: "columns_changed" }
  | { status: "rows_changed" }
  | { status: "amount_invalid" }
  | { status: "parsed"; table: ExpenditureTable };

function parseExpenditureTable(page: string): ExpenditureTableResult {
  const lines = page.split("\n");
  const totalLine = lines.find((line) => compact(line).startsWith("計"));
  const totalCells = totalLine ? numericCells(totalLine) : [];
  if (totalCells.length !== EXPENDITURE_COLUMN_COUNT) {
    return { status: "columns_changed" };
  }

  // 款は公式表と同じ並び・表記で並ぶ。番号が合わない行や、款名が変わった行は
  // 誤読を避けるため採用せず、そろわなければ表全体を失敗させる。
  const rows: ExpenditureRow[] = [];
  for (const line of lines) {
    const parsed = parseExpenditureRow(line);
    if (!parsed) continue;
    const expected = EXPENDITURE_PURPOSE_CLASSIFICATIONS[parsed.index - 1];
    if (!expected || expected.label !== parsed.label) continue;
    if (parsed.cells.length !== EXPENDITURE_COLUMN_COUNT) {
      return { status: "columns_changed" };
    }
    const initial = parseYenCell(parsed.cells[0]);
    const current = parseYenCell(parsed.cells[2]);
    const actual = parseYenCell(parsed.cells[4]);
    if (initial === null || current === null || actual === null) {
      return { status: "amount_invalid" };
    }
    rows.push({
      classificationKey: expected.key,
      label: expected.label,
      cells: parsed.cells,
      initial,
      current,
      actual,
    });
  }
  if (rows.length !== EXPENDITURE_PURPOSE_CLASSIFICATIONS.length) {
    return { status: "rows_changed" };
  }

  const totalInitial = parseYenCell(totalCells[0]);
  const totalCurrent = parseYenCell(totalCells[2]);
  const totalActual = parseYenCell(totalCells[4]);
  if (totalInitial === null || totalCurrent === null || totalActual === null) {
    return { status: "amount_invalid" };
  }

  return {
    status: "parsed",
    table: {
      rows,
      total: {
        cells: totalCells,
        initial: totalInitial,
        current: totalCurrent,
        actual: totalActual,
      },
    },
  };
}

export function parseMajorMeasures2024(text: string): FiscalParserResult {
  const pages = text.split("\f");
  const normalizedText = compact(text);
  if (
    !normalizedText.includes("令和６年度") ||
    !normalizedText.includes("第１章財政")
  ) {
    return {
      records: [],
      validationSummary: [
        {
          ruleCode: "major_measures_document_identity_mismatch",
          severity: "hard_error",
          message: "令和6年度市政報告書の第1章財政を確認できませんでした",
        },
      ],
    };
  }

  const relevantPages = findRelevantPages(pages);
  if (!relevantPages) {
    return {
      records: [],
      validationSummary: [
        {
          ruleCode: "major_measures_table_schema_missing",
          severity: "hard_error",
          message:
            "一般会計予算推移または歳出決算表の列構造を検出できませんでした",
        },
      ],
    };
  }

  const controlTotals = parseBudgetControlTotals(
    pages[relevantPages.budgetPageIndex] ?? ""
  );
  const parsedTable = parseExpenditureTable(
    pages[relevantPages.expenditurePageIndex] ?? ""
  );
  if (parsedTable.status === "columns_changed") {
    return {
      records: [],
      validationSummary: [
        {
          ruleCode: "major_measures_expenditure_columns_changed",
          severity: "hard_error",
          message: "一般会計歳出表の列数が想定と一致しませんでした",
        },
      ],
    };
  }

  if (parsedTable.status === "rows_changed") {
    return {
      records: [],
      validationSummary: [
        {
          ruleCode: "major_measures_expenditure_rows_changed",
          severity: "hard_error",
          message: "一般会計歳出表の款の並び・名称が想定と一致しませんでした",
        },
      ],
    };
  }

  if (parsedTable.status === "amount_invalid") {
    return {
      records: [],
      validationSummary: [
        {
          ruleCode: "major_measures_amount_invalid",
          severity: "hard_error",
          message: "一般会計または款の金額セルを整数化できませんでした",
        },
      ],
    };
  }
  const { rows, total } = parsedTable.table;

  const validationSummary: FiscalParserResult["validationSummary"] = [];
  if (
    controlTotals.initial !== total.initial ||
    controlTotals.current !== total.current
  ) {
    validationSummary.push({
      ruleCode: "major_measures_budget_control_total_mismatch",
      severity: "hard_error",
      message: "予算推移の本文と歳出表の一般会計合計が一致しません",
    });
  }
  const rowTotalByColumn = {
    initial: rows.reduce((sum, row) => sum + row.initial, 0n),
    current: rows.reduce((sum, row) => sum + row.current, 0n),
    actual: rows.reduce((sum, row) => sum + row.actual, 0n),
  };
  if (
    rowTotalByColumn.initial !== total.initial ||
    rowTotalByColumn.current !== total.current ||
    rowTotalByColumn.actual !== total.actual
  ) {
    validationSummary.push({
      ruleCode: "major_measures_expenditure_control_total_mismatch",
      severity: "hard_error",
      message: "歳出表の款別合計と一般会計合計が一致しません",
    });
  }
  const rateChecks = [
    {
      classificationKey: "total",
      label: "一般会計合計",
      publishedMetricValue: total.cells[6],
      calculatedMetricValue: calculateRoundedPercent(
        total.actual,
        total.current,
        1
      ),
    },
    ...rows.map((row) => ({
      classificationKey: row.classificationKey,
      label: row.label,
      publishedMetricValue: row.cells[6],
      calculatedMetricValue: calculateRoundedPercent(
        row.actual,
        row.current,
        1
      ),
    })),
  ];
  for (const rate of rateChecks) {
    if (rate.calculatedMetricValue === rate.publishedMetricValue) {
      validationSummary.push({
        ruleCode: "major_measures_execution_rate_matched",
        severity: "info",
        message: `${rate.label}の公表執行率と再計算値が一致しました`,
        publishedMetricValue: rate.publishedMetricValue,
        calculatedMetricValue: rate.calculatedMetricValue ?? "",
        classificationKey: rate.classificationKey,
      });
      continue;
    }
    validationSummary.push({
      ruleCode: "major_measures_execution_rate_mismatch",
      severity: "hard_error",
      message: `${rate.label}の決算額と予算現額から算出した執行率が公表値と一致しません`,
      publishedMetricValue: rate.publishedMetricValue,
      calculatedMetricValue: rate.calculatedMetricValue ?? "",
      classificationKey: rate.classificationKey,
    });
  }
  if (
    !validationSummary.some(
      (validation) => validation.severity === "hard_error"
    )
  ) {
    validationSummary.push({
      ruleCode: "major_measures_control_totals_passed",
      severity: "info",
      message: `一般会計合計と${rows.length}款の予算・決算・執行率を突合しました`,
    });
  }

  const sourcePage = relevantPages.expenditurePageIndex + 1;
  const amount = (params: {
    eventKind: "initial_budget" | "available_budget_snapshot" | "settlement";
    decisionStage: "passed" | "not_applicable";
    measure: "expenditure_budget" | "expenditure_actual";
    amountYen: bigint;
    sourceValue: string;
    classification?: { key: string; label: string };
  }) =>
    buildFiscalAmountRecord({
      fiscalYear: FISCAL_YEAR,
      eventKind: params.eventKind,
      decisionStage: params.decisionStage,
      measure: params.measure,
      amountYen: params.amountYen,
      sourceValueText: params.sourceValue,
      sourceValueNumeric: params.amountYen.toString(),
      sourceUnit: "yen",
      sourcePage,
      sourceTable: "一般会計 歳出",
      ...(params.eventKind === "available_budget_snapshot"
        ? { asOfDate: "2025-03-31" }
        : {}),
      ...(params.classification
        ? {
            classificationKey: params.classification.key,
            sourceClassificationLabel: params.classification.label,
          }
        : {}),
    });
  // 公式表と同じ順序で、款ごとに当初予算・予算現額・決算を並べる。
  const records = [
    ...rows.flatMap((row) => [
      amount({
        eventKind: "initial_budget",
        decisionStage: "passed",
        measure: "expenditure_budget",
        amountYen: row.initial,
        sourceValue: row.cells[0],
        classification: { key: row.classificationKey, label: row.label },
      }),
      amount({
        eventKind: "available_budget_snapshot",
        decisionStage: "not_applicable",
        measure: "expenditure_budget",
        amountYen: row.current,
        sourceValue: row.cells[2],
        classification: { key: row.classificationKey, label: row.label },
      }),
      amount({
        eventKind: "settlement",
        decisionStage: "not_applicable",
        measure: "expenditure_actual",
        amountYen: row.actual,
        sourceValue: row.cells[4],
        classification: { key: row.classificationKey, label: row.label },
      }),
    ]),
    amount({
      eventKind: "initial_budget",
      decisionStage: "passed",
      measure: "expenditure_budget",
      amountYen: total.initial,
      sourceValue: total.cells[0],
    }),
    amount({
      eventKind: "available_budget_snapshot",
      decisionStage: "not_applicable",
      measure: "expenditure_budget",
      amountYen: total.current,
      sourceValue: total.cells[2],
    }),
    amount({
      eventKind: "settlement",
      decisionStage: "not_applicable",
      measure: "expenditure_actual",
      amountYen: total.actual,
      sourceValue: total.cells[4],
    }),
  ];
  return { records, validationSummary };
}
