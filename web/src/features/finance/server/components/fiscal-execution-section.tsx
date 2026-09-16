import "server-only";
import { formatDateWithDots } from "@/lib/utils/date";
import type { FiscalExecution } from "../../shared/utils/build-fiscal-execution";
import {
  calculateSharePercent,
  formatSharePercent,
  formatYenExact,
  formatYenWithUnits,
  parseYen,
} from "../../shared/utils/format-yen";

type FiscalExecutionSectionProps = {
  execution: FiscalExecution;
};

/**
 * 年度末の予算現額に対して、その年度の支出がどれだけ確定したかを款ごとに示す。
 * 率の分母は予算現額であり、当初予算ではない。当初予算額も併記して、
 * 補正で予算が動いたことを率だけから読み違えないようにする。
 * 棒は読み上げでは意味を持たないため装飾として扱い、値は表で伝える。
 */
export function FiscalExecutionSection({
  execution,
}: FiscalExecutionSectionProps) {
  const totalAvailableBudgetYen = execution.totalAvailableBudgetYen;
  const coveredSharePercent = totalAvailableBudgetYen
    ? calculateSharePercent(
        execution.coveredAvailableBudgetYen,
        totalAvailableBudgetYen
      )
    : null;
  const isPartial =
    totalAvailableBudgetYen !== null &&
    parseYen(execution.coveredAvailableBudgetYen) !==
      parseYen(totalAvailableBudgetYen);
  const hasUndisclosedRate = execution.rows.some(
    (row) => row.executionRatePercent === null
  );

  return (
    <section className="space-y-4" aria-labelledby="fiscal-execution-heading">
      <div className="space-y-2">
        <h2
          id="fiscal-execution-heading"
          className="text-[22px] font-bold leading-[1.48] text-mirai-text"
        >
          予算の執行状況
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          年度末の予算現額（補正予算や流用を反映した後の予算額）に対して、その年度に支出が確定した額（歳出決算額）がいくらだったかを款ごとに示します。執行率は「歳出決算額
          ÷ 年度末の予算現額」で計算しており、分母は当初予算ではありません。
        </p>
        {execution.availableBudgetAsOfDate ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            年度末の予算現額は
            {formatDateWithDots(execution.availableBudgetAsOfDate)}
            現在の額です。
          </p>
        ) : null}
        {execution.initialBudgetDecisionStage === "proposed" ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            当初予算額は、まだ議会で議決されていない案の額です。
          </p>
        ) : null}
      </div>

      <ul className="space-y-3 rounded-xl border bg-card p-5 shadow">
        {execution.rows.map((row) => (
          <li key={row.classificationKey} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-mirai-text">{row.label}</span>
              <span className="text-mirai-text-secondary">
                執行率 {formatSharePercent(row.executionRatePercent)}
              </span>
            </div>
            {/* 棒は表の補助。読み上げには出さない */}
            <div
              aria-hidden
              className="h-3 w-full overflow-hidden rounded-full bg-mirai-surface-grouped"
            >
              <div
                className="h-full rounded-full bg-primary-accent"
                style={{ width: `${barPercent(row.executionRatePercent)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              予算現額 {formatOrUndisclosed(row.availableBudgetYen)}・決算{" "}
              {formatOrUndisclosed(row.actualYen)}
            </p>
          </li>
        ))}
      </ul>

      {isPartial ? (
        <p className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
          この表は、取得できた款だけを並べています。合計額
          {totalAvailableBudgetYen === null
            ? ""
            : formatYenWithUnits(totalAvailableBudgetYen)}
          のうち、表に表示しているのは
          {formatSharePercent(coveredSharePercent)}にあたる
          {formatYenWithUnits(execution.coveredAvailableBudgetYen)}
          です。残りの款はまだ取り込めていません。
        </p>
      ) : null}

      <p className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
        執行率が高いほど事業の成果が高いとは限りません。事業の進み方や支出の時期によって率は変わるためです。予算現額と支出済額の差も、その額がそのまま余ったことや、翌年度に自由に使えることを意味しません。
      </p>

      {hasUndisclosedRate ? (
        <p className="rounded-xl border border-mirai-border bg-mirai-surface p-4 text-sm leading-relaxed text-mirai-text-note">
          「—」は、年度末の予算現額と歳出決算額のどちらかがまだ公開されていないため、執行率を算出していない款です。
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-card shadow">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="p-4 text-left text-muted-foreground">
            予算の執行状況（執行率は年度末の予算現額に対する歳出決算額の割合）
          </caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="p-3">
                款
              </th>
              <th scope="col" className="p-3 text-right">
                当初予算額
              </th>
              <th scope="col" className="p-3 text-right">
                年度末の予算現額
              </th>
              <th scope="col" className="p-3 text-right">
                歳出決算額
              </th>
              <th scope="col" className="p-3 text-right">
                執行率
              </th>
            </tr>
          </thead>
          <tbody>
            {execution.rows.map((row) => (
              <tr
                key={row.classificationKey}
                className="border-b last:border-0"
              >
                <th scope="row" className="p-3 font-medium">
                  {row.label}
                </th>
                <td className="p-3 text-right tabular-nums">
                  {formatOrUndisclosed(row.initialBudgetYen)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatOrUndisclosed(row.availableBudgetYen)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatOrUndisclosed(row.actualYen)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {formatSharePercent(row.executionRatePercent)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-mirai-surface-gray">
              <th scope="row" className="p-3 font-medium">
                合計
              </th>
              <td className="p-3 text-right font-medium tabular-nums">
                {formatOrUndisclosed(execution.totalInitialBudgetYen)}
              </td>
              <td className="p-3 text-right font-medium tabular-nums">
                {formatOrUndisclosed(execution.totalAvailableBudgetYen)}
              </td>
              <td className="p-3 text-right font-medium tabular-nums">
                {formatOrUndisclosed(execution.totalActualYen)}
              </td>
              <td className="p-3 text-right font-medium tabular-nums">
                {formatSharePercent(execution.totalExecutionRatePercent)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

/** 未公開を 0円 と書かない。額が無い理由は資料側にある。 */
function formatOrUndisclosed(amountYen: string | null): string {
  return amountYen === null ? "未公開" : formatYenExact(amountYen);
}

/**
 * 棒の長さ。予算現額を超えて支出した款でも、棒は満杯で止める。
 * 100% を超えた事実は率の数字で伝える。
 */
function barPercent(executionRatePercent: number | null): number {
  if (executionRatePercent === null) return 0;
  return Math.min(Math.max(executionRatePercent, 0), 100);
}
