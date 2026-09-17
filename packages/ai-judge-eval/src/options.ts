export type Target = "moderation" | "richness";
export type JudgeKind = "openai" | "typesafe";

export type Options = {
  judges: JudgeKind[];
  targets: Target[];
  /** 各ケースの実行回数。2 以上なら判定のぶれも見る */
  repeat: number;
  /** markdown の書き出し先。null なら標準出力のみ */
  out: string | null;
  /** OpenAI 判定器に渡すモデル名の上書き。null なら本番と同じ既定値 */
  openaiModel: string | null;
  /** TypeSafe 判定器に渡すモデル名の上書き。null なら API 側の既定モデル */
  typesafeModel: string | null;
  /** API を呼ばず、配線だけ検証する */
  dryRun: boolean;
};

export type ParseResult = { kind: "help" } | { kind: "run"; options: Options };

export const USAGE = `使い方: pnpm --filter @mirai-gikai/ai-judge-eval eval -- [options]

  --judge=openai|typesafe|all     比較する判定器（既定: all）
  --only=moderation|richness|all  対象タスク（既定: all）
  --openai-model=<name>           OpenAI 側のモデル名を上書き（既定: 本番と同じ定数）
  --typesafe-model=<name>         TypeSafe 側のモデル名を上書き（既定: API 既定）
  --repeat=<n>                    各ケースの実行回数（既定: 1）
  --out=<path>                    markdown をファイルにも書き出す
  --dry-run                       API を呼ばずに配線だけ検証する
  --help                          このヘルプ

必要な環境変数:
  OPENAI_API_KEY    --judge=openai または all のとき
  TYPESAFE_API_KEY  --judge=typesafe または all のとき
`;

const JUDGE_KINDS: JudgeKind[] = ["openai", "typesafe"];
const TARGETS: Target[] = ["moderation", "richness"];

function parseChoice<T extends string>(
  flag: string,
  value: string | undefined,
  allowed: T[]
): T[] {
  if (value === undefined || value === "all") return [...allowed];
  if (!allowed.includes(value as T)) {
    throw new Error(
      `${flag} には ${allowed.join(" / ")} / all のいずれかを指定してください: ${value}`
    );
  }
  return [value as T];
}

export function parseArgs(argv: string[]): ParseResult {
  const options: Options = {
    judges: [...JUDGE_KINDS],
    targets: [...TARGETS],
    repeat: 1,
    out: null,
    openaiModel: null,
    typesafeModel: null,
    dryRun: false,
  };

  for (const arg of argv) {
    // pnpm 経由だと `--` がそのまま渡ってくるので読み飛ばす
    if (arg === "--") continue;

    const separator = arg.indexOf("=");
    const flag = separator === -1 ? arg : arg.slice(0, separator);
    const value = separator === -1 ? undefined : arg.slice(separator + 1);

    if (flag === "--help" || flag === "-h") return { kind: "help" };
    if (flag === "--judge") {
      options.judges = parseChoice(flag, value, JUDGE_KINDS);
    } else if (flag === "--only") {
      options.targets = parseChoice(flag, value, TARGETS);
    } else if (flag === "--openai-model") {
      if (!value) throw new Error("--openai-model にはモデル名が必要です");
      options.openaiModel = value;
    } else if (flag === "--typesafe-model") {
      if (!value) throw new Error("--typesafe-model にはモデル名が必要です");
      options.typesafeModel = value;
    } else if (flag === "--repeat") {
      const repeat = Number(value);
      if (!Number.isInteger(repeat) || repeat < 1) {
        throw new Error(
          `--repeat には 1 以上の整数を指定してください: ${value}`
        );
      }
      options.repeat = repeat;
    } else if (flag === "--out") {
      if (!value) throw new Error("--out には出力先のパスが必要です");
      options.out = value;
    } else if (flag === "--dry-run") {
      options.dryRun = true;
    } else {
      throw new Error(`不明な引数: ${arg}`);
    }
  }

  return { kind: "run", options };
}
