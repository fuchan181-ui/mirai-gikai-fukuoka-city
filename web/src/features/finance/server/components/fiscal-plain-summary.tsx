import "server-only";
import type { FiscalPlainSummary } from "../../shared/utils/build-fiscal-plain-summary";

/**
 * 表を読まなくても全体像が分かるように、その年度の要点を平易な文で示す。
 * 文が1つも作れないときは何も出さない。
 */
export function FiscalPlainSummarySection({
  summary,
}: {
  summary: FiscalPlainSummary;
}) {
  if (summary.sentences.length === 0) return null;

  return (
    <section
      className="space-y-3 rounded-xl border bg-card p-5 shadow"
      aria-labelledby="fiscal-plain-summary"
    >
      <h2
        id="fiscal-plain-summary"
        className="text-[22px] font-bold leading-[1.48] text-mirai-text"
      >
        やさしく言うと
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        この年度の予算と使われ方を、下の表を読まなくても分かるようにまとめました。
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-mirai-text">
        {summary.sentences.map((sentence, index) => (
          <li key={`${index}-${sentence}`}>{sentence}</li>
        ))}
      </ul>
    </section>
  );
}
