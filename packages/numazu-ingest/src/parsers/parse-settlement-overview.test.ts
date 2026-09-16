import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findFiscalSourceProfile } from "../shared/fiscal-source-profiles";
import { parseFiscalDocument } from "./parse-fiscal-document";
import { parseSettlementOverview } from "./parse-settlement-overview";

const fixture = readFileSync(
  new URL(
    "./__fixtures__/fiscal-settlement-overview-2024-layout.txt",
    import.meta.url
  ),
  "utf8"
);
/** 令和2年度は金額が款名より前に印字される。 */
const fixture2020 = readFileSync(
  new URL(
    "./__fixtures__/fiscal-settlement-overview-2020-layout.txt",
    import.meta.url
  ),
  "utf8"
);
/** 令和5年度の歳入は千円の位を持たない「902 億 8,042 万円」表記で印字される。 */
const fixture2023 = readFileSync(
  new URL(
    "./__fixtures__/fiscal-settlement-overview-2023-layout.txt",
    import.meta.url
  ),
  "utf8"
);

describe("parseSettlementOverview", () => {
  it("一般会計の千円単位の歳入・歳出決算額を比較用根拠として抽出する", () => {
    const result = parseSettlementOverview(fixture, 2024);

    expect(result.records).toHaveLength(2);
    expect(
      result.records.map((record) => ({
        amountYen: record.parsedPayload.amountYen,
        measure: record.parsedPayload.measure,
        precision: record.parsedPayload.sourcePrecisionYen,
        evidenceRole: record.parsedPayload.evidenceRole,
        tolerance: record.parsedPayload.comparisonToleranceYen,
      }))
    ).toEqual([
      {
        amountYen: "96520466000",
        measure: "revenue_actual",
        precision: 1000,
        evidenceRole: "corroborating",
        tolerance: 500,
      },
      {
        amountYen: "92736569000",
        measure: "expenditure_actual",
        precision: 1000,
        evidenceRole: "corroborating",
        tolerance: 500,
      },
    ]);
    expect(result.records[0]?.validationResults).toContainEqual(
      expect.objectContaining({
        ruleCode: "settlement_overview_rounded_to_thousand_yen",
        severity: "info",
      })
    );
    expect(result.validationSummary).not.toContainEqual(
      expect.objectContaining({ severity: "hard_error" })
    );
  });

  it("令和2年度の款名より前に金額が印字される様式も読み取る", () => {
    const result = parseSettlementOverview(fixture2020, 2020);

    expect(result.records.map((record) => record.parsedPayload)).toMatchObject([
      {
        fiscalYear: 2020,
        measure: "revenue_actual",
        amountYen: "97191082000",
        sourceValueText: "971億9,108万2千円",
      },
      {
        fiscalYear: 2020,
        measure: "expenditure_actual",
        amountYen: "95394558000",
        sourceValueText: "953億9,455万8千円",
      },
    ]);
  });

  it("令和5年度の万円までで終わる歳入額も千円単位で確定する", () => {
    const result = parseSettlementOverview(fixture2023, 2023);

    expect(result.records.map((record) => record.parsedPayload)).toMatchObject([
      {
        fiscalYear: 2023,
        measure: "revenue_actual",
        amountYen: "90280420000",
        sourceValueText: "902億8,042万円",
      },
      {
        fiscalYear: 2023,
        measure: "expenditure_actual",
        amountYen: "87300912000",
        sourceValueText: "873億91万2千円",
      },
    ]);
    expect(result.validationSummary.every((v) => v.severity === "info")).toBe(
      true
    );
  });

  it("profileの年度と資料の年度が違えば値を返さず失敗する", () => {
    const result = parseSettlementOverview(fixture, 2023);

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "settlement_overview_schema_missing",
        severity: "hard_error",
      })
    );
  });

  it("資料見出しや金額構造が変わった場合は値を返さず失敗する", () => {
    const result = parseSettlementOverview(
      fixture.replace("令和６年度", "令和７年度"),
      2024
    );

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "settlement_overview_schema_missing",
        severity: "hard_error",
      })
    );
  });

  it("金額の単位が想定外なら値を返さず失敗する", () => {
    const result = parseSettlementOverview(
      fixture.replace("3,656 万 9 千円", "3,656 万 900 百円"),
      2024
    );

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "settlement_overview_amounts_invalid",
        severity: "hard_error",
      })
    );
  });

  it("対応していない小数付きの金額は下位桁だけを拾わず値を返さず失敗する", () => {
    // 一部だけを切り出すと、誤った小さい金額を検証通過させてしまう。
    const result = parseSettlementOverview(
      fixture.replace("965 億", "965.5 億"),
      2024
    );

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "settlement_overview_amounts_invalid",
        severity: "hard_error",
      })
    );
  });

  it("千円未満を含む金額は丸めず値を返さず失敗する", () => {
    // 表示単位が千円の資料なので、千円未満は切り捨てず根拠として採用しない。
    const result = parseSettlementOverview(
      fixture.replace("3,656 万 9 千円", "3,656 万 123 円"),
      2024
    );

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "settlement_overview_amounts_invalid",
        severity: "hard_error",
      })
    );
  });

  it("決算概要profileから令和5年度の決算額を抽出する", () => {
    const profile = findFiscalSourceProfile("settlement-overview-2023");
    if (!profile) throw new Error("test profile missing");
    const result = parseFiscalDocument({ profile, text: fixture2023 });

    expect(
      result.records.map((record) => record.parsedPayload.amountYen)
    ).toEqual(["90280420000", "87300912000"]);
    expect(
      result.records.every(
        (record) =>
          record.parsedPayload.eventKind === "settlement" &&
          record.parsedPayload.decisionStage === "not_applicable"
      )
    ).toBe(true);
  });
});
