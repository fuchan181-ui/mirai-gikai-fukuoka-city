import type {
  FiscalDecisionStage,
  FiscalEventKind,
  FiscalMeasure,
} from "../types/fiscal-amount";

/**
 * DB の enum 値を、この画面で扱える値に読み替える。
 * 補正予算や資産・負債など、この画面が対象にしない値は null を返す。
 * DB に値が増えてもページを落とさず、その行だけを読み飛ばすため。
 */
export function toFiscalEventKind(value: string): FiscalEventKind | null {
  if (
    value === "initial_budget" ||
    value === "available_budget_snapshot" ||
    value === "settlement"
  ) {
    return value;
  }
  return null;
}

export function toFiscalDecisionStage(
  value: string
): FiscalDecisionStage | null {
  if (
    value === "proposed" ||
    value === "passed" ||
    value === "not_applicable"
  ) {
    return value;
  }
  return null;
}

export function toFiscalMeasure(value: string): FiscalMeasure | null {
  if (
    value === "revenue_budget" ||
    value === "expenditure_budget" ||
    value === "revenue_actual" ||
    value === "expenditure_actual"
  ) {
    return value;
  }
  return null;
}

/**
 * この画面が扱うイベント種別。補正予算と現計予算額は、当初予算や決算とは
 * 別の見せ方が必要になるため、読み込む段階で外す。
 */
export const SUPPORTED_EVENT_KINDS: FiscalEventKind[] = [
  "initial_budget",
  "available_budget_snapshot",
  "settlement",
];

/**
 * この画面が扱う金額の意味。補正差額や資産・負債は款別の内訳として
 * 並べられないため、読み込む段階で外す。
 */
export const SUPPORTED_MEASURES: FiscalMeasure[] = [
  "revenue_budget",
  "expenditure_budget",
  "revenue_actual",
  "expenditure_actual",
];
