import { describe, expect, it } from "vitest";
import { findFiscalClassificationDescription } from "./fiscal-classification-descriptions";

/** 取り込み済みの分類キー。分類を増やしたのに説明を忘れると、このテストが落ちる。 */
const EXPENDITURE_KEYS = [
  "council_expense",
  "general_affairs",
  "welfare",
  "public_health",
  "labor",
  "agriculture_forestry_fisheries",
  "commerce_and_industry",
  "civil_engineering",
  "fire_service",
  "education",
  "disaster_recovery",
  "debt_service",
  "reserve_fund",
];

const REVENUE_KEYS = [
  "city_tax",
  "local_transfer_tax",
  "interest_portion_grant",
  "dividend_portion_grant",
  "capital_gains_portion_grant",
  "corporate_business_tax_grant",
  "local_consumption_tax_grant",
  "golf_course_tax_grant",
  "environmental_performance_grant",
  "national_property_grant",
  "local_special_grant",
  "local_allocation_tax",
  "traffic_safety_grant",
  "contributions",
  "fees_and_charges",
  "national_treasury_disbursements",
  "prefectural_treasury_disbursements",
  "property_revenue",
  "donations",
  "transfers_in",
  "carryover_funds",
  "miscellaneous_revenue",
  "municipal_bonds",
  "automobile_acquisition_tax_grant",
];

describe("findFiscalClassificationDescription", () => {
  it("歳出の款すべてに説明がある", () => {
    for (const key of EXPENDITURE_KEYS) {
      const description = findFiscalClassificationDescription(key);
      expect(description, key).not.toBeNull();
      expect(description?.length ?? 0).toBeGreaterThan(10);
    }
  });

  it("歳入の項目すべてに説明がある", () => {
    for (const key of REVENUE_KEYS) {
      const description = findFiscalClassificationDescription(key);
      expect(description, key).not.toBeNull();
      expect(description?.length ?? 0).toBeGreaterThan(10);
    }
  });

  it("説明に金額や割合を書かない", () => {
    for (const key of [...EXPENDITURE_KEYS, ...REVENUE_KEYS]) {
      const description = findFiscalClassificationDescription(key) ?? "";
      expect(description, key).not.toMatch(/\d/);
    }
  });

  it("対応表に無いキーは null を返す", () => {
    expect(findFiscalClassificationDescription("unknown_key")).toBeNull();
  });
});
