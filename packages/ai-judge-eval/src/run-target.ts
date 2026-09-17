import { type ArtifactRun, toArtifactRun } from "./artifacts";
import { MODERATION_CASES } from "./cases/moderation";
import { RICHNESS_CASES } from "./cases/richness";
import { buildModerationJudge, buildRichnessJudge } from "./judges/factory";
import type { Judge } from "./judges/types";
import type { Options, Target } from "./options";
import type { ErrorRow, UsageRow } from "./report";
import { type RunRecord, runCases } from "./runs";
import { buildModerationSection, buildRichnessSection } from "./sections";
import { summarizeUsage } from "./usage";

export type TargetRunResult = {
  sections: string[];
  errors: ErrorRow[];
  runs: ArtifactRun[];
  usageRows: UsageRow[];
};

/**
 * 1 つの判定器 × 対象タスクを実行し、レポート材料に変換する。
 * 1 ケースが失敗しても他のケースは続ける（エラーはレポートに載せる）。
 */
async function runOne<TInput, TOutput>(params: {
  judge: Judge<TInput, TOutput>;
  cases: Array<{ id: string; input: TInput }>;
  target: Target;
  repeat: number;
  buildSection: (runs: Array<RunRecord<TOutput>>, judgeId: string) => string;
}): Promise<TargetRunResult> {
  const judgeId = params.judge.id;
  const { runs, errors } = await runCases({
    judge: params.judge,
    cases: params.cases,
    repeat: params.repeat,
  });

  return {
    sections: [params.buildSection(runs, judgeId)],
    errors,
    runs: runs.map((run) =>
      toArtifactRun({ judgeId, target: params.target, run })
    ),
    usageRows: [
      {
        judgeId,
        target: params.target,
        summary: summarizeUsage(runs.map((run) => run.meta)),
      },
    ],
  };
}

/** 指定された判定器 × 対象タスクをすべて実行し、レポート材料を集める。 */
export async function runTargets(options: Options): Promise<TargetRunResult> {
  const result: TargetRunResult = {
    sections: [],
    errors: [],
    runs: [],
    usageRows: [],
  };

  for (const target of options.targets) {
    for (const kind of options.judges) {
      const outcome =
        target === "moderation"
          ? await runOne({
              judge: buildModerationJudge(kind, options),
              cases: MODERATION_CASES,
              target,
              repeat: options.repeat,
              buildSection: (runs, judgeId) =>
                buildModerationSection({
                  judgeId,
                  cases: MODERATION_CASES,
                  runs,
                  repeat: options.repeat,
                }),
            })
          : await runOne({
              judge: buildRichnessJudge(kind, options),
              cases: RICHNESS_CASES,
              target,
              repeat: options.repeat,
              buildSection: (runs, judgeId) =>
                buildRichnessSection({
                  judgeId,
                  cases: RICHNESS_CASES,
                  runs,
                  repeat: options.repeat,
                }),
            });

      result.sections.push(...outcome.sections);
      result.errors.push(...outcome.errors);
      result.runs.push(...outcome.runs);
      result.usageRows.push(...outcome.usageRows);
    }
  }

  return result;
}
