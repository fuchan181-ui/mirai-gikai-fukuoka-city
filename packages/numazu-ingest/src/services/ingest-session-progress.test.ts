import { describe, expect, it } from "vitest";
import type { FetchedText } from "../fetchers/numazu-site-client";
import {
  buildPage,
  PAGE_HTML,
  publishCommentedReports,
  reportBlock,
} from "../parsers/__fixtures__/session-progress-page";
import type { SessionProgressBill } from "../repositories/session-progress-ingest-repository";
import {
  ingestSessionProgress,
  type SessionProgressClient,
  type SessionProgressDependencies,
} from "./ingest-session-progress";

const REFERRAL_REPORT = reportBlock(
  "9月16日　議案質疑が行われました。",
  "次に、9月4日に提出された議案に対する質疑が行われ、各委員会に付託されました。"
);

class FakeSessionProgressClient implements SessionProgressClient {
  constructor(
    private readonly html: string,
    private readonly contentHash = "progress-hash"
  ) {}

  async fetchHtml(url: string): Promise<FetchedText> {
    return {
      url,
      text: this.html,
      contentHash: this.contentHash,
      etag: '"etag"',
      lastModified: "Wed, 16 Sep 2026 00:00:00 GMT",
    };
  }
}

function bill(
  id: string,
  billNumber: string,
  overrides: Partial<SessionProgressBill> = {}
): SessionProgressBill {
  return {
    id,
    billNumber,
    status: "submitted",
    statusNote: null,
    submittedDate: "2026-09-04",
    ...overrides,
  };
}

const DEFAULT_BILLS = [
  bill("bill-83", "議第83号"),
  bill("bill-88", "議第88号"),
];

type RecordedUpdate = {
  billId: string;
  status: SessionProgressBill["status"];
  statusNote: string;
};

function createDependencies(options?: {
  previousHash?: string | null;
  sessionExists?: boolean;
  bills?: SessionProgressBill[];
  rejectUpdateIds?: string[];
  failUpdate?: boolean;
}) {
  const updates: RecordedUpdate[] = [];
  const savedHashes: Parameters<
    SessionProgressDependencies["saveContentHash"]
  >[0][] = [];

  const dependencies: SessionProgressDependencies = {
    findContentHash: async () => options?.previousHash ?? null,
    findCouncilSessionBySlug: async () =>
      options?.sessionExists === false
        ? null
        : { id: "session-id", startDate: "2026-09-04" },
    saveContentHash: async (record) => {
      savedHashes.push(record);
    },
    listBillsForSessionProgress: async () => options?.bills ?? DEFAULT_BILLS,
    updateBillSessionProgress: async (billId, update) => {
      if (options?.failUpdate) throw new Error("保存失敗");
      if (options?.rejectUpdateIds?.includes(billId)) return false;
      updates.push({
        billId,
        status: update.status,
        statusNote: update.statusNote,
      });
      return true;
    },
  };
  return { dependencies, updates, savedHashes };
}

