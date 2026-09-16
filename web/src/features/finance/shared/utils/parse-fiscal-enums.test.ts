import { describe, expect, it } from "vitest";
import {
  SUPPORTED_EVENT_KINDS,
  SUPPORTED_MEASURES,
  toFiscalDecisionStage,
  toFiscalEventKind,
  toFiscalMeasure,
} from "./parse-fiscal-enums";

describe("toFiscalEventKind", () => {
  it("この画面で扱う種別だけを返す", () => {
    expect(toFiscalEventKind("initial_budget")).toBe("initial_budget");
    expect(toFiscalEventKind("available_budget_snapshot")).toBe(
      "available_budget_snapshot"
    );
    expect(toFiscalEventKind("settlement")).toBe("settlement");
  });

  it("対象外の種別と未知の値は null にする", () => {
    expect(toFiscalEventKind("supplementary_budget")).toBeNull();
    expect(toFiscalEventKind("current_snapshot")).toBeNull();
    expect(toFiscalEventKind("unknown_kind")).toBeNull();
  });

  it("対象外の種別は読み込み対象にも含めない", () => {
    expect(SUPPORTED_EVENT_KINDS).not.toContain("supplementary_budget");
    expect(SUPPORTED_EVENT_KINDS).not.toContain("current_snapshot");
  });
});

describe("toFiscalDecisionStage", () => {
  it("議決段階をそのまま返す", () => {
    expect(toFiscalDecisionStage("proposed")).toBe("proposed");
    expect(toFiscalDecisionStage("passed")).toBe("passed");
    expect(toFiscalDecisionStage("not_applicable")).toBe("not_applicable");
  });

  it("未知の値は null にする", () => {
    expect(toFiscalDecisionStage("rejected")).toBeNull();
  });
});

describe("toFiscalMeasure", () => {
  it("歳入・歳出と予算・決算の4種類を返す", () => {
    expect(toFiscalMeasure("revenue_budget")).toBe("revenue_budget");
    expect(toFiscalMeasure("expenditure_budget")).toBe("expenditure_budget");
    expect(toFiscalMeasure("revenue_actual")).toBe("revenue_actual");
    expect(toFiscalMeasure("expenditure_actual")).toBe("expenditure_actual");
  });

  it("内訳として並べられない値は null にする", () => {
    expect(toFiscalMeasure("expenditure_budget_delta")).toBeNull();
    expect(toFiscalMeasure("expenditure_budget_after")).toBeNull();
    expect(toFiscalMeasure("asset")).toBeNull();
    expect(toFiscalMeasure("liability")).toBeNull();
  });

  it("対象外の値は読み込み対象にも含めない", () => {
    expect(SUPPORTED_MEASURES).not.toContain("expenditure_budget_delta");
    expect(SUPPORTED_MEASURES).toHaveLength(4);
  });
});
