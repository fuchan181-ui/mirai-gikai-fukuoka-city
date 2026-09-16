import type {
  FiscalDecisionStage,
  FiscalEventKind,
  FiscalMeasure,
} from "../types/fiscal-amount";

export const FISCAL_EVENT_KIND_LABELS: Record<FiscalEventKind, string> = {
  initial_budget: "当初予算",
  available_budget_snapshot: "年度末の予算現額",
  settlement: "決算",
};

export const FISCAL_DECISION_STAGE_LABELS: Record<FiscalDecisionStage, string> =
  {
    proposed: "提案中",
    passed: "可決",
    not_applicable: "",
  };

export const FISCAL_MEASURE_LABELS: Record<FiscalMeasure, string> = {
  revenue_budget: "歳入（予算）",
  expenditure_budget: "歳出（予算）",
  revenue_actual: "歳入（決算）",
  expenditure_actual: "歳出（決算）",
};
