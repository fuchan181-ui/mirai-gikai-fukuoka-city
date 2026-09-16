import type {
  FiscalAmountSet,
  FiscalDecisionStage,
  FiscalEventKind,
  FiscalMeasure,
} from "../types/fiscal-amount";
import {
  buildBreakdown,
  buildExpenditureTimeline,
  type FiscalBreakdown,
  type FiscalTimelineStep,
  measuresOf,
  totalLineOf,
} from "./build-fiscal-summary";

/** 同じ種類・段階の金額セットが複数あるときは、議決を経た段階を優先する。 */
const STAGE_PRIORITY: FiscalDecisionStage[] = [
  "passed",
  "proposed",
  "not_applicable",
];

/**
 * 指定した種類の金額を持つ金額セットを1つ選ぶ。
 * 提案段階と可決後が並ぶ年度では可決後を使い、二重計上しない。
 * 同じ議決段階が複数ある年度（期中と年度末の予算現額など）では、
 * 基準日が最も新しいものを使う。選び方が並び順に左右されないようにする。
 */
export function pickAmountSet(
  amountSets: FiscalAmountSet[],
  eventKind: FiscalEventKind,
  measure: FiscalMeasure
): FiscalAmountSet | null {
  for (const decisionStage of STAGE_PRIORITY) {
    const candidates = amountSets.filter(
      (amountSet) =>
        amountSet.eventKind === eventKind &&
        amountSet.decisionStage === decisionStage &&
        measuresOf(amountSet).includes(measure)
    );
    const latest = pickLatestByAsOfDate(candidates);
    if (latest) return latest;
  }
  return null;
}

/**
 * 基準日が新しい順。基準日を持たないものは日付で比べられないため、
 * 並び順の向きによらず最後に回す。
 */
function compareAsOfDateDesc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a > b ? -1 : 1;
}

/**
 * 基準日が最も新しいものを返す。基準日が同じときは ID で決め、
 * 入力順に依存させない。
 */
function pickLatestByAsOfDate(
  amountSets: FiscalAmountSet[]
): FiscalAmountSet | null {
  const [latest] = [...amountSets].sort(
    (a, b) =>
      compareAsOfDateDesc(a.asOfDate, b.asOfDate) || a.id.localeCompare(b.id)
  );
  return latest ?? null;
}

/**
 * 基準日が年度末（翌年3月31日）かどうか。会計年度は4月1日から翌年3月31日まで。
 * 年度末より前の基準日の額を「年度末の予算現額」と呼ぶと、事実と食い違う。
 */
export function isFiscalYearEnd(
  asOfDate: string | null,
  fiscalYear: number
): boolean {
  return asOfDate === `${fiscalYear + 1}-03-31`;
}

/** 指定した種類の合計額。合計が未公開なら null。 */
export function totalOf(
  amountSet: FiscalAmountSet | null,
  measure: FiscalMeasure
): string | null {
  return amountSet === null
    ? null
    : (totalLineOf(amountSet, measure)?.amountYen ?? null);
}

export type FiscalHighlight = {
  key: string;
  label: string;
  amountYen: string | null;
  /** 予算現額のように基準日のある数字だけ入る。 */
  asOfDate: string | null;
  note: string;
  /** まだ議決されていない案か、議決済みか。見出しの注記に使う。 */
  decisionStage: FiscalDecisionStage;
};

export type FiscalYearView = {
  fiscalYear: number;
  /** 予算から決算までの流れ。合計が無い段階も抜けを隠さず並べる。 */
  timeline: FiscalTimelineStep[];
  highlights: FiscalHighlight[];
  revenueBudget: FiscalBreakdown | null;
  expenditureBudget: FiscalBreakdown | null;
  expenditureActual: FiscalBreakdown | null;
};

/**
 * 年度の要点だけを組み立てる。年度一覧のように内訳を出さない画面でも使う。
 * 値が無い段階はカードを作らず、「0円」と区別する。
 */
