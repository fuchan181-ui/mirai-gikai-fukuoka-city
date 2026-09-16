import { describe, expect, it } from "vitest";
import {
  buildPage,
  PAGE_HTML,
  publishCommentedReports,
  reportBlock,
  SESSION,
} from "./__fixtures__/session-progress-page";
import { parseSessionProgressHtml } from "./parse-session-progress";

describe("parseSessionProgressHtml", () => {
  it("公開済みの報告だけを読み取り、コメント内の将来分は無視する", () => {
    const parsed = parseSessionProgressHtml(PAGE_HTML, SESSION);

    expect(parsed?.reports.map((report) => report.dateLabel)).toEqual([
      "9月4日",
      "9月14日",
      "9月15日",
    ]);
    expect(parsed?.reports.every((report) => report.committee === null)).toBe(
      true
    );
    expect(parsed?.reports.some((report) => report.allBillsReferred)).toBe(
      false
    );
  });

  it("開会日と一般質問の報告から、審議の進捗は読み取らない", () => {
    const parsed = parseSessionProgressHtml(PAGE_HTML, SESSION);
    const opening = parsed?.reports[0];

    expect(opening?.heading).toContain("第14回定例会が開会しました");
    expect(opening?.committeeResults).toEqual([]);
  });

  it("公開された議案質疑の報告から、各委員会への付託を読み取る", () => {
    const parsed = parseSessionProgressHtml(
      publishCommentedReports(PAGE_HTML),
      SESSION
    );
    const referral = parsed?.reports.find((report) => report.allBillsReferred);

    expect(referral).toMatchObject({
      dateLabel: "9月16日",
      date: "2026-09-16",
      committee: null,
    });
  });

  it("公開された委員会の報告から、議案番号と審査結果を読み取る", () => {
    const parsed = parseSessionProgressHtml(
      publishCommentedReports(PAGE_HTML),
      SESSION
    );
    const soumu = parsed?.reports.find(
      (report) => report.committee === "総務経済"
    );

    expect(soumu).toMatchObject({
      dateLabel: "9月17日",
      date: "2026-09-17",
      heading: "9月17日 総務経済委員会が開催されました。",
    });
    expect(soumu?.committeeResults).toEqual([
      { billNumbers: ["議第87号", "議第88号"], result: "可決すべきもの" },
    ]);
  });

  it("議案番号の範囲表記と、結果ごとの複数行を読み取る", () => {
    const parsed = parseSessionProgressHtml(
      publishCommentedReports(PAGE_HTML),
      SESSION
    );
    const tokubetsu = parsed?.reports.find(
      (report) => report.committee === "特別会計企業会計予算決算"
    );

    expect(tokubetsu?.date).toBe("2026-09-30");
    expect(tokubetsu?.committeeResults).toEqual([
      {
        billNumbers: [
          "認第37号",
          "認第38号",
          "認第39号",
          "認第40号",
          "認第41号",
          "認第42号",
          "認第43号",
        ],
        result: "認定すべきもの",
      },
      {
        billNumbers: ["議第75号", "議第76号", "議第84号", "議第85号"],
        result: "可決すべきもの",
      },
    ]);
  });

  it("閉会日の報告を付託や委員会審査の結果と取り違えない", () => {
    const parsed = parseSessionProgressHtml(
      publishCommentedReports(PAGE_HTML),
      SESSION
    );
    const closing = parsed?.reports.at(-1);

    expect(closing).toMatchObject({ dateLabel: "10月8日", date: "2026-10-08" });
    expect(closing?.allBillsReferred).toBe(false);
    expect(closing?.committeeResults).toEqual([]);
  });

  it("議事報告のないページは null を返す", () => {
    expect(
      parseSessionProgressHtml("<html><body></body></html>", SESSION)
    ).toBe(null);
    expect(
      parseSessionProgressHtml(
        '<a name="houkoku"></a><h2>議事報告</h2><div id="inform"></div>',
        SESSION
      )
    ).toEqual({ reports: [] });
  });

  it("1行に並んだ結果を、議案ごとに分けて読み取る", () => {
    const parsed = parseSessionProgressHtml(
      buildPage([
        reportBlock(
          "9月18日　民生病院教育委員会が開催されました。",
          "【民生病院教育委員会】<br>審査の結果は以下のとおりです。<br>議第77号（可決すべきもの）、議第78号（否決すべきもの）<br>"
        ),
      ]),
      SESSION
    );

    expect(parsed?.reports[0].committee).toBe("民生病院教育");
    expect(parsed?.reports[0].committeeResults).toEqual([
      { billNumbers: ["議第77号"], result: "可決すべきもの" },
      { billNumbers: ["議第78号"], result: "否決すべきもの" },
    ]);
  });

  it("「すべきもの」以外の括弧書きを委員会審査の結果にしない", () => {
    const parsed = parseSessionProgressHtml(
      buildPage([
        reportBlock(
          "9月18日　民生病院教育委員会が開催されました。",
          "【民生病院教育委員会】<br>議第77号（賛成多数）<br>資料1（配布済み）<br>"
        ),
      ]),
      SESSION
    );

    expect(parsed?.reports[0].committeeResults).toEqual([]);
  });

  it("議案番号として読めない要素を含む行は採用しない", () => {
    const parsed = parseSessionProgressHtml(
      buildPage([
        reportBlock(
          "9月18日　民生病院教育委員会が開催されました。",
          "【民生病院教育委員会】<br>議第77号、〇〇（可決すべきもの）<br>"
        ),
      ]),
      SESSION
    );

    expect(parsed?.reports[0].committeeResults).toEqual([]);
  });

  it("見出しから委員会名を読み、本文の【】があればそちらを優先する", () => {
    const parsed = parseSessionProgressHtml(
      buildPage([
        reportBlock(
          "9月24日　建設水道危機管理委員会が開催されました。",
          "審査が行われました。<br>"
        ),
        reportBlock(
          "9月24日　建設水道危機管理委員会が開催されました。",
          "【総務経済委員会】<br>議第89号（可決すべきもの）<br>"
        ),
      ]),
      SESSION
    );

    expect(parsed?.reports.map((report) => report.committee)).toEqual([
      "建設水道危機管理",
      "総務経済",
    ]);
  });

  it("会期開始月より前の日付は翌年の報告として解決する", () => {
    const parsed = parseSessionProgressHtml(
      buildPage([
        reportBlock(
          "1月5日　総務経済委員会が開催されました。",
          "審査が行われました。<br>"
        ),
      ]),
      { sessionStartYear: 2026, sessionStartMonth: 12 }
    );

    expect(parsed?.reports[0].date).toBe("2027-01-05");
  });

  it("存在しない日付は解決せず、日付表記だけを残す", () => {
    const parsed = parseSessionProgressHtml(
      buildPage([
        reportBlock(
          "2月30日　総務経済委員会が開催されました。",
          "審査が行われました。<br>"
        ),
      ]),
      { sessionStartYear: 2026, sessionStartMonth: 2 }
    );

    expect(parsed?.reports[0]).toMatchObject({
      dateLabel: "2月30日",
      date: null,
    });
  });
});
