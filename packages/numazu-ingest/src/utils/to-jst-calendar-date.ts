/**
 * 日付欄（"2026-09-04"）や ISO 8601 の文字列を、JST の暦日（"2026-09-04"）に直す。
 *
 * 沼津市のページの日付は暦日だが、DB の timestamptz（例: bills.submitted_date）は
 * PostgREST から "2026-09-04T00:00:00+00:00" のように時刻付きで返る。文字列のまま
 * 比べると桁位置がずれて大小関係を誤るため、比較の前に暦日へ正規化する。
 * 読み取れない値は null を返し、呼び出し側で「日付不明」として扱えるようにする。
 */
export function toJstCalendarDate(value: string): string | null {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time).toLocaleDateString("sv-SE", {
    timeZone: "Asia/Tokyo",
  });
}
