import { describe, expect, it } from "vitest";
import { buildTreemapLayout, type TreemapTile } from "./build-treemap-layout";

const areaOf = (tile: TreemapTile) =>
  (tile.widthPercent * tile.heightPercent) / 100;

type Box = { left: number; top: number; right: number; bottom: number };

const boxOf = (tile: TreemapTile): Box => ({
  left: tile.leftPercent,
  top: tile.topPercent,
  right: tile.leftPercent + tile.widthPercent,
  bottom: tile.topPercent + tile.heightPercent,
});

/** キーから箱を取り出す。無ければテストの失敗として落とす。 */
const tileOf = (tiles: TreemapTile[], key: string): TreemapTile => {
  const tile = tiles.find((candidate) => candidate.key === key);
  if (tile === undefined) throw new Error(`${key} の箱が無い`);
  return tile;
};

const overlaps = (a: Box, b: Box) =>
  a.left < b.right - 0.01 &&
  b.left < a.right - 0.01 &&
  a.top < b.bottom - 0.01 &&
  b.top < a.bottom - 0.01;

describe("buildTreemapLayout", () => {
  it("面積を値の比に合わせる", () => {
    const tiles = buildTreemapLayout(
      [
        { key: "a", value: 60 },
        { key: "b", value: 30 },
        { key: "c", value: 10 },
      ],
      1000,
      500
    );

    expect(tiles).toHaveLength(3);
    expect(areaOf(tileOf(tiles, "a"))).toBeCloseTo(60, 1);
    expect(areaOf(tileOf(tiles, "b"))).toBeCloseTo(30, 1);
    expect(areaOf(tileOf(tiles, "c"))).toBeCloseTo(10, 1);
  });

  it("箱を重なりなく敷き詰める", () => {
    const tiles = buildTreemapLayout(
      [
        { key: "a", value: 37 },
        { key: "b", value: 17 },
        { key: "c", value: 14 },
        { key: "d", value: 10 },
        { key: "e", value: 8 },
        { key: "f", value: 7 },
        { key: "g", value: 6 },
        { key: "h", value: 1 },
      ],
      900,
      420
    );

    const totalArea = tiles.reduce((sum, tile) => sum + areaOf(tile), 0);
    expect(totalArea).toBeCloseTo(100, 1);

    const boxes = tiles.map(boxOf);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(overlaps(boxes[i], boxes[j])).toBe(false);
      }
    }
  });

  it("いちばん大きい値のタイルをいちばん大きくする", () => {
    const tiles = buildTreemapLayout(
      [
        { key: "small", value: 1 },
        { key: "large", value: 99 },
      ],
      1000,
      500
    );

    expect(areaOf(tileOf(tiles, "large"))).toBeGreaterThan(
      areaOf(tileOf(tiles, "small"))
    );
  });

  it("値が0以下の項目は置かない", () => {
    const tiles = buildTreemapLayout(
      [
        { key: "a", value: 10 },
        { key: "zero", value: 0 },
        { key: "negative", value: -5 },
      ],
      400,
      300
    );

    expect(tiles.map((tile) => tile.key)).toEqual(["a"]);
  });

  it("置くものが無いときや箱が潰れているときは空を返す", () => {
    expect(buildTreemapLayout([], 400, 300)).toEqual([]);
    expect(buildTreemapLayout([{ key: "a", value: 10 }], 0, 300)).toEqual([]);
    expect(buildTreemapLayout([{ key: "a", value: 10 }], 400, 0)).toEqual([]);
  });
});
