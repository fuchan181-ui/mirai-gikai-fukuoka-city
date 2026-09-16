import type { FiscalDecisionStage } from "../types/fiscal-amount";
import {
  type FiscalComparison,
  type FiscalComparisonKind,
  type FiscalComparisonRow,
  type FiscalComparisonStage,
  hasPartialCoverageAt,
} from "./build-fiscal-comparison";
import { formatFiscalYear, isFiscalYearEnd } from "./format-fiscal-year";
import {
  compareYen,
  formatSharePercent,
  formatYenWithUnits,
} from "./format-yen";

/**
 * 金額の表を読まなくても全体像が分かるように、その年度の要点を平易な文にする。
 * 断定できないことは書かない。割合の分母にした段階を文の中でも明示する。
 */
export type FiscalPlainSummary = {
  sentences: string[];
};

export type FiscalPlainSummarySources = {
  fiscalYear: number;
  expenditure: FiscalComparison | null;
  revenue: FiscalComparison | null;
};

/**
 * 構成比の分母を、読者が表に戻らずに分かる言葉にする。
 * 予算の段階と決算とでは、同じ「全体」でも指すものが違う。
 */
function shareSubject(
  kind: FiscalComparisonKind,
  stage: FiscalComparisonStage
): string {
  const onSettlement = stage === "settlement";
  if (kind === "expenditure") {
    return onSettlement ? "支出全体" : "支出予算全体";
  }
  return onSettlement ? "収入全体" : "収入予算全体";
}

/** 順位として並べる1行と、その段階の額。額が未公開の行は順位に置けない。 */
type RankedRow = { row: FiscalComparisonRow; amountYen: string };

/**
 * 構成比の基準にした段階で、額の大きい順に上から数件を取る。
 * 表の並びは決算を先に見るため、段階が変われば並びも変わる。
 * 「最も大きい」と書く以上、ここで段階の額を比べ直す。
 */
function topRankedRows(
  comparison: FiscalComparison,
  count: number
): RankedRow[] {
  return comparison.rows
    .flatMap((row) => {
      const amountYen = row.amounts[comparison.shareStage];
      return amountYen === null ? [] : [{ row, amountYen }];
    })
    .sort((a, b) => compareYen(b.amountYen, a.amountYen))
    .slice(0, count);
}

function describeRow(entry: RankedRow, subject: string): string {
  const share =
    entry.row.sharePercent === null
      ? ""
      : `（${subject}の${formatSharePercent(entry.row.sharePercent)}）`;
  return `${entry.row.label} ${formatYenWithUnits(entry.amountYen)}${share}`;
}

/**
 * 内訳が総額の一部しか無い段階では、順位を全体のものと言い切らない。
 * 何を見て選んだかが分かるよう、文の頭に但し書きを置く。
 */
function rankingLead(comparison: FiscalComparison): string {
  return hasPartialCoverageAt(comparison, comparison.shareStage)
    ? "公開されている内訳では、"
    : "";
}

function rankingSentences(
  comparison: FiscalComparison,
  subject: string
): string[] {
  const kindLabel = comparison.kind === "expenditure" ? "支出" : "収入";
  const lead = rankingLead(comparison);
  const top = topRankedRows(comparison, 3);

  if (top.length === 3) {
    const [first, second, third] = top;
    return [
      `${lead}${kindLabel}で最も大きいのは${describeRow(
        first,
        subject
      )}で、次に${describeRow(second, subject)}、${describeRow(
        third,
        subject
      )}が続きます。`,
    ];
  }
  if (top.length > 0) {
    return [
      `${lead}${kindLabel}の内訳は、${top
        .map((entry) => describeRow(entry, subject))
        .join("、")}です。`,
    ];
  }
  return [];
}

/**
 * 支出の規模。内訳と同じ段階の額を使い、
 * どの段階の額を読んでいるかを文の中で言い分ける。
 */
function expenditureLead(
  comparison: FiscalComparison,
  fiscalYear: number
): string[] {
  const { initial_budget, available_budget, settlement } = comparison.totals;
  const year = formatFiscalYear(fiscalYear);
  const proposed = comparison.decisionStage === "proposed";
  const proposedNote = proposed
    ? ["この予算案は、まだ議会で議決されていません。"]
    : [];

  if (comparison.shareStage === "settlement" && settlement !== null) {
    if (available_budget === null) {
      return [
        `${year}に支出が確定したのは、${formatYenWithUnits(settlement)}です。`,
      ];
    }
    const rate =
      comparison.totalProgressPercent === null
        ? ""
        : `（執行率 ${formatSharePercent(comparison.totalProgressPercent)}）`;
    // 年度末より前の基準日を「年度末」と呼ばない。
    const availableLabel = isFiscalYearEnd(
      comparison.availableBudgetAsOfDate,
      fiscalYear
    )
      ? "年度末の予算現額"
      : "予算現額";
    return [
      `${year}は、${availableLabel} ${formatYenWithUnits(
        available_budget
      )}のうち、${formatYenWithUnits(settlement)}を支出しました${rate}。`,
    ];
  }

  if (
    comparison.shareStage === "available_budget" &&
    available_budget !== null
  ) {
    return [
      `${year}は、補正を反映した予算現額で、歳出に${formatYenWithUnits(
        available_budget
      )}を計上しています。`,
      ...proposedNote,
    ];
  }

  if (initial_budget !== null) {
    // 議決済みの当初予算を「案」と呼ばない。
    return [
      `${year}の当初予算${
        proposed ? "案" : ""
      }では、歳出に${formatYenWithUnits(initial_budget)}を計上しています。`,
      ...proposedNote,
    ];
  }

  return [];
}

/** 収入の規模を、どの段階の額かを言い分けて1文にする。 */
function revenueLead(
  amountYen: string,
  stage: FiscalComparisonStage,
  decisionStage: FiscalDecisionStage | null
): string {
  switch (stage) {
    case "settlement":
      return `収入では、${formatYenWithUnits(amountYen)}を受け入れました。`;
    case "available_budget":
      return `収入は、補正を反映した予算現額で${formatYenWithUnits(
        amountYen
      )}を見込んでいます。`;
    case "initial_budget":
      return `収入は、当初予算${
        decisionStage === "proposed" ? "案" : ""
      }で${formatYenWithUnits(amountYen)}を見込んでいます。`;
  }
}

/**
 * 年度の要点を3〜4文にまとめる。比較できる金額が1つも無いときは空を返し、
 * 画面は要約の枠ごと出さない。
 */
export function buildFiscalPlainSummary({
  fiscalYear,
  expenditure,
  revenue,
}: FiscalPlainSummarySources): FiscalPlainSummary {
  const sentences: string[] = [];

  if (expenditure) {
    sentences.push(...expenditureLead(expenditure, fiscalYear));
    sentences.push(
      ...rankingSentences(
        expenditure,
        shareSubject("expenditure", expenditure.shareStage)
      )
    );
  }

  if (revenue) {
    const total = revenue.totals[revenue.shareStage];
    if (total !== null) {
      sentences.push(
        revenueLead(total, revenue.shareStage, revenue.decisionStage)
      );
      const top = topRankedRows(revenue, 1);
      if (top.length > 0) {
        sentences.push(
          `${rankingLead(revenue)}収入で最も大きいのは${describeRow(
            top[0],
            shareSubject("revenue", revenue.shareStage)
          )}です。`
        );
      }
    }
  }

  return { sentences };
}
