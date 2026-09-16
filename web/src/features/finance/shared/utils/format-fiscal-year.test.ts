import { describe, expect, it } from "vitest";
import {
  formatFiscalYear,
  formatFiscalYearWithGregorian,
  isFiscalYearEnd,
} from "./format-fiscal-year";

describe("formatFiscalYear", () => {
  it("西暦を令和の年度表記にする", () => {
    expect(formatFiscalYear(2026)).toBe("令和8年度");
    expect(formatFiscalYear(2024)).toBe("令和6年度");
  });

  it("令和元年は元と表記する", () => {
    expect(formatFiscalYear(2019)).toBe("令和元年度");
  });

  it("令和より前は西暦のまま返す", () => {
    expect(formatFiscalYear(2018)).toBe("2018年度");
  });
});

describe("formatFiscalYearWithGregorian", () => {
  it("和暦と西暦を併記する", () => {
    expect(formatFiscalYearWithGregorian(2026)).toBe("令和8年度（2026年度）");
  });
});

describe("isFiscalYearEnd", () => {
  it("翌年3月31日だけを年度末として扱う", () => {
    expect(isFiscalYearEnd("2025-03-31", 2024)).toBe(true);
    expect(isFiscalYearEnd("2024-09-30", 2024)).toBe(false);
    expect(isFiscalYearEnd(null, 2024)).toBe(false);
  });
});
