import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findFiscalSourceProfile } from "../shared/fiscal-source-profiles";
import {
  parseCouncilBudget,
  parseGeneralBudget,
} from "./parse-budget-overview";
import { parseFiscalDocument } from "./parse-fiscal-document";

const general = readFileSync(
  new URL("./__fixtures__/budget-2026-general.txt", import.meta.url),
  "utf8"
);
const council = readFileSync(
  new URL("./__fixtures__/budget-2026-council.txt", import.meta.url),
  "utf8"
);
/** 令和6年度は数字と記号がCJK統合漢字拡張Aへ誤写像された状態で出力される。 */
const misencodedGeneral = readFileSync(
  new URL("./__fixtures__/budget-2024-general.txt", import.meta.url),
  "utf8"
);
/** 令和5年度の議会費は事業費が2費目あり、費目名に数字を含む。 */
const council2023 = readFileSync(
  new URL("./__fixtures__/budget-2023-council.txt", import.meta.url),
  "utf8"
);

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
];

function sumYen(
  records: readonly { parsedPayload: { [key: string]: unknown } }[]
): bigint {
  return records.reduce(
    (total, record) => total + BigInt(String(record.parsedPayload.amountYen)),
    0n
  );
}

describe("令和8年度予算概要", () => {
  it("原金額表記と公表指標を保持する", () => {
    expect(
      parseGeneralBudget(general, 2026).records[2]?.parsedPayload
    ).toMatchObject({
      sourceValueText: "469,887",
      publishedMetrics: { compositionRatio: "0.5", changeRate: "2.2" },
    });
    expect(
      parseCouncilBudget(council, 2026).records[0]?.parsedPayload
        .sourceValueText
    ).toBe("469,887");
  });
  it("ページ追加を誤った出典ページで受け入れない", () => {
    expect(parseGeneralBudget(`\f${general}`, 2026).records).toEqual([]);
    expect(parseCouncilBudget(`表紙\f${council}`, 2026).records).toEqual([]);
  });
  it("行内差額が正しくても款別集計または歳入歳出が一致しなければ拒否する", () => {
    const taxChanged = general
      .replace("35,500,000", "35,500,001")
      .replace("200,000 千円", "200,001 千円");
    expect(parseGeneralBudget(taxChanged, 2026).records).toEqual([]);
    const revenueChanged = taxChanged
      .replace("95,650,000", "95,650,001")
      .replace(/50,000(\s+0\.1)/, "50,001$1");
    expect(parseGeneralBudget(revenueChanged, 2026).records).toEqual([]);
  });
  it.each([
    general.replace("35,500,000 千円", "35,500,000 123 千円"),
    general.replace("35,500,000 千円", "千円"),
    general.replace(/\n\s*2 {3}地/, "\n 1   地"),
    general.replace(/^.*35,500,000.*\n/m, ""),
  ])("数値列・款の追加や欠落を拒否する", (changed) => {
    expect(changed).not.toBe(general);
    expect(parseGeneralBudget(changed, 2026).records).toEqual([]);
  });
  it("歳入23款・歳出13款を款別内訳として提案候補に展開する", () => {
    const profile = findFiscalSourceProfile(
      "budget-overview-2026-general-account"
    );
    if (!profile) throw new Error("test profile missing");
    const result = parseFiscalDocument({ profile, text: general });
    expect(result.records).toHaveLength(38);

    const totals = result.records.slice(0, 2).map((row) => row.parsedPayload);
    expect(totals).toMatchObject([
      {
        measure: "revenue_budget",
        amountYen: "95650000000",
        classificationKey: null,
        sourcePage: "1",
      },
      {
        measure: "expenditure_budget",
        amountYen: "95650000000",
        classificationKey: null,
        sourcePage: "2",
      },
    ]);

    const expenditure = result.records.slice(2, 15);
    expect(
      expenditure.map((row) => row.parsedPayload.classificationKey)
    ).toEqual(EXPENDITURE_KEYS);
    expect(
      expenditure.every(
        (row) =>
          row.parsedPayload.classificationScheme === "purpose" &&
          row.parsedPayload.measure === "expenditure_budget" &&
          row.parsedPayload.sourcePage === "2" &&
          row.parsedPayload.sourceUnit === "thousand_yen" &&
          row.parsedPayload.sourcePrecisionYen === 1000
      )
    ).toBe(true);
    expect(expenditure[0]?.parsedPayload.sourceClassificationLabel).toBe(
      "議会費"
    );
    expect(expenditure[0]?.parsedPayload.amountYen).toBe("469887000");
    expect(expenditure[1]?.parsedPayload.amountYen).toBe("12486809000");

    const revenue = result.records.slice(15);
    expect(revenue).toHaveLength(23);
    expect(revenue.map((row) => row.parsedPayload.classificationKey)).toEqual(
      REVENUE_KEYS
    );
    expect(
      revenue.every(
        (row) =>
          row.parsedPayload.classificationScheme === "revenue_source" &&
          row.parsedPayload.measure === "revenue_budget" &&
          row.parsedPayload.sourcePage === "1"
      )
    ).toBe(true);
    expect(revenue[0]?.parsedPayload).toMatchObject({
      classificationKey: "city_tax",
      sourceClassificationLabel: "市税",
      amountYen: "35500000000",
    });
    expect(revenue[22]?.parsedPayload).toMatchObject({
      classificationKey: "municipal_bonds",
      sourceClassificationLabel: "市債",
      amountYen: "9569500000",
    });

    // 款別内訳の単純合計が公式の歳入・歳出合計と一致する。
    expect(sumYen(expenditure)).toBe(95650000000n);
    expect(sumYen(revenue)).toBe(95650000000n);

    const keys = result.records.map((row) => row.sourceRecordKey);
    expect(new Set(keys).size).toBe(result.records.length);
    expect(
      result.records.every(
        (row) => row.parsedPayload.decisionStage === "proposed"
      )
    ).toBe(true);
    expect(result.validationSummary.every((v) => v.severity === "info")).toBe(
      true
    );
  });
  it("議会費の重複する階層を1件の比較根拠にする", () => {
    const profile = findFiscalSourceProfile(
      "budget-overview-2026-council-expense"
    );
    if (!profile) throw new Error("test profile missing");
    const result = parseFiscalDocument({ profile, text: council });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.parsedPayload).toMatchObject({
      amountYen: "469887000",
      evidenceRole: "corroborating",
      decisionStage: "proposed",
    });
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "council_budget_year_from_profile",
        severity: "warning",
      })
    );
  });
  it.each([
    ["年度", "令和８年度", "令和９年度"],
    ["単位", "千円", "百万円"],
    ["列見出し", "増 減     率", "変更列"],
    ["款別金額", "35,500,000", "35,500,001"],
    ["総額", "95,650,000", "95,650,001"],
    ["前年度", "35,300,000", "35,300,001"],
  ])("一般会計の%s不整合をhard errorにする", (_name, from, to) => {
    const changed = general.replaceAll(from, to);
    expect(changed).not.toBe(general);
    const result = parseGeneralBudget(changed, 2026);
    expect(result.records).toEqual([]);
    expect(result.validationSummary[0]?.severity).toBe("hard_error");
  });
  it.each([
    ["合計", "469,887", "469,888"],
    ["内訳", "418,900", "418,901"],
    ["小数表記", "418,900", "418,900.5"],
    ["不明な接尾辞", "418,900", "418,900万円"],
    ["事業費", "5,161", "5,162"],
    ["単位", "千円", "円"],
  ])("議会費の%s不整合をhard errorにする", (_name, from, to) => {
    const changed = council.replace(from, to);
    expect(changed).not.toBe(council);
    const result = parseCouncilBudget(changed, 2026);
    expect(result.records).toEqual([]);
    expect(result.validationSummary[0]?.severity).toBe("hard_error");
  });
  it("異なる資料は受け付けない", () => {
    expect(parseCouncilBudget(general, 2026).records).toEqual([]);
    expect(parseGeneralBudget(council, 2026).records).toEqual([]);
  });
});

