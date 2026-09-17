import type { ModerationStatus } from "@mirai-gikai/shared/moderation/status";
import { RICHNESS_LEVELS, type RichnessLevel } from "./cases/richness";

/** 深刻度の低い順。この順序で「見逃し」「過検知」を判定する。 */
export const MODERATION_SEVERITY_ORDER: ModerationStatus[] = [
  "ok",
  "warning",
  "ng",
];

export function severityIndex(status: ModerationStatus): number {
  return MODERATION_SEVERITY_ORDER.indexOf(status);
}

export type ModerationComparison = {
  caseId: string;
  expected: ModerationStatus;
  predicted: ModerationStatus;
};

export type ModerationSummary = {
  total: number;
  correct: number;
  accuracy: number;
  /** 期待より軽い判定になった件数（見逃し） */
  misses: number;
  /** 期待より重い判定になった件数（過検知） */
  overBlocks: number;
  /** ng を ok と判定したケース。公開事故に直結するので最重要 */
  criticalMissCaseIds: string[];
  confusion: Record<ModerationStatus, Record<ModerationStatus, number>>;
};

function emptyConfusion(): Record<
  ModerationStatus,
  Record<ModerationStatus, number>
> {
  const build = () => ({ ok: 0, warning: 0, ng: 0 });
  return { ok: build(), warning: build(), ng: build() };
}

/**
 * 期待ラベルと判定結果を突き合わせる純粋関数。
 *
 * 単純な一致率だけでは「不適切な意見を公開してしまう」誤りと、
 * 「適切な意見を非公開にしてしまう」誤りを区別できない。
 * 深刻度の大小で見逃しと過検知を分けて数える。
 */
export function summarizeModeration(
  rows: ModerationComparison[]
): ModerationSummary {
  const confusion = emptyConfusion();
  let correct = 0;
  let misses = 0;
  let overBlocks = 0;
  const criticalMissCaseIds: string[] = [];

  for (const row of rows) {
    confusion[row.expected][row.predicted] += 1;

    const expected = severityIndex(row.expected);
    const predicted = severityIndex(row.predicted);

    if (expected === predicted) correct += 1;
    else if (predicted < expected) {
      misses += 1;
      if (row.expected === "ng" && row.predicted === "ok") {
        criticalMissCaseIds.push(row.caseId);
      }
    } else overBlocks += 1;
  }

  return {
    total: rows.length,
    correct,
    accuracy: rows.length === 0 ? 0 : correct / rows.length,
    misses,
    overBlocks,
    criticalMissCaseIds,
    confusion,
  };
}

export type RichnessComparison = {
  caseId: string;
  expectedLevel: RichnessLevel;
  predictedLevel: RichnessLevel;
  expectedScore: number;
  predictedScore: number;
};

export type RichnessSummary = {
  total: number;
  exactLevel: number;
  exactLevelRate: number;
  withinOneLevel: number;
  withinOneLevelRate: number;
  /**
   * 0-100 スコアの平均絶対誤差。
   *
   * 期待値はレベル帯の中点、TypeSafe の判定はレベルを 0-100 に線形換算した値なので、
   * レベルが完全一致していても ±10 点ほどの系統差が出る。判定器をまたいだ比較には
   * 下のレベル単位の誤差を使うこと。
   */
  meanAbsoluteError: number;
  /** 正なら過大評価、負なら過小評価のバイアス */
  meanSignedError: number;
  /** レベル差の平均絶対値。スケールに依存しないので判定器間で比較できる */
  meanAbsoluteLevelError: number;
  /** レベル差の符号付き平均。正なら過大評価 */
  meanSignedLevelError: number;
};

/** レベル番号に対応するスコア帯の中点を返す。誤差計算の基準に使う。 */
export function levelMidpoint(level: RichnessLevel): number {
  const entry = RICHNESS_LEVELS.find((candidate) => candidate.level === level);
  if (!entry) return 0;
  return (entry.min + entry.max) / 2;
}

/** TypeSafe が返すレベル（0〜4）を 0-100 スケールに換算する。 */
export function levelToScore(level: number, levelCount: number): number {
  if (levelCount <= 1) return 0;
  return Math.round((level / (levelCount - 1)) * 100);
}

export function summarizeRichness(rows: RichnessComparison[]): RichnessSummary {
  if (rows.length === 0) {
    return {
      total: 0,
      exactLevel: 0,
      exactLevelRate: 0,
      withinOneLevel: 0,
      withinOneLevelRate: 0,
      meanAbsoluteError: 0,
      meanSignedError: 0,
      meanAbsoluteLevelError: 0,
      meanSignedLevelError: 0,
    };
  }

  let exactLevel = 0;
  let withinOneLevel = 0;
  let absoluteErrorSum = 0;
  let signedErrorSum = 0;
  let absoluteLevelErrorSum = 0;
  let signedLevelErrorSum = 0;

  for (const row of rows) {
    const levelError = row.predictedLevel - row.expectedLevel;
    const levelDelta = Math.abs(levelError);
    if (levelDelta === 0) exactLevel += 1;
    if (levelDelta <= 1) withinOneLevel += 1;
    absoluteLevelErrorSum += levelDelta;
    signedLevelErrorSum += levelError;

    const delta = row.predictedScore - row.expectedScore;
    absoluteErrorSum += Math.abs(delta);
    signedErrorSum += delta;
  }

  return {
    total: rows.length,
    exactLevel,
    exactLevelRate: exactLevel / rows.length,
    withinOneLevel,
    withinOneLevelRate: withinOneLevel / rows.length,
    meanAbsoluteError: absoluteErrorSum / rows.length,
    meanSignedError: signedErrorSum / rows.length,
    meanAbsoluteLevelError: absoluteLevelErrorSum / rows.length,
    meanSignedLevelError: signedLevelErrorSum / rows.length,
  };
}