describe("ingestSessionProgress", () => {
  it("委員会付託を in_committee として反映する", async () => {
    const fake = createDependencies();
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(result).toEqual({
      skipped: false,
      reason: null,
      sessionSlug: "2026-14",
      reportCount: 1,
      referredCount: 2,
      committeeResultCount: 0,
    });
    expect(fake.updates).toEqual([
      {
        billId: "bill-83",
        status: "in_committee",
        statusNote: "9月16日 各委員会に付託",
      },
      {
        billId: "bill-88",
        status: "in_committee",
        statusNote: "9月16日 各委員会に付託",
      },
    ]);
    expect(fake.savedHashes).toHaveLength(1);
  });

  it("委員会審査の結果を付託より優先して記録する", async () => {
    const fake = createDependencies();
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(
        buildPage([
          REFERRAL_REPORT,
          reportBlock(
            "9月17日　総務経済委員会が開催されました。",
            "【総務経済委員会】<br>議第83号、議第88号（いずれも可決すべきもの）"
          ),
        ])
      ),
      dependencies: fake.dependencies,
    });

    expect(result.referredCount).toBe(0);
    expect(result.committeeResultCount).toBe(2);
    expect(fake.updates.map((update) => update.statusNote)).toEqual([
      "9月17日 総務経済委員会で「可決すべきもの」",
      "9月17日 総務経済委員会で「可決すべきもの」",
    ]);
  });

  it("議決済みの議案は確定した審査結果を巻き戻さない", async () => {
    const fake = createDependencies({
      bills: [
        bill("bill-83", "議第83号", {
          status: "passed",
          statusNote: "10月8日 可決",
        }),
        bill("bill-88", "議第88号"),
      ],
    });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(
        buildPage([
          REFERRAL_REPORT,
          reportBlock(
            "9月17日　総務経済委員会が開催されました。",
            "【総務経済委員会】<br>議第83号、議第88号（いずれも可決すべきもの）"
          ),
        ])
      ),
      dependencies: fake.dependencies,
    });

    expect(fake.updates).toEqual([
      {
        billId: "bill-88",
        status: "in_committee",
        statusNote: "9月17日 総務経済委員会で「可決すべきもの」",
      },
    ]);
    expect(result.committeeResultCount).toBe(1);
  });

  it("保存条件を満たさなかった議案は件数に数えない", async () => {
    const fake = createDependencies({ rejectUpdateIds: ["bill-83"] });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(fake.updates.map((update) => update.billId)).toEqual(["bill-88"]);
    expect(result.referredCount).toBe(1);
  });

  it("提出日が報告日より後の追加議案は付託に含めない", async () => {
    const fake = createDependencies({
      bills: [bill("bill-90", "議第90号", { submittedDate: "2026-09-20" })],
    });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(fake.updates).toEqual([]);
    expect(result.referredCount).toBe(0);
  });

  it("報告・人事・発議の議案は「各委員会に付託されました」で付託済みにしない", async () => {
    const fake = createDependencies({
      bills: [
        bill("bill-hou", "報第22号"),
        bill("bill-nin", "認第32号"),
        bill("bill-hatsugi", "発議第3号"),
        bill("bill-gi", "議第75号"),
      ],
    });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(fake.updates.map((update) => update.billId)).toEqual(["bill-gi"]);
    expect(result.referredCount).toBe(1);
  });

  it("timestamptzの提出日でもJSTの暦日で付託の対象を決める", async () => {
    const fake = createDependencies({
      bills: [
        // 9月16日 09:00 JST。同じ日の付託に含まれる
        bill("bill-90", "議第90号", {
          submittedDate: "2026-09-16T00:00:00+00:00",
        }),
        // 9月17日 00:00 JST。9月16日の付託には含まれない
        bill("bill-91", "議第91号", {
          submittedDate: "2026-09-16T15:00:00+00:00",
        }),
      ],
    });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(fake.updates.map((update) => update.billId)).toEqual(["bill-90"]);
    expect(result.referredCount).toBe(1);
  });

  it("議案がまだ取り込まれていないときはハッシュを記録しない", async () => {
    const fake = createDependencies({ bills: [] });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: false,
      reportCount: 1,
      referredCount: 0,
      committeeResultCount: 0,
    });
    expect(fake.savedHashes).toEqual([]);
  });

  it("反映できる記載が無いときはハッシュを記録しない", async () => {
    const fake = createDependencies();
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(
        buildPage([
          reportBlock(
            "9月4日　第14回定例会が開会しました。",
            "次に市長から議案41件が提出され、提案説明が行われました。"
          ),
        ])
      ),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: false,
      reportCount: 1,
      referredCount: 0,
      committeeResultCount: 0,
    });
    expect(fake.updates).toEqual([]);
    expect(fake.savedHashes).toEqual([]);
  });

  it("すでに同じ進捗が入っている議案には書き込まない", async () => {
    const fake = createDependencies({
      bills: [
        bill("bill-83", "議第83号", {
          status: "in_committee",
          statusNote: "9月16日 各委員会に付託",
        }),
      ],
    });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(fake.updates).toEqual([]);
    expect(result.referredCount).toBe(0);
  });

  it("取得内容が前回と同じならDB更新を省略する", async () => {
    const fake = createDependencies({ previousHash: "progress-hash" });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: true,
      reason: "unchanged",
      sessionSlug: "2026-14",
      reportCount: 1,
    });
    expect(fake.updates).toEqual([]);
    expect(fake.savedHashes).toEqual([]);
  });

  it("会期が未登録なら取り込まずハッシュも記録しない", async () => {
    const fake = createDependencies({ sessionExists: false });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: true,
      reason: "session-not-found",
      sessionSlug: "2026-14",
    });
    expect(fake.updates).toEqual([]);
    expect(fake.savedHashes).toEqual([]);
  });

  it("議事報告がまだ公開されていない場合は取り込まない", async () => {
    const fake = createDependencies();
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(buildPage([])),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: true,
      reason: "no-report",
      sessionSlug: "2026-14",
      reportCount: 0,
    });
    expect(fake.savedHashes).toEqual([]);
  });

  it("開会中の会期を読み取れない場合は取り込まない", async () => {
    const fake = createDependencies();
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient("<h1>市議会のお知らせ</h1>"),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: true,
      reason: "no-report",
      sessionSlug: null,
    });
    expect(fake.savedHashes).toEqual([]);
  });

  it("保存が途中で失敗した場合はハッシュを記録しない", async () => {
    const fake = createDependencies({ failUpdate: true });

    await expect(
      ingestSessionProgress({
        client: new FakeSessionProgressClient(buildPage([REFERRAL_REPORT])),
        dependencies: fake.dependencies,
      })
    ).rejects.toThrow("保存失敗");
    expect(fake.savedHashes).toEqual([]);
  });

  it("実際の議事報告から第14回定例会の審議進捗を反映する", async () => {
    const fixtureNumbers = [
      "議第70号",
      "議第75号",
      "議第76号",
      "議第77号",
      "議第78号",
      "議第79号",
      "議第80号",
      "議第81号",
      "議第82号",
      "議第83号",
      "議第84号",
      "議第85号",
      "議第86号",
      "議第87号",
      "議第88号",
      "議第89号",
      "認第36号",
      "認第37号",
      "認第38号",
      "認第39号",
      "認第40号",
      "認第41号",
      "認第42号",
      "認第43号",
    ];
    const fake = createDependencies({
      bills: [
        ...fixtureNumbers.map((billNumber) => bill(billNumber, billNumber)),
        // 会期中に提出された追加議案。9月16日の付託には含まれない
        bill("議第90号", "議第90号", { submittedDate: "2026-09-20" }),
      ],
    });
    const result = await ingestSessionProgress({
      client: new FakeSessionProgressClient(publishCommentedReports(PAGE_HTML)),
      dependencies: fake.dependencies,
    });

    expect(result).toMatchObject({
      skipped: false,
      sessionSlug: "2026-14",
      reportCount: 10,
      referredCount: 1,
      committeeResultCount: 23,
    });
    expect(fake.updates.every((u) => u.status === "in_committee")).toBe(true);

    const notes = new Map(
      fake.updates.map((update) => [update.billId, update.statusNote])
    );
    expect(notes.get("議第87号")).toBe(
      "9月17日 総務経済委員会で「可決すべきもの」"
    );
    expect(notes.get("認第36号")).toBe(
      "9月25日 一般会計予算決算委員会で「認定すべきもの」"
    );
    expect(notes.get("議第83号")).toBe(
      "9月25日 一般会計予算決算委員会で「可決すべきもの」"
    );
    expect(notes.get("認第43号")).toBe(
      "9月30日 特別会計企業会計予算決算委員会で「認定すべきもの」"
    );
    expect(notes.get("議第76号")).toBe(
      "9月30日 特別会計企業会計予算決算委員会で「可決すべきもの」"
    );
    // 委員会審査の結果が出ていない議案は付託の記載だけを残す
    expect(notes.get("議第70号")).toBe("9月16日 各委員会に付託");
    expect(notes.has("議第90号")).toBe(false);
  });
});
