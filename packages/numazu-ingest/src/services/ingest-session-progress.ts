import {
  type FetchedText,
  NumazuSiteClient,
} from "../fetchers/numazu-site-client";
import { buildSessionSlug } from "../parsers/map-bill-status";
import { parseBillNumber } from "../parsers/parse-bill-number";
import { parseCurrentSessionHeading } from "../parsers/parse-current-session-bills";
import {
  parseSessionProgressHtml,
  type SessionProgressReport,
} from "../parsers/parse-session-progress";
import {
  findContentHash,
  findCouncilSessionBySlug,
  saveContentHash,
} from "../repositories/ingest-repository";
import {
  listBillsForSessionProgress,
  PROGRESS_UPDATABLE_STATUSES,
  type SessionProgressBill,
  updateBillSessionProgress,
} from "../repositories/session-progress-ingest-repository";
import { NUMAZU_SITE_URLS } from "../shared/constants-site";
import type { BillNumberKind } from "../shared/types";
import { toJstCalendarDate } from "../utils/to-jst-calendar-date";

const SOURCE = "session_progress";

export interface SessionProgressClient {
  fetchHtml(url: string): Promise<FetchedText>;
}

export type SessionProgressDependencies = {
  findContentHash: typeof findContentHash;
  findCouncilSessionBySlug: typeof findCouncilSessionBySlug;
  saveContentHash: typeof saveContentHash;
  listBillsForSessionProgress: typeof listBillsForSessionProgress;
  updateBillSessionProgress: typeof updateBillSessionProgress;
};

const defaultDependencies: SessionProgressDependencies = {
  findContentHash,
  findCouncilSessionBySlug,
  saveContentHash,
  listBillsForSessionProgress,
  updateBillSessionProgress,
};

/** 進捗の書き込みが何を根拠にしたものか。報告の種類ごとに件数を分けて残す */
type ProgressKind = "referral" | "committeeResult";

/**
 * 議事報告の「各委員会に付託されました」を当てはめてよい議案の種別。
 *
 * この一文は付託された議案を列挙しないため、付託の実績を種別ごとに確認できるものだけを
 * 対象にする。議案審議結果PDFでは、議第はすべて付託委員会名が入る一方、認第の人事案件と
 * 発議第は付託欄が「省略」、報告（報第）は●報告に分かれ付託欄そのものがない。認第は
 * 決算の認定（付託あり）と人事（省略）が同じ回次に混在し、議事報告の一文からは区別できない。
 * そのため一括の付託反映は議第に絞り、他の種別は委員会審査の結果が公表された時点で、
 * 議案番号が明示された記載から反映する。
 */
const REFERRABLE_KINDS: readonly BillNumberKind[] = ["gi"];

type DesiredProgress = {
  bill: SessionProgressBill;
  status: "in_committee";
  statusNote: string;
  kind: ProgressKind;
};

export type SessionProgressSkipReason =
  | "unchanged"
  | "no-report"
  | "session-not-found";

export type IngestSessionProgressResult = {
  skipped: boolean;
  reason: SessionProgressSkipReason | null;
  sessionSlug: string | null;
  reportCount: number;
  /** 委員会付託を反映した議案数 */
  referredCount: number;
  /** 委員会審査の結果を記録した議案数 */
  committeeResultCount: number;
};

/**
 * 提出日が報告日より後の議案は、その日の付託に含まれない。
 *
 * 追加議案（会期中に提出される議案）を、開会日の「各委員会に付託されました」で
 * まとめて付託済みにしないための判定。どちらかが不明なら対象に含める。
 * 提出日は timestamptz で返るため、JSTの暦日に直してから報告日と比べる。
 */
function isSubmittedBy(
  bill: SessionProgressBill,
  date: string | null
): boolean {
  if (date === null || bill.submittedDate === null) return true;
  const submittedDate = toJstCalendarDate(bill.submittedDate);
  if (submittedDate === null) return true;
  return submittedDate <= date;
}

/** 「各委員会に付託されました」の一括記載から付託済みにできる議案か */
function isReferredByAllBillsStatement(bill: SessionProgressBill): boolean {
  const parsed = parseBillNumber(bill.billNumber);
  return parsed !== null && REFERRABLE_KINDS.includes(parsed.kind);
}

