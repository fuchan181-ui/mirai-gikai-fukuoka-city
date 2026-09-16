import type {
  FiscalAmountLine,
  FiscalAmountSet,
  FiscalDecisionStage,
  FiscalEventKind,
  FiscalMeasure,
} from "../types/fiscal-amount";
import { parseYen } from "./format-yen";

/** 金額セットに含まれる金額の種類。歳入と歳出が同じセットに同居できる。 */
export function measuresOf(amountSet: FiscalAmountSet): FiscalMeasure[] {
  return [...new Set(amountSet.lines.map((line) => line.measure))];
}

/** 指定した種類の合計行。合計が未公開なら null。 */
export function totalLineOf(
  amountSet: FiscalAmountSet,
  measure: FiscalMeasure
): FiscalAmountLine | null {
  return (
    amountSet.lines.find(
      (line) => line.measure === measure && line.classificationKey === null
    ) ?? null
  );
}

/**
 * 直前の段階との比較結果。差額を出せないときは、その理由まで持つ。
 * 理由は1つではないため、null 一つで「比較なし」を表さない。
 */
export type FiscalTimelineComparison =
  | { kind: "computed"; deltaYen: string }
  /** 最初の段階で、比べる相手が無い。 */
  | { kind: "no_previous" }
  /** 予算と決算のように、金額の意味が変わる。 */
  | { kind: "measure_changed" }
  /** 前後どちらかの合計が未公開。 */
  | { kind: "amount_missing" };

export type FiscalTimelineStep = {
  /** 元になった金額セットの ID。並べ替えても変わらない一意な鍵。 */
  id: string;
  eventKind: FiscalEventKind;
  decisionStage: FiscalDecisionStage;
  measure: FiscalMeasure;
  amountYen: string | null;
  asOfDate: string | null;
  /** 改訂を適用した日。資料の基準日とは別の日付なので分けて持つ。 */
  effectiveOn: string | null;
  /** 直前の段階との比較。 */
  comparison: FiscalTimelineComparison;
};

/**
 * イベント種別ごとに、歳出側のどの金額を使うかを決める。
 * 1つの金額セットに歳入と歳出が同居できるため、「歳入以外」のような
 * 消去法で選ぶと、行の並び順次第で歳入を掴んでしまう。
 */
const EXPENDITURE_MEASURE_BY_EVENT_KIND: Record<
  FiscalEventKind,
  FiscalMeasure
> = {
  initial_budget: "expenditure_budget",
  available_budget_snapshot: "expenditure_budget",
  settlement: "expenditure_actual",
};

const TIMELINE_ORDER: { eventKind: FiscalEventKind; order: number }[] = [
  { eventKind: "initial_budget", order: 1 },
  { eventKind: "available_budget_snapshot", order: 2 },
  { eventKind: "settlement", order: 3 },
];

const DECISION_STAGE_ORDER: Record<FiscalDecisionStage, number> = {
  proposed: 0,
  passed: 1,
  not_applicable: 2,
};

function timelineOrder(eventKind: FiscalEventKind): number {
  return (
    TIMELINE_ORDER.find((entry) => entry.eventKind === eventKind)?.order ?? 99
  );
}

/** 基準日を持たない段階は、日付で順序を決められないため後ろに置く。 */
export function compareOptionalDate(
  a: string | null,
  b: string | null
): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

/** 比較結果を付ける前の段階。並べ替えてから、隣どうしを比べる。 */
type FiscalTimelineStepBase = Omit<FiscalTimelineStep, "comparison">;

/** 段階 → 議決段階 → 基準日 → ID の順に並べる。同じ段階が複数あっても順序を固定する。 */
function compareTimelineSteps(
  a: FiscalTimelineStepBase,
  b: FiscalTimelineStepBase
): number {
  return (
    timelineOrder(a.eventKind) - timelineOrder(b.eventKind) ||
    DECISION_STAGE_ORDER[a.decisionStage] -
      DECISION_STAGE_ORDER[b.decisionStage] ||
    compareOptionalDate(a.asOfDate, b.asOfDate) ||
    a.id.localeCompare(b.id)
  );
}

/** 直前の段階と比べる。引ける段階だけで差額を出し、引けない理由は残す。 */
function compareWithPrevious(
  previous: FiscalTimelineStepBase | undefined,
  step: FiscalTimelineStepBase
): FiscalTimelineComparison {
  // 予算と決算は同じ会計でも意味が違う。単純に引けない。
  if (!previous) return { kind: "no_previous" };
  if (previous.measure !== step.measure) return { kind: "measure_changed" };
  if (previous.amountYen === null || step.amountYen === null) {
    return { kind: "amount_missing" };
  }
  return {
    kind: "computed",
    deltaYen: (
      parseYen(step.amountYen) - parseYen(previous.amountYen)
    ).toString(),
  };
}

/**
 * 歳出の金額セットを「当初予算 → 予算現額 → 決算」の順に並べる。
 * 合計行が無い（または額が未公開の）段階も、抜けを隠さずそのまま並べる。
 */
export function buildExpenditureTimeline(
  amountSets: FiscalAmountSet[]
): FiscalTimelineStep[] {
  const steps = amountSets
    .flatMap((amountSet): FiscalTimelineStepBase[] => {
      const measure = EXPENDITURE_MEASURE_BY_EVENT_KIND[amountSet.eventKind];
      // 歳入しか持たないセットは、歳出の流れに置く位置が無い。
      if (!measuresOf(amountSet).includes(measure)) return [];
      return [
        {
          id: amountSet.id,
          eventKind: amountSet.eventKind,
          decisionStage: amountSet.decisionStage,
          measure,
          amountYen: totalLineOf(amountSet, measure)?.amountYen ?? null,
          asOfDate: amountSet.asOfDate,
          effectiveOn: amountSet.effectiveOn,
        },
      ];
    })
    .sort(compareTimelineSteps);

  return steps.map((step, index) => ({
    ...step,
    comparison: compareWithPrevious(steps[index - 1], step),
  }));
}
