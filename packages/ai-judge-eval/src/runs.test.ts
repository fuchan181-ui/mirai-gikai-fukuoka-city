import { describe, expect, it } from "vitest";
import type { Judge } from "./judges/types";
import { firstRunByCase, runCases } from "./runs";

type Output = { value: number };

function createCountingJudge(params: {
  /** この入力では失敗させる */
  failOn?: (input: number) => boolean;
}): { judge: Judge<number, Output>; calls: number[] } {
  const calls: number[] = [];
  const judge: Judge<number, Output> = {
    id: "fake:judge",
    async run(input) {
      calls.push(input);
      if (params.failOn?.(input)) throw new Error(`失敗: ${input}`);
      return {
        output: { value: input * 10 },
        meta: {
          model: "fake-model",
          latencyMs: 5,
          usage: { inputTokens: input, outputTokens: input * 2 },
        },
      };
    },
  };
  return { judge, calls };
}

describe("runCases", () => {
  it("ケース × 反復の回数だけ実行し、attempt を 1 始まりで記録する", async () => {
    const { judge } = createCountingJudge({});
    const { runs, errors } = await runCases({
      judge,
      cases: [
        { id: "a", input: 1 },
        { id: "b", input: 2 },
      ],
      repeat: 3,
    });

    expect(errors).toEqual([]);
    expect(runs.map((run) => [run.caseId, run.attempt])).toEqual([
      ["a", 1],
      ["a", 2],
      ["a", 3],
      ["b", 1],
      ["b", 2],
      ["b", 3],
    ]);
    expect(runs[0].output).toEqual({ value: 10 });
  });

  it("usage と model をそのまま保持する", async () => {
    const { judge } = createCountingJudge({});
    const { runs } = await runCases({
      judge,
      cases: [{ id: "a", input: 3 }],
      repeat: 1,
    });

    expect(runs[0].meta).toEqual({
      model: "fake-model",
      latencyMs: 5,
      usage: { inputTokens: 3, outputTokens: 6 },
    });
  });

  it("失敗したケースはエラーに記録し、残りのケースは続ける", async () => {
    const { judge, calls } = createCountingJudge({
      failOn: (input) => input === 1,
    });
    const { runs, errors } = await runCases({
      judge,
      cases: [
        { id: "a", input: 1 },
        { id: "b", input: 2 },
      ],
      repeat: 2,
    });

    expect(errors).toEqual([
      { caseId: "a", judgeId: "fake:judge", message: "失敗: 1" },
    ]);
    // 失敗したケースは再試行せず、次のケースへ進む
    expect(calls).toEqual([1, 2, 2]);
    expect(runs.map((run) => run.caseId)).toEqual(["b", "b"]);
  });
});

describe("firstRunByCase", () => {
  it("ケースごとに最初の出力だけを残す", () => {
    const map = firstRunByCase([
      { caseId: "a", output: { value: 1 } },
      { caseId: "a", output: { value: 2 } },
      { caseId: "b", output: { value: 3 } },
    ]);

    expect(map.size).toBe(2);
    expect(map.get("a")).toEqual({ value: 1 });
    expect(map.get("b")).toEqual({ value: 3 });
  });
});
