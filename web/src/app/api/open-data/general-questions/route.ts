import { GENERAL_QUESTIONS_ENABLED } from "@/features/general-questions/shared/constants";
import {
  GENERAL_QUESTION_DATA_RIGHTS,
  generalQuestionsToCsv,
  getOpenDataGeneralQuestions,
} from "@/features/open-data/server/services/get-open-data-general-questions";
import { checkRateLimit } from "@/features/open-data/server/utils/rate-limit-guard";
import { parseGeneralQuestionsQuery } from "@/features/open-data/shared/utils/parse-general-questions-query";
import { jsonNoStore } from "@/lib/api/response";

const RIGHTS_HEADERS = {
  Link: `<${GENERAL_QUESTION_DATA_RIGHTS.sourceTermsUrl}>; rel="terms-of-service"`,
  "X-Content-Provenance":
    "official-source; summary-provenance-in-payload; ai-summaries-human-reviewed",
};

export async function GET(request: Request) {
  if (!GENERAL_QUESTIONS_ENABLED) {
    return jsonNoStore({ error: "Not Found" }, 404);
  }

  const query = parseGeneralQuestionsQuery(new URL(request.url).searchParams);
  if (!query.ok) return jsonNoStore({ error: query.error }, 400);
  try {
    const rateLimited = await checkRateLimit(request);
    if (rateLimited) return rateLimited;
    const result = await getOpenDataGeneralQuestions(query);
    if (query.format === "csv") {
      return new Response(generalQuestionsToCsv(result.items), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="general-questions.csv"',
          "X-Next-Cursor": result.nextCursor ?? "",
          ...RIGHTS_HEADERS,
        },
      });
    }
    return jsonNoStore(result, 200, RIGHTS_HEADERS);
  } catch (error) {
    console.error("[OpenData] general questions read failed:", error);
    return jsonNoStore({ error: "サーバー内部でエラーが発生しました" }, 500);
  }
}
