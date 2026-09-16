import { DiscussVisionClient } from "./fetchers/discussvision-client";
import { NumazuSiteClient } from "./fetchers/numazu-site-client";
import { allTerms } from "./parsers/parse-term-index";
import {
  finishIngestionRun,
  startIngestionRun,
} from "./repositories/ingest-repository";
import {
  ingestAmivoiceArchive,
  ingestAmivoiceMinutes,
} from "./services/ingest-amivoice";
import {
  assertNoBillFailuresForEraYear,
  ingestBillsForSession,
  ingestBillsForTerm,
} from "./services/ingest-bills";
import { ingestCurrentSessionBills } from "./services/ingest-current-session-bills";
import { ingestFiscalSources } from "./services/ingest-fiscal-sources";
import { ingestGeneralQuestionMinutes } from "./services/ingest-general-question-minutes";
import { ingestGeneralQuestionsForTerm } from "./services/ingest-general-questions";
import { ingestMembers } from "./services/ingest-members";
import { ingestMinutes } from "./services/ingest-minutes";
import { ingestSessionProgress } from "./services/ingest-session-progress";
import { ingestSessionSchedule } from "./services/ingest-sessions";
import { CURRENT_TERM } from "./shared/constants-site";

export {
  ingestAmivoiceArchive,
  ingestAmivoiceMinutes,
} from "./services/ingest-amivoice";
export {
  ingestBillsForSession,
  ingestBillsForTerm,
} from "./services/ingest-bills";
export { ingestCurrentSessionBills } from "./services/ingest-current-session-bills";
export { ingestFiscalSources } from "./services/ingest-fiscal-sources";
export { ingestGeneralQuestionMinutes } from "./services/ingest-general-question-minutes";
export { ingestGeneralQuestionsForTerm } from "./services/ingest-general-questions";
export { ingestMembers } from "./services/ingest-members";
export { ingestMinutes } from "./services/ingest-minutes";
export { ingestSessionProgress } from "./services/ingest-session-progress";
export { ingestSessionSchedule } from "./services/ingest-sessions";
export { CURRENT_TERM } from "./shared/constants-site";

export type IngestMode =
  | "sessions"
  | "members"
  | "current-bills"
  | "session-progress"
  | "bills"
  | "minutes"
  | "amivoice"
  | "amivoice-archive"
  | "general-questions"
  | "general-question-records"
  | "fiscal"
  | "frequent"
  | "daily"
  | "all";

export type IngestOptions = {
  mode: IngestMode;
  /** bills モードで取り込む定例会。省略時は当年の全定例会（2/6/9/11月）を試す */
  eraYear?: number;
  month?: number;
  term?: number;
  force?: boolean;
  /** 公開されているすべての期を取り込む */
  allTerms?: boolean;
  /** 会議記録補完を公式案内の開始年（1990年）から実行する */
  allYears?: boolean;
  /** amivoice-archive で取り込む年（西暦） */
  year?: number;
};

/** 定例会が開かれる月。臨時会はこの限りではない。 */
const REGULAR_SESSION_MONTHS = [2, 6, 9, 11] as const;

/**
 * 取り込みのエントリポイント。worker / admin の両方から呼ぶ。
 *
 * 実行のたびに ingestion_runs に記録を残し、失敗時は status=failed で終える
 * （Cloud Run Job のリトライに委ねる）。
 */
export async function runIngest(options: IngestOptions): Promise<void> {
  const runId = await startIngestionRun(options.mode);
  try {
    const stats = await dispatch(options, runId);
    await finishIngestionRun(runId, { status: "completed", stats });
    console.log(`取り込み完了 (${options.mode}):`, JSON.stringify(stats));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`取り込み失敗 (${options.mode}): ${message}`);
    await finishIngestionRun(runId, { status: "failed", error: message });
    throw error;
  }
}

