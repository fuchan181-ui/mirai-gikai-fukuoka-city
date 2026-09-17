import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MODERATION_CASES } from "../cases/moderation";
import { RICHNESS_CASES } from "../cases/richness";
import { levelMidpoint } from "../metrics";
import type { Options } from "../options";
import {
  buildModerationJudge,
  buildRichnessJudge,
  createDryRunModerationJudge,
  createDryRunRichnessJudge,
  requireApiKey,
} from "./factory";

const BASE_OPTIONS: Options = {
  judges: ["openai", "typesafe"],
  targets: ["moderation", "richness"],
  repeat: 1,
  out: null,
  model: null,
  dryRun: true,
};

const ENV_KEYS = ["OPENAI_API_KEY", "TYPESAFE_API_KEY"] as const;

describe("requireApiKey", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("未設定なら判定器の名前と回避方法を含むエラーを投げる", () => {
    expect(() => requireApiKey("TYPESAFE_API_KEY", "typesafe")).toThrow(
      /TYPESAFE_API_KEY が未設定です[\s\S]*--judge/
    );
  });

  it("設定済みなら値を返す", () => {
    process.env.TYPESAFE_API_KEY = "sk-test";
    expect(requireApiKey("TYPESAFE_API_KEY", "typesafe")).toBe("sk-test");
  });
});

describe("dry-run 判定器", () => {
  it("モデレーションは期待ラベルをそのまま返す", async () => {
    const judge = createDryRunModerationJudge("typesafe");
    expect(judge.id).toBe("dry-run:typesafe:moderation");

    for (const testCase of MODERATION_CASES) {
      const run = await judge.run(testCase.input);
      expect(run.output.status).toBe(testCase.expected);
      expect(run.meta.model).toBe("dry-run");
    }
  });

  it("情報充実度は期待レベルの中点スコアを返す", async () => {
    const judge = createDryRunRichnessJudge("openai");
    expect(judge.id).toBe("dry-run:openai:richness");

    for (const testCase of RICHNESS_CASES) {
      const run = await judge.run(testCase.input);
      expect(run.output.level).toBe(testCase.expected);
      expect(run.output.total).toBe(levelMidpoint(testCase.expected));
    }
  });
});

describe("buildModerationJudge", () => {
  it("dry-run では API キー無しでダミー判定器を返す", () => {
    const judge = buildModerationJudge("typesafe", BASE_OPTIONS);
    expect(judge.id).toBe("dry-run:typesafe:moderation");
  });

  it("API キーが無ければ実行前に落ちる", () => {
    const saved = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      expect(() =>
        buildModerationJudge("openai", { ...BASE_OPTIONS, dryRun: false })
      ).toThrow(/OPENAI_API_KEY が未設定/);
    } finally {
      if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
    }
  });
});

describe("buildRichnessJudge", () => {
  it("dry-run では対象ごとに識別子が変わる", () => {
    expect(buildRichnessJudge("typesafe", BASE_OPTIONS).id).toBe(
      "dry-run:typesafe:richness"
    );
  });

  it("OpenAI 版は既定のモデル名を識別子に使う", () => {
    const saved = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    try {
      const judge = buildRichnessJudge("openai", {
        ...BASE_OPTIONS,
        dryRun: false,
      });
      expect(judge.id.startsWith("openai:")).toBe(true);
    } finally {
      if (saved === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = saved;
    }
  });

  it("モデル上書きが識別子に反映される", () => {
    const saved = process.env.TYPESAFE_API_KEY;
    process.env.TYPESAFE_API_KEY = "sk-test";
    try {
      const judge = buildRichnessJudge("typesafe", {
        ...BASE_OPTIONS,
        dryRun: false,
        model: "jev-latest",
      });
      expect(judge.id).toBe("typesafe:jev-latest");
    } finally {
      if (saved === undefined) delete process.env.TYPESAFE_API_KEY;
      else process.env.TYPESAFE_API_KEY = saved;
    }
  });
});
