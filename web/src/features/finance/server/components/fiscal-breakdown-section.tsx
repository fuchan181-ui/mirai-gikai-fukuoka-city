import "server-only";
import type { FiscalBreakdown } from "../../shared/utils/build-fiscal-summary";
import {
  calculateSharePercent,
  formatSharePercent,
  formatYenExact,
  formatYenWithUnits,
  parseYen,
  ZERO,
} from "../../shared/utils/format-yen";
import { FiscalStageBadge } from "./fiscal-stage-badge";

type FiscalBreakdownSectionProps = {
  /** 見出しと本文を結ぶ固定の ID。見出し文言を変えても壊れないよう外から渡す。 */
  sectionId: string;
  /** 見出し。何の内訳かを短く示す。 */
  title: string;
  description: string;
  breakdown: FiscalBreakdown;
  /** 表の金額欄の見出し。予算と決算で語を変える。 */
  amountCaption: string;
};

/**
 * 款別の内訳を、横棒グラフと表で並べて示す。
 * 棒の長さは最大の款を基準にした相対値、構成比は総額に対する割合で、
 * 意味の違う2つを混同しないよう表側に構成比の列を置く。
 * 棒は読み上げでは意味を持たないため装飾として扱い、値は表で伝える。
 */
export function FiscalBreakdownSection({
  sectionId,
  title,
  description,
  breakdown,
  amountCaption,
}: FiscalBreakdownSectionProps) {
  const maxYen = breakdown.items.reduce((max, item) => {
    const value = parseYen(item.amountYen);
    return value > max ? value : max;
  }, ZERO);

  const totalYen = breakdown.totalYen;
  const coveredSharePercent = totalYen
    ? calculateSharePercent(breakdown.coveredYen, totalYen)
    : null;
  const isPartial =
    totalYen !== null && parseYen(breakdown.coveredYen) !== parseYen(totalYen);

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
          <FiscalStageBadge decisionStage={breakdown.decisionStage} />
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {breakdown.items.length === 0 ? (
        <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow">
          この内訳はまだ公開されていません。
        </p>
      ) : (
        <>
          <ul className="space-y-3 rounded-xl border bg-card p-5 shadow">
            {breakdown.items.map((item) => (
              <li key={item.classificationKey} className="space-y-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-mirai-text">
                    {item.label}
                  </span>
                  <span className="text-mirai-text-secondary">
                    {formatYenWithUnits(item.amountYen)}
                    <span className="ml-3 text-muted-foreground">
                      {formatSharePercent(item.sharePercent)}
                    </span>
                  </span>
                </div>
                {/* 棒は表の補助。読み上げには出さない */}
                <div
                  aria-hidden
                  className="h-3 w-full overflow-hidden rounded-full bg-mirai-surface-grouped"
                >
                  <div
                    className="h-full rounded-full bg-primary-accent"
                    style={{
                      width: `${percentOfMax(item.amountYen, maxYen)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {isPartial ? (
            <p className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
              この内訳は、取得できた款だけを並べています。合計額
              {totalYen === null ? "" : formatYenWithUnits(totalYen)}
              のうち、内訳として表示しているのは
              {formatSharePercent(coveredSharePercent)}にあたる
              {formatYenWithUnits(breakdown.coveredYen)}
              です。残りの款はまだ取り込めていません。
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border bg-card shadow">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="p-4 text-left text-muted-foreground">
                {title}（{amountCaption}、構成比は合計に対する割合）
              </caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="p-3">
                    款
                  </th>
                  <th scope="col" className="p-3 text-right">
                    {amountCaption}
                  </th>
                  <th scope="col" className="p-3 text-right">
                    構成比
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.items.map((item) => (
                  <tr
                    key={item.classificationKey}
                    className="border-b last:border-0"
                  >
                    <th scope="row" className="p-3 font-medium">
                      {item.label}
                    </th>
                    <td className="p-3 text-right tabular-nums">
                      {formatYenExact(item.amountYen)}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {formatSharePercent(item.sharePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalYen === null ? null : (
                <tfoot>
                  <tr className="border-t bg-mirai-surface-gray">
                    <th scope="row" className="p-3 font-medium">
                      合計
                    </th>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {formatYenExact(totalYen)}
                    </td>
                    <td className="p-3 text-right tabular-nums">100.0%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/** 最大の款を 100% とした棒の長さ。0 除算を避け、極小の値でも見えるようにする。 */
function percentOfMax(amountYen: string, maxYen: bigint): number {
  if (maxYen === ZERO) return 0;
  const ratio = Number((parseYen(amountYen) * BigInt(10000)) / maxYen) / 100;
  return Math.max(ratio, 1);
}
