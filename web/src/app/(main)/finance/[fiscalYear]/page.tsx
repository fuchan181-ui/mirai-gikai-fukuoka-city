import type { Metadata } from "next";
import { FiscalYearPage } from "@/features/finance/server/components/fiscal-year-page";
import { formatFiscalYear } from "@/features/finance/shared/utils/format-fiscal-year";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fiscalYear: string }>;
}): Promise<Metadata> {
  const { fiscalYear } = await params;
  const year = Number(fiscalYear);
  if (!Number.isInteger(year)) {
    return { title: "財政 | みらい議会＠沼津市" };
  }
  const label = formatFiscalYear(year);
  return {
    title: `${label}の予算と決算 | みらい議会＠沼津市`,
    description: `沼津市の一般会計の${label}予算の内訳と、その予算がどう使われたかを公式資料からまとめて表示します。`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ fiscalYear: string }>;
}) {
  const { fiscalYear } = await params;
  return <FiscalYearPage fiscalYear={Number(fiscalYear)} />;
}
