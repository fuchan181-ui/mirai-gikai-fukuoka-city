import {
  FISCAL_COMPARISON_STAGE_LABELS,
  type FiscalComparison,
  type FiscalComparisonStage,
} from "./build-fiscal-comparison";
import type { TreemapItem } from "./build-treemap-layout";
import {
  calculateSharePercent,
  compareYen,
  parseYen,
  ZERO,
} from "./format-yen";

/**
 * 構成バーとタイル（ツリーマップ）のための計算。
 * 金額そのものは変えず「どの額を面の大きさの基準にするか」だけを決める。
 */

export type FiscalCompositionSegment = {
  key: string;
  /** 款の名前。 */
  label: string;
  amountYen: string;
  /**
   * 画面に出す構成比（%）。表の「構成比」と同じ計算・同じ丸め（小数第1位）。
   * 丸めた値なので、そのまま面の大きさには使わない。0.05% 未満の額は
   * 0.0% になり、面が消えてしまうため、面には金額そのものを使う。
   */
  areaPercent: number;
};

export type FiscalComposition = {
  stage: FiscalComparisonStage;
  /** その段階の名前。「決算」「当初予算」など。 */
  stageLabel: string;
  /** その段階の総額。未公開なら null。 */
  totalAmountYen: string | null;
  /** 構成比と面の大きさの基準にした額。総額か、公開できている内訳の合計。 */
  basisAmountYen: string;
  /**
   * まだ内訳を出せていない額。総額が分かっている段階だけ入り、
   * 内訳がそろっていれば 0。総額そのものが未公開の段階は null。
   */
  missingAmountYen: string | null;
  segments: FiscalCompositionSegment[];
  /**
   * 内訳を出せていない割合（%）。総額が分かっている段階だけ入り、
   * 内訳がそろっていれば 0。総額そのものが未公開の段階は null。
   */
  missingPercent: number | null;
  /**
   * 基準が総額そのものか、公開できている内訳の合計か。
   * covered のときは、この図が総額の全部ではないことを画面に書く。
   */
  basis: "total" | "covered";
};

/**
 * 金額の構成比。基準額が 0 でないことを確かめた後に使う。
 * 表と同じ計算にそろえ、同じ額が図と表で違う数字にならないようにする。
 */
function sharePercentOf(amountYen: string, basisAmountYen: string): number {
  const percent = calculateSharePercent(amountYen, basisAmountYen);
  if (percent === null) {
    throw new Error(`構成比の基準額が0円です: ${basisAmountYen}`);
  }
  return percent;
}

/**
 * ある段階の額を、面の大きさに変換する。
 * 総額が分かる段階は総額を分母にし、足りない分を missingPercent として残す。
 * 総額そのものが未公開の段階だけ、公開できている分を 100% として並べる。
 * どちらも、分からない額を足して総額に見せることはしない。
 */
export function buildFiscalComposition(
  comparison: FiscalComparison,
  stage: FiscalComparisonStage = comparison.shareStage
): FiscalComposition | null {
  const entries = comparison.rows.flatMap((row) => {
    const amountYen = row.amounts[stage];
    if (amountYen === null || parseYen(amountYen) <= ZERO) return [];
    return [{ row, amountYen }];
  });
  if (entries.length === 0) return null;

  const total = comparison.totals[stage];
  const coveredYen = parseYen(comparison.covered[stage]);
  const basis: FiscalComposition["basis"] =
    total === null ? "covered" : "total";
  const basisYen = total === null ? coveredYen : parseYen(total);
  if (basisYen <= ZERO) return null;
  const basisAmount = basisYen.toString();

  // 額の大きい順。分母が同じなので、額の大小がそのまま面の大小になる。
  const segments = entries
    .sort((a, b) => compareYen(b.amountYen, a.amountYen))
    .map(
      ({ row, amountYen }): FiscalCompositionSegment => ({
        key: row.classificationKey,
        label: row.label,
        amountYen,
        areaPercent: sharePercentOf(amountYen, basisAmount),
      })
    );

  const missingYen = basisYen - coveredYen;

  return {
    stage,
    stageLabel: FISCAL_COMPARISON_STAGE_LABELS[stage],
    totalAmountYen: total,
    basisAmountYen: basisAmount,
    missingAmountYen:
      basis === "covered"
        ? null
        : missingYen > ZERO
          ? missingYen.toString()
          : "0",
    segments,
    missingPercent:
      basis === "covered"
        ? null
        : missingYen > ZERO
          ? sharePercentOf(missingYen.toString(), basisAmount)
          : 0,
    basis,
  };
}

