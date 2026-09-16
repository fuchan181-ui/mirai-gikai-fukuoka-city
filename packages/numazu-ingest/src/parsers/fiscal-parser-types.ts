import type { ParsedFiscalStagingRecord } from "../shared/utils/build-fiscal-staging";

export type FiscalParserValidation = {
  ruleCode: string;
  severity: "hard_error" | "warning" | "info";
  message: string;
  publishedMetricValue?: string;
  calculatedMetricValue?: string;
  classificationKey?: string;
};

export type FiscalParserResult = {
  records: ParsedFiscalStagingRecord[];
  validationSummary: FiscalParserValidation[];
};

export type FiscalAmountRecordParams = {
  fiscalYear: number;
  eventKind: "initial_budget" | "available_budget_snapshot" | "settlement";
  decisionStage: "proposed" | "passed" | "not_applicable";
  measure:
    | "revenue_budget"
    | "expenditure_budget"
    | "revenue_actual"
    | "expenditure_actual";
  amountYen: bigint;
  sourceValueText: string;
  sourceValueNumeric: string;
  sourceUnit: "yen" | "thousand_yen";
  sourcePage: number;
  sourceTable: string;
  classificationKey?: string;
  sourceClassificationLabel?: string;
  sourcePrecisionYen?: number;
  asOfDate?: string;
  evidenceRole?: "primary" | "corroborating";
  comparisonToleranceYen?: number;
  validationResults?: FiscalParserValidation[];
};

export function buildFiscalAmountRecord(
  params: FiscalAmountRecordParams
): ParsedFiscalStagingRecord {
  const classificationKey = params.classificationKey ?? "total";
  return {
    recordKind: "amount",
    sourceRecordKey: [
      params.fiscalYear,
      "general-account",
      params.eventKind,
      params.decisionStage,
      classificationKey,
      params.measure,
    ].join(":"),
    parsedPayload: {
      accountCode: "general",
      amountYen: params.amountYen.toString(),
      asOfDate: params.asOfDate ?? null,
      classificationKey: params.classificationKey ?? null,
      classificationScheme: params.classificationKey ? "purpose" : null,
      comparisonToleranceYen: params.comparisonToleranceYen ?? 0,
      decisionStage: params.decisionStage,
      evidenceRole: params.evidenceRole ?? "primary",
      eventKind: params.eventKind,
      fiscalYear: params.fiscalYear,
      measure: params.measure,
      reportingScopeCode: "general_account",
      sourceClassificationLabel: params.sourceClassificationLabel ?? null,
      sourcePage: params.sourcePage.toString(),
      sourcePrecisionYen: params.sourcePrecisionYen ?? 1,
      sourceTable: params.sourceTable,
      sourceUnit: params.sourceUnit,
      sourceValueNumeric: params.sourceValueNumeric,
      sourceValueText: params.sourceValueText,
    },
    validationResults: params.validationResults ?? [],
  };
}
