import { describe, expect, it } from "vitest";
import {
  buildFiscalComparison,
  type FiscalComparison,
} from "./build-fiscal-comparison";
import {
  buildCompositionPlan,
  buildFiscalComposition,
  describeTileShareBasis,
  type FiscalComposition,
  groupSegments,
  MISSING_TILE_KEY,
  OTHER_SEGMENTS_KEY,
  shouldShowMissingLabel,
  shouldShowTileAmount,
  shouldShowTileLabel,
  shouldShowTileShare,
  toBarWidths,
  toTreemapTiles,
} from "./build-fiscal-composition";
import {
  expenditure2024,
  expenditure2024Sources,
  expenditure2026Proposed,
} from "./fiscal-test-fixtures";
import { parseYen, ZERO } from "./format-yen";

/** 面にした割合の合計。小数第1位で丸める分だけ 100 からずれる。 */
const totalArea = (composition: { segments: { areaPercent: number }[] }) =>
  composition.segments.reduce((sum, segment) => sum + segment.areaPercent, 0);

/** null の時点でテストを失敗させ、以降を非 null として扱う。 */
const requireValue = <T>(value: T | null, message: string): T => {
  if (value === null) throw new Error(message);
  return value;
};

const requireComposition = (composition: FiscalComposition | null) =>
  requireValue(composition, "構成を作れなかった");

/** 段階ごとの内訳。画面と同じ順で並べる。 */
const compositionsOf = (comparison: FiscalComparison) =>
  comparison.stages.flatMap((stage) => {
    const composition = buildFiscalComposition(comparison, stage);
    return composition === null ? [] : [composition];
  });

