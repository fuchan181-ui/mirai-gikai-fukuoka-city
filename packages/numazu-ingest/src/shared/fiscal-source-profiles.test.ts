import { describe, expect, it } from "vitest";
import {
  findFiscalSourceProfile,
  fiscalSourceProfiles,
} from "./fiscal-source-profiles";

describe("fiscalSourceProfiles", () => {
  it("初期対象の令和6年度と令和8年度の公式PDFを一意に定義する", () => {
    expect(fiscalSourceProfiles).toHaveLength(4);
    expect(
      new Set(fiscalSourceProfiles.map((profile) => profile.profileKey)).size
    ).toBe(4);
    expect(
      new Set(fiscalSourceProfiles.map((profile) => profile.url)).size
    ).toBe(4);
    expect(
      fiscalSourceProfiles.every(
        (profile) =>
          new URL(profile.url).hostname === "www.city.numazu.shizuoka.jp" &&
          profile.expectedMediaType === "application/pdf"
      )
    ).toBe(true);
    expect(
      new Set(fiscalSourceProfiles.map((profile) => profile.fiscalYear))
    ).toEqual(new Set([2024, 2026]));
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
    expect(findFiscalSourceProfile("unknown")).toBeNull();
  });
});
