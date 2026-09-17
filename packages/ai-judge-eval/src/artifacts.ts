import { isAbsolute, resolve } from "node:path";
import type { JudgeKind, Options, Target } from "./options";
import type { ErrorRow } from "./report";
import type { RunRecord } from "./runs";

/**
 * 保存用の 1 実行。判定器の完全な出力をそのまま持つ。
 *
 * markdown のレポートは発火カテゴリしか載せないため、閾値や重みを変えたときに
 * 再推論せず再計算できるよう、カテゴリ別確率・次元別スコアも残す。
 */
export type ArtifactRun = {
  judgeId: string;
  target: Target;
  caseId: string;
  attempt: number;
  model: string;
  latencyMs: number;
  usage?: { inputTokens: number; outputTokens: number };
  output: unknown;
};

/**
 * 出力形式の版。フィールドの意味や構成を変えたら上げる
 * （`version: 2` でモデルの上書きを判定器ごとのフィールドに分けた）。
 */
export type JudgeEvalArtifact = {
  version: 2;
  generatedAt: string;
  judges: JudgeKind[];
  targets: Target[];
  openaiModel: string | null;
  typesafeModel: string | null;
  repeat: number;
  dryRun: boolean;
  runs: ArtifactRun[];
  errors: ErrorRow[];
};

/**
 * `--out` をリポジトリルート基準で解決する。
 *
 * `pnpm --filter <pkg> run` は cwd がパッケージ配下になるため、README の例のように
 * `docs/...` を渡すと存在しないディレクトリを指してしまう。絶対パスはそのまま使う。
 */
export function resolveOutPath(repoRoot: string, outPath: string): string {
  return isAbsolute(outPath) ? outPath : resolve(repoRoot, outPath);
}

/** markdown の出力先に対応する JSON のパス。`a.md` → `a.json`。 */
export function artifactPathFor(outPath: string): string {
  return outPath.endsWith(".md")
    ? `${outPath.slice(0, -".md".length)}.json`
    : `${outPath}.json`;
}

export function toArtifactRun<TOutput>(params: {
  judgeId: string;
  target: Target;
  run: RunRecord<TOutput>;
}): ArtifactRun {
  const { meta } = params.run;
  return {
    judgeId: params.judgeId,
    target: params.target,
    caseId: params.run.caseId,
    attempt: params.run.attempt,
    model: meta.model,
    latencyMs: meta.latencyMs,
    ...(meta.usage ? { usage: meta.usage } : {}),
    output: params.run.output,
  };
}

export function buildArtifact(params: {
  options: Options;
  runs: ArtifactRun[];
  errors: ErrorRow[];
  generatedAt: Date;
}): JudgeEvalArtifact {
  const { options } = params;
  return {
    version: 2,
    generatedAt: params.generatedAt.toISOString(),
    judges: options.judges,
    targets: options.targets,
    openaiModel: options.openaiModel,
    typesafeModel: options.typesafeModel,
    repeat: options.repeat,
    dryRun: options.dryRun,
    runs: params.runs,
    errors: params.errors,
  };
}
