import { executeInTestDatabase } from "@test-utils/db-function/ingestion-audit-test-database";
import { publishedGeneralQuestionItemFixtureSql } from "@test-utils/db-function/policy-classification-test-fixture";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GENERAL_QUESTIONS_ENABLED } from "@/features/general-questions/shared/constants";
import { GET } from "./route";

const fixtureAppearanceId = "00000000-0000-0000-0000-000000000201";

function removeFixture() {
  executeInTestDatabase(`
    set session_replication_role = replica;
    delete from public.general_question_item_sources
      where id = '00000000-0000-0000-0000-000000000304';
    delete from public.general_question_item_source_occurrences
      where id = '00000000-0000-0000-0000-000000000303';
    delete from public.general_question_item_revisions
      where id = '00000000-0000-0000-0000-000000000302';
    delete from public.general_question_items
      where id = '00000000-0000-0000-0000-000000000301';
    delete from public.general_question_appearance_sources
      where id = '00000000-0000-0000-0000-000000000204';
    delete from public.general_question_appearance_source_occurrences
      where id = '00000000-0000-0000-0000-000000000203';
    delete from public.general_question_appearance_revisions
      where id = '00000000-0000-0000-0000-000000000202';
    delete from public.general_question_appearances
      where id = '${fixtureAppearanceId}';
    delete from public.council_meeting_source_evidence
      where id = '00000000-0000-0000-0000-000000000108';
    delete from public.council_meeting_source_occurrences
      where id = '00000000-0000-0000-0000-000000000107';
    delete from public.council_meeting_revisions
      where id = '00000000-0000-0000-0000-000000000106';
    delete from public.council_meetings
      where id = '00000000-0000-0000-0000-000000000105';
    delete from public.published_source_version_references
      where source_version_id = '00000000-0000-0000-0000-000000000102';
    delete from public.ingestion_source_version_retention_transitions
      where source_version_id = '00000000-0000-0000-0000-000000000102';
    delete from public.ingestion_parse_runs
      where id = '00000000-0000-0000-0000-000000000104';
    delete from public.ingestion_runs
      where id = '00000000-0000-0000-0000-000000000103';
    delete from public.ingestion_source_versions
      where id = '00000000-0000-0000-0000-000000000102';
    delete from public.ingestion_sources
      where id = '00000000-0000-0000-0000-000000000101';
    delete from public.council_sessions
      where id = '00000000-0000-0000-0000-000000000100';
    set session_replication_role = origin;
  `);
}

function request(query = "") {
  return new Request(
    `http://localhost/api/open-data/general-questions${query}`,
    {
      headers: { "x-forwarded-for": "198.51.100.44" },
    }
  );
}

describe("GET /api/open-data/general-questions", () => {
  it.skipIf(GENERAL_QUESTIONS_ENABLED)("未リリース中は404を返す", async () => {
    expect((await GET(request())).status).toBe(404);
  });
});

describe.skipIf(!GENERAL_QUESTIONS_ENABLED)(
  "GET /api/open-data/general-questions (enabled)",
  () => {
    beforeAll(() => {
      removeFixture();
      executeInTestDatabase(publishedGeneralQuestionItemFixtureSql);
    });

    afterAll(removeFixture);

    it("不正な年を400にする", async () => {
      expect((await GET(request("?year=1989"))).status).toBe(400);
    });

    it("QA済み一覧をno-storeで返す", async () => {
      const response = await GET(request());
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("X-Content-Provenance")).toContain(
        "ai-summaries-human-reviewed"
      );
      const body = await response.json();
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items).toContainEqual(
        expect.objectContaining({
          appearanceId: fixtureAppearanceId,
          items: [
            expect.objectContaining({
              summary: "地域防災の取組",
              summaryGenerationModel: "openai/gpt-5-mini",
              summaryPromptVersion: "2026-09-04-v1",
            }),
          ],
        })
      );
      expect(body.rights.sourceTermsUrl).toBe(
        "https://www.city.numazu.shizuoka.jp/about/copyright.htm"
      );
    });

    it("CSVをダウンロード形式で返す", async () => {
      const response = await GET(request("?format=csv"));
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain("text/csv");
      expect(response.headers.has("X-Next-Cursor")).toBe(true);
      expect(response.headers.get("Link")).toContain('rel="terms-of-service"');
      expect(await response.text()).toContain("appearance_id");
    });
  }
);
