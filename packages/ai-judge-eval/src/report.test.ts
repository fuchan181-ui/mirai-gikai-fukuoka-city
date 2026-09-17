import { describe, expect, it } from "vitest";
import {
  summarizeLatency,
  summarizeModeration,
  summarizeRichness,
} from "./metrics";
import type { Options } from "./options";
import {
  buildReport,
  formatCount,
  formatMs,
  formatPercent,
  formatUsd,
  renderErrors,
  renderModerationSection,
  renderRichnessSection,
  renderUsageSection,
} from "./report";
import { summarizeUsage } from "./usage";

describe("formatPercent", () => {
  it("小数第1位までのパーセントにする", () => {
    expect(formatPercent(0.5)).toBe("50.0%");
    expect(formatPercent(2 / 3)).toBe("66.7%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatMs", () => {
  it("ミリ秒を整数に丸める", () => {
    expect(formatMs(1234.6)).toBe("1235ms");
  });
});

describe("renderModerationSection", () => {
  it("見逃しケースに警告マークを付ける", () => {
    const rows = [
      {
        caseId: "clean-support",
        note: "通常の賛成意見",
        expected: "ok" as const,
        predicted: "ok" as const,
        score: null,
        confidence: 0.8,
        triggeredCategories: [],
      },
      {
        caseId: "ng-spam",
        note: "スパム",
        expected: "ng" as const,
        predicted: "ok" as const,
        score: null,
        confidence: 0.6,
        triggeredCategories: [],
      },
    ];
    const markdown = renderModerationSection({
      judgeId: "typesafe:jev-latest",
      rows,
      summary: summarizeModeration(
        rows.map((row) => ({
          caseId: row.caseId,
          expected: row.expected,
          predicted: row.predicted,
        }))
      ),
      latency: summarizeLatency([100, 200]),
    });

    expect(markdown).toContain("typesafe:jev-latest");
    expect(markdown).toContain("ng-spam | ng | ok ⚠️");
    expect(markdown).toContain("clean-support | ok | ok |");
    expect(markdown).toContain("重大な見逃し（ng→ok）: 1 件 — ng-spam");
  });

  it("OpenAI 版の生スコアを列に出す", () => {
    const markdown = renderModerationSection({
      judgeId: "openai:gpt-5.2",
      rows: [
        {
          caseId: "warning-insensitive",
          note: "不謹慎な内容",
          expected: "warning",
          predicted: "warning",
          score: 42,
          confidence: null,
          triggeredCategories: [],
        },
      ],
      summary: summarizeModeration([
        {
          caseId: "warning-insensitive",
          expected: "warning",
          predicted: "warning",
        },
      ]),
      latency: summarizeLatency([500]),
    });

    expect(markdown).toContain(
      "| warning-insensitive | warning | warning | 42 | - |"
    );
  });
});

describe("renderRichnessSection", () => {
  it("レベル不一致に警告マークを付ける", () => {
    const rows = [
      {
        caseId: "rich-4",
        note: "非常に充実",
        expectedLevel: 4 as const,
        predictedLevel: 4 as const,
        predictedScore: 88,
        confidence: 0.7,
      },
      {
        caseId: "rich-0",
        note: "情報なし",
        expectedLevel: 0 as const,
        predictedLevel: 2 as const,
        predictedScore: 45,
        confidence: 0.3,
      },
    ];
    const markdown = renderRichnessSection({
      judgeId: "openai:gpt-5.2",
      rows,
      summary: summarizeRichness(
        rows.map((row) => ({
          caseId: row.caseId,
          expectedLevel: row.expectedLevel,
          predictedLevel: row.predictedLevel,
          expectedScore: 0,
          predictedScore: row.predictedScore,
        }))
      ),
      latency: summarizeLatency([500]),
    });

    expect(markdown).toContain("rich-0 | 0 | 2 ⚠️");
    expect(markdown).toContain("rich-4 | 4 | 4 | 88");
    expect(markdown).toContain("レベル完全一致: 50.0% (1/2)");
    expect(markdown).toContain("レベル単位の誤差: 平均絶対値 1.00 レベル");
  });
});

describe("renderErrors", () => {
  it("エラーがなければ空文字を返す", () => {
    expect(renderErrors([])).toBe("");
  });

  it("エラーを一覧にする", () => {
    const markdown = renderErrors([
      { caseId: "a", judgeId: "typesafe:jev-latest", message: "401" },
    ]);
    expect(markdown).toContain("typesafe:jev-latest` / a: 401");
  });
});

describe("formatCount", () => {
  it("3 桁区切りにする", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1234567)).toBe("1,234,567");
  });
});

describe("formatUsd", () => {
  it("0 と不明を区別する", () => {
    expect(formatUsd(null)).toBe("不明");
    expect(formatUsd(0)).toBe("$0");
    expect(formatUsd(0.0123)).toBe("$0.0123");
    expect(formatUsd(0.00001)).toBe("<$0.0001");
  });
});

describe("renderUsageSection", () => {
  it("トークン数と推定コストを行にする", () => {
    const markdown = renderUsageSection([
      {
        judgeId: "openai:gpt-5.2",
        target: "moderation",
        summary: summarizeUsage([
          {
            model: "openai/gpt-5.2",
            usage: { inputTokens: 10000, outputTokens: 2000 },
          },
        ]),
      },
    ]);

    expect(markdown).toContain("## 実行コスト");
    expect(markdown).toContain(
      "| openai:gpt-5.2 | モデレーション | 1 | 10,000 | 2,000 |"
    );
  });

  it("単価未登録・usage 未取得を注記する", () => {
    const markdown = renderUsageSection([
      {
        judgeId: "typesafe:jev-latest",
        target: "richness",
        summary: summarizeUsage([{ model: "jev-latest" }]),
      },
    ]);

    expect(markdown).toContain("不明");
    expect(markdown).toContain("usage 未取得 1 件");
  });

  it("行が無ければ空文字を返す", () => {
    expect(renderUsageSection([])).toBe("");
  });
});

describe("buildReport", () => {
  const options: Options = {
    judges: ["openai"],
    targets: ["moderation"],
    repeat: 2,
    out: null,
    model: null,
    dryRun: true,
  };

  it("実行条件・セクション・コスト・エラーを順に並べる", () => {
    const report = buildReport({
      options,
      sections: ["### モデレーション — openai:gpt-5.2\n"],
      errors: [{ caseId: "a", judgeId: "openai:gpt-5.2", message: "401" }],
      usageRows: [
        {
          judgeId: "openai:gpt-5.2",
          target: "moderation",
          summary: summarizeUsage([]),
        },
      ],
      generatedAt: new Date("2026-09-18T01:23:45.000Z"),
    });

    expect(report).toContain("- 実行日時: 2026-09-18T01:23:45.000Z");
    expect(report).toContain("- 反復回数: 2");
    expect(report).toContain("- ドライラン: はい（結果はダミー）");
    expect(report.indexOf("### モデレーション")).toBeLessThan(
      report.indexOf("## 実行コスト")
    );
    expect(report.indexOf("## 実行コスト")).toBeLessThan(
      report.indexOf("## 実行できなかったケース")
    );
  });
});