describe("buildFiscalComposition", () => {
  it("総額が分かる段階は総額を分母にし、届いていない分を残す", () => {
    const composition = buildFiscalComposition(expenditure2024());

    expect(composition).not.toBeNull();
    expect(composition?.stage).toBe("settlement");
    expect(composition?.stageLabel).toBe("決算");
    expect(composition?.basis).toBe("total");
    expect(composition?.totalAmountYen).toBe("92736569118");

    // 公開できている内訳は総額のおよそ55%。残りは足さずに、足りない分として残す。
    expect(composition?.missingPercent).toBeCloseTo(45, 1);
    const built = requireComposition(composition);
    // どちらも丸めた値なので、合計は100から0.1ほどずれる。
    expect(totalArea(built) + (built.missingPercent ?? 0)).toBeCloseTo(100, 0);
  });

  it("内訳がそろっている段階は、届いていない分を0にする", () => {
    const composition = buildFiscalComposition(expenditure2026Proposed());

    expect(composition?.basis).toBe("total");
    expect(composition?.missingPercent).toBe(0);
    expect(composition?.segments[0]?.label).toBe("民生費");
    // 300億 / 390億。表の構成比と同じく小数第1位で丸める。
    expect(composition?.segments[0]?.areaPercent).toBe(76.9);
  });

  it("額の大きい順に並べ、額が0の款には面を持たせない", () => {
    const composition = buildFiscalComposition(expenditure2024());

    expect(composition?.segments.map((segment) => segment.label)).toEqual([
      "民生費",
      "土木費",
      "議会費",
    ]);
    // 決算額が0円の予備費に、面積0の面は置かない。
    expect(
      composition?.segments.some((segment) => segment.label === "予備費")
    ).toBe(false);
  });

  it("面の大きさは総額に対する割合になる", () => {
    const composition = buildFiscalComposition(expenditure2024());
    const welfare = composition?.segments.find(
      (segment) => segment.label === "民生費"
    );

    // 344億5760万5986円 / 927億3656万9118円
    expect(welfare?.areaPercent).toBe(37.2);
  });

  it("面の割合は、表の構成比と同じ数字にする", () => {
    const comparison = expenditure2024();
    const composition = requireComposition(buildFiscalComposition(comparison));

    for (const segment of composition.segments) {
      const row = comparison.rows.find(
        (candidate) => candidate.classificationKey === segment.key
      );
      expect(segment.areaPercent).toBe(row?.sharePercent);
    }
  });

  it("段階を指定すると、その段階の内訳を返す", () => {
    const comparison = expenditure2024();
    const initial = buildFiscalComposition(comparison, "initial_budget");

    expect(initial?.stageLabel).toBe("当初予算");
    expect(initial?.totalAmountYen).toBe("87960000000");
    expect(initial?.missingPercent).toBeCloseTo(44.8, 1);
    // 決算では0円の予備費も、当初予算では額を持つ。
    expect(
      initial?.segments.some((segment) => segment.label === "予備費")
    ).toBe(true);
  });

  it("総額が未公開の段階は、公開できている分だけで100%を作る", () => {
    const sources = expenditure2024Sources();
    const settlement = sources.settlementSet;
    const comparison = buildFiscalComparison("expenditure", {
      ...sources,
      settlementSet:
        settlement === null
          ? null
          : {
              ...settlement,
              lines: settlement.lines.filter(
                (line) => line.classificationKey !== null
              ),
            },
    });

    const composition = buildFiscalComposition(
      requireValue(comparison, "比較を作れなかった"),
      "settlement"
    );

    expect(composition?.basis).toBe("covered");
    expect(composition?.totalAmountYen).toBeNull();
    // 分母が分からないため、足りない分は数にできない。
    expect(composition?.missingPercent).toBeNull();
    expect(totalArea(requireComposition(composition))).toBeCloseTo(100, 0);
  });

  it("金額を持つ款が1件も無ければ null", () => {
    const comparison = expenditure2026Proposed();
    const empty = {
      ...comparison,
      rows: comparison.rows.map((row) => ({
        ...row,
        amounts: { ...row.amounts, initial_budget: null },
      })),
    };

    expect(buildFiscalComposition(empty)).toBeNull();
  });

  it("基準額から公開できている内訳を引いた分が、まだ取り込めていない額になる", () => {
    const composition = requireComposition(
      buildFiscalComposition(expenditure2024())
    );
    const coveredYen = composition.segments.reduce(
      (sum, segment) => sum + parseYen(segment.amountYen),
      ZERO
    );

    expect(parseYen(composition.missingAmountYen ?? "0")).toBe(
      parseYen(composition.basisAmountYen) - coveredYen
    );
  });
});

describe("describeTileShareBasis", () => {
  it("表の構成比と同じ段階・同じ基準なら、同じ基準だと伝える", () => {
    const comparison = expenditure2024();
    const composition = requireComposition(buildFiscalComposition(comparison));

    expect(describeTileShareBasis(comparison, composition)).toBe(
      "割合は、下の表の「構成比」と同じ基準です。"
    );
  });

  it("総額が未公開の段階では、基準が表と違うと伝える", () => {
    const sources = expenditure2024Sources();
    const settlement = sources.settlementSet;
    const comparison = requireValue(
      buildFiscalComparison("expenditure", {
        ...sources,
        settlementSet:
          settlement === null
            ? null
            : {
                ...settlement,
                lines: settlement.lines.filter(
                  (line) => line.classificationKey !== null
                ),
              },
      }),
      "比較を作れなかった"
    );
    const composition = requireComposition(
      buildFiscalComposition(comparison, "settlement")
    );

    expect(composition.basis).toBe("covered");
    expect(describeTileShareBasis(comparison, composition)).toBe(
      "総額がまだ公開されていないため、割合は公開できている内訳の合計に対するものです。下の表の「構成比」とは基準が違います。"
    );
  });

  it("構成比の段階に内訳が無いときは、代わりに出している段階を伝える", () => {
    const comparison = expenditure2024();
    const composition = requireComposition(
      buildFiscalComposition(comparison, "initial_budget")
    );

    expect(composition.stage).not.toBe(comparison.shareStage);
    expect(describeTileShareBasis(comparison, composition)).toBe(
      "決算は款ごとの額がまだ公開されていないため、当初予算の内訳を出しています。割合は当初予算の総額に対するもので、下の表の「構成比」とは基準が違います。"
    );
  });
});

