import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "@mirai-gikai/supabase";

type BillStatus = Database["public"]["Enums"]["bill_status_enum"];

/**
 * 議事報告から進捗を反映できる状態。
 *
 * 本会議の議決（議案審議結果PDF）や会議録から保存した確定値
 * （可決・否決・継続審査など）は上書きしない。
 */
export const PROGRESS_UPDATABLE_STATUSES: readonly BillStatus[] = [
  "submitted",
  "in_committee",
];

export type SessionProgressBill = {
  id: string;
  /** 表記どおりの議案番号（例: "議第87号"） */
  billNumber: string;
  status: BillStatus;
  statusNote: string | null;
  /** 提出日。委員会付託の対象を「その日までに出た議案」に限るために使う */
  submittedDate: string | null;
};

/** 会期の議案を、議事報告の反映に必要な項目だけ取得する */
export async function listBillsForSessionProgress(
  councilSessionId: string
): Promise<SessionProgressBill[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("id, bill_number, status, status_note, submitted_date")
    .eq("council_session_id", councilSessionId);

  if (error) throw new Error(`議案の取得に失敗した: ${error.message}`);
  return (data ?? []).flatMap((row) =>
    row.bill_number === null
      ? []
      : [
          {
            id: row.id,
            billNumber: row.bill_number,
            status: row.status,
            statusNote: row.status_note,
            submittedDate: row.submitted_date,
          },
        ]
  );
}

/**
 * 議事報告から読み取った審議の進捗（委員会付託・委員会審査の結果）を保存する。
 *
 * まだ議決していない議案だけを更新する。更新条件をSQL側にも持たせることで、
 * 議案審議結果PDFの取り込みと同時に走っても確定値を巻き戻さない。
 * 対象外だった場合は false を返す。
 */
export async function updateBillSessionProgress(
  billId: string,
  update: { status: BillStatus; statusNote: string }
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .update({ status: update.status, status_note: update.statusNote })
    .eq("id", billId)
    .in("status", [...PROGRESS_UPDATABLE_STATUSES])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`審議進捗の保存に失敗した: ${error.message}`);
  return data !== null;
}
