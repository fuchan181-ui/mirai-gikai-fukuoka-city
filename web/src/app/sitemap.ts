import type { MetadataRoute } from "next";
import { getPublishedBillSitemapEntries } from "@/features/bills/server/loaders/get-published-bill-sitemap-entries";
import { getGeneralQuestionSessions } from "@/features/general-questions/server/loaders/get-general-question-sessions";
import { GENERAL_QUESTIONS_ENABLED } from "@/features/general-questions/shared/constants";
import { env } from "@/lib/env";
import { getPublicBaseUrl } from "@/lib/metadata/utils/get-public-base-url";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl(env.webUrl);

  const [bills, generalQuestionSessions] = await Promise.all([
    getPublishedBillSitemapEntries(),
    GENERAL_QUESTIONS_ENABLED
      ? getGeneralQuestionSessions()
      : Promise.resolve([]),
  ]);
  const now = new Date();

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}${routes.billDetail(bill.id)}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const generalQuestionSessionUrls = generalQuestionSessions
    .filter(
      (session) => session.appearances.length > 0 || session.coverage.length > 0
    )
    .map((session) => ({
      url: `${baseUrl}${routes.generalQuestionsSession(session.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}${routes.billsList()}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...[
      routes.gikaiSessions(),
      ...(GENERAL_QUESTIONS_ENABLED ? [routes.generalQuestions()] : []),
      routes.developers(),
      routes.developersOpenDataApi(),
      routes.interviewDataTerms(),
      routes.privacy(),
      routes.terms(),
    ].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...billUrls,
    ...generalQuestionSessionUrls,
  ];
}
