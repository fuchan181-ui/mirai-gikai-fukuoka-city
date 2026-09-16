import "server-only";
import type { FiscalComparison } from "../../shared/utils/build-fiscal-comparison";
import {
  buildCompositionPlan,
  buildFiscalComposition,
  type CompositionPlan,
  describeTileShareBasis,
  MISSING_TILE_KEY,
  shouldShowMissingLabel,
  shouldShowTileAmount,
  shouldShowTileLabel,
  shouldShowTileShare,
  toBarWidths,
  toTreemapTiles,
} from "../../shared/utils/build-fiscal-composition";
import { buildTreemapLayout } from "../../shared/utils/build-treemap-layout";
import {
  formatSharePercent,
  formatYenWithUnits,
} from "../../shared/utils/format-yen";

/**
 * 款ごとの額を、帯とタイルの2つの図で見せる。
 * 帯は段階ごとの配分の移り変わり、タイルは内訳の大きさを伝える。
 * 色は款に結び付けて、段階が変わっても同じ款が同じ色になるようにする。
 */

/**
 * 帯とタイルの色。款は5色では足りないため、3段階の濃さを掛けて15通りにする。
 * 先頭ほど濃く、額の大きい款ほど目に留まるようにする。
 * 別々の表にすると片方だけ増やしたときにずれるため、1つの表にまとめる。
 * この表の長さが、そのまま色で見分けられる款の数になる。
 */
const COMPOSITION_COLORS = [
  {
    bar: "bg-chart-1",
    tile: "border-chart-1/40 bg-linear-to-b from-chart-1/35 to-chart-1/10",
  },
  {
    bar: "bg-chart-2",
    tile: "border-chart-2/40 bg-linear-to-b from-chart-2/35 to-chart-2/10",
  },
  {
    bar: "bg-chart-3",
    tile: "border-chart-3/40 bg-linear-to-b from-chart-3/35 to-chart-3/10",
  },
  {
    bar: "bg-chart-4",
    tile: "border-chart-4/40 bg-linear-to-b from-chart-4/35 to-chart-4/10",
  },
  {
    bar: "bg-chart-5",
    tile: "border-chart-5/40 bg-linear-to-b from-chart-5/35 to-chart-5/10",
  },
  {
    bar: "bg-chart-1/65",
    tile: "border-chart-1/35 bg-linear-to-b from-chart-1/22 to-chart-1/5",
  },
  {
    bar: "bg-chart-2/65",
    tile: "border-chart-2/35 bg-linear-to-b from-chart-2/22 to-chart-2/5",
  },
  {
    bar: "bg-chart-3/65",
    tile: "border-chart-3/35 bg-linear-to-b from-chart-3/22 to-chart-3/5",
  },
  {
    bar: "bg-chart-4/65",
    tile: "border-chart-4/35 bg-linear-to-b from-chart-4/22 to-chart-4/5",
  },
  {
    bar: "bg-chart-5/65",
    tile: "border-chart-5/35 bg-linear-to-b from-chart-5/22 to-chart-5/5",
  },
  {
    bar: "bg-chart-1/40",
    tile: "border-chart-1/30 bg-linear-to-b from-chart-1/14 to-chart-1/5",
  },
  {
    bar: "bg-chart-2/40",
    tile: "border-chart-2/30 bg-linear-to-b from-chart-2/14 to-chart-2/5",
  },
  {
    bar: "bg-chart-3/40",
    tile: "border-chart-3/30 bg-linear-to-b from-chart-3/14 to-chart-3/5",
  },
  {
    bar: "bg-chart-4/40",
    tile: "border-chart-4/30 bg-linear-to-b from-chart-4/14 to-chart-4/5",
  },
  {
    bar: "bg-chart-5/40",
    tile: "border-chart-5/30 bg-linear-to-b from-chart-5/14 to-chart-5/5",
  },
] as const;

/** まとめた款の色。款ではないため、どの款の色とも重ねない。 */
const OTHER_COLOR = {
  bar: "bg-mirai-text-note/35",
  tile: "border-mirai-text-note/25 bg-mirai-surface-muted",
} as const;

/**
 * まだ取り込めていない部分の色。まとめた款と同じ灰色にすると見分けられないため、
 * こちらは薄く敷いて点線の枠で囲む。
 */
const MISSING_COLOR = {
  bar: "bg-mirai-surface-muted",
  tile: "border-dashed border-mirai-text-note/40 bg-mirai-surface-muted/40",
} as const;

/** ツリーマップの仮想キャンバス。比率だけが配置に効く。 */
const TREEMAP_WIDTH = 1000;
const TREEMAP_HEIGHT = 560;
const TREEMAP_ASPECT_RATIO = TREEMAP_WIDTH / TREEMAP_HEIGHT;

/**
 * 帯の区画に余白を付ける下限（%）。これより細い区画は、余白が区画の幅を
 * 食い尽くして色が見えなくなるため、余白なしで描く。
 */
const BAR_GAP_MIN_WIDTH_PERCENT = 1;

