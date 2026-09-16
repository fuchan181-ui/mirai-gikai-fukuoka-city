import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import { cache } from "react";

/**
 * 公開ページが扱う集計範囲。沼津市の一般会計だけを見せる。
 * 金額セットは集計範囲ごとに別々に公開されるため、全会計合計や
 * 普通会計の数字が混ざらないようこの範囲に絞る。
 */
const PUBLIC_REPORTING_SCOPE_CODE = "general_account";

/**
 * 一般会計の集計範囲 ID。1リクエスト内で1回だけ引く。
 * 範囲が見つからないときは、どの会計の数字か断定できないので null を返し、
 * 呼び出し側で「何も出さない」に倒す。
 */
export const findPublicReportingScopeId = cache(
  async (): Promise<string | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("fiscal_reporting_scopes")
      .select("id")
      .eq("code", PUBLIC_REPORTING_SCOPE_CODE)
      .maybeSingle();

    if (error) {
      throw new Error(
        `公開対象の集計範囲を取得できませんでした: ${error.message}`
      );
    }
    return data?.id ?? null;
  }
);