/**
 * 帯の幅（%）。款の額のあとに、まだ取り込めていない分を並べて、合計を100にそろえる。
 * 丸めた構成比から作ると、0.0% になった款の色が消え、合計も100からずれる。
 * 額そのものから作れば、どんなに小さくても色が残る。
 */
export function toBarWidths(
  segments: FiscalCompositionSegment[],
  missingAmountYen: string | null
): number[] {
  const weights = [
    ...segments.map((segment) => Number(parseYen(segment.amountYen))),
    Number(parseYen(missingAmountYen ?? "0")),
  ];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return weights.map(() => 0);
  return weights.map((weight) => (weight / total) * 100);
}

/**
 * タイルに敷く区画。面積は金額そのものに比例させる。
 * 丸めた構成比を渡すと、0.0% になった款のタイルが置かれず、
 * 額があるのに図から消えてしまう。
 */
export function toTreemapTiles(
  segments: FiscalCompositionSegment[],
  missingAmountYen: string | null
): TreemapItem[] {
  const tiles: TreemapItem[] = segments.map((segment) => ({
    key: segment.key,
    value: Number(parseYen(segment.amountYen)),
  }));

  // 内訳がそろっている段階に、額0のタイルは置かない。
  const missingYen = parseYen(missingAmountYen ?? "0");
  if (missingAmountYen !== null && missingYen > ZERO) {
    tiles.push({ key: MISSING_TILE_KEY, value: Number(missingYen) });
  }
  return tiles;
}

/** まだ取り込めていない部分を表す、款ではないタイルの印。 */
export const MISSING_TILE_KEY = "__missing__";

/**
 * ツリーマップのタイルに款名を置けるかどうか。
 * 狭いタイルに文字を重ねると読めなくなるため、一定の広さを持つタイルだけに出す。
 */
export function shouldShowTileLabel(areaPercent: number): boolean {
  return areaPercent >= 3;
}

/**
 * ツリーマップのタイルに構成比を置けるかどうか。
 * 数字は款名より幅を取るため、一定の広さを持つタイルだけに出す。
 */
export function shouldShowTileShare(areaPercent: number): boolean {
  return areaPercent >= 7;
}

/**
 * ツリーマップのタイルに金額を置けるかどうか。
 * 金額は構成比より長いため、いちばん大きないくつかの款に限る。
 */
export function shouldShowTileAmount(areaPercent: number): boolean {
  return areaPercent >= 15;
}

/** まとめた款を表す、款ではない区画の印。 */
export const OTHER_SEGMENTS_KEY = "__other__";

/** まとめたあとの区画と、まとめた款の数。 */
export type GroupedSegments = {
  segments: FiscalCompositionSegment[];
  /** まとめた款の数。0 ならまとめていない。 */
  groupedCount: number;
};

/**
 * 残す款を keepKeys で指定して、それ以外を1つの区画にまとめる。
 * 額は足し合わせるだけで、分からない額を補うことはしない。
 * 段階をまたいで同じ款を残せるよう、上限ではなくキーで指定する。
 * まとめた区画の構成比は、足した額から出し直す。丸めた構成比を足し合わせると、
 * まとめる件数が多いほど誤差が積み上がるため。
 */
export function groupSegments(
  segments: FiscalCompositionSegment[],
  keepKeys: ReadonlySet<string>,
  basisAmountYen: string
): GroupedSegments {
  const kept = segments.filter((segment) => keepKeys.has(segment.key));
  const rest = segments.filter((segment) => !keepKeys.has(segment.key));
  if (rest.length === 0) {
    return { segments: kept, groupedCount: 0 };
  }

  const groupedAmountYen = rest
    .reduce((sum, segment) => sum + parseYen(segment.amountYen), ZERO)
    .toString();

  return {
    segments: [
      ...kept,
      {
        key: OTHER_SEGMENTS_KEY,
        label: "その他の款",
        amountYen: groupedAmountYen,
        areaPercent: sharePercentOf(groupedAmountYen, basisAmountYen),
      },
    ],
    groupedCount: rest.length,
  };
}