/** 議事報告から、議案ごとに保存すべき状態と補足を作る。報告は日付順に並んでいる前提 */
function buildDesiredProgress(
  reports: SessionProgressReport[],
  bills: SessionProgressBill[]
): DesiredProgress[] {
  const billsByNumber = new Map(bills.map((bill) => [bill.billNumber, bill]));
  const referralNotes = new Map<string, string>();
  const committeeResultNotes = new Map<string, string>();

  for (const report of reports) {
    if (report.allBillsReferred) {
      for (const bill of bills) {
        if (!PROGRESS_UPDATABLE_STATUSES.includes(bill.status)) continue;
        if (!isReferredByAllBillsStatement(bill)) continue;
        if (!isSubmittedBy(bill, report.date)) continue;
        if (referralNotes.has(bill.id)) continue;
        referralNotes.set(bill.id, `${report.dateLabel} 各委員会に付託`);
      }
    }
    if (report.committee === null) continue;

    for (const result of report.committeeResults) {
      // 会期中だけ入る暫定の表記。閉会後に議案審議結果PDFから入る
      // 「◯◯委員会が「△△」と決定し、本会議で□□」へ置き換わる前提で、
      // 可視化の実装時に表記をそろえる。
      const statusNote = `${report.dateLabel} ${report.committee}委員会で「${result.result}」`;
      for (const billNumber of result.billNumbers) {
        const bill = billsByNumber.get(billNumber);
        if (!bill) continue;
        if (!PROGRESS_UPDATABLE_STATUSES.includes(bill.status)) continue;
        committeeResultNotes.set(bill.id, statusNote);
      }
    }
  }

  const desired: DesiredProgress[] = [];
  for (const bill of bills) {
    // 委員会審査まで進んだ議案は、付託の記載より具体的な結果を残す
    const committeeResultNote = committeeResultNotes.get(bill.id);
    const statusNote = committeeResultNote ?? referralNotes.get(bill.id);
    if (statusNote === undefined) continue;
    desired.push({
      bill,
      status: "in_committee",
      statusNote,
      kind: committeeResultNote === undefined ? "referral" : "committeeResult",
    });
  }
  return desired;
}

/**
 * 開会中の「本会議のお知らせ」の議事報告から、委員会付託と委員会審査の結果を取り込む。
 *
 * 会議終了後に公開される議案審議結果PDFより早く、会期中の審議の進み具合を反映する。
 * いまは「最新状態」だけを bills.status / status_note（互換スナップショット）へ書き、
 * 審議イベントの履歴化は議案審議過程可視化の実装に合わせて別途行う。
 */
export async function ingestSessionProgress(
  options: {
    force?: boolean;
    client?: SessionProgressClient;
    dependencies?: SessionProgressDependencies;
  } = {}
): Promise<IngestSessionProgressResult> {
  const client = options.client ?? new NumazuSiteClient();
  const dependencies = options.dependencies ?? defaultDependencies;
  const url = NUMAZU_SITE_URLS.billDocuments;
  const fetched = await client.fetchHtml(url);

  const session = parseCurrentSessionHeading(fetched.text);
  if (!session) {
    return skip("no-report", null, 0);
  }
  const sessionSlug = buildSessionSlug(session.year, session.sessionNumber);

  // 会期の年・月は、報告と同じページの見出しから取る。日付の解決にDBの値を使うと、
  // 開会中の暫定会期（開会日が実行日で保存された臨時会など）で月を取り違える。
  const progress = parseSessionProgressHtml(fetched.text, {
    sessionStartYear: session.year,
    sessionStartMonth: session.month,
  });
  if (!progress || progress.reports.length === 0) {
    return skip("no-report", sessionSlug, progress?.reports.length ?? 0);
  }

  const previousHash = await dependencies.findContentHash(SOURCE, url);
  if (!options.force && previousHash === fetched.contentHash) {
    return skip("unchanged", sessionSlug, progress.reports.length);
  }

  const councilSession =
    await dependencies.findCouncilSessionBySlug(sessionSlug);
  if (!councilSession) {
    return skip("session-not-found", sessionSlug, progress.reports.length);
  }

  const bills = await dependencies.listBillsForSessionProgress(
    councilSession.id
  );
  const desired = buildDesiredProgress(progress.reports, bills);

  let referredCount = 0;
  let committeeResultCount = 0;
  for (const update of desired) {
    const { bill } = update;
    // 実行のたびに同じ値を書き戻さない
    if (
      bill.status === update.status &&
      bill.statusNote === update.statusNote
    ) {
      continue;
    }
    const updated = await dependencies.updateBillSessionProgress(bill.id, {
      status: update.status,
      statusNote: update.statusNote,
    });
    if (!updated) continue;
    if (update.kind === "referral") referredCount += 1;
    else committeeResultCount += 1;
  }

  // 反映できる議案が1件も無いままハッシュを記録すると、あとから議案が取り込まれても
  // 「内容が変わっていない」とみなして突合をやめてしまう。その回は記録を見送り、
  // 次回の実行で必ず突合し直す。市側の文言が変わって何も解釈できなくなった場合も
  // 同じ経路で再解析が続く。
  if (desired.length > 0) {
    await dependencies.saveContentHash({
      source: SOURCE,
      url,
      contentHash: fetched.contentHash,
      etag: fetched.etag,
      lastModified: fetched.lastModified,
    });
  }

  return {
    skipped: false,
    reason: null,
    sessionSlug,
    reportCount: progress.reports.length,
    referredCount,
    committeeResultCount,
  };
}

function skip(
  reason: SessionProgressSkipReason,
  sessionSlug: string | null,
  reportCount: number
): IngestSessionProgressResult {
  return {
    skipped: true,
    reason,
    sessionSlug,
    reportCount,
    referredCount: 0,
    committeeResultCount: 0,
  };
}
