import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EXPENDITURE_SECTION_CLASSIFICATIONS,
  SECTION_SCHEME,
} from "../shared/fiscal-classifications";
import { findFiscalSourceProfile } from "../shared/fiscal-source-profiles";
import { parseBudgetSectionSummary } from "./parse-budget-section-summary";
import { parseFiscalDocument } from "./parse-fiscal-document";

/** 令和5〜8年度の歳出予算節別集計表。令和6年度は数字が誤写像された状態で保存する。 */
const fixtures: Record<number, string> = {
  2023: readFileSync(
    new URL(
      "./__fixtures__/fiscal-budget-section-2023-layout.txt",
      import.meta.url
    ),
    "utf8"
  ),
  2024: readFileSync(
    new URL(
      "./__fixtures__/fiscal-budget-section-2024-layout.txt",
      import.meta.url
    ),
    "utf8"
  ),
  2025: readFileSync(
    new URL(
      "./__fixtures__/fiscal-budget-section-2025-layout.txt",
      import.meta.url
    ),
    "utf8"
  ),
  2026: readFileSync(
    new URL(
      "./__fixtures__/fiscal-budget-section-2026-layout.txt",
      import.meta.url
    ),
    "utf8"
  ),
};

/**
 * 公式表の合計列をそのまま写した回帰値（千円）。27節と予備費の並びで、
 * 合計は一般会計の歳出予算額と一致する。全額が0の節は2ページ目に
 * 印字が無い年度でも0として並べる。
 */
const expectedByYear: Record<number, { total: number; sections: number[] }> = {
  2023: {
    total: 80090000,
    sections: [
      1701802, 4199059, 3231031, 1706301, 1995, 1536, 275284, 110804, 1775,
      3402626, 637638, 9550459, 1409305, 6959540, 63377, 1319781, 190931,
      7410000, 18645491, 0, 1018593, 6924048, 0, 2008875, 0, 6057, 9213692,
      100000,
    ],
  },
  2024: {
    total: 87960000,
    sections: [
      1816387, 4281909, 4048700, 1824238, 1995, 1553, 277708, 116147, 1775,
      3303429, 993732, 10803475, 1449826, 8776598, 63325, 456309, 389076,
      10859646, 19201998, 0, 1408888, 6682037, 0, 2023646, 0, 5703, 9071900,
      100000,
    ],
  },
  2025: {
    total: 95600000,
    sections: [
      2135075, 4424149, 3940571, 1911660, 1995, 1606, 298083, 120398, 1675,
      3424849, 1147983, 11683673, 1543971, 9982901, 63229, 513023, 618509,
      11907742, 22064918, 0, 1044511, 6822547, 0, 2285249, 0, 5708, 9555975,
      100000,
    ],
  },
  2026: {
    total: 95650000,
    sections: [
      2146057, 4660151, 4475303, 1983105, 1994, 1124, 285780, 113713, 1575,
      3393151, 1099783, 11900956, 1695037, 8159207, 51227, 2691405, 442303,
      11313401, 22379492, 0, 528308, 6915024, 0, 2371665, 0, 4351, 8935888,
      100000,
    ],
  },
};

function requireProfile(fiscalYear: number) {
  const profile = findFiscalSourceProfile(
    `budget-section-summary-${fiscalYear}`
  );
  if (!profile) throw new Error(`test profile missing: ${fiscalYear}`);
  return profile;
}

describe.each<[string, number]>([
  ["令和5", 2023],
  ["令和6", 2024],
  ["令和7", 2025],
  ["令和8", 2026],
])("%s年度の歳出予算節別集計表", (_label, fiscalYear) => {
  const expected = expectedByYear[fiscalYear];
  if (!expected) throw new Error(`test expectation missing: ${fiscalYear}`);
  const result = parseFiscalDocument({
    profile: requireProfile(fiscalYear),
    text: fixtures[fiscalYear] ?? "",
  });

  it("節27行と予備費を節別の歳出予算として抽出する", () => {
    expect(result.records).toHaveLength(
      EXPENDITURE_SECTION_CLASSIFICATIONS.length
    );
    expect(
      result.records.map((record) => record.parsedPayload.classificationKey)
    ).toEqual(EXPENDITURE_SECTION_CLASSIFICATIONS.map((entry) => entry.key));
    expect(
      result.records.map(
        (record) => Number(record.parsedPayload.amountYen) / 1000
      )
    ).toEqual(expected.sections);
    expect(
      result.records.reduce(
        (total, record) =>
          total + BigInt(String(record.parsedPayload.amountYen)),
        0n
      ) / 1000n
    ).toBe(BigInt(expected.total));
  });

  it("単位・出典・分類schemeを節別金額として揃える", () => {
    for (const record of result.records) {
      expect(record.parsedPayload).toMatchObject({
        accountCode: "general",
        decisionStage: "proposed",
        eventKind: "initial_budget",
        measure: "expenditure_budget",
        reportingScopeCode: "general_account",
        sourcePage: "2",
        sourcePrecisionYen: 1000,
        sourceTable: "一般会計 歳出予算節別集計表",
        sourceUnit: "thousand_yen",
        classificationScheme: SECTION_SCHEME,
      });
      expect(record.validationResults).toEqual([]);
    }
    expect(result.validationSummary.length).toBeGreaterThan(0);
    expect(
      result.validationSummary.every((entry) => entry.severity === "info")
    ).toBe(true);
  });
});

