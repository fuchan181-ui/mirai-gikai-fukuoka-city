import { COMMITTEE_RESULT_PATTERN } from "../shared/constants";
import { toHalfWidthDigits } from "./normalize-wareki";
import { parseBillNumber } from "./parse-bill-number";

/** 委員会で審査された議案と、委員会が決めた結論 */
export type SessionProgressCommitteeResult = {
  /** 表記どおりの議案番号（例: "議第87号"） */
  billNumbers: string[];
  /** 委員会の結論（例: "可決すべきもの"） */
  result: string;
};

/** 「議事報告」に日ごとに追記される1件の報告 */
export type SessionProgressReport = {
  /** 見出しの日付表記（例: "9月17日"）。複数日あるときは最初の日 */
  dateLabel: string;
  /** 会期開始日を基準に解決した日付（例: "2026-09-17"）。読み取れなければ null */
  date: string | null;
  /** 見出しの全文（例: "9月17日 総務経済委員会が開催されました。"） */
  heading: string;
  /** 委員会の略称（例: "総務経済"）。本会議の日は null */
  committee: string | null;
  /** 「各委員会に付託されました」のように、全議案の委員会付託を示す記載がある */
  allBillsReferred: boolean;
  /** 委員会審査の結果 */
  committeeResults: SessionProgressCommitteeResult[];
};

export type ParsedSessionProgress = {
  reports: SessionProgressReport[];
};

export type SessionProgressParseOptions = {
  /** 会期開始日の西暦年。見出しの「9月17日」を年に直す基準にする */
  sessionStartYear: number;
  /** 会期開始月（1〜12）。月が巻き戻る報告（12月開会→1月）を翌年として解決する */
  sessionStartMonth: number;
};

const SECTION_START_PATTERN =
  /<a\b[^>]*(?:name|id)\s*=\s*["']houkoku["'][^>]*>/i;
const SECTION_END_PATTERN = /<div\b[^>]*id\s*=\s*["']inform["'][^>]*>/i;
const REPORT_START_PATTERN =
  /<div\b[^>]*class\s*=\s*["'][^"']*\bh3_main\b[^"']*["'][^>]*>/gi;
const HEADING_PATTERN = /<h3\b[^>]*>([\s\S]*?)<\/h3>/i;
const PARAGRAPH_PATTERN = /<p\b[^>]*>([\s\S]*?)<\/p>/i;
const BREAK_PATTERN = /<br\b[^>]*>/gi;
const DATE_PATTERN = /^(\d{1,2})月(\d{1,2})日/;
const COMMITTEE_MARKER_PATTERN = /【([^】]{1,30}?)委員会】/;
const COMMITTEE_HEADING_PATTERN = /^(.{1,30}?)委員会が開催されました/;
const REFERRAL_PATTERN = /委員会に付託されました/;
/** 「議第87号、議第88号（いずれも可決すべきもの）」の括弧と、その手前の議案番号を拾う */
const RESULT_GROUP_PATTERN = /([^（）()]*)[（(]([^）)]*)[）)]/g;
const NUMBER_SEPARATOR_PATTERN = /[、,，]/;
const RANGE_SEPARATOR_PATTERN = /[～〜~]/;
const OMITTED_PREFIX_PATTERN = /^いずれも\s*/;
const BARE_NUMBER_PATTERN = /^(\d{1,4})号$/;
/** 議案番号の範囲を展開する上限。区切りを誤って大量展開しないための歯止め */
const MAX_RANGE_SIZE = 100;

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toText(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, ""))
    .replace(/[\s　]+/g, " ")
    .trim();
}

/** 段落を行に分ける。委員会審査の結果は1行に1つの結論が書かれる */
function toLines(html: string): string[] {
  return html
    .split(BREAK_PATTERN)
    .map((line) => toText(line))
    .filter((line) => line.length > 0);
}

/** 「議事報告」の範囲を切り出す。開会中の会期が無いページでは null を返す */
function extractReportSection(html: string): string | null {
  const start = SECTION_START_PATTERN.exec(html);
  if (start?.index === undefined) return null;

  const rest = html.slice(start.index + start[0].length);
  const end = SECTION_END_PATTERN.exec(rest);
  if (end?.index === undefined) return null;
  return rest.slice(0, end.index);
}

/** 日ごとの報告を、見出しブロックの位置で分割する */
function splitReportBlocks(section: string): string[] {
  const starts = Array.from(section.matchAll(REPORT_START_PATTERN));
  return starts.map((start, index) => {
    const from = (start.index ?? 0) + start[0].length;
    return section.slice(from, starts[index + 1]?.index ?? section.length);
  });
}

/**
 * 見出しの日付を、会期開始日を基準に西暦の日付へ直す。
 *
 * 会期は月をまたぐ（12月開会→1月閉会）。会期開始月より小さい月は翌年の日付として扱う。
 */