/** ツリーマップの説明文を置けるだけの広さがあるかどうか。 */
export function shouldShowMissingLabel(missingPercent: number): boolean {
  return missingPercent >= 8;
}

/** 帯とタイルに色を当てるための、段階をまたいだ款の整理。 */
export type CompositionPlan = {
  /** 色を当てる款。並び順がそのまま色の番号になる。 */
  coloredKeys: string[];
  /** 色を当てず、1つの区画にまとめた款。 */
  groupedKeys: string[];
  /** 内訳を出す段階。段階が1つも無ければ null。 */
  detailStage: FiscalComparisonStage | null;
  /** 段階ごとの区画。まとめた款は1つに足し合わせてある。 */
  bars: { composition: FiscalComposition; grouped: GroupedSegments }[];
  /** 款のキーから名前。 */
  labels: Map<string, string>;
};

/** 何も描けないときの計画。共有すると壊れたときに全リクエストへ波及するため、毎回作る。 */
function createEmptyCompositionPlan(): CompositionPlan {
  return {
    coloredKeys: [],
    groupedKeys: [],
    detailStage: null,
    bars: [],
    labels: new Map(),
  };
}

/**
 * 段階ごとの内訳から、色を当てる款とまとめる款を決める。
 * 内訳を出す段階の並びを先にし、上限を超えた款はすべての段階でまとめる。
 * こうすると、同じ款は必ず同じ色になり、違う款が同じ色になることはない。
 * 色数は色の表を持っている側から渡す。表の長さと上限がずれないようにするため。
 */
export function buildCompositionPlan(
  compositions: FiscalComposition[],
  detailStage: FiscalComparisonStage,
  colorLimit: number
): CompositionPlan {
  const detail =
    compositions.find((composition) => composition.stage === detailStage) ??
    compositions[compositions.length - 1];
  if (detail === undefined) return createEmptyCompositionPlan();

  const ordered: string[] = [];
  for (const composition of [detail, ...compositions]) {
    for (const segment of composition.segments) {
      if (!ordered.includes(segment.key)) ordered.push(segment.key);
    }
  }

  const coloredKeys = ordered.slice(0, colorLimit);
  const keepKeys = new Set(coloredKeys);
  return {
    coloredKeys,
    groupedKeys: ordered.filter((key) => !keepKeys.has(key)),
    detailStage: detail.stage,
    bars: compositions.map((composition) => ({
      composition,
      grouped: groupSegments(
        composition.segments,
        keepKeys,
        composition.basisAmountYen
      ),
    })),
    labels: new Map(
      compositions.flatMap((composition) =>
        composition.segments.map(
          (segment) => [segment.key, segment.label] as const
        )
      )
    ),
  };
}

/**
 * タイルの割合が何を基準にしているかの説明。
 * 下の表の「構成比」と基準が違うときは、勝手に同じ基準だと言わずに理由を書く。
 */
export function describeTileShareBasis(
  comparison: Pick<FiscalComparison, "shareStage">,
  composition: Pick<FiscalComposition, "stage" | "stageLabel" | "basis">
): string {
  if (composition.basis === "covered") {
    return "総額がまだ公開されていないため、割合は公開できている内訳の合計に対するものです。下の表の「構成比」とは基準が違います。";
  }
  if (composition.stage !== comparison.shareStage) {
    const shareStageLabel =
      FISCAL_COMPARISON_STAGE_LABELS[comparison.shareStage];
    return `${shareStageLabel}は款ごとの額がまだ公開されていないため、${composition.stageLabel}の内訳を出しています。割合は${composition.stageLabel}の総額に対するもので、下の表の「構成比」とは基準が違います。`;
  }
  return "割合は、下の表の「構成比」と同じ基準です。";
}
