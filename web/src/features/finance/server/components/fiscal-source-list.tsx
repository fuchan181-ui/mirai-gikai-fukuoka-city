import "server-only";
import { ExternalLink } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import type { FiscalSourceRef } from "../../shared/types/fiscal-amount";

/**
 * 金額の根拠になった公式資料。
 * 数字ごとに原資料へ辿れることを優先し、書誌と取得日時を併記する。
 */
export function FiscalSourceList({ sources }: { sources: FiscalSourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="fiscal-sources-heading">
      <div className="space-y-2">
        <h2
          id="fiscal-sources-heading"
          className="text-[22px] font-bold leading-[1.48] text-mirai-text"
        >
          出典
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          このページの金額は、次の公式資料から作成しています。正式な内容は各資料をご確認ください。
        </p>
      </div>
      <ul className="space-y-3">
        {sources.map((source) => (
          <li
            key={`${source.title}-${source.url}`}
            className="rounded-xl border bg-card p-5 shadow"
          >
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 font-medium text-mirai-text hover:underline"
            >
              <ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden />
              <span>{source.title}</span>
            </a>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {source.publisher ? (
                <div className="flex gap-2">
                  <dt>発行</dt>
                  <dd>{source.publisher}</dd>
                </div>
              ) : null}
              {source.publishedAt ? (
                <div className="flex gap-2">
                  <dt>公表日</dt>
                  <dd>{formatDate(source.publishedAt)}</dd>
                </div>
              ) : null}
              {source.fetchedAt ? (
                <div className="flex gap-2">
                  <dt>取得日時</dt>
                  <dd>{formatDateTime(source.fetchedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