type CompositionColor =
  | (typeof COMPOSITION_COLORS)[number]
  | typeof OTHER_COLOR;

type PreparedCompositionCharts = {
  plan: CompositionPlan;
  /** 款のキーから色。色を当てていない款は「その他の款」の色にする。 */
  colorOf: (key: string) => CompositionColor;
};

/**
 * 段階ごとの内訳から、色とまとめ方を決める。
 * 段階が1つも無ければ描くものが無いため null を返す。
 */
function prepareCompositionCharts(
  comparison: FiscalComparison
): PreparedCompositionCharts | null {
  const stageCompositions = comparison.stages.flatMap((stage) => {
    const composition = buildFiscalComposition(comparison, stage);
    return composition === null ? [] : [composition];
  });
  if (stageCompositions.length === 0) return null;

  const plan = buildCompositionPlan(
    stageCompositions,
    comparison.shareStage,
    COMPOSITION_COLORS.length
  );
  // 色の上限は色の表の長さそのものなので、色を当てた款には必ず色がある。
  const colorByKey = new Map(
    plan.coloredKeys.map(
      (key, index) => [key, COMPOSITION_COLORS[index]] as const
    )
  );

  return { plan, colorOf: (key) => colorByKey.get(key) ?? OTHER_COLOR };
}

type FiscalCompositionChartsProps = {
  comparison: FiscalComparison;
};

export function FiscalCompositionCharts({
  comparison,
}: FiscalCompositionChartsProps) {
  const charts = prepareCompositionCharts(comparison);
  if (charts === null) return null;

  return (
    <div className="space-y-4">
      <CompositionBars charts={charts} />
      <CompositionTreemap comparison={comparison} charts={charts} />
    </div>
  );
}

/** 段階ごとの帯を積み上げ、款の配分がどう移ったかを見せる。 */
function CompositionBars({ charts }: { charts: PreparedCompositionCharts }) {
  const { plan, colorOf } = charts;
  const hasMissing = plan.bars.some(
    (bar) =>
      bar.composition.missingPercent !== null &&
      bar.composition.missingPercent > 0
  );
  const hasCoveredBasis = plan.bars.some(
    (bar) => bar.composition.basis === "covered"
  );

  return (
    <div className="rounded-xl border bg-card p-5 shadow">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-mirai-text">
          款ごとの配分と、その移り変わり
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          帯の長さが、その段階の総額のうちの割合を表します。同じ色は同じ款です。段階を追うと、配分がどう動いたかを見比べられます。
        </p>
      </div>

      <dl className="mt-4 space-y-3">
        {plan.bars.map(({ composition, grouped }) => {
          const widths = toBarWidths(
            grouped.segments,
            composition.missingAmountYen
          );
          // 並びの最後が、まだ取り込めていない部分。
          const missingWidth = widths[widths.length - 1] ?? 0;

          return (
            <div
              key={composition.stage}
              className="grid grid-cols-1 gap-1 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-4"
            >
              <dt className="text-sm">
                <span className="font-medium text-mirai-text">
                  {composition.stageLabel}
                </span>
                <span className="ml-2 tabular-nums text-mirai-text-note sm:ml-0 sm:block">
                  {composition.totalAmountYen === null
                    ? "総額は未公開"
                    : formatYenWithUnits(composition.totalAmountYen)}
                </span>
              </dt>
              <dd>
                <div
                  aria-hidden
                  className="flex h-7 w-full overflow-hidden rounded-md bg-mirai-surface-grouped"
                >
                  {grouped.segments.map((segment, index) => (
                    <BarSegment
                      key={segment.key}
                      widthPercent={widths[index] ?? 0}
                      className={colorOf(segment.key).bar}
                    />
                  ))}
                  {missingWidth > 0 ? (
                    <BarSegment
                      widthPercent={missingWidth}
                      className={MISSING_COLOR.bar}
                    />
                  ) : null}
                </div>
              </dd>
            </div>
          );
        })}
      </dl>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3">
        {plan.coloredKeys.map((key) => (
          <li
            key={key}
            className="flex items-center gap-1.5 text-xs text-mirai-text-note"
          >
            <span
              aria-hidden
              className={`size-3 shrink-0 rounded-xs ${colorOf(key).bar}`}
            />
            {plan.labels.get(key) ?? key}
          </li>
        ))}
        {plan.groupedKeys.length > 0 ? (
          <li className="flex items-center gap-1.5 text-xs text-mirai-text-note">
            <span
              aria-hidden
              className={`size-3 shrink-0 rounded-xs ${OTHER_COLOR.bar}`}
            />
            その他の款（{plan.groupedKeys.length}件）
          </li>
        ) : null}
        {hasMissing ? (
          <li className="flex items-center gap-1.5 text-xs text-mirai-text-note">
            <span
              aria-hidden
              className={`size-3 shrink-0 rounded-xs ${MISSING_COLOR.bar}`}
            />
            まだ取り込めていない部分
          </li>
        ) : null}
      </ul>

      {plan.groupedKeys.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          款が多いため、額の小さい{plan.groupedKeys.length}
          件は「その他の款」にまとめています。款ごとの額は下の表でご確認ください。
        </p>
      ) : null}

      {hasCoveredBasis ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          総額が未公開の段階は、公開できている内訳の合計を100%として描いています。総額そのものが分からないため、足りない分は示せません。
        </p>
      ) : null}
    </div>
  );
}

