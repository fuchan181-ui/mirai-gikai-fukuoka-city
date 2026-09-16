import "server-only";
import {
  FISCAL_COMPARISON_STAGE_LABELS,
  type FiscalComparison,
  fiscalComparisonDescription,
} from "../../shared/utils/build-fiscal-comparison";
import { partialCoverageStages } from "../../shared/utils/fiscal-comparison-display";
import {
  formatSharePercent,
  formatYenWithUnits,
} from "../../shared/utils/format-yen";
import { FiscalCompositionCharts } from "./fiscal-composition-charts";
import { FiscalStageBadge } from "./fiscal-stage-badge";

type FiscalComparisonSectionProps = {
  /** 見出しと本文を結ぶ固定の ID。見出し文言を変えても壊れないよう外から渡す。 */
  sectionId: string;
  /** 見出し。何の内訳かを短く示す。 */
  title: string;
  /** 款ごとの内訳を出せない年度に、何が足りないかを示す文。 */
  undisclosedNote: string;
  /** 金額が1件も取れていない年度は null。見出しだけを残して理由を書く。 */
  comparison: FiscalComparison | null;
};

/**
 * 款ごとの金額を、当初予算から決算まで段階をまたいで1つの表に並べる。
 * どの額も資料から取れた分だけを出し、無い額は 0円 と書かず「—」で残す。
 * 配分は面の大きさで伝え、金額そのものは表で伝える。
 */
export function FiscalComparisonSection({
  sectionId,
  title,
  undisclosedNote,
  comparison,
}: FiscalComparisonSectionProps) {
  if (comparison === null) {
    return (
      <section className="space-y-4" aria-labelledby={`${sectionId}-heading`}>
        <h2
          id={`${sectionId}-heading`}
          className="text-[22px] font-bold leading-[1.48] text-mirai-text"
        >
          {title}
        </h2>
        <p className="rounded-xl border bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow">
          {undisclosedNote}
        </p>
      </section>
    );
  }

  const description = fiscalComparisonDescription(comparison);
  const shareStageLabel = FISCAL_COMPARISON_STAGE_LABELS[comparison.shareStage];
  const partialStages = partialCoverageStages(comparison);
  const hasUndisclosedAmount = comparison.rows.some((row) =>
    comparison.stages.some((stage) => row.amounts[stage] === null)
  );

  return (
    <section className="space-y-4" aria-labelledby={`${sectionId}-heading`}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id={`${sectionId}-heading`}
            className="text-[22px] font-bold leading-[1.48] text-mirai-text"
          >
            {title}
          </h2>
          {comparison.decisionStage ? (
            <FiscalStageBadge decisionStage={comparison.decisionStage} />
          ) : null}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {comparison.availableBudgetAsOfDate ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            予算現額は
            {comparison.availableBudgetAsOfDate}
            時点の額です。
          </p>
        ) : null}
      </div>

      <FiscalCompositionCharts comparison={comparison} />

      {partialStages.length > 0 ? (
        <div className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
          <p>
            取得できた款だけを並べているため、内訳を足しても総額に届かない段階があります。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {partialStages.map(
              ({ stage, total, covered, coveredSharePercent }) => (
                <li key={stage}>
                  {FISCAL_COMPARISON_STAGE_LABELS[stage]}
                  は、合計{formatYenWithUnits(total)}のうち
                  {formatSharePercent(coveredSharePercent)}にあたる
                  {formatYenWithUnits(covered)}
                  だけを内訳として表示しています。残りの款はまだ取り込めていません。
                </li>
              )
            )}
          </ul>
        </div>
      ) : null}

      {comparison.kind === "expenditure" ? (
        <p className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
          {comparison.progressLabel}
          が高いほど事業の成果が高いとは限りません。事業の進み方や支出の時期によって率は変わるためです。予算現額と決算の差も、その額がそのまま余ったことや、翌年度に自由に使えることを意味しません。
        </p>
      ) : null}

      {hasUndisclosedAmount ? (
        <p className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
          「—」は、その段階の額がまだ公開されていない箇所です。
          {comparison.progressLabel}
          も、比べる2つの額がそろわないため算出していません。
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card shadow">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="p-4 text-left text-muted-foreground">
            {title}（{comparison.progressLabel}
            は予算現額に対する決算の割合、構成比は
            {shareStageLabel}
            の合計に対する割合）
          </caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="p-3">
                款
              </th>
              {comparison.stages.map((stage) => (
                <th key={stage} scope="col" className="p-3 text-right">
                  {FISCAL_COMPARISON_STAGE_LABELS[stage]}
                </th>
              ))}
              <th scope="col" className="p-3 text-right">
                構成比
              </th>
              <th scope="col" className="p-3 text-right">
                {comparison.progressLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr
                key={row.classificationKey}
                className="border-b last:border-0"
              >
                <th scope="row" className="p-3 font-medium">
                  {row.label}
                  {row.description ? (
                    <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                      {row.description}
                    </span>
                  ) : null}
                </th>
                {comparison.stages.map((stage) => (
                  <td key={stage} className="p-3 text-right tabular-nums">
                    {formatOrUndisclosed(row.amounts[stage])}
                  </td>
                ))}
                <td className="p-3 text-right tabular-nums">
                  {formatSharePercent(row.sharePercent)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatSharePercent(row.progressPercent)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-mirai-surface-gray">
              <th scope="row" className="p-3 font-medium">
                合計
              </th>
              {comparison.stages.map((stage) => (
                <td
                  key={stage}
                  className="p-3 text-right font-medium tabular-nums"
                >
                  {formatOrUndisclosed(comparison.totals[stage])}
                </td>
              ))}
              <td className="p-3 text-right font-medium tabular-nums">
                {comparison.totals[comparison.shareStage] === null
                  ? "—"
                  : "100.0%"}
              </td>
              <td className="p-3 text-right font-medium tabular-nums">
                {formatSharePercent(comparison.totalProgressPercent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        表の金額は円単位です。読みやすさのため、一覧では兆・億・万円に区切って表示しています。
      </p>
    </section>
  );
}

/** 未公開を 0円 と書かない。額が無い理由は資料側にある。 */
function formatOrUndisclosed(amountYen: string | null): string {
  return amountYen === null ? "—" : formatYenWithUnits(amountYen);
}
