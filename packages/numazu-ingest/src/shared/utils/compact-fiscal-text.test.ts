import { describe, expect, it } from "vitest";
import {
  compactFiscalText,
  stripFiscalWhitespace,
} from "./compact-fiscal-text";

describe("compactFiscalText", () => {
  it("全角数字と字間の空白を半角へ揃えて取り除く", () => {
    expect(compactFiscalText("令和 ６ 年度 一般会計")).toBe(
      "令和6年度一般会計"
    );
  });

  it("改行やタブを含むPDF本文でも1つの文字列に詰める", () => {
    expect(compactFiscalText("歳 入\n\t965 億")).toBe("歳入965億");
  });

  it("全角数字も半角へ揃える", () => {
    expect(compactFiscalText("１ 議会費")).toBe("1議会費");
  });
});

describe("stripFiscalWhitespace", () => {
  it("空白だけを取り除き、全角数字はそのまま残す", () => {
    expect(stripFiscalWhitespace("第１章 財政")).toBe("第１章財政");
  });

  it("全角の款名を保つため、compactFiscalTextとは結果が異なる", () => {
    expect(stripFiscalWhitespace("１議会費")).toBe("１議会費");
    expect(compactFiscalText("１議会費")).toBe("1議会費");
  });
});
