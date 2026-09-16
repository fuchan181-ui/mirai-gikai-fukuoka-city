import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import {
  buildFiscalYearView,
  initialBudgetBreakdownDescription,
} from "../../shared/utils/build-fiscal-view";
import {
  formatFiscalYear,
  formatFiscalYearWithGregorian,
} from "../../shared/utils/format-fiscal-year";
import { formatYenWithUnits } from "../../shared/utils/format-yen";
import {
  getPublishedFiscalYearAmounts,
  getPublishedFiscalYears,
} from "../loaders/get-fiscal-years";
import { FiscalBreakdownSection } from "./fiscal-breakdown-section";
import { FiscalSourceList } from "./fiscal-source-list";
import { FiscalStageBadge } from "./fiscal-stage-badge";
import { FiscalTimeline } from "./fiscal-timeline";

export async function FiscalYearPage({ fiscalYear }: { fiscalYear: number }) {
  const publishedYears = await getPublishedFiscalYears();
  if (!Number.isInteger(fiscalYear) || !publishedYears.includes(fiscalYear)) {
    notFound();
  }

  const { amountSets, sources } =
    await getPublishedFiscalYearAmounts(fiscalYear);
  const view = buildFiscalYearView(fiscalYear, amountSets);

  return (
    <div className="min-h-dvh bg-mirai-surface-muted">
      <Container className="flex flex-col gap-8 pb-10 pt-24 md:pt-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-mirai-text">
            {formatFiscalYearWithGregorian(fiscalYear)}の予算と決算
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            沼津市の一般会計について、予算の内訳と、その予算がどう使われたかを公式資料からまとめています。本サービスは非公式であり、正式な内容は各公式資料をご確認ください。
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            金額は円単位です。構成比は合計額に対する割合を小数第1位まで四捨五入したもので、合計が100.0%にならないことがあります。
          </p>
        </header>

        {view.highlights.length > 0 ? (
          <section className="space-y-4" aria-labelledby="fiscal-highlights">
            <h2
              id="fiscal-highlights"
              className="text-[22px] font-bold leading-[1.48] text-mirai-text"
            >
              この年度の主な金額
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {view.highlights.map((highlight) => (
                <li
                  key={highlight.key}
                  className="rounded-xl border bg-card p-5 shadow"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-mirai-text-secondary">
                      {highlight.label}
                    </h3>
                    <FiscalStageBadge decisionStage={highlight.decisionStage} />
                  </div>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-mirai-text">
                    {highlight.amountYen === null
                      ? "未公開"
                      : formatYenWithUnits(highlight.amountYen)}
                  </p>
                  {highlight.asOfDate ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateWithDots(highlight.asOfDate)}現在
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {highlight.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <FiscalTimeline steps={view.timeline} />

        {view.expenditureBudget ? (
          <FiscalBreakdownSection
            sectionId="expenditure-budget"
            title="歳出の内訳"
            description={`${initialBudgetBreakdownDescription(
              view.expenditureBudget.decisionStage,
              "何にいくら使う"
            )}款ごとに金額の大きい順に並べています。`}
            breakdown={view.expenditureBudget}
            amountCaption="歳出予算額"
          />
        ) : null}

        {view.revenueBudget ? (
          <FiscalBreakdownSection
            sectionId="revenue-budget"
            title="歳入の内訳"
            description={`${initialBudgetBreakdownDescription(
              view.revenueBudget.decisionStage,
              "何でまかなう"
            )}市税や国・県からの支出金など、収入の種類ごとに示します。`}
            breakdown={view.revenueBudget}
            amountCaption="歳入予算額"
          />
        ) : null}

        {view.expenditureActual ? (
          <FiscalBreakdownSection
            sectionId="expenditure-actual"
            title="決算の内訳"
            description="その年度に実際に支出が確定した額の内訳です。予算額ではなく、確定した額である点に注意してください。"
            breakdown={view.expenditureActual}
            amountCaption="歳出決算額"
          />
        ) : null}

        <FiscalSourceList sources={sources} />

        {publishedYears.length > 1 ? (
          <nav aria-label="年度の切り替え" className="space-y-2">
            <h2 className="text-[22px] font-bold leading-[1.48] text-mirai-text">
              ほかの年度
            </h2>
            <ul className="flex flex-wrap gap-2">
              {publishedYears.map((year) => (
                <li key={year}>
                  <Link
                    href={routes.financeYear(year)}
                    aria-current={year === fiscalYear ? "page" : undefined}
                    className="inline-flex rounded-md border bg-card px-3 py-2 text-sm text-mirai-text shadow-xs hover:underline"
                  >
                    {formatFiscalYear(year)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <Breadcrumb
          items={[
            { label: "トップ", href: routes.home() },
            { label: "財政", href: routes.finance() },
            { label: formatFiscalYear(fiscalYear) },
          ]}
        />
      </Container>
    </div>
  );
}
