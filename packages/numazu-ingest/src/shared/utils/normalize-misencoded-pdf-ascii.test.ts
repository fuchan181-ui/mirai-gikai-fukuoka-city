import { describe, expect, it } from "vitest";
import { normalizeMisencodedPdfAscii } from "./normalize-misencoded-pdf-ascii";

describe("normalizeMisencodedPdfAscii", () => {
  it("誤写像された数字と記号をASCIIへ戻す", () => {
    // 令和6年度予算概要PDFの実データで、"- 1 -" と "34,300,000" が
    // CJK統合漢字拡張Aへ化けたもの。
    expect(normalizeMisencodedPdfAscii("㻙㻌㻝㻌㻙")).toBe("- 1 -");
    expect(normalizeMisencodedPdfAscii("㻟㻠㻘㻟㻜㻜㻘㻜㻜㻜")).toBe(
      "34,300,000"
    );
    expect(normalizeMisencodedPdfAscii("㻝㻟㻚㻡")).toBe("13.5");
  });

  it("日本語の本文や全角数字は変えない", () => {
    expect(normalizeMisencodedPdfAscii("令和６年度 一般会計 3,000円")).toBe(
      "令和６年度 一般会計 3,000円"
    );
  });

  it("誤写像の範囲の端まで戻し、範囲外は変えない", () => {
    // U+3ECC（空白）〜U+3EE5（"9"）が対象。1文字ずれても検出できるようにする。
    expect(normalizeMisencodedPdfAscii("\u3ecc\u3ee5")).toBe(" 9");
    expect(normalizeMisencodedPdfAscii("\u3ecb\u3ee6")).toBe("\u3ecb\u3ee6");
  });
});