export function buildFiscalYearHighlights(
  fiscalYear: number,
  amountSets: FiscalAmountSet[]
): FiscalHighlight[] {
  const revenueBudgetSet = pickAmountSet(
    amountSets,
    "initial_budget",
    "revenue_budget"
  );
  const expenditureBudgetSet = pickAmountSet(
    amountSets,
    "initial_budget",
    "expenditure_budget"
  );
  const snapshotSet = pickAmountSet(
    amountSets,
    "available_budget_snapshot",
    "expenditure_budget"
  );
  const settlementSet = pickAmountSet(
    amountSets,
    "settlement",
    "expenditure_actual"
  );

  const highlights: FiscalHighlight[] = [];
  if (revenueBudgetSet) {
    highlights.push({
      key: "revenue-budget",
      label: "歳入予算",
      amountYen: totalOf(revenueBudgetSet, "revenue_budget"),
      asOfDate: null,
      note: initialBudgetNote(revenueBudgetSet.decisionStage, "歳入"),
      decisionStage: revenueBudgetSet.decisionStage,
    });
  }
  if (expenditureBudgetSet) {
    highlights.push({
      key: "expenditure-budget",
      label: "歳出予算",
      amountYen: totalOf(expenditureBudgetSet, "expenditure_budget"),
      asOfDate: null,
      note: initialBudgetNote(expenditureBudgetSet.decisionStage, "歳出"),
      decisionStage: expenditureBudgetSet.decisionStage,
    });
  }
  if (snapshotSet) {
    const isYearEnd = isFiscalYearEnd(snapshotSet.asOfDate, fiscalYear);
    highlights.push({
      key: "available-budget",
      label: isYearEnd ? "年度末の予算現額" : "予算現額",
      amountYen: totalOf(snapshotSet, "expenditure_budget"),
      asOfDate: snapshotSet.asOfDate,
      note: isYearEnd
        ? "補正予算や流用を反映した後の、年度末時点の予算額です。"
        : "補正予算や流用を反映した後の、基準日時点の予算額です。",
      decisionStage: snapshotSet.decisionStage,
    });
  }
  if (settlementSet) {
    highlights.push({
      key: "expenditure-actual",
      label: "歳出決算",
      amountYen: totalOf(settlementSet, "expenditure_actual"),
      asOfDate: null,
      note: "その年度に支出が確定した額です。",
      decisionStage: settlementSet.decisionStage,
    });
  }

  return highlights;
}

/**
 * 公開済みの金額セットを、年度ページで使う view model へ組み替える。
 * 値が無い段階はカードを作らず、内訳も null にして「0円」と区別する。
 */
export function buildFiscalYearView(
  fiscalYear: number,
  amountSets: FiscalAmountSet[]
): FiscalYearView {
  const revenueBudgetSet = pickAmountSet(
    amountSets,
    "initial_budget",
    "revenue_budget"
  );
  const expenditureBudgetSet = pickAmountSet(
    amountSets,
    "initial_budget",
    "expenditure_budget"
  );
  const settlementSet = pickAmountSet(
    amountSets,
    "settlement",
    "expenditure_actual"
  );

  return {
    fiscalYear,
    timeline: buildExpenditureTimeline(amountSets),
    highlights: buildFiscalYearHighlights(fiscalYear, amountSets),
    revenueBudget: revenueBudgetSet
      ? buildBreakdown(revenueBudgetSet, "revenue_budget")
      : null,
    expenditureBudget: expenditureBudgetSet
      ? buildBreakdown(expenditureBudgetSet, "expenditure_budget")
      : null,
    expenditureActual: settlementSet
      ? buildBreakdown(settlementSet, "expenditure_actual")
      : null,
  };
}

/**
 * 当初予算の合計を説明する文。まだ議決されていない案を「決めた」と
 * 書いてしまわないよう、議決段階で言い分ける。
 */
function initialBudgetNote(
  decisionStage: FiscalDecisionStage,
  subject: string
): string {
  return decisionStage === "proposed"
    ? `その年度の当初予算として提案されている案に計上された${subject}の合計です。まだ議会で議決されていません。`
    : `その年度の当初予算として議決された${subject}の合計です。`;
}

/**
 * 当初予算の内訳を説明する文。合計と同じく、議決段階で言い分ける。
 * purpose には「何にいくら使う」のような、内訳が示す内容を渡す。
 */
export function initialBudgetBreakdownDescription(
  decisionStage: FiscalDecisionStage,
  purpose: string
): string {
  return decisionStage === "proposed"
    ? `その年度の当初予算として提案されている案で、${purpose}としているかの内訳です。まだ議会で議決されていません。`
    : `その年度の当初予算で、${purpose}と決めたかの内訳です。`;
}
