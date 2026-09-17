import type { ModerationStatus } from "@mirai-gikai/shared/moderation/status";
import type { RichnessLevel } from "./cases/richness";
import type {
  LatencySummary,
  ModerationSummary,
  RichnessSummary,
} from "./metrics";
import type { Options, Target } from "./options";
import type { UsageSummary } from "./usage";

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatMs(ms: number): string {
  return `${Math.round(ms)}ms`;
}

/** 3 桁区切り。Intl に依存させず、実行環境で結果が変わらないようにする。 */
export function formatCount(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** USD は桁が小さいので 4 桁まで出す。0 と「不明」は区別する。 */
export function formatUsd(value: number | null): string {
  if (value === null) return "不明";
  if (value === 0) return "$0";
  if (value < 0.0001) return "<$0.0001";
  return `$${value.toFixed(4)}`;
}

export type ModerationRow = {
  caseId: string;
  note: string;
  expected: ModerationStatus;
  predicted: ModerationStatus;
  score: number | null;
  confidence: number | null;
  /** 閾値を超えたカテゴリ（TypeSafe 版のみ） */
  triggeredCategories: string[];
};

export type RichnessRow = {
  caseId: string;
  note: string;
  expectedLevel: RichnessLevel;
  predictedLevel: RichnessLevel;
  predictedScore: number;
  confidence: number | null;
};

export type ErrorRow = {
  caseId: string;
  judgeId: string;
  message: string;
};

export function renderModerationSection(params: {
  judgeId: string;
  rows: ModerationRow[];
  summary: ModerationSummary;
  latency: LatencySummary;
}): string {
  const { judgeId, rows, summary, latency } = params;
  const lines: string[] = [];

  lines.push(`### モデレーション — ${judgeId}`);
  lines.push("");
  lines.push(
    `- 一致率: ${formatPercent(summary.accuracy)} (${summary.correct}/${summary.total})`
  );
  lines.push(
    `- 見逃し: ${summary.misses} 件 / 過検知: ${summary.overBlocks} 件`
  );
  lines.push(
    `- 重大な見逃し（ng→ok）: ${summary.criticalMissCaseIds.length} 件` +
      (summary.criticalMissCaseIds.length > 0
        ? ` — ${summary.criticalMissCaseIds.join(", ")}`
        : "")
  );
  lines.push(
    `- レイテンシ: 中央値 ${formatMs(latency.medianMs)} / p90 ${formatMs(latency.p90Ms)}`
  );
  lines.push("");
  lines.push(
    "| ケース | 期待 | 判定 | スコア | 確信度 | 発火カテゴリ | 内容 |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");

  for (const row of rows) {
    const mark = row.expected === row.predicted ? "" : " ⚠️";
    const confidence =
      row.confidence === null ? "-" : row.confidence.toFixed(2);
    const triggered =
      row.triggeredCategories.length > 0
        ? row.triggeredCategories.join(", ")
        : "-";
    const score = row.score === null ? "-" : String(row.score);
    lines.push(
      `| ${row.caseId} | ${row.expected} | ${row.predicted}${mark} | ${score} | ${confidence} | ${triggered} | ${row.note} |`
    );
  }

  lines.push("");
  lines.push("混同行列（行=期待, 列=判定）:");
  lines.push("");
  lines.push("| 期待\\判定 | ok | warning | ng |");
  lines.push("| --- | --- | --- | --- |");
  for (const expected of ["ok", "warning", "ng"] as ModerationStatus[]) {
    const row = summary.confusion[expected];
    lines.push(`| ${expected} | ${row.ok} | ${row.warning} | ${row.ng} |`);
  }
  lines.push("");

  return lines.join("\n");
}

export function renderRichnessSection(params: {
  judgeId: string;
  rows: RichnessRow[];
  summary: RichnessSummary;
  latency: LatencySummary;
}): string {
  const { judgeId, rows, summary, latency } = params;
  const lines: string[] = [];

  lines.push(`### 情報充実度 — ${judgeId}`);
  lines.push("");
  lines.push(
    `- レベル完全一致: ${formatPercent(summary.exactLevelRate)} (${summary.exactLevel}/${summary.total})`
  );
  lines.push(
    `- ±1 レベル以内: ${formatPercent(summary.withinOneLevelRate)} (${summary.withinOneLevel}/${summary.total})`
  );
  lines.push(
    `- 平均絶対誤差: ${summary.meanAbsoluteError.toFixed(1)} 点（0-100 スケール。期待値はレベル帯の中点なので、TypeSafe とは目盛りがずれる）`
  );
  lines.push(
    `- バイアス: ${summary.meanSignedError >= 0 ? "+" : ""}${summary.meanSignedError.toFixed(1)} 点（正なら過大評価）`
  );
  lines.push(
    `- レベル単位の誤差: 平均絶対値 ${summary.meanAbsoluteLevelError.toFixed(2)} レベル / バイアス ${
      summary.meanSignedLevelError >= 0 ? "+" : ""
    }${summary.meanSignedLevelError.toFixed(2)} レベル（判定器間で比較可能）`
  );
  lines.push(
    `- レイテンシ: 中央値 ${formatMs(latency.medianMs)} / p90 ${formatMs(latency.p90Ms)}`
  );
  lines.push("");
  lines.push(
    "| ケース | 期待レベル | 判定レベル | 判定スコア | 確信度 | 内容 |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- |");

  for (const row of rows) {
    const mark = row.expectedLevel === row.predictedLevel ? "" : " ⚠️";
    const confidence =
      row.confidence === null ? "-" : row.confidence.toFixed(2);
    lines.push(
      `| ${row.caseId} | ${row.expectedLevel} | ${row.predictedLevel}${mark} | ${row.predictedScore} | ${confidence} | ${row.note} |`
    );
  }
  lines.push("");

  return lines.join("\n");
}

export type UsageRow = {
  judgeId: string;
  target: Target;
  summary: UsageSummary;
};

const TARGET_LABELS: Record<Target, string> = {
  moderation: "モデレーション",
  richness: "情報充実度",
};

export function renderUsageSection(rows: UsageRow[]): string {
  if (rows.length === 0) return "";

  const lines: string[] = ["## 実行コスト", ""];
  lines.push(
    "| 判定 | 対象 | 呼び出し | 入力トークン | 出力トークン | 推定コスト |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- |");

  for (const row of rows) {
    const { summary } = row;
    const note: string[] = [];
    if (summary.unpricedCalls > 0) {
      note.push(
        `単価未登録 ${summary.unpricedCalls} 件 (${summary.unpricedModels.join(", ")})`
      );
    }
    if (summary.missingUsageCalls > 0) {
      note.push(`usage 未取得 ${summary.missingUsageCalls} 件`);
    }
    const cost =
      formatUsd(summary.costUsd) +
      (note.length > 0 ? ` ※${note.join(" / ")}` : "");
    lines.push(
      `| ${row.judgeId} | ${TARGET_LABELS[row.target]} | ${formatCount(summary.calls)} | ${formatCount(summary.inputTokens)} | ${formatCount(summary.outputTokens)} | ${cost} |`
    );
  }

  lines.push("");
  return lines.join("\n");
}

export function renderErrors(errors: ErrorRow[]): string {
  if (errors.length === 0) return "";
  const lines: string[] = ["## 実行できなかったケース", ""];
  for (const error of errors) {
    lines.push(`- \`${error.judgeId}\` / ${error.caseId}: ${error.message}`);
  }
  lines.push("");
  return lines.join("\n");
}

/** 実行条件と各セクションを 1 本の markdown に組み立てる純粋関数。 */
export function buildReport(params: {
  options: Options;
  sections: string[];
  errors: ErrorRow[];
  usageRows: UsageRow[];
  generatedAt: Date;
}): string {
  const { options } = params;
  return [
    "# TypeSafe Phase 0 判定比較",
    "",
    `- 実行日時: ${params.generatedAt.toISOString()}`,
    `- 判定器: ${options.judges.join(", ")}`,
    `- 対象: ${options.targets.join(", ")}`,
    `- モデル上書き: ${options.model ?? "なし"}`,
    `- 反復回数: ${options.repeat}`,
    `- ドライラン: ${options.dryRun ? "はい（結果はダミー）" : "いいえ"}`,
    "",
    ...params.sections,
    renderUsageSection(params.usageRows),
    renderErrors(params.errors),
  ].join("\n");
}