describe("ラベルを置けるかどうか", () => {
  it("タイルは3%以上で款名を出す", () => {
    expect(shouldShowTileLabel(3)).toBe(true);
    expect(shouldShowTileLabel(2.99)).toBe(false);
  });

  it("タイルの構成比は7%以上、金額は15%以上に限る", () => {
    expect(shouldShowTileShare(7)).toBe(true);
    expect(shouldShowTileShare(6.99)).toBe(false);
    expect(shouldShowTileAmount(15)).toBe(true);
    expect(shouldShowTileAmount(14.99)).toBe(false);
    // 構成比を出せない大きさでも、款名は出せる。
    expect(shouldShowTileLabel(5)).toBe(true);
  });

  it("取り込めていない部分は8%以上で説明を出す", () => {
    expect(shouldShowMissingLabel(8)).toBe(true);
    expect(shouldShowMissingLabel(7.99)).toBe(false);
  });
});

describe("toBarWidths", () => {
  const segment = (key: string, amountYen: string) => ({
    key,
    label: key,
    amountYen,
    areaPercent: 0,
  });

  it("金額の比を保ったまま、合計を100にそろえる", () => {
    const widths = toBarWidths(
      [segment("a", "501"), segment("b", "301"), segment("c", "198")],
      "0"
    );

    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 5);
    // 幅の比は変えない。
    expect(widths[0] / widths[1]).toBeCloseTo(501 / 301, 5);
  });

  it("構成比が0.0%に丸められる額でも、幅を0にしない", () => {
    // 3,542万円 / 879億6,000万円 は 0.04%。表の構成比は 0.0% になる。
    const widths = toBarWidths(
      [segment("main", "87960000000"), segment("small", "35420000")],
      "0"
    );

    expect(widths[1]).toBeGreaterThan(0);
  });

  it("まだ取り込めていない分を、最後の区画として足す", () => {
    const widths = toBarWidths([segment("a", "60")], "40");

    expect(widths).toHaveLength(2);
    expect(widths[0]).toBeCloseTo(60, 5);
    expect(widths[1]).toBeCloseTo(40, 5);
  });

  it("額がすべて0のときは、すべて0にする", () => {
    expect(toBarWidths([segment("a", "0")], "0")).toEqual([0, 0]);
  });
});

describe("toTreemapTiles", () => {
  const segment = (key: string, amountYen: string) => ({
    key,
    label: key,
    amountYen,
    areaPercent: 0,
  });

  it("金額そのものを重みにするので、構成比が0.0%に丸められる額も残る", () => {
    const tiles = toTreemapTiles(
      [segment("main", "87960000000"), segment("small", "35420000")],
      "0"
    );

    expect(tiles).toEqual([
      { key: "main", value: 87960000000 },
      { key: "small", value: 35420000 },
    ]);
  });

  it("まだ取り込めていない分は、款とは別の印で足す", () => {
    expect(toTreemapTiles([segment("a", "60")], "40")).toEqual([
      { key: "a", value: 60 },
      { key: MISSING_TILE_KEY, value: 40 },
    ]);
  });

  it("内訳がそろっていれば、額0のタイルを置かない", () => {
    expect(toTreemapTiles([segment("a", "60")], "0")).toEqual([
      { key: "a", value: 60 },
    ]);
  });

  it("総額が未公開の段階は、足りない分を足さない", () => {
    expect(toTreemapTiles([segment("a", "60")], null)).toEqual([
      { key: "a", value: 60 },
    ]);
  });
});