function resolveReportDate(
  month: number,
  day: number,
  options: SessionProgressParseOptions
): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const year =
    month < options.sessionStartMonth
      ? options.sessionStartYear + 1
      : options.sessionStartYear;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 議案番号の並びを1件ずつに開く。"認第37号～43号" のような範囲表記も展開する。
 * 議案番号として読めない要素が混ざる場合は null を返し、推測で埋めない。
 */
function expandNumberSegment(segment: string): string[] | null {
  const parts = segment
    .split(RANGE_SEPARATOR_PATTERN)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 1) {
    const number = parseBillNumber(parts[0]);
    return number ? [number.billNumber] : null;
  }
  if (parts.length !== 2) return null;

  const from = parseBillNumber(parts[0]);
  if (!from) return null;

  const to = parseBillNumber(parts[1]);
  const bareTo = BARE_NUMBER_PATTERN.exec(toHalfWidthDigits(parts[1]));
  const toValue = to ? to.value : bareTo ? Number(bareTo[1]) : null;
  if (toValue === null || toValue < from.value) return null;
  if (to && to.kind !== from.kind) return null;
  if (toValue - from.value + 1 > MAX_RANGE_SIZE) return null;

  return Array.from(
    { length: toValue - from.value + 1 },
    (_, index) => `${from.prefix}${from.value + index}号`
  );
}

/**
 * 1行から委員会審査の結果を読み取る。
 *
 * 委員会の結論は「可決すべきもの」のように「〜すべきもの」で書かれる（議案審議結果PDFと
 * 同じ表記）。括弧の付いた別の補足を結果と取り違えないよう、この表記だけを対象にする。
 */
function parseResultLine(line: string): SessionProgressCommitteeResult[] {
  const results: SessionProgressCommitteeResult[] = [];
  for (const match of line.matchAll(RESULT_GROUP_PATTERN)) {
    const result = toHalfWidthDigits(match[2])
      .replace(OMITTED_PREFIX_PATTERN, "")
      .trim();
    if (!COMMITTEE_RESULT_PATTERN.test(result)) continue;

    const numbersText = match[1].replace(/^[、,，\s]+/, "").trim();
    if (!numbersText) continue;

    const billNumbers: string[] = [];
    let readable = true;
    for (const segment of numbersText.split(NUMBER_SEPARATOR_PATTERN)) {
      const trimmed = segment.trim();
      if (!trimmed) continue;
      const expanded = expandNumberSegment(trimmed);
      if (!expanded) {
        readable = false;
        break;
      }
      billNumbers.push(...expanded);
    }
    if (!readable || billNumbers.length === 0) continue;
    results.push({ billNumbers, result });
  }
  return results;
}

/** 本文の【◯◯委員会】を優先し、無ければ見出しの「◯◯委員会が開催されました」から読む */
function extractCommittee(heading: string, bodyText: string): string | null {
  const marker = COMMITTEE_MARKER_PATTERN.exec(bodyText);
  if (marker) return marker[1].trim();

  const withoutDate = heading.replace(DATE_PATTERN, "").trim();
  return COMMITTEE_HEADING_PATTERN.exec(withoutDate)?.[1].trim() ?? null;
}

function parseReportBlock(
  block: string,
  options: SessionProgressParseOptions
): SessionProgressReport | null {
  const headingHtml = HEADING_PATTERN.exec(block)?.[1];
  if (headingHtml === undefined) return null;

  const heading = toText(headingHtml);
  const date = DATE_PATTERN.exec(toHalfWidthDigits(heading));
  const bodyHtml = PARAGRAPH_PATTERN.exec(block)?.[1] ?? "";
  const bodyText = toText(bodyHtml);
  const committee = extractCommittee(heading, bodyText);

  return {
    dateLabel: date ? `${date[1]}月${date[2]}日` : heading,
    date: date
      ? resolveReportDate(Number(date[1]), Number(date[2]), options)
      : null,
    heading,
    committee,
    // 委員会の報告ではなく、本会議で委員会付託が決まった日の記載だけを対象にする
    allBillsReferred: committee === null && REFERRAL_PATTERN.test(bodyText),
    committeeResults:
      committee === null
        ? []
        : toLines(bodyHtml).flatMap((line) => parseResultLine(line)),
  };
}

/**
 * 開会中の「本会議のお知らせ」から、日ごとの議事報告を読み取る。
 *
 * 市は将来分の報告をHTMLコメントとして先に用意し、当日にコメントを外して公開する。
 * 公開前の内容を取り込まないよう、解析前にコメントを除外する。
 */
export function parseSessionProgressHtml(
  html: string,
  options: SessionProgressParseOptions
): ParsedSessionProgress | null {
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const section = extractReportSection(visibleHtml);
  if (section === null) return null;

  const reports = splitReportBlocks(section)
    .map((block) => parseReportBlock(block, options))
    .filter((report): report is SessionProgressReport => report !== null);
  return { reports };
}
