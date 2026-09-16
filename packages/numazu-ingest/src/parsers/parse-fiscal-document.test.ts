import { describe, expect, it } from "vitest";
import { findFiscalSourceProfile } from "../shared/fiscal-source-profiles";
import { parseFiscalDocument } from "./parse-fiscal-document";

function requireProfile(profileKey: string) {
  const profile = findFiscalSourceProfile(profileKey);
  if (!profile) throw new Error(`test profile missing: ${profileKey}`);
  return profile;
}

describe("parseFiscalDocument", () => {
  it("metadata_only profileでは金額候補を作らない", () => {
    const result = parseFiscalDocument({
      profile: {
        ...requireProfile("budget-overview-2026-general-account"),
        parserKind: "metadata_only",
      },
      text: "令和8年度 一般会計",
    });

    expect(result).toEqual({ records: [], validationSummary: [] });
  });

  it("決算概要profileを対応parserへ渡す", () => {
    const result = parseFiscalDocument({
      profile: requireProfile("settlement-overview-2024"),
      text: `令和６年度 沼津市一般会計等の決算の概要
１ 一般会計
歳入 965 億 2,046 万 6 千円（前年度比）
歳出 927 億 3,656 万 9 千円（前年度比）`,
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[0]?.parsedPayload.measure).toBe("revenue_actual");
  });

  it("市政報告書profileを対応parserへ渡す", () => {
    const result = parseFiscalDocument({
      profile: requireProfile("major-measures-2024-fiscal"),
      text: `令和６年度 市政報告書
\f第１章 財政
\f一般会計の当初予算規模は 87,960,000 千円
最終予算額は 106,430,416 千円
\f歳出 当初予算額 予算現額 決算額 執行率
１ 議会費 460,162,000 0.5 464,149,000 0.4 449,516,456 0.5 96.8
計 87,960,000,000 100.0 106,430,416,000 100.0 92,736,569,118 100.0 87.1`,
    });

    expect(result.records).toHaveLength(6);
    expect(result.records[5]?.parsedPayload.amountYen).toBe("449516456");
  });
});
