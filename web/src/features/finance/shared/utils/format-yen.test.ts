import { describe, expect, it } from "vitest";
import {
  calculateSharePercent,
  formatSharePercent,
  formatYenExact,
  formatYenWithUnits,
  groupDigits,
  parseYen,
} from "./format-yen";

describe("parseYen", () => {
  it("10進整数の文字列を bigint に変換する", () => {
    expect(parseYen("95650000000")).toBe(BigInt("95650000000"));
  });

  it("小数や空文字は受け付けない", () => {
    expect(() => parseYen("1.5")).toThrow();
    expect(() => parseYen("")).toThrow();
  });

  it("Number の安全整数を超える額でも精度を落とさない", () => {
    expect(parseYen("9007199254740993")).toBe(BigInt("9007199254740993"));
  });
});

describe("groupDigits", () => {
  it("3桁ごとに区切る", () => {
    expect(groupDigits(BigInt("460162000"))).toBe("460,162,000");
    expect(groupDigits(BigInt(0))).toBe("0");
  });

  it("負の値は符号を前に付ける", () => {
    expect(groupDigits(BigInt(-1500))).toBe("-1,500");
  });
});

describe("formatYenWithUnits", () => {
  it("兆・億・万・円に分解し、0 の位は省く", () => {
    expect(formatYenWithUnits("95650000000")).toBe("956億5,000万円");
    expect(formatYenWithUnits("469887000")).toBe("4億6,988万7,000円");
    expect(formatYenWithUnits("24220000")).toBe("2,422万円");
  });

  it("ちょうど億のときは末尾に円を付ける", () => {
    expect(formatYenWithUnits("100000000")).toBe("1億円");
  });

  it("0 は 0円 と表示する", () => {
    expect(formatYenWithUnits("0")).toBe("0円");
  });

  it("負の値も読める表記にする", () => {
    expect(formatYenWithUnits("-150000000")).toBe("-1億5,000万円");
  });
});

describe("formatYenExact", () => {
  it("3桁区切りで円を付ける", () => {
    expect(formatYenExact("92736569118")).toBe("92,736,569,118円");
  });
});

describe("calculateSharePercent", () => {
  it("合計に対する割合を小数第1位で四捨五入して返す", () => {
    expect(calculateSharePercent("250", "1000")).toBe(25);
    expect(calculateSharePercent("1", "3")).toBe(33.3);
    expect(calculateSharePercent("2", "3")).toBe(66.7);
  });

  it("合計が 0 のときは比を返さない", () => {
    expect(calculateSharePercent("100", "0")).toBeNull();
  });

  it("金種が大きくても bigint で丸めてから数値化する", () => {
    expect(calculateSharePercent("95650000000", "191300000000")).toBeCloseTo(
      50,
      1
    );
  });
});

describe("formatSharePercent", () => {
  it("未算出は — と表示する", () => {
    expect(formatSharePercent(null)).toBe("—");
    expect(formatSharePercent(12.34)).toBe("12.3%");
  });
});
