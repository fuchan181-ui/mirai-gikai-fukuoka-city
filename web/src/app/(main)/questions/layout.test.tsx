import { describe, expect, it, vi } from "vitest";
import { GENERAL_QUESTIONS_ENABLED } from "@/features/general-questions/shared/constants";
import GeneralQuestionsLayout from "./layout";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("GeneralQuestionsLayout", () => {
  it.skipIf(GENERAL_QUESTIONS_ENABLED)("未リリース中は404にする", () => {
    expect(() =>
      GeneralQuestionsLayout({ children: <div>一般質問</div> })
    ).toThrow("NEXT_NOT_FOUND");
  });
});
