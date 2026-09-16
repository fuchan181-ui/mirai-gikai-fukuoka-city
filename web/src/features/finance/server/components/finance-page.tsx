import "server-only";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import { buildFiscalYearHighlights } from "../../shared/utils/build-fiscal-view";
import { formatFiscalYearWithGregorian } from "../../shared/utils/format-fiscal-year";
import { formatYenWithUnits } from "../../shared/utils/format-yen";
import {
  getPublishedFiscalYearAmounts,
  getPublishedFiscalYears,
} from "../loaders/get-fiscal-years";
import { FiscalStageBadge } from "./fiscal-stage-badge";

/**
 * 財政トップ。公開済みの年度を新しい順に並べ、
 * 各年度の要点だけを見せて詳細へ送る。
 */
export async function FinancePage() {
  const years = await getPublishedFiscalYears();
  const yearHighlights = await Promise.all(
    years.map(async (year) => {
      // 一覧では出典も内訳も出さないため、資料まで読み込まない。
      const { amountSets } = await getPublishedFiscalYearAmounts(year, {
        includeSources: false,
      });
      return {
        fiscalYear: year,
        highlights: buildFiscalYearHighlights(year, amountSets),
      };
    })
  );

  return (
    <div className="min-h-dvh bg-mirai-surface-muted">
      <Container className="flex flex-col gap-8 pb-10 pt-24 md:pt-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-mirai-text">
            予算とその使われ方
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            沼津市の一般会計について、予算が何にいくら配分され、そのお金がどう使われたかを、公式資料をもとにまとめています。
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            本サービスは沼津市および沼津市議会の公式サービスではありません。数字の出典と基準日を各ページに示しています。正式な内容は必ず公式資料をご確認ください。
          </p>
        </header>

        {yearHighlights.length === 0 ? (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow">
            公開できる財政データはまだありません。
          </p>
        ) : (
          <section className="space-y-4" aria-labelledby="finance-years">
            <h2
              id="finance-years"
              className="text-[22px] font-bold leading-[1.48] text-mirai-text"
            >
              年度から見る
            </h2>
            <ul className="space-y-3">
              {yearHighlights.map((entry) => (
                <li key={entry.fiscalYear}>
                  <Link
                    href={routes.financeYear(entry.fiscalYear)}
                    className="block rounded-xl border bg-card p-5 shadow transition-colors hover:border-primary-accent"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-mirai-text">
                        {formatFiscalYearWithGregorian(entry.fiscalYear)}
                      </h3>
                      <ChevronRight
                        className="h-5 w-5 text-mirai-text-muted"
                        aria-hidden
                      />
                    </div>
                    {entry.highlights.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        金額はまだ公開されていません。
                      </p>
                    ) : (
                      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                        {entry.highlights.map((highlight) => (
                          <div key={highlight.key}>
                            <dt className="flex flex-wrap items-center gap-2 text-sm text-mirai-text-secondary">
                              {highlight.label}
                              <FiscalStageBadge
                                decisionStage={highlight.decisionStage}
                              />
                            </dt>
                            <dd className="text-base font-bold tabular-nums text-mirai-text">
                              {highlight.amountYen === null
                                ? "未公開"
                                : formatYenWithUnits(highlight.amountYen)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3" aria-labelledby="finance-notes">
          <h2
            id="finance-notes"
            className="text-[22px] font-bold leading-[1.48] text-mirai-text"
          >
            数字の読み方
          </h2>
          <ul className="space-y-2 rounded-xl border bg-card p-5 text-sm leading-relaxed text-mirai-text-note shadow">
            <li>
              ・金額はすべて円単位です。読みやすさのため、兆・億・万円に区切って表示しています。
            </li>
            <li>
              ・「当初予算」はその年度に最初に組んだ予算、「年度末の予算現額」は補正予算や流用を反映した後の予算額、「決算」は実際に支出が確定した額です。同じ年度でも意味が違うため、単純に増減を比べられない箇所は比較していません。
            </li>
            <li>
              ・まだ議会で議決されていない予算案は「提案中」と示し、議決されて確定した額と区別しています。
            </li>
            <li>
              ・構成比は合計額に対する割合で、小数第1位まで四捨五入しています。合計が100.0%にならないことがあります。
            </li>
            <li>
              ・内訳として取得できている款が一部の年度は、その旨と、合計のうち何割を表示しているかを各ページに示しています。
            </li>
          </ul>
        </section>

        <Breadcrumb
          items={[{ label: "トップ", href: routes.home() }, { label: "財政" }]}
        />
      </Container>
    </div>
  );
}
