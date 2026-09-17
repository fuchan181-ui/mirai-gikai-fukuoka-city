import { describe, expect, it } from "vitest";
import {
  type ArtifactRun,
  artifactPathFor,
  buildArtifact,
  resolveOutPath,
  toArtifactRun,
} from "./artifacts";
import type { Options } from "./options";
import type { RunRecord } from "./runs";

const OPTIONS: Options = {
  judges: ["openai", "typesafe"],
  targets: ["moderation", "richness"],
  repeat: 2,
  out: "docs/out.md",
  model: "jev-latest",
  dryRun: false,
};

describe("artifactPathFor", () => {
  it(".md は .json に置き換える", () => {
    expect(artifactPathFor("docs/typesafe-phase0.md")).toBe(
      "docs/typesafe-phase0.json"
    );
  });

  it("拡張子が md でなければ .json を足す", () => {
    expect(artifactPathFor("docs/result")).toBe("docs/result.json");
    expect(artifactPathFor("docs/result.txt")).toBe("docs/result.txt.json");
  });
});

describe("resolveOutPath", () => {
  it("相対パスはリポジトリルート基準で解決する", () => {
    expect(resolveOutPath("/repo", "docs/out.md")).toBe("/repo/docs/out.md");
  });

  it("絶対パスはそのまま使う", () => {
    expect(resolveOutPath("/repo", "/tmp/out.md")).toBe("/tmp/out.md");
  });
});

describe("toArtifactRun", () => {
  const run: RunRecord<{ status: string; categoryProbabilities: object }> = {
    caseId: "ng-spam",
    attempt: 2,
    output: { status: "ng", categoryProbabilities: { spam: 0.9 } },
    meta: {
      model: "jev-latest",
      latencyMs: 123,
      usage: { inputTokens: 500, outputTokens: 20 },
    },
  };

  it("完全な出力と usage を保持する", () => {
    expect(
      toArtifactRun({
        judgeId: "typesafe:jev-latest",
        target: "moderation",
        run,
      })
    ).toEqual({
      judgeId: "typesafe:jev-latest",
      target: "moderation",
      caseId: "ng-spam",
      attempt: 2,
      model: "jev-latest",
      latencyMs: 123,
      usage: { inputTokens: 500, outputTokens: 20 },
      output: { status: "ng", categoryProbabilities: { spam: 0.9 } },
    });
  });

  it("usage が無ければキー自体を持たせない", () => {
    const artifactRun = toArtifactRun({
      judgeId: "openai:gpt-5.2",
      target: "richness",
      run: { ...run, meta: { model: "gpt-5.2", latencyMs: 1 } },
    });
    expect("usage" in artifactRun).toBe(false);
  });
});

describe("buildArtifact", () => {
  const runs: ArtifactRun[] = [
    {
      judgeId: "typesafe:jev-latest",
      target: "moderation",
      caseId: "ng-spam",
      attempt: 1,
      model: "jev-latest",
      latencyMs: 100,
      output: {
        status: "ng",
        categoryProbabilities: { spam: 0.91, hate_speech: 0.02 },
      },
    },
  ];

  it("実行条件と実行記録をそのまま保存する", () => {
    const generatedAt = new Date("2026-09-18T00:00:00.000Z");
    const artifact = buildArtifact({
      options: OPTIONS,
      runs,
      errors: [],
      generatedAt,
    });

    expect(artifact.version).toBe(1);
    expect(artifact.generatedAt).toBe("2026-09-18T00:00:00.000Z");
    expect(artifact.judges).toEqual(["openai", "typesafe"]);
    expect(artifact.repeat).toBe(2);
    expect(artifact.model).toBe("jev-latest");
    expect(artifact.dryRun).toBe(false);
    expect(artifact.runs).toEqual(runs);
  });

  it("JSON 経由でもカテゴリ別確率が欠けない（再計算できる）", () => {
    const artifact = buildArtifact({
      options: OPTIONS,
      runs,
      errors: [{ caseId: "a", judgeId: "openai:gpt-5.2", message: "401" }],
      generatedAt: new Date("2026-09-18T00:00:00.000Z"),
    });
    const restored = JSON.parse(JSON.stringify(artifact)) as typeof artifact;

    expect(restored.runs[0].output).toEqual({
      status: "ng",
      categoryProbabilities: { spam: 0.91, hate_speech: 0.02 },
    });
    expect(restored.errors).toHaveLength(1);
  });
});
