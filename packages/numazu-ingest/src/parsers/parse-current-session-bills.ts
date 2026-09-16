import type {
  BillCategory,
  BillNumberKind,
  BillSubmitter,
} from "../shared/types";
import { toHalfWidthDigits } from "./normalize-wareki";
import { parseBillNumber, stripBillNumberPrefix } from "./parse-bill-number";

export type ParsedCurrentSessionBill = {
  billNumber: string;
  numberKind: BillNumberKind;
  numberValue: number;
  title: string;
  category: BillCategory;
  submitter: BillSubmitter | null;
  submittedOn: string | null;
  documentUrl: string | null;
};

export type ParsedCurrentSessionBills = {
  label: string;
  year: number;
  month: number;
  sessionNumber: number;
  kind: "regular" | "extraordinary";
  bills: ParsedCurrentSessionBill[];
};

const ERA_BASE_YEAR: Record<string, number> = {
  令和: 2019,
  平成: 1989,
  昭和: 1926,
};

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

function resolveUrl(href: string, baseUrl: string | null): string {
  if (!baseUrl) return href;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/** 開会中ページだけで利用する、件名と番号種別による暫定分類。 */
export function inferCurrentBillCategory(
  title: string,
  numberKind: BillNumberKind
): BillCategory {
  if (numberKind === "hou") return "report";
  if (numberKind === "hatsugi") return "opinion_paper";
  if (numberKind === "seigan" || numberKind === "chinjo") return "petition";

  if (/専決処分/.test(title)) return "provisional_approval";
  if (/条例/.test(title)) return "ordinance";
  if (/補正予算|当初予算|予算/.test(title)) return "budget";
  if (/決算|剰余金/.test(title)) return "settlement";
  if (/任命|選任|人権擁護委員/.test(title)) return "personnel";
  if (/契約|財産|土地|市道路線/.test(title)) return "contract";

  return "other";
}

function inferCurrentBillSubmitter(
  numberKind: BillNumberKind
): BillSubmitter | null {
  if (numberKind === "seigan" || numberKind === "chinjo") return "citizen";
  return null;
}

/** 開会中ページの見出しから、会期の年・月・回次を読み取る。 */
export function parseCurrentSessionHeading(
  html: string
): Omit<ParsedCurrentSessionBills, "bills"> | null {
  for (const match of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)) {
    const label = toText(match[1]);
    const normalized = toHalfWidthDigits(label);
    const parsed = normalized.match(
      /第\s*(\d{1,3})\s*回[^令平昭]*(令和|平成|昭和)\s*(\d{1,2}|元)\s*年\s*(\d{1,2})\s*月/
    );
    if (!parsed) continue;

    const eraYear = parsed[3] === "元" ? 1 : Number(parsed[3]);
    return {
      label,
      sessionNumber: Number(parsed[1]),
      year: ERA_BASE_YEAR[parsed[2]] + eraYear - 1,
      month: Number(parsed[4]),
      kind: label.includes("臨時") ? "extraordinary" : "regular",
    };
  }
  return null;
}

function extractSubmittedBillsList(html: string): string | null {
  const anchor = html.match(
    /<a\b[^>]*(?:name|id)\s*=\s*["']teisyutu["'][^>]*>/i
  );
  if (anchor?.index === undefined) return null;

  const afterAnchor = html.slice(anchor.index + anchor[0].length);
  const list = afterAnchor.match(
    /<ul\b[^>]*class\s*=\s*["'][^"']*\blist_disk\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i
  );
  return list?.[1] ?? null;
}

function parseBillListItem(
  itemHtml: string,
  baseUrl: string | null
): ParsedCurrentSessionBill | null {
  const rawLabel = toText(itemHtml);
  const addition = toHalfWidthDigits(rawLabel).match(
    /【(令和|平成|昭和)\s*(\d{1,2}|元)\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日に追加された議案】/
  );
  const additionEraYear = addition?.[2] === "元" ? 1 : Number(addition?.[2]);
  const submittedOn = addition
    ? `${ERA_BASE_YEAR[addition[1]] + additionEraYear - 1}-${addition[3].padStart(2, "0")}-${addition[4].padStart(2, "0")}`
    : null;
  const label = rawLabel
    .replace(/【[^】]*追加[^】]*】/g, "")
    .replace(/[（(]\s*PDF[：:][^）)]*[）)]\s*$/i, "")
    .trim();
  const number = parseBillNumber(label);
  if (!number) return null;

  const title = stripBillNumberPrefix(label)
    .replace(/について$/, "")
    .trim();
  if (!title) return null;

  const link = itemHtml.match(
    /<a\b[^>]*href\s*=\s*["']([^"']+\.pdf(?:[?#][^"']*)?)["'][^>]*>/i
  );

  return {
    billNumber: number.billNumber,
    numberKind: number.kind,
    numberValue: number.value,
    title,
    category: inferCurrentBillCategory(title, number.kind),
    submitter: inferCurrentBillSubmitter(number.kind),
    submittedOn,
    documentUrl: link ? resolveUrl(link[1].trim(), baseUrl) : null,
  };
}

/**
 * 「本会議のお知らせ」から、現在掲載されている会期と提出議案を読み取る。
 * 将来追記用のHTMLコメントは公開情報ではないため、解析前に除外する。
 */
export function parseCurrentSessionBillsHtml(
  html: string,
  baseUrl: string | null = null
): ParsedCurrentSessionBills | null {
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const session = parseCurrentSessionHeading(visibleHtml);
  const list = extractSubmittedBillsList(visibleHtml);
  if (!session || list === null) return null;

  const bills: ParsedCurrentSessionBill[] = [];
  const seen = new Set<string>();
  let itemCount = 0;
  for (const match of list.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    itemCount += 1;
    const bill = parseBillListItem(match[1], baseUrl);
    if (!bill || seen.has(bill.billNumber)) return null;
    seen.add(bill.billNumber);
    bills.push(bill);
  }

  if (itemCount === 0) return null;
  return { ...session, bills };
}
