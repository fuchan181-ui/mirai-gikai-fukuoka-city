"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  isInterviewSection,
  isMainPage,
  isWidePage,
} from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname);
  const isInterview = isInterviewSection(pathname);
  const isWide = isWidePage(pathname);

  return (
    <div
      className={cn(
        // モバイルは余白なし（ヒーロー/サムネイルを画面最上部に表示）、md以上で固定
        // ヘッダー分の上余白を確保する。パンくずを持つページは各ページ側で
        // モバイル時の上余白（pt-24 md:pt-0）を付与してヘッダー埋もれを回避する。
        "relative md:mt-24",
        // 表やグラフを並べるページは幅を絞らない。
        // 読み物としての行長は各ページの Container と本文側で調整する。
        !isWide && "max-w-[700px] mx-auto",
        // 幅を絞ったページだけ、背景から浮かせる影を付ける。
        // 幅いっぱいのページはカードごとに影を持つため、外側には付けない。
        !isInterview && !isWide && "sm:shadow-lg",
        // TOP・議案一覧・議案詳細のみ、チャットサイドバー用のオフセット
        useSidebarLayout && "pc:mr-[500px] xl:ml-[calc(calc(100vw-1180px)/2)]"
      )}
    >
      {children}
    </div>
  );
}
