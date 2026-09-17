import { describe, expect, it } from "vitest";
import { stringList } from "./entry-values";

describe("stringList", () => {
  it("受け取った文字列を可変配列として返す（SDK が readonly を受けないため）", () => {
    const list = stringList("a", "b");
    list.push("c");
    expect(list).toEqual(["a", "b", "c"]);
  });

  it("引数が無ければ空配列を返す", () => {
    expect(stringList()).toEqual([]);
  });
});
