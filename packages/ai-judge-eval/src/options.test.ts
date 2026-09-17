import { describe, expect, it } from "vitest";
import { parseArgs } from "./options";

function runOptions(argv: string[]) {
  const result = parseArgs(argv);
  if (result.kind !== "run") throw new Error("run を期待した");
  return result.options;
}

describe("parseArgs", () => {
  it("引数なしなら両方の判定器と両方のタスクを対象にする", () => {
    const options = runOptions([]);
    expect(options.judges).toEqual(["openai", "typesafe"]);
    expect(options.targets).toEqual(["moderation", "richness"]);
    expect(options.repeat).toBe(1);
    expect(options.dryRun).toBe(false);
  });

  it("--help は help を返す", () => {
    expect(parseArgs(["--help"]).kind).toBe("help");
  });

  it("--judge=typesafe で片方に絞る", () => {
    expect(runOptions(["--judge=typesafe"]).judges).toEqual(["typesafe"]);
  });

  it("--only=moderation で片方のタスクに絞る", () => {
    expect(runOptions(["--only=moderation"]).targets).toEqual(["moderation"]);
  });

  it("--judge=all は両方を返す", () => {
    expect(runOptions(["--judge=all"]).judges).toEqual(["openai", "typesafe"]);
  });

  it("--repeat は 1 以上の整数のみ受け付ける", () => {
    expect(runOptions(["--repeat=3"]).repeat).toBe(3);
    expect(() => parseArgs(["--repeat=0"])).toThrow();
    expect(() => parseArgs(["--repeat=abc"])).toThrow();
  });

  it("未知の enum 値はエラーにする", () => {
    expect(() => parseArgs(["--judge=gemini"])).toThrow();
    expect(() => parseArgs(["--only=chat"])).toThrow();
  });

  it("不明な引数はエラーにする", () => {
    expect(() => parseArgs(["--unknown"])).toThrow();
  });

  it("pnpm が渡してくる区切りの -- は無視する", () => {
    expect(runOptions(["--", "--dry-run"]).dryRun).toBe(true);
  });

  it("OpenAI と TypeSafe のモデルを別々に上書きできる", () => {
    const options = runOptions([
      "--openai-model=openai/gpt-5.6-luna",
      "--typesafe-model=jev-1.13.0",
    ]);
    expect(options.openaiModel).toBe("openai/gpt-5.6-luna");
    expect(options.typesafeModel).toBe("jev-1.13.0");
    expect(() => parseArgs(["--openai-model"])).toThrow();
    expect(() => parseArgs(["--typesafe-model"])).toThrow();
  });

  it("モデル上書きは既定で未指定にする", () => {
    const options = runOptions([]);
    expect(options.openaiModel).toBeNull();
    expect(options.typesafeModel).toBeNull();
  });

  it("両判定器に同じ名前を渡す旧 --model は受け付けない", () => {
    expect(() => parseArgs(["--model=jev-1.13.0"])).toThrow();
  });
});
