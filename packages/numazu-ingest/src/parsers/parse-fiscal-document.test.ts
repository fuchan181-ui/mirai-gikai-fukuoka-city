import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findFiscalSourceProfile } from "../shared/fiscal-source-profiles";
import { parseFiscalDocument } from "./parse-fiscal-document";

/** 令和6年度市政報告書の実レイアウトを写したfixture。 */
const majorMeasuresFixture = readFileSync(
  new URL(
    "./__fixtures__/fiscal-major-measures-2024-layout.txt",
    import.meta.url
  ),
  "utf8"
);

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
歳出 927 億 3,656 万 9 千円（前年度比）
（１）歳入`,
    });

    expect(result.records).toHaveLength(2);
    expect(result.records[0]?.parsedPayload.measure).toBe("revenue_actual");
  });

  it("市政報告書profileを対応parserへ渡す", () => {
    const result = parseFiscalDocument({
      profile: requireProfile("major-measures-2024-fiscal"),
      text: majorMeasuresFixture,
    });

    expect(result.records).toHaveLength(42);
    expect(result.records[0]?.parsedPayload.classificationKey).toBe(
      "council_expense"
    );
    expect(result.records[2]?.parsedPayload.amountYen).toBe("449516456");
    expect(result.records[41]?.parsedPayload.measure).toBe(
      "expenditure_actual"
    );
    expect(result.records[41]?.parsedPayload.amountYen).toBe("92736569118");
  });
});