export type LatencySummary = {
  count: number;
  medianMs: number;
  p90Ms: number;
};

/** レイテンシは外れ値の影響を受けやすいので中央値と p90 で見る。 */
export function summarizeLatency(samples: number[]): LatencySummary {
  if (samples.length === 0) {
    return { count: 0, medianMs: 0, p90Ms: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const median = medianOf(sorted);
  const p90Index = Math.min(
    sorted.length - 1,
    Math.ceil(sorted.length * 0.9) - 1
  );
  return {
    count: sorted.length,
    medianMs: median,
    p90Ms: sorted[p90Index],
  };
}

/**
 * ソート済み配列の中央値。偶数個は中央 2 つの平均を返す。
 *
 * 偶数個で下側をそのまま返すと、評価セットの件数が偶数のときに
 * 中央値が systematic に小さく出る（モデレーションの 16 件が該当する）。
 */
export function medianOf(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

/** 平均と標準偏差（母集団）。再実行時の判定のぶれ（安定性）を見るために使う。 */
export function summarizeSpread(samples: number[]): {
  mean: number;
  standardDeviation: number;
} {
  if (samples.length === 0) return { mean: 0, standardDeviation: 0 };
  const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  const variance =
    samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples.length;
  return { mean, standardDeviation: Math.sqrt(variance) };
}

export type CaseSpread = {
  caseId: string;
  count: number;
  mean: number;
  standardDeviation: number;
};

export type PerCaseSpreadSummary = {
  cases: CaseSpread[];
  /** ケースごとの標準偏差の平均（2 回以上実行できたケースが対象） */
  meanStandardDeviation: number;
  /** 最もぶれたケースの標準偏差（2 回以上実行できたケースが対象） */
  maxStandardDeviation: number;
  /** 失敗などで 1 回しか実行できず、ぶれを測れなかったケース数 */
  singleSampleCases: number;
};

/**
 * ケースごとに区切って判定のぶれを測る純粋関数。
 *
 * 全ケースの値をひとまとめにして標準偏差を取ると、モデルのばらつきではなく
 * 「ケース間の内容差」を測ってしまい、常に大きな値になる。反復実行の
 * 安定性を見るには、同じケースの複数回の結果だけで比較する必要がある。
 */
export function summarizeCaseSpread(
  samples: ReadonlyArray<{ caseId: string; value: number }>
): PerCaseSpreadSummary {
  const grouped = new Map<string, number[]>();
  for (const sample of samples) {
    const values = grouped.get(sample.caseId);
    if (values) values.push(sample.value);
    else grouped.set(sample.caseId, [sample.value]);
  }

  const cases: CaseSpread[] = [];
  for (const [caseId, values] of grouped) {
    const { mean, standardDeviation } = summarizeSpread(values);
    cases.push({ caseId, count: values.length, mean, standardDeviation });
  }

  // 1 回しか実行できなかったケースを 0 として混ぜると、平均が実態より
  // 小さく出る。ぶれの集計は 2 回以上実行できたケースだけで行う。
  const measured = cases.filter((entry) => entry.count >= 2);
  const singleSampleCases = cases.length - measured.length;

  if (measured.length === 0) {
    return {
      cases,
      meanStandardDeviation: 0,
      maxStandardDeviation: 0,
      singleSampleCases,
    };
  }

  const meanStandardDeviation =
    measured.reduce((sum, entry) => sum + entry.standardDeviation, 0) /
    measured.length;
  const maxStandardDeviation = measured.reduce(
    (max, entry) => Math.max(max, entry.standardDeviation),
    0
  );
  return {
    cases,
    meanStandardDeviation,
    maxStandardDeviation,
    singleSampleCases,
  };
}

/**
 * 反復実行でラベルが変わったケースを数える純粋関数（モデレーション用）。
 *
 * スコアを持たないカテゴリ判定では標準偏差が使えないため、
 * 「同じ入力なのに判定が変わったか」を安定性の指標にする。
 */
export function findUnstableCases(
  samples: ReadonlyArray<{ caseId: string; label: string }>
): { caseIds: string[]; changedCount: number; totalCases: number } {
  const grouped = new Map<string, Set<string>>();
  for (const sample of samples) {
    const labels = grouped.get(sample.caseId);
    if (labels) labels.add(sample.label);
    else grouped.set(sample.caseId, new Set([sample.label]));
  }

  const caseIds = [...grouped.entries()]
    .filter(([, labels]) => labels.size > 1)
    .map(([caseId]) => caseId);

  return {
    caseIds,
    changedCount: caseIds.length,
    totalCases: grouped.size,
  };
}
