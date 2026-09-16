import type { Metadata } from "next";
import { FinancePage } from "@/features/finance/server/components/finance-page";

export const metadata: Metadata = {
  title: "予算とその使われ方 | みらい議会＠沼津市",
  description:
    "沼津市の一般会計の予算内訳と、その予算がどう使われたかを公式資料からまとめて表示します。",
};

export default function Page() {
  return <FinancePage />;
}