describe("令和8年度の歳出予算節別集計表", () => {
  const result = parseFiscalDocument({
    profile: requireProfile(2026),
    text: fixtures[2026] ?? "",
  });

  it("報酬と扶助費を公式表の額で読む", () => {
    const byKey = new Map(
      result.records.map((record) => [
        record.parsedPayload.classificationKey,
        record.parsedPayload,
      ])
    );
    expect(byKey.get("remuneration")).toMatchObject({
      amountYen: "2146057000",
      sourceValueText: "2,146,057",
      sourceClassificationLabel: "報酬",
    });
    expect(byKey.get("public_assistance")).toMatchObject({
      amountYen: "22379492000",
      sourceValueText: "22,379,492",
    });
    expect(byKey.get("reserve_fund")).toMatchObject({
      amountYen: "100000000",
      sourceValueText: "100,000",
    });
  });
});

describe("歳出予算節別集計表の検証", () => {
  it("令和5年度は印字の無い3節を0千円として扱い、検証結果に残す", () => {
    const result = parseBudgetSectionSummary(fixtures[2023] ?? "", 2023);
    const amounts = result.records.map((record) => record.parsedPayload);
    expect(
      amounts
        .filter((payload) =>
          ["loans", "investments_and_contributions", "donations_paid"].includes(
            String(payload.classificationKey)
          )
        )
        .map((payload) => payload.amountYen)
    ).toEqual(["0", "0", "0"]);
    expect(
      result.validationSummary.find(
        (entry) => entry.ruleCode === "budget_section_summary_zero_rows_omitted"
      )?.message
    ).toContain("貸付金・投資及び出資金・寄附金");
  });

  it("令和6年度の誤写像PDFを解析前に補正して読み、補正しない入力は拒否する", () => {
    expect(
      parseBudgetSectionSummary(fixtures[2024] ?? "", 2024).records
    ).toEqual([]);
    expect(
      parseFiscalDocument({
        profile: requireProfile(2024),
        text: fixtures[2024] ?? "",
      }).records
    ).toHaveLength(EXPENDITURE_SECTION_CLASSIFICATIONS.length);
  });

  it("節名と番号が入れ替われば金額を作らない", () => {
    const text = fixtures[2026] ?? "";
    // 1報酬と2給料の番号と節名だけを入れ替え、金額の字位置は変えない。
    const swapped = text.replace(
      /^1 (報酬)(.*)\n\n2 (給料)(.*)$/m,
      "2 $3$2\n\n1 $1$4"
    );
    expect(swapped).not.toBe(text);
    expect(parseBudgetSectionSummary(swapped, 2026).records).toEqual([]);
  });

  it("年度・ページ構成・款の並びが違えば金額を作らない", () => {
    const text = fixtures[2026] ?? "";
    expect(parseBudgetSectionSummary(text, 2025).records).toEqual([]);
    expect(
      parseBudgetSectionSummary(text.replace("\f", ""), 2026).records
    ).toEqual([]);
    expect(
      parseBudgetSectionSummary(text.replace(/1(\s+)議会費/, "6$1議会費"), 2026)
        .records
    ).toEqual([]);
  });

  it("節名の欠落や金額の改変を拒否する", () => {
    const text = fixtures[2026] ?? "";
    expect(
      parseBudgetSectionSummary(text.replace(/^\s*予備費\s*$/m, ""), 2026)
        .records
    ).toEqual([]);
    expect(
      parseBudgetSectionSummary(text.replace("2,146,057", "2,146,058"), 2026)
        .records
    ).toEqual([]);
    expect(
      parseBudgetSectionSummary(text.replace("21,971,594", "21,971,595"), 2026)
        .records
    ).toEqual([]);
  });
});
