import { describe, expect, it } from "vitest";
import { summarizeUsage } from "./usage";

describe("summarizeUsage", () => {
  it("空配列ではコストを null にする（0 = 無料と混同しない）", () => {
    expect(summarizeUsage([])).toEqual({
      calls: 0,
      callsWithUsage: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: null,
      unpricedCalls: 0,
      unpricedModels: [],
      missingUsageCalls: 0,
    });
  });

  it("単価が登録済みのモデルはトークン数から USD を算出する", () => {
    // gpt-5.2: 入力 $1.25 / 出力 $10.00 （100万トークンあたり）
    const summary = summarizeUsage([
      {
        model: "openai/gpt-5.2",
        usage: { inputTokens: 2000, outputTokens: 1000 },
      },
      {
        model: "openai/gpt-5.2",
        usage: { inputTokens: 1000, outputTokens: 500 },
      },
    ]);

    expect(summary.calls).toBe(2);
    expect(summary.callsWithUsage).toBe(2);
    expect(summary.inputTokens).toBe(3000);
    expect(summary.outputTokens).toBe(1500);
    // 3000/1e6*1.25 + 1500/1e6*10 = 0.00375 + 0.015
    expect(summary.costUsd).toBeCloseTo(0.01875, 8);
    expect(summary.unpricedCalls).toBe(0);
  });

  it("単価が未登録のモデルはコスト不明として数える", () => {
    const summary = summarizeUsage([
      { model: "jev-latest", usage: { inputTokens: 100, outputTokens: 50 } },
    ]);

    expect(summary.callsWithUsage).toBe(1);
    expect(summary.costUsd).toBeNull();
    expect(summary.unpricedCalls).toBe(1);
    expect(summary.unpricedModels).toEqual(["jev-latest"]);
  });

  it("一部だけ単価が分かる場合は既知分だけ合算し、未登録件数を添える", () => {
    const summary = summarizeUsage([
      {
        model: "openai/gpt-5.2",
        usage: { inputTokens: 1000, outputTokens: 0 },
      },
      { model: "jev-latest", usage: { inputTokens: 100, outputTokens: 50 } },
    ]);

    expect(summary.costUsd).toBeCloseTo(0.00125, 8);
    expect(summary.unpricedCalls).toBe(1);
    expect(summary.unpricedModels).toEqual(["jev-latest"]);
  });

  it("usage が無い呼び出しと 0/0 の呼び出しは未取得として数える", () => {
    const summary = summarizeUsage([
      { model: "openai/gpt-5.2" },
      { model: "openai/gpt-5.2", usage: { inputTokens: 0, outputTokens: 0 } },
      { model: "openai/gpt-5.2", usage: { inputTokens: 10, outputTokens: 0 } },
    ]);

    expect(summary.calls).toBe(3);
    expect(summary.callsWithUsage).toBe(1);
    expect(summary.missingUsageCalls).toBe(2);
    expect(summary.inputTokens).toBe(10);
    expect(summary.costUsd).toBeCloseTo(0.0000125, 10);
  });
});