describe("groupSegments", () => {
  const segment = (key: string, amountYen: string, areaPercent: number) => ({
    key,
    label: key,
    amountYen,
    areaPercent,
  });

  it("残す款だけを指定すると、残りをまとめる", () => {
    const segments = [
      segment("a", "500", 50),
      segment("b", "300", 30),
      segment("c", "150", 15),
      segment("d", "50", 5),
    ];

    const grouped = groupSegments(segments, new Set(["a", "b", "c"]), "1000");

    expect(grouped.groupedCount).toBe(1);
    expect(grouped.segments.map((item) => item.key)).toEqual([
      "a",
      "b",
      "c",
      OTHER_SEGMENTS_KEY,
    ]);
    // 額は足すだけで、増やしたり減らしたりしない。
    expect(grouped.segments[3]?.amountYen).toBe("50");
    expect(grouped.segments[3]?.areaPercent).toBeCloseTo(5, 2);
    // 合計はまとめる前と変わらない。
    expect(
      grouped.segments.reduce((sum, item) => sum + item.areaPercent, 0)
    ).toBeCloseTo(100, 2);
  });

  it("すべて残すなら、まとめない", () => {
    const segments = [segment("a", "100", 60), segment("b", "50", 40)];

    expect(groupSegments(segments, new Set(["a", "b"]), "100")).toEqual({
      segments,
      groupedCount: 0,
    });
  });

  it("段階ごとに款が違っても、残す款をそろえられる", () => {
    const segments = [
      segment("a", "100", 60),
      segment("b", "50", 30),
      // ほかの段階にしか無い款。
      segment("d", "10", 5),
      segment("e", "10", 5),
    ];

    const grouped = groupSegments(segments, new Set(["a", "b"]), "170");

    expect(grouped.segments.map((item) => item.key)).toEqual([
      "a",
      "b",
      OTHER_SEGMENTS_KEY,
    ]);
    expect(grouped.groupedCount).toBe(2);
    expect(grouped.segments[2]?.amountYen).toBe("20");
    // まとめた区画の構成比も、足した額から出す。
    expect(grouped.segments[2]?.areaPercent).toBeCloseTo(11.8, 1);
  });
});

describe("buildCompositionPlan", () => {
  it("上限までの款に色を当て、残りはすべての段階でまとめる", () => {
    const compositions = compositionsOf(expenditure2026Proposed());
    const plan = buildCompositionPlan(compositions, "initial_budget", 2);

    expect(plan.coloredKeys).toHaveLength(2);
    expect(plan.detailStage).toBe("initial_budget");
    // 内訳を出す段階の並びが先。いちばん大きい款から色が当たる。
    expect(plan.coloredKeys[0]).toBe(compositions[0]?.segments[0]?.key);

    // 色を当てなかった款は、まとめた款として全部数える。
    const leftover = compositions
      .flatMap((composition) => composition.segments.map((seg) => seg.key))
      .filter((key) => !plan.coloredKeys.includes(key));
    expect(new Set(plan.groupedKeys)).toEqual(new Set(leftover));

    // どの段階も、色を当てた款と「その他の款」だけで描く。
    for (const bar of plan.bars) {
      const keys = bar.grouped.segments.map((segment) => segment.key);
      expect(keys.filter((key) => !plan.coloredKeys.includes(key))).toEqual(
        bar.grouped.groupedCount > 0 ? [OTHER_SEGMENTS_KEY] : []
      );
    }
  });

  it("色を当てた款がすべての段階にあれば、まとめない", () => {
    const plan = buildCompositionPlan(
      compositionsOf(expenditure2024()),
      "settlement",
      15
    );

    expect(plan.groupedKeys).toEqual([]);
    expect(plan.bars.every((bar) => bar.grouped.groupedCount === 0)).toBe(true);
  });

  it("款の名前を、キーから引けるようにする", () => {
    const plan = buildCompositionPlan(
      compositionsOf(expenditure2024()),
      "settlement",
      15
    );

    expect(plan.labels.get("welfare")).toBe("民生費");
  });

  it("段階が1つも無ければ、空の計画を返す", () => {
    expect(buildCompositionPlan([], "settlement", 15)).toEqual({
      coloredKeys: [],
      groupedKeys: [],
      detailStage: null,
      bars: [],
      labels: new Map(),
    });
  });
});
