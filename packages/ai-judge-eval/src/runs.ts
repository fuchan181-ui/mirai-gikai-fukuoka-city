import type { Judge, JudgeRunMeta } from "./judges/types";
import type { ErrorRow } from "./report";

/**
 * 1 回の判定実行の記録。
 *
 * レポートに出す集計値だけでなく、usage と完全な出力を保持する。
 * 閾値や重みを変えたときに、再推論せず保存済みの出力から再計算できるようにするため。
 */
export type RunRecord<TOutput> = {
  caseId: string;
  /** 同一ケースの何回目の実行か（1 始まり） */
  attempt: number;
  output: TOutput;
  meta: JudgeRunMeta;
};

/** 判定器を差し替え可能な形で受け取り、ケース × 反復を実行する。 */
export async function runCases<TInput, TOutput>(params: {
  judge: Judge<TInput, TOutput>;
  cases: Array<{ id: string; input: TInput }>;
  repeat: number;
}): Promise<{ runs: Array<RunRecord<TOutput>>; errors: ErrorRow[] }> {
  const runs: Array<RunRecord<TOutput>> = [];
  const errors: ErrorRow[] = [];

  for (const testCase of params.cases) {
    for (let attempt = 0; attempt < params.repeat; attempt += 1) {
      try {
        const run = await params.judge.run(testCase.input);
        runs.push({
          caseId: testCase.id,
          attempt: attempt + 1,
          output: run.output,
          meta: run.meta,
        });
      } catch (error) {
        errors.push({
          caseId: testCase.id,
          judgeId: params.judge.id,
          message: error instanceof Error ? error.message : String(error),
        });
        // 同じケースを繰り返しても同じエラーになる可能性が高いので次へ進む
        break;
      }
    }
  }

  return { runs, errors };
}

/** 反復実行したときの指標には初回の結果を使う。 */
export function firstRunByCase<T>(
  runs: Array<{ caseId: string; output: T }>
): Map<string, T> {
  const map = new Map<string, T>();
  for (const run of runs) {
    if (!map.has(run.caseId)) map.set(run.caseId, run.output);
  }
  return map;
}