describe("年度別の予算概要", () => {
  it("令和6年度の誤写像PDFを解析前に補正して全款を抽出する", () => {
    const profile = findFiscalSourceProfile(
      "budget-overview-2024-general-account"
    );
    if (!profile) throw new Error("test profile missing");
    const result = parseFiscalDocument({
      profile,
      text: misencodedGeneral,
    });

    expect(result.records).toHaveLength(38);
    expect(result.records[0]?.parsedPayload).toMatchObject({
      fiscalYear: 2024,
      amountYen: "87960000000",
      sourceValueText: "87,960,000",
    });
    expect(result.records[2]?.parsedPayload).toMatchObject({
      classificationKey: "council_expense",
      amountYen: "460162000",
    });
    expect(
      result.records.every((row) => row.parsedPayload.fiscalYear === 2024)
    ).toBe(true);
    expect(result.validationSummary.every((v) => v.severity === "info")).toBe(
      true
    );
  });
  it("補正しない誤写像PDFは年度と款別表を確認できず失敗する", () => {
    const result = parseGeneralBudget(misencodedGeneral, 2024);
    expect(result.records).toEqual([]);
    expect(result.validationSummary[0]).toMatchObject({
      ruleCode: "budget_overview_validation_failed",
      severity: "hard_error",
    });
  });
  it("profileの年度と資料の年度が違えば静かに誤読せず失敗する", () => {
    expect(parseGeneralBudget(general, 2025).records).toEqual([]);
    expect(parseGeneralBudget(misencodedGeneral, 2025).records).toEqual([]);
  });
  it("令和5年度の議会費は事業費2費目を突合して1件にする", () => {
    const result = parseCouncilBudget(council2023, 2023);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.parsedPayload).toMatchObject({
      fiscalYear: 2023,
      amountYen: "475299000",
      sourceValueText: "475,299",
      evidenceRole: "corroborating",
    });
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "council_budget_totals_passed",
        severity: "info",
        message: expect.stringContaining("事業費2件"),
      })
    );
  });
  it("年度印字のない議会費はprofileの年度で候補にする", () => {
    const profile = findFiscalSourceProfile(
      "budget-overview-2023-council-expense"
    );
    if (!profile) throw new Error("test profile missing");
    const result = parseFiscalDocument({ profile, text: council2023 });
    expect(result.records[0]?.parsedPayload.fiscalYear).toBe(2023);
    expect(result.records[0]?.parsedPayload.amountYen).toBe("475299000");
  });
});
