import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { GENERAL_QUESTIONS_ENABLED } from "@/features/general-questions/shared/constants";

export default function GeneralQuestionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!GENERAL_QUESTIONS_ENABLED) {
    notFound();
  }

  return children;
}