/** 帯の1区画。幅は帯の幅に対する割合（%）。 */
function BarSegment({
  widthPercent,
  className,
}: {
  widthPercent: number;
  className: string;
}) {
  return (
    <div
      style={{ width: `${widthPercent}%` }}
      className={
        widthPercent < BAR_GAP_MIN_WIDTH_PERCENT ? "h-full" : "h-full p-px"
      }
    >
      <div className={`h-full rounded-xs ${className}`} />
    </div>
  );
}

/** 内訳を、面積の大きさで見せる。 */
function CompositionTreemap({
  comparison,
  charts,
}: {
  comparison: FiscalComparison;
  charts: PreparedCompositionCharts;
}) {
  const { plan, colorOf } = charts;
  const detailBar =
    plan.bars.find((bar) => bar.composition.stage === plan.detailStage) ??
    plan.bars[plan.bars.length - 1];
  if (detailBar === undefined) return null;

  const detail = detailBar.composition;
  const segments = detailBar.grouped.segments;
  const segmentByKey = new Map(
    segments.map((segment) => [segment.key, segment] as const)
  );
  const tiles = buildTreemapLayout(
    toTreemapTiles(segments, detail.missingAmountYen),
    TREEMAP_WIDTH,
    TREEMAP_HEIGHT
  );

  return (
    <div className="rounded-xl border bg-card p-5 shadow">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-mirai-text">
          {detail.stageLabel}の内訳を、面積で見る
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          タイルの面積が金額の大きさを表します。額の大きい款から順に並べています。
          {describeTileShareBasis(comparison, detail)}
        </p>
      </div>

      <div
        aria-hidden
        style={{ aspectRatio: TREEMAP_ASPECT_RATIO }}
        className="relative mt-4 w-full overflow-hidden rounded-lg bg-mirai-surface-grouped"
      >
        {tiles.map((tile) => {
          const style = {
            left: `${tile.leftPercent}%`,
            top: `${tile.topPercent}%`,
            width: `${tile.widthPercent}%`,
            height: `${tile.heightPercent}%`,
          };

          if (tile.key === MISSING_TILE_KEY) {
            return (
              <div key={tile.key} className="absolute p-[3px]" style={style}>
                <div
                  className={`flex h-full w-full items-center justify-center overflow-hidden rounded-lg border p-2 text-center ${MISSING_COLOR.tile}`}
                >
                  {detail.missingPercent !== null &&
                  shouldShowMissingLabel(detail.missingPercent) ? (
                    <span className="text-xs leading-tight text-mirai-text-note">
                      まだ取り込めていない款
                      {formatSharePercent(detail.missingPercent)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          }

          const segment = segmentByKey.get(tile.key);
          if (segment === undefined) return null;

          const showLabel = shouldShowTileLabel(segment.areaPercent);
          const showShare = shouldShowTileShare(segment.areaPercent);
          const showAmount = shouldShowTileAmount(segment.areaPercent);

          return (
            <div
              key={tile.key}
              className="absolute p-[3px]"
              style={style}
              title={`${segment.label} ${formatYenWithUnits(segment.amountYen)}`}
            >
              {/* 文字は面積だけでなく、実際のタイル幅でも出し分ける。
                  面積があっても細長いタイルでは読めないため。 */}
              <div
                className={`@container flex h-full w-full flex-col overflow-hidden rounded-lg border p-2 ${
                  colorOf(segment.key).tile
                } ${showShare ? "justify-between" : "justify-start"}`}
              >
                {showLabel ? (
                  <span className="hidden truncate text-[10px] font-medium leading-tight text-mirai-text @[64px]:block sm:text-xs">
                    {segment.label}
                  </span>
                ) : null}
                {showShare ? (
                  <span className="hidden text-[11px] font-bold tabular-nums leading-tight text-mirai-text @[54px]:block">
                    {formatSharePercent(segment.areaPercent)}
                    {showAmount && detail.basis === "total" ? (
                      <span className="mt-0.5 hidden font-normal text-mirai-text-note @[160px]:block">
                        {formatYenWithUnits(segment.amountYen)}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <ul className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
        {detailBar.grouped.groupedCount > 0 ? (
          <li>
            灰色のタイルは、額の小さい{detailBar.grouped.groupedCount}
            件をまとめた「その他の款」です。款ごとの額は下の表でご確認ください。
          </li>
        ) : null}
        {detail.missingPercent !== null && detail.missingPercent > 0 ? (
          <li>
            点線の枠のタイルは、まだ内訳を取り込めていない部分
            {formatSharePercent(detail.missingPercent)}
            です。灰色の「その他の款」とは別のものです。
          </li>
        ) : null}
      </ul>
    </div>
  );
}
