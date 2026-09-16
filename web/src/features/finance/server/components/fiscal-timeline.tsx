import "server-only";
import { ArrowDown, Minus } from "lucide-react";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  FISCAL_EVENT_KIND_LABELS,
  FISCAL_MEASURE_LABELS,
} from "../../shared/constants/fiscal-labels";
import type { FiscalTimelineStep } from "../../shared/utils/build-fiscal-summary";
import {
  formatYenExact,
  formatYenWithUnits,
} from "../../shared/utils/format-yen";
import { FiscalStageBadge } from "./fiscal-stage-badge";

/** 差額が増えたのか減ったのかをテキストでも示す。色だけに頼らない。 */
function deltaLabel(deltaYen: string): string {
  return deltaYen.startsWith("-")
    ? `前の段階から${formatYenWithUnits(deltaYen.slice(1))}の減`
    : `前の段階から${formatYenWithUnits(deltaYen)}の増`;
}

/**
 * 差額を出せなかった理由。同じ「比較なし」でも原因が違うため、
 * どの理由でも同じ文言を出してしまわないよう分けて書く。
 */
function noComparisonLabel(
  kind: "no_previous" | "measure_changed" | "amount_missing"
): string {
  switch (kind) {
    case "measure_changed":
      return "前の段階との比較なし（金額の種類が変わるため）";
    case "amount_missing":
      return "前の段階との比較なし（前後の金額が未公開のため）";
    case "no_previous":
      return "前の段階との比較なし";
  }
}

/**
 * 予算から決算までの流れを縦に並べる。
 * 金額の意味（予算か決算か）が変わる段階では差額を出さず、
 * 引けないことを「比較なし」と明示する。
 */
export function FiscalTimeline({ steps }: { steps: FiscalTimelineStep[] }) {
  if (steps.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="fiscal-timeline-heading">
      <div className="space-y-2">
        <h2
          id="fiscal-timeline-heading"
          className="text-[22px] font-bold leading-[1.48] text-mirai-text"
        >
          予算から決算までの流れ
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          同じ年度の歳出が、当初予算から年度末の予算現額、決算へとどう移ったかを示します。予算と決算は意味が異なるため、その間の差額は計算していません。
        </p>
      </div>

      <ol className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <article className="rounded-xl border bg-card p-5 shadow">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-mirai-text">
                    {FISCAL_EVENT_KIND_LABELS[step.eventKind]}
                  </h3>
                  <FiscalStageBadge decisionStage={step.decisionStage} />
                </div>
                <p className="text-lg font-bold tabular-nums text-mirai-text">
                  {step.amountYen === null
                    ? "未公開"
                    : formatYenWithUnits(step.amountYen)}
                </p>
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <dt>金額の種類</dt>
                  <dd>{FISCAL_MEASURE_LABELS[step.measure]}</dd>
                </div>
                {step.asOfDate ? (
                  <div className="flex gap-2">
                    <dt>基準日</dt>
                    <dd>{formatDateWithDots(step.asOfDate)}</dd>
                  </div>
                ) : null}
                {!step.asOfDate && step.effectiveOn ? (
                  <div className="flex gap-2">
                    <dt>適用日</dt>
                    <dd>{formatDateWithDots(step.effectiveOn)}</dd>
                  </div>
                ) : null}
              </dl>
              {step.amountYen === null ? null : (
                <p className="mt-1 text-sm text-mirai-text-note">
                  {formatYenExact(step.amountYen)}
                </p>
              )}
              {step.comparison.kind === "no_previous" ? null : (
                <p className="mt-3 flex items-center gap-2 border-t pt-3 text-sm text-mirai-text-note">
                  {step.comparison.kind === "computed" ? (
                    <>
                      <ArrowDown className="h-4 w-4" aria-hidden />
                      {deltaLabel(step.comparison.deltaYen)}
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4" aria-hidden />
                      {noComparisonLabel(step.comparison.kind)}
                    </>
                  )}
                </p>
              )}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
