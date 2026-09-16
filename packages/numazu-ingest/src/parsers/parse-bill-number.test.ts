import { describe, expect, it } from "vitest";
import { parseBillNumber, startsWithBillNumber } from "./parse-bill-number";

describe("parseBillNumber", () => {
  it("議第◯号を解析する", () => {
    expect(parseBillNumber("議第58号")).toEqual({
      billNumber: "議第58号",
      prefix: "議第",
      kind: "gi",
      value: 58,
    });
  });

  it("報第・認第を解析する", () => {
    expect(parseBillNumber("報第14号")?.kind).toBe("hou");
    expect(parseBillNumber("認第11号")?.kind).toBe("nin");
  });

  it("発議第を議第と取り違えない", () => {
    expect(parseBillNumber("発議第4号")).toEqual({
      billNumber: "発議第4号",
      prefix: "発議第",
      kind: "hatsugi",
      value: 4,
    });
  });

  it("請願・陳情を解析する", () => {
    expect(parseBillNumber("請願第2号")?.kind).toBe("seigan");
    expect(parseBillNumber("陳情第1号")?.kind).toBe("chinjo");
  });

  it("全角数字を半角に正規化する", () => {
    expect(parseBillNumber("発議第１号")).toEqual({
      billNumber: "発議第1号",
      prefix: "発議第",
      kind: "hatsugi",
      value: 1,
    });
  });

  it("議案名が続いていても番号だけを取る", () => {
    expect(parseBillNumber("議第58号 沼津市印鑑条例の一部改正")).toEqual({
      billNumber: "議第58号",
      prefix: "議第",
      kind: "gi",
      value: 58,
    });
  });

  it("前後の空白を無視する", () => {
    expect(parseBillNumber("  議第7号  ")?.value).toBe(7);
  });

  it("議案番号でなければ null", () => {
    expect(parseBillNumber("議案番号")).toBeNull();
    expect(parseBillNumber("市長")).toBeNull();
    expect(parseBillNumber("")).toBeNull();
    expect(parseBillNumber("第58号")).toBeNull();
    // 番号が数字でない
    expect(parseBillNumber("議第あ号")).toBeNull();
  });
});

describe("startsWithBillNumber", () => {
  it("レコード行を判定する", () => {
    expect(startsWithBillNumber("議第1号 市道路線の廃止")).toBe(true);
    expect(startsWithBillNumber("発議第１号")).toBe(true);
  });

  it("見出し行やメタ行は false", () => {
    expect(startsWithBillNumber("議案番号                    議案名")).toBe(
      false
    );
    expect(startsWithBillNumber("        市長          可決すべきもの")).toBe(
      false
    );
    expect(startsWithBillNumber("●条例 （地方自治法第96条第1項第1号）")).toBe(
      false
    );
  });
});
