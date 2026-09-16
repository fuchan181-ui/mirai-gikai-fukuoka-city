/**
 * 面積で構成比を見せるタイル配置（squarified treemap）。
 * 座標は描画側で使いやすいよう、元の箱に対する割合（%）で返す。
 */

export type TreemapItem = {
  key: string;
  value: number;
};

export type TreemapTile = {
  key: string;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
};

type AreaNode = { key: string; area: number };

/**
 * 行に並べたときの、いちばん細長いタイルの縦横比。
 * これが小さいほど正方形に近く、款名を置きやすい。
 */
function worstAspectRatio(areas: number[], side: number, rowArea: number) {
  const thickness = rowArea / side;
  let worst = 0;
  for (const area of areas) {
    const length = area / thickness;
    worst = Math.max(worst, length / thickness, thickness / length);
  }
  return worst;
}

/**
 * 面積が value に比例するようタイルを敷き詰める。
 * 大きい順に並べ、短い辺に沿って行を作ることで、細長いタイルを減らす。
 * value が 0 以下の項目と、箱の面積が 0 のときは空を返す。
 */
export function buildTreemapLayout(
  items: TreemapItem[],
  width: number,
  height: number
): TreemapTile[] {
  const positive = items.filter((item) => item.value > 0);
  if (positive.length === 0 || width <= 0 || height <= 0) return [];

  const totalValue = positive.reduce((sum, item) => sum + item.value, 0);
  const scale = (width * height) / totalValue;
  const queue: AreaNode[] = [...positive]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ key: item.key, area: item.value * scale }));

  const tiles: TreemapTile[] = [];
  let left = 0;
  let top = 0;
  let boxWidth = width;
  let boxHeight = height;
  let index = 0;

  while (index < queue.length && boxWidth > 0 && boxHeight > 0) {
    const side = Math.min(boxWidth, boxHeight);
    const row: AreaNode[] = [];
    let rowArea = 0;
    let worst = Number.POSITIVE_INFINITY;

    while (index < queue.length) {
      const candidate = queue[index];
      const nextArea = rowArea + candidate.area;
      const nextWorst = worstAspectRatio(
        [...row, candidate].map((node) => node.area),
        side,
        nextArea
      );
      // 行が細長くなるなら、そこで行を閉じて次の行に回す。
      if (row.length > 0 && nextWorst > worst) break;
      row.push(candidate);
      rowArea = nextArea;
      worst = nextWorst;
      index += 1;
    }

    const thickness = rowArea / side;
    const horizontal = boxWidth >= boxHeight;
    let offset = 0;
    for (const node of row) {
      const length = node.area / thickness;
      const tile = horizontal
        ? { left, top: top + offset, width: thickness, height: length }
        : { left: left + offset, top, width: length, height: thickness };
      tiles.push({
        key: node.key,
        leftPercent: (tile.left / width) * 100,
        topPercent: (tile.top / height) * 100,
        widthPercent: (tile.width / width) * 100,
        heightPercent: (tile.height / height) * 100,
      });
      offset += length;
    }

    if (horizontal) {
      left += thickness;
      boxWidth -= thickness;
    } else {
      top += thickness;
      boxHeight -= thickness;
    }
  }

  return tiles;
}
