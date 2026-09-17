import { describe, expect, it } from "vitest";
import { buildJudgeState } from "./state";

describe("buildJudgeState", () => {
  it("ケースの全項目を TypeSafe の state に写す", () => {
    const input = {
      summary: "要約",
      opinions: [{ title: "見出し", content: "本文" }],
      roleDescription: "沼津市在住",
      messages: [{ role: "user", content: "発言" }],
    };

    expect(buildJudgeState(input)).toEqual({
      role_description: "沼津市在住",
      summary: "要約",
      opinions: [{ title: "見出し", content: "本文" }],
      conversation: [{ role: "user", content: "発言" }],
    });
  });

  it("null も保ったまま写す", () => {
    const state = buildJudgeState({
      summary: null,
      opinions: null,
      roleDescription: null,
      messages: [],
    });

    expect(state).toEqual({
      role_description: null,
      summary: null,
      opinions: null,
      conversation: [],
    });
  });
});
