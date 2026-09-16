import { describe, expect, it } from "vitest";
import {
  formatFiscalYear,
  formatFiscalYearWithGregorian,
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
