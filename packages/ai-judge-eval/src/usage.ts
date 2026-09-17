import { estimateCostUsd } from "@mirai-gikai/shared/ai/model-pricing";
import type { JudgeRunMeta } from "./judges/types";

/** 集計に必要な分だけを取り出した実行メタデータ。 */
export type UsageRecord = Pick<JudgeRunMeta, "model" | "usage">;

export type UsageSummary = {
  calls: number;
  /** usage が返った呼び出し数 */
  callsWithUsage: number;
  inputTokens: number;
  outputTokens: number;
  /**
   * 単価が登録済みの呼び出しから算出した推定コスト（USD）。
   * 1 件も算出できなければ null（0 と「無料」を混同しないため）。
   */
  costUsd: number | null;
  /** 単価が未登録でコストを算出できなかった呼び出し数 */
  unpricedCalls: number;
  /** 単価が未登録だったモデル名（重複なし・出現順） */
  unpricedModels: string[];
  /** usage が返らなかった呼び出し数 */
  missingUsageCalls: number;
};

/**
 * usage の有無を判定する。
 *
 * `judges/openai-*.ts` は AI SDK が usage を返さない場合に 0 を入れている。
 * 実際のリクエストは入力トークンが 0 になることがないので、入力・出力とも 0 の
 * 呼び出しは「usage 未取得」として数える。0 をそのまま合算すると、
 * コストを過小に見積もって比較の判断を誤る。
 */
function hasUsage(usage: JudgeRunMeta["usage"]): boolean {
  if (!usage) return false;
  return usage.inputTokens > 0 || usage.outputTokens > 0;
}

/**
 * 呼び出しごとの usage を合計し、トークン数と推定コストを返す純粋関数。
 *
 * Phase 0 の判定基準「コストが OpenAI 以下」を評価するために使う。
 */
export function summarizeUsage(records: UsageRecord[]): UsageSummary {
  let callsWithUsage = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costSum = 0;
  let pricedCalls = 0;
  let unpricedCalls = 0;
  let missingUsageCalls = 0;
  const unpricedModels: string[] = [];

  for (const record of records) {
    if (!hasUsage(record.usage)) {
      missingUsageCalls += 1;
      continue;
    }

    const usage = record.usage ?? { inputTokens: 0, outputTokens: 0 };
    callsWithUsage += 1;
    inputTokens += usage.inputTokens;
    outputTokens += usage.outputTokens;

    const cost = estimateCostUsd({
      modelName: record.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });
    if (cost === undefined) {
      unpricedCalls += 1;
      if (!unpricedModels.includes(record.model)) {
        unpricedModels.push(record.model);
      }
      continue;
    }

    pricedCalls += 1;
    costSum += cost;
  }

  return {
    calls: records.length,
    callsWithUsage,
    inputTokens,
    outputTokens,
    costUsd: pricedCalls > 0 ? costSum : null,
    unpricedCalls,
    unpricedModels,
    missingUsageCalls,
  };
}
