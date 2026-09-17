import type { ModerationCase } from "./cases/moderation";
import type { RichnessCase } from "./cases/richness";
import type {
  ModerationJudgeOutput,
  RichnessJudgeOutput,
} from "./judges/types";
import {
  findUnstableCases,
  levelMidpoint,
  type ModerationComparison,
  type RichnessComparison,
  summarizeCaseSpread,
  summarizeLatency,
  summarizeModeration,
  summarizeRichness,
} from "./metrics";
import {
  type ModerationRow,
  type RichnessRow,
  renderModerationSection,
  renderRichnessSection,
} from "./report";
import { firstRunByCase, type RunRecord } from "./runs";

/**
 * ケース × 実行記録からモデレーションのレポートセクションを組み立てる。
 *
 * `--repeat` を指定したときは、同じ入力の判定が変わったケースを併記する。
 * カテゴリ判定はスコアを持たないため、標準偏差ではなくラベルの変化で見る。
 */
export function buildModerationSection(params: {
  judgeId: string;
  cases: ModerationCase[];
  runs: Array<RunRecord<ModerationJudgeOutput>>;
  repeat: number;
}): string {
  const byCase = firstRunByCase(params.runs);
  const rows: ModerationRow[] = [];
  const comparisons: ModerationComparison[] = [];

  for (const testCase of params.cases) {
    const output = byCase.get(testCase.id);
    if (!output) continue;

    const triggered = (output.triggeredCategories ?? []).map(
      (category) => `${category.key}:${category.probability.toFixed(2)}`
    );

    rows.push({
      caseId: testCase.id,
      note: testCase.note,
      expected: testCase.expected,
      predicted: output.status,
      score: output.score,
      confidence: output.confidence,
      triggeredCategories: triggered,
    });
    comparisons.push({
      caseId: testCase.id,
      expected: testCase.expected,
      predicted: output.status,
    });
  }

  const section = renderModerationSection({
    judgeId: params.judgeId,
    rows,
    summary: summarizeModeration(comparisons),
    latency: summarizeLatency(params.runs.map((run) => run.meta.latencyMs)),
  });

  if (params.repeat <= 1) return section;

  const stability = findUnstableCases(
    params.runs.map((run) => ({
      caseId: run.caseId,
      label: run.output.status,
    }))
  );
  const detail =
    stability.caseIds.length > 0 ? ` — ${stability.caseIds.join(", ")}` : "";
  return `${section}\n判定のぶれ（${params.repeat} 回反復）: ${stability.changedCount}/${stability.totalCases} ケースで判定が変化${detail}\n`;
}

/**
 * ケース × 実行記録から情報充実度のレポートセクションを組み立てる。
 *
 * `--repeat` のぶれはケースごとに標準偏差を取る。全ケースをまとめると
 * 内容差（レベル 0 と 4 の差）を測ってしまい、安定性の指標にならない。
 */
export function buildRichnessSection(params: {
  judgeId: string;
  cases: RichnessCase[];
  runs: Array<RunRecord<RichnessJudgeOutput>>;
  repeat: number;
}): string {
  const byCase = firstRunByCase(params.runs);
  const rows: RichnessRow[] = [];
  const comparisons: RichnessComparison[] = [];

  for (const testCase of params.cases) {
    const output = byCase.get(testCase.id);
    if (!output) continue;

    rows.push({
      caseId: testCase.id,
      note: testCase.note,
      expectedLevel: testCase.expected,
      predictedLevel: output.level,
      predictedScore: output.total,
      confidence: output.confidence,
    });
    comparisons.push({
      caseId: testCase.id,
      expectedLevel: testCase.expected,
      predictedLevel: output.level,
      expectedScore: levelMidpoint(testCase.expected),
      predictedScore: output.total,
    });
  }

  const section = renderRichnessSection({
    judgeId: params.judgeId,
    rows,
    summary: summarizeRichness(comparisons),
    latency: summarizeLatency(params.runs.map((run) => run.meta.latencyMs)),
  });

  if (params.repeat <= 1) return section;

  const spread = summarizeCaseSpread(
    params.runs.map((run) => ({ caseId: run.caseId, value: run.output.total }))
  );
  const insufficient =
    spread.singleSampleCases > 0
      ? `（${spread.singleSampleCases} 件は実行回数不足で除外）`
      : "";
  return `${section}\n判定のぶれ（${params.repeat} 回反復）: ケース別標準偏差 平均 ${spread.meanStandardDeviation.toFixed(1)} 点 / 最大 ${spread.maxStandardDeviation.toFixed(1)} 点${insufficient}\n`;
}
