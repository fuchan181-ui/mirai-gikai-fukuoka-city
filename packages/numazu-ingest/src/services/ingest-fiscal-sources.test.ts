import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  findFiscalSourceProfile,
  fiscalSourceProfiles,
} from "../shared/fiscal-source-profiles";
import { ingestFiscalSources } from "./ingest-fiscal-sources";

/** 令和6年度市政報告書の解析は parser と同じ fixture で検証する。 */
const majorMeasuresFixture = readFileSync(
  new URL(
    "../parsers/__fixtures__/fiscal-major-measures-2024-layout.txt",
    import.meta.url
  ),
  "utf8"
);

/** 一般会計合計1件と13款それぞれの当初予算・予算現額・決算の金額レコード数。 */
const MAJOR_MEASURES_AMOUNT_COUNT = 3 * 13 + 3;

describe("ingestFiscalSources", () => {
  it("staging保存失敗時にparse runを再試行可能な失敗として確定する", async () => {
    const failedRuns: { parseRunId: string; errorMessage: string }[] = [];
    const profile = fiscalSourceProfiles[0];

    await expect(
      ingestFiscalSources({
        ingestionRunId: "ingestion-run",
        profiles: [profile],
        client: {
          fetchPdfDocument: async () => ({
            url: profile.url,
            contentHash: "content-hash",
            etag: null,
            lastModified: null,
            text: "令和8年度一般会計",
            bytes: new Uint8Array([1]),
          }),
        },
        repository: {
          prepareSource: async () => ({
            sourceId: "source",
            sourceVersionId: "source-version",
            parseRunId: "parse-run",
            alreadyParsed: false,
          }),
          saveStaging: async () => {
            throw new Error("staging unavailable");
          },
          failParseRun: async (failedRun) => {
            failedRuns.push(failedRun);
          },
          findPreviousRecords: async () => [],
        },
      })
    ).rejects.toThrow("staging unavailable");

    expect(failedRuns).toEqual([
      {
        parseRunId: "parse-run",
        errorMessage: "staging unavailable",
      },
    ]);
  });

  it("前回適用済み候補と比較して変更候補を保存する", async () => {
    const profile = fiscalSourceProfiles[0];
    let savedChangeKind: string | null = null;

    await ingestFiscalSources({
      ingestionRunId: "ingestion-run",
      profiles: [profile],
      client: {
        fetchPdfDocument: async () => ({
          url: profile.url,
          contentHash: "new-content-hash",
          etag: null,
          lastModified: null,
          text: "改訂版",
          bytes: new Uint8Array([2]),
        }),
      },
      repository: {
        prepareSource: async () => ({
          sourceId: "source",
          sourceVersionId: "source-version",
          parseRunId: "parse-run",
          alreadyParsed: false,
        }),
        findPreviousRecords: async () => [
          {
            targetId: "previous-record",
            recordKind: "document_metadata",
            sourceRecordKey: profile.profileKey,
            contentFingerprint: "previous-fingerprint",
            parsedPayload: { contentHash: "old-content-hash" },
          },
        ],
        saveStaging: async ({ rows }) => {
          savedChangeKind = rows[0]?.changeKind ?? null;
          return "batch";
        },
        failParseRun: async () => {},
      },
    });

    expect(savedChangeKind).toBe("changed");
  });

  it("令和6年度市政報告書の金額と検算結果をstagingへ渡す", async () => {
    const profile = findFiscalSourceProfile("major-measures-2024-fiscal");
    if (!profile) throw new Error("test profile missing");
    let saved:
      | {
          discoveredCount: number;
          parseStatus: "completed" | "failed" | undefined;
          recordKinds: string[];
        }
      | undefined;

    await ingestFiscalSources({
      ingestionRunId: "ingestion-run",
      profiles: [profile],
      client: {
        fetchPdfDocument: async () => ({
          url: profile.url,
          contentHash: "major-measures-hash",
          etag: null,
          lastModified: null,
          text: majorMeasuresFixture,
          bytes: new Uint8Array([3]),
        }),
      },
      repository: {
        prepareSource: async () => ({
          sourceId: "source",
          sourceVersionId: "source-version",
          parseRunId: "parse-run",
          alreadyParsed: false,
        }),
        findPreviousRecords: async () => [],
        saveStaging: async ({ discoveredCount, parseStatus, rows }) => {
          saved = {
            discoveredCount,
            parseStatus,
            recordKinds: rows.map((row) => row.recordKind),
          };
          return "batch";
        },
        failParseRun: async () => {},
      },
    });

    expect(saved).toEqual({
      discoveredCount: MAJOR_MEASURES_AMOUNT_COUNT + 1,
      parseStatus: "completed",
      recordKinds: [
        "document_metadata",
        ...Array.from({ length: MAJOR_MEASURES_AMOUNT_COUNT }, () => "amount"),
      ],
    });
  });

  it("parserのhard errorをfailed状態と集計件数へ反映する", async () => {
    const profile = findFiscalSourceProfile("major-measures-2024-fiscal");
    if (!profile) throw new Error("test profile missing");
    let savedParseStatus: "completed" | "failed" | undefined;

    const result = await ingestFiscalSources({
      ingestionRunId: "ingestion-run",
      profiles: [profile],
      client: {
        fetchPdfDocument: async () => ({
          url: profile.url,
          contentHash: "invalid-major-measures-hash",
          etag: null,
          lastModified: null,
          text: majorMeasuresFixture.replace("96.8", "96.7"),
          bytes: new Uint8Array([4]),
        }),
      },
      repository: {
        prepareSource: async () => ({
          sourceId: "source",
          sourceVersionId: "source-version",
          parseRunId: "parse-run",
          alreadyParsed: false,
        }),
        findPreviousRecords: async () => [],
        saveStaging: async ({ parseStatus }) => {
          savedParseStatus = parseStatus;
          return "batch";
        },
        failParseRun: async () => {},
      },
    });

    expect(savedParseStatus).toBe("failed");
    expect(result.validationErrorCount).toBe(1);
  });
});
