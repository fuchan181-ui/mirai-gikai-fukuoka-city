import type { JudgeCaseInput } from "../cases/input";

/**
 * 入力ケースを TypeSafe に渡す state に変換する。
 *
 * モデレーションと情報充実度で state の形がずれると比較条件が変わるため、
 * 変換はここに一本化する。
 */
export function buildJudgeState(input: JudgeCaseInput) {
  return {
    role_description: input.roleDescription,
    summary: input.summary,
    opinions: input.opinions,
    conversation: input.messages,
  };
}
