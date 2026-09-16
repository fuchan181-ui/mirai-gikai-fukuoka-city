import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fiscalSourceProfiles } from "../shared/fiscal-source-profiles";
import {
  parseCouncilBudget2026,
  parseGeneralBudget2026,
} from "./parse-budget-overview-2026";
import { parseFiscalDocument } from "./parse-fiscal-document";

const general = readFileSync(
  new URL("./__fixtures__/budget-2026-general.txt", import.meta.url),
  "utf8"
);
const council = readFileSync(
  new URL("./__fixtures__/budget-2026-council.txt", import.meta.url),
  "utf8"
);

describe("令和8年度予算概要", () => {
  it("原金額表記と公表指標を保持する", () => {
    expect(
      parseGeneralBudget2026(general).records[2]?.parsedPayload
    ).toMatchObject({
      sourceValueText: "469,887",
      publishedMetrics: { compositionRatio: "0.5", changeRate: "2.2" },
    });
    expect(
      parseCouncilBudget2026(council).records[0]?.parsedPayload.sourceValueText
    ).toBe("469,887");
  });
  it("ページ追加を誤った出典ページで受け入れない", () => {
    expect(parseGeneralBudget2026(`\f${general}`).records).toEqual([]);
    expect(parseCouncilBudget2026(`表紙\f${council}`).records).toEqual([]);
  });
  it("行内差額が正しくても款別集計または歳入歳出が一致しなければ拒否する", () => {
    const taxChanged = general
      .replace("35,500,000", "35,500,001")
      .replace("200,000 千円", "200,001 千円");
    expect(parseGeneralBudget2026(taxChanged).records).toEqual([]);
    const revenueChanged = taxChanged
      .replace("95,650,000", "95,650,001")
      .replace(/50,000(\s+0\.1)/, "50,001$1");
    expect(parseGeneralBudget2026(revenueChanged).records).toEqual([]);
  });
  it.each([
    general.replace("35,500,000 千円", "35,500,000 123 千円"),
    general.replace("35,500,000 千円", "千円"),
    general.replace(/\n\s*2 {3}地/, "\n 1   地"),
    general.replace(/^.*35,500,000.*\n/m, ""),
  ])("数値列・款の追加や欠落を拒否する", (changed) => {
    expect(changed).not.toBe(general);
    expect(parseGeneralBudget2026(changed).records).toEqual([]);
  });
  it("歳入歳出と議会費の千円額を円単位の提案候補として抽出する", () => {
    const result = parseFiscalDocument({
      profile: fiscalSourceProfiles[0],
      text: general,
    });
    expect(result.records.map((r) => r.parsedPayload.amountYen)).toEqual([
      "95650000000",
      "95650000000",
      "469887000",
    ]);
    expect(result.records.map((r) => r.parsedPayload.measure)).toEqual([
      "revenue_budget",
      "expenditure_budget",
      "expenditure_budget",
    ]);
    expect(
      result.records.every((r) => r.parsedPayload.decisionStage === "proposed")
    ).toBe(true);
    expect(result.records[2]?.parsedPayload).toMatchObject({
      sourcePage: "2",
      sourceUnit: "thousand_yen",
      classificationKey: "council_expense",
    });
    expect(result.validationSummary.every((v) => v.severity === "info")).toBe(
      true
    );
  });
  it("議会費の重複する階層を1件の比較根拠にする", () => {
    const result = parseFiscalDocument({
      profile: fiscalSourceProfiles[1],
      text: council,
    });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.parsedPayload).toMatchObject({
      amountYen: "469887000",
      evidenceRole: "corroborating",
      decisionStage: "proposed",
    });
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "budget_2026_year_from_profile",
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
    const result = parseGeneralBudget2026(changed);
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
    const result = parseCouncilBudget2026(changed);
    expect(result.records).toEqual([]);
    expect(result.validationSummary[0]?.severity).toBe("hard_error");
  });
  it("異なる資料は受け付けない", () => {
    expect(parseCouncilBudget2026(general).records).toEqual([]);
    expect(parseGeneralBudget2026(council).records).toEqual([]);
  });
});
