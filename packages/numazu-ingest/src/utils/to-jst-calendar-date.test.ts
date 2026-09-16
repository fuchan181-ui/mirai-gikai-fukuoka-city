import { describe, expect, it } from "vitest";
import { toJstCalendarDate } from "./to-jst-calendar-date";

describe("toJstCalendarDate", () => {
  it("日付だけの文字列はそのままJSTの暦日として返す", () => {
    expect(toJstCalendarDate("2026-09-04")).toBe("2026-09-04");
  });

  it("PostgRESTが返すtimestamptzをJSTの暦日に直す", () => {
    expect(toJstCalendarDate("2026-09-04T00:00:00+00:00")).toBe("2026-09-04");
    // UTC 15:00 は JST の翌日 0:00。実装から timeZone: "Asia/Tokyo" が抜けると
    // 実行環境の暦日を返すため、JST 以外の環境（CI は UTC）でこの行が落ちる。
    expect(toJstCalendarDate("2026-09-04T15:00:00+00:00")).toBe("2026-09-05");
  });

  it("JSTのオフセット付きの時刻はその日の暦日を返す", () => {
    expect(toJstCalendarDate("2026-09-04T09:00:00+09:00")).toBe("2026-09-04");
  });

  it("読み取れない値はnullを返す", () => {
    expect(toJstCalendarDate("")).toBeNull();
    expect(toJstCalendarDate("議事報告")).toBeNull();
  });
});
