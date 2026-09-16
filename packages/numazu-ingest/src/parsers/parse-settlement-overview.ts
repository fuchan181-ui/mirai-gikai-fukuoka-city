import { formatFiscalYearLabel } from "../shared/utils/fiscal-year-label";
import { compactFiscalText as compact } from "../shared/utils/compact-fiscal-text";
import { parseJapaneseAmountToYen } from "../shared/utils/parse-fiscal-amount-value";
import {
  buildFiscalAmountRecord,
  type FiscalParserValidation,
  type FiscalParserResult,
} from "./fiscal-parser-types";

function failure(ruleCode: string, message: string): FiscalParserResult {
  return {
    records: [],
    validationSummary: [{ ruleCode, severity: "hard_error", message }],
  };
}

/**
 * 決算概要の金額は「857億5,472万2千円」のように漢字の単位で印字される。
 * 一部でも取りこぼすと桁の小さい金額を黙って採用してしまうため、
 * 小数点を含む表記も丸ごと1件として切り出し、対応可否は
 * parseJapaneseAmountToYen の完全一致判定に委ねる。
 */
const JAPANESE_AMOUNT_PATTERN =
  /[△▲-]?\d[\d,]*(?:\.\d+)?(?:[億万千][\d,]*(?:\.\d+)?)*円/g;

type GeneralAccountActuals = {
  revenueText: string;
  revenueYen: bigint;
  expenditureText: string;
  expenditureYen: bigint;
};

/**
 * 一般会計の歳入・歳出決算額を読む。令和2・3年度は金額が款名より前に印字され、
 * 令和4年度以降は款名の後に印字されるため、並び順に依存せず概要欄の金額2件を
 * 歳入・歳出の順に採用する。前年度比の括弧内は比較値なので取り除く。
 * 概要欄の終わりは歳入の内訳を示す「（１）」の見出しで判定する。この見出しは
 * 年度によって「（１）歳入」の並びが崩れて印字されるため、番号だけで区切る。
 */
function parseGeneralAccountActuals(
  page: string
): GeneralAccountActuals | null {
  const normalized = compact(page);
  const summaryEnd = normalized.indexOf("(1)");
  const summaryStart = normalized.lastIndexOf("一般会計", summaryEnd);
  if (summaryEnd < 0 || summaryStart < 0) return null;
  const summary = normalized
    .slice(summaryStart + "一般会計".length, summaryEnd)
    .replace(/\([^)]*\)/g, "");
  const amounts = summary.match(JAPANESE_AMOUNT_PATTERN) ?? [];
  if (amounts.length !== 2) return null;
  const [revenueText = "", expenditureText = ""] = amounts;
  const revenueYen = parseJapaneseAmountToYen(revenueText);
  const expenditureYen = parseJapaneseAmountToYen(expenditureText);
  if (revenueYen === null || expenditureYen === null) return null;
  return {
    revenueText,
    revenueYen,
    expenditureText,
    expenditureYen,
  };
}

export function parseSettlementOverview(
  text: string,
  fiscalYear: number
): FiscalParserResult {
  const fiscalYearLabel = formatFiscalYearLabel(fiscalYear);
  const pages = text.split("\f");
  const pageIndex = pages.findIndex((page) => {
    const normalized = compact(page);
    return (
      normalized.includes(`${fiscalYearLabel}沼津市一般会計等の決算の概要`) &&
      // 見出しは全角数字で印字されるため、NFKC正規化後の半角表記で照合する。
      normalized.includes("1一般会計")
    );
  });
  if (pageIndex < 0) {
    return failure(
      "settlement_overview_schema_missing",
      `${fiscalYearLabel}決算概要の一般会計見出しを検出できませんでした`
    );
  }

  const actuals = parseGeneralAccountActuals(pages[pageIndex] ?? "");
  if (
    !actuals ||
    actuals.revenueYen % 1_000n !== 0n ||
    actuals.expenditureYen % 1_000n !== 0n
  ) {
    return failure(
      "settlement_overview_amounts_invalid",
      "一般会計の歳入・歳出決算額を千円単位で確定できませんでした"
    );
  }

  const roundedValidation: FiscalParserValidation = {
    ruleCode: "settlement_overview_rounded_to_thousand_yen",
    severity: "info",
    message: "概要資料の表示値は千円未満を丸めた比較用根拠です",
  };
  const amount = (params: {
    measure: "revenue_actual" | "expenditure_actual";
    sourceValueText: string;
    amountYen: bigint;
  }) =>
    buildFiscalAmountRecord({
      fiscalYear,
      eventKind: "settlement",
      decisionStage: "not_applicable",
      measure: params.measure,
      amountYen: params.amountYen,
      sourceValueText: params.sourceValueText,
      sourceValueNumeric: (params.amountYen / 1_000n).toString(),
      sourceUnit: "thousand_yen",
      sourcePrecisionYen: 1_000,
      evidenceRole: "corroborating",
      comparisonToleranceYen: 500,
      sourcePage: pageIndex + 1,
      sourceTable: "一般会計 決算概要",
      validationResults: [roundedValidation],
    });

  return {
    records: [
      amount({
        measure: "revenue_actual",
        sourceValueText: actuals.revenueText,
        amountYen: actuals.revenueYen,
      }),
      amount({
        measure: "expenditure_actual",
        sourceValueText: actuals.expenditureText,
        amountYen: actuals.expenditureYen,
      }),
    ],
    validationSummary: [
      {
        ruleCode: "settlement_overview_amounts_detected",
        severity: "info",
        message: "一般会計の歳入・歳出決算額を検出しました",
      },
    ],
  };
}
