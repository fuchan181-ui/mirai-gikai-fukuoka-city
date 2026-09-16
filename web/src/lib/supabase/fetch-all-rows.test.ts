import { describe, expect, it } from "vitest";
import { fetchAllRows } from "./fetch-all-rows";

const PAGE_SIZE = 1000;

function makeRows(count: number, offset = 0): { id: number }[] {
  return Array.from({ length: count }, (_, index) => ({ id: offset + index }));
}

describe("fetchAllRows", () => {
  it("1ページで収まるときは1回だけ読み込む", async () => {
    const calls: number[] = [];
    const result = await fetchAllRows((from, to) => {
      calls.push(from);
      expect(to).toBe(PAGE_SIZE - 1);
      return Promise.resolve({ data: makeRows(3), error: null });
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(3);
    expect(calls).toEqual([0]);
  });

  it("上限の件数まで埋まったら、終端を確かめるまで読み進める", async () => {
    const calls: number[] = [];
    const result = await fetchAllRows((from) => {
      calls.push(from);
      const remaining = 3 * PAGE_SIZE - from;
      const size = Math.min(PAGE_SIZE, Math.max(remaining, 0));
      return Promise.resolve({
        data: makeRows(size, from),
        error: null,
      });
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(3 * PAGE_SIZE);
    // ちょうど上限で埋まったページは、次が空だと確かめるまで終端と分からない。
    expect(calls).toEqual([0, PAGE_SIZE, 2 * PAGE_SIZE, 3 * PAGE_SIZE]);
    expect(result.data?.[2 * PAGE_SIZE]).toEqual({ id: 2 * PAGE_SIZE });
  });

  it("途中でエラーになったら途中結果を返さない", async () => {
    const result = await fetchAllRows((from) =>
      Promise.resolve(
        from === 0
          ? { data: makeRows(PAGE_SIZE), error: null }
          : { data: null, error: { message: "取得に失敗しました" } }
      )
    );

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("取得に失敗しました");
  });

  it("データが空でもエラーにしない", async () => {
    const result = await fetchAllRows(() =>
      Promise.resolve({ data: [], error: null })
    );

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});