async function dispatch(
  options: IngestOptions,
  runId: string
): Promise<unknown> {
  const siteClient = new NumazuSiteClient();
  const discussVisionClient = new DiscussVisionClient();

  switch (options.mode) {
    case "sessions":
      return ingestSessionSchedule({
        force: options.force,
        client: siteClient,
      });

    case "members":
      return ingestMembers({ client: discussVisionClient });

    case "current-bills":
      return ingestCurrentSessionBills({
        force: options.force,
        client: siteClient,
      });

    case "session-progress":
      return ingestSessionProgress({
        force: options.force,
        client: siteClient,
      });

    case "bills":
      return ingestBills(options, siteClient);

    case "minutes":
      return ingestMinutesForYear(options, discussVisionClient);

    case "amivoice":
      return ingestAmivoiceMinutes();

    case "amivoice-archive": {
      // 年の指定が無ければ、会議記録が収録されている2015年から当年まで
      const until = new Date().getFullYear();
      const years =
        options.year !== undefined
          ? [options.year]
          : Array.from({ length: until - 2015 + 1 }, (_, i) => 2015 + i);
      return ingestAmivoiceArchive({ years });
    }

    case "general-questions": {
      const terms = options.allTerms
        ? allTerms()
        : [options.term ?? CURRENT_TERM];
      const results = [];
      for (const term of terms) {
        results.push(
          await ingestGeneralQuestionsForTerm({
            ingestionRunId: runId,
            term,
            client: siteClient,
          })
        );
      }
      return results;
    }

    case "general-question-records": {
      const currentYear = new Date().getFullYear();
      const years = options.allYears
        ? Array.from(
            { length: currentYear - 1990 + 1 },
            (_, index) => 1990 + index
          )
        : [options.year ?? currentYear];
      return ingestGeneralQuestionMinutes({
        ingestionRunId: runId,
        years,
      });
    }

    case "fiscal":
      return ingestFiscalSources({
        ingestionRunId: runId,
        client: siteClient,
      });

    case "frequent": {
      const sessions = await ingestSessionSchedule({
        force: options.force,
        client: siteClient,
      });
      const currentBills = await ingestCurrentSessionBills({
        force: options.force,
        client: siteClient,
      });
      const sessionProgress = await ingestSessionProgress({
        force: options.force,
        client: siteClient,
      });
      return { sessions, currentBills, sessionProgress };
    }

    case "daily": {
      const bills = await ingestBillsForTerm({
        term: options.term ?? CURRENT_TERM,
        force: options.force,
        client: siteClient,
      });
      const currentEraYear = new Date().getFullYear() - 2018;
      assertNoBillFailuresForEraYear(bills, currentEraYear);
      const minutes = await ingestMinutesForYear(options, discussVisionClient);
      const amivoice = await ingestAmivoiceMinutes();
      return { bills, minutes, amivoice };
    }

    case "all": {
      const sessions = await ingestSessionSchedule({
        force: options.force,
        client: siteClient,
      });
      const members = await ingestMembers({ client: discussVisionClient });
      const currentBills = await ingestCurrentSessionBills({
        force: options.force,
        client: siteClient,
      });
      const sessionProgress = await ingestSessionProgress({
        force: options.force,
        client: siteClient,
      });
      const bills = await ingestBills(options, siteClient);
      // 会議録は議案が入っている前提で突合するため最後に流す
      const minutes = await ingestMinutesForYear(options, discussVisionClient);
      const generalQuestions = await ingestGeneralQuestionsForTerm({
        ingestionRunId: runId,
        term: options.term ?? CURRENT_TERM,
        client: siteClient,
      });
      return {
        sessions,
        members,
        currentBills,
        sessionProgress,
        bills,
        minutes,
        generalQuestions,
      };
    }
  }
}

/** 会議録を取り込む。会期の特定は会議の名称から行う（ingest-minutes 側）。 */
async function ingestMinutesForYear(
  options: IngestOptions,
  client: DiscussVisionClient
): Promise<unknown> {
  const year = options.eraYear
    ? options.eraYear + 2018
    : new Date().getFullYear();
  return ingestMinutes({ year, client });
}

async function ingestBills(
  options: IngestOptions,
  client: NumazuSiteClient
): Promise<unknown> {
  const term = options.term ?? CURRENT_TERM;

  // --all-terms: 公開されている全期（第20期＝平成16年〜）をまとめて取り込む
  if (options.allTerms) {
    const results = [];
    for (const t of allTerms()) {
      results.push(
        await ingestBillsForTerm({ term: t, force: options.force, client })
      );
    }
    return results;
  }

  // --term だけ指定された場合は、その期の会期を期のページから見つけて全部取り込む
  if (options.term !== undefined && options.month === undefined) {
    return ingestBillsForTerm({ term, force: options.force, client });
  }

  if (options.eraYear !== undefined && options.month !== undefined) {
    return ingestBillsForSession({
      term,
      eraYear: options.eraYear,
      month: options.month,
      force: options.force,
      client,
    });
  }

  // 年の指定がなければ当年を対象にする（令和 = 西暦 - 2018）
  const eraYear = options.eraYear ?? new Date().getFullYear() - 2018;
  const results = [];
  for (const month of REGULAR_SESSION_MONTHS) {
    try {
      results.push(
        await ingestBillsForSession({
          term,
          eraYear,
          month,
          force: options.force,
          client,
        })
      );
    } catch (error) {
      // 未開催の定例会はPDFが存在しない。取り込み全体は止めない
      console.warn(
        `令和${eraYear}年${month}月定例会は取り込めなかった: ${String(error)}`
      );
    }
  }
  return results;
}
