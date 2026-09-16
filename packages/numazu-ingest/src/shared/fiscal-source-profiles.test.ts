import { describe, expect, it } from "vitest";
import {
  findFiscalSourceProfile,
  fiscalSourceProfiles,
} from "./fiscal-source-profiles";
import { formatFiscalYearLabel } from "./utils/fiscal-year-label";

/** 資料種別ごとに公開済み年度を並べた期待値。未公開の年度は追加しない。 */
const EXPECTED_YEARS_BY_SERIES: Record<string, number[]> = {
  "budget-overview-general-account": [2023, 2024, 2025, 2026],
  "budget-overview-council-expense": [2023, 2024, 2025, 2026],
  "settlement-overview": [2020, 2021, 2022, 2023, 2024],
  "major-measures-fiscal": [2020, 2021, 2022, 2023, 2024],
};

function yearsOf(seriesCode: string): number[] {
  return fiscalSourceProfiles
    .filter((profile) => profile.seriesCode === seriesCode)
    .map((profile) => profile.fiscalYear)
    .sort((left, right) => left - right);
}

describe("fiscalSourceProfiles", () => {
  it("公開済みの全年度の公式PDFを一意に定義する", () => {
    expect(fiscalSourceProfiles).toHaveLength(18);
    expect(
      new Set(fiscalSourceProfiles.map((profile) => profile.profileKey)).size
    ).toBe(fiscalSourceProfiles.length);
    expect(
      new Set(fiscalSourceProfiles.map((profile) => profile.url)).size
    ).toBe(fiscalSourceProfiles.length);
    expect(
      fiscalSourceProfiles.every(
        (profile) =>
          new URL(profile.url).hostname === "www.city.numazu.shizuoka.jp" &&
          profile.expectedMediaType === "application/pdf" &&
          new URL(profile.url).pathname.endsWith(".pdf")
      )
    ).toBe(true);
    expect(
      new Set(fiscalSourceProfiles.map((profile) => profile.fiscalYear))
    ).toEqual(new Set([2020, 2021, 2022, 2023, 2024, 2025, 2026]));
  });

  it("系列ごとに欠けのない年度を定義する", () => {
    for (const [seriesCode, years] of Object.entries(
      EXPECTED_YEARS_BY_SERIES
    )) {
      expect(yearsOf(seriesCode)).toEqual(years);
    }
  });

  it("令和4年度以前の予算概要と令和7年度決算は未公開のため定義しない", () => {
    expect(
      fiscalSourceProfiles.filter(
        (profile) =>
          profile.sourceKind === "budget_overview" && profile.fiscalYear <= 2022
      )
    ).toEqual([]);
    expect(
      fiscalSourceProfiles.filter(
        (profile) =>
          profile.sourceKind === "settlement_report" &&
          profile.fiscalYear >= 2025
      )
    ).toEqual([]);
  });

  it("同じ様式の資料はparserKindを共有し、年度ごとに別profileにする", () => {
    const parserKinds = new Set(
      fiscalSourceProfiles.map((profile) => profile.parserKind)
    );
    expect(parserKinds).toEqual(
      new Set([
        "general_budget_2026",
        "council_budget_2026",
        "settlement_overview_2024",
        "major_measures_2024",
      ])
    );
    const settlementKinds = new Set(
      fiscalSourceProfiles
        .filter((profile) => profile.seriesCode === "settlement-overview")
        .map((profile) => profile.parserKind)
    );
    expect(settlementKinds).toEqual(new Set(["settlement_overview_2024"]));
  });

  it("年度とprofileKeyとparserNameが一致する", () => {
    for (const profile of fiscalSourceProfiles) {
      expect(profile.parserName.endsWith(String(profile.fiscalYear))).toBe(
        true
      );
      expect(profile.profileKey).toContain(String(profile.fiscalYear));
      expect(profile.title).toContain(
        formatFiscalYearLabel(profile.fiscalYear)
      );
    }
  });

  it("同じ様式のprofileは同じparserVersionを持つ", () => {
    const versionsByKind = new Map<string, Set<string>>();
    for (const profile of fiscalSourceProfiles) {
      const versions = versionsByKind.get(profile.parserKind) ?? new Set();
      versions.add(profile.parserVersion);
      versionsByKind.set(profile.parserKind, versions);
    }

    for (const [parserKind, versions] of versionsByKind) {
      expect([...versions], parserKind).toHaveLength(1);
    }
  });

  it("期待値の系列とprofileの系列が過不足なく一致する", () => {
    expect(
      [...new Set(fiscalSourceProfiles.map((p) => p.seriesCode))].sort()
    ).toEqual(Object.keys(EXPECTED_YEARS_BY_SERIES).sort());
  });

  it("profile keyから対象資料を取得し、不明なkeyはnullにする", () => {
    expect(
      findFiscalSourceProfile("settlement-overview-2024")?.fiscalYear
    ).toBe(2024);
    expect(
      findFiscalSourceProfile("major-measures-2024-fiscal")?.parserKind
    ).toBe("major_measures_2024");
    expect(
      findFiscalSourceProfile("budget-overview-2026-general-account")
        ?.parserKind
    ).toBe("general_budget_2026");
    expect(
      findFiscalSourceProfile("budget-overview-2023-council-expense")?.title
    ).toBe("令和5年度 議会費");
    expect(
      findFiscalSourceProfile("major-measures-2020-fiscal")?.url
    ).toContain("/kessan2020/pdf_houkoku/1.pdf");
    expect(findFiscalSourceProfile("unknown")).toBeNull();
  });
});
