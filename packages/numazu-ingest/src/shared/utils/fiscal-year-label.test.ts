import { describe, expect, it } from "vitest";
import {
  formatFiscalYearLabel,
  includesFiscalYearLabel,
} from "./fiscal-year-label";

describe("formatFiscalYearLabel", () => {
  it.each([
    [2025, "令和7年度"],
    [2021, "令和3年度"],
    [2026, "令和8年度"],
  ])("年度%dを%sにする", (fiscalYear, expected) => {
    expect(formatFiscalYearLabel(fiscalYear)).toBe(expected);
  });

  it("令和元年は元年と表記する", () => {
    expect(formatFiscalYearLabel(2019)).toBe("令和元年度");
  });

  it("令和より前の年度は例外にする", () => {
    expect(() => formatFiscalYearLabel(2018)).toThrowError(
      "令和の年度として扱えない値です: 2018"
    );
  });

  it("整数でない年度は例外にする", () => {
    expect(() => formatFiscalYearLabel(2025.5)).toThrowError(
      "令和の年度として扱えない値です: 2025.5"
    );
  });
});

describe("includesFiscalYearLabel", () => {
  it("全角数字で印字されたPDF本文でも一致する", () => {
    expect(
      includesFiscalYearLabel("令和７年度 歳入歳出予算款別前年度比較表", 2025)
    ).toBe(true);
  });

  it("字間に空白が入った見出しでも一致する", () => {
    expect(includesFiscalYearLabel("令和 ６ 年度 市政報告書", 2024)).toBe(true);
  });

  it("別年度の表記には一致しない", () => {
    expect(includesFiscalYearLabel("令和６年度 市政報告書", 2025)).toBe(false);
  });
});
