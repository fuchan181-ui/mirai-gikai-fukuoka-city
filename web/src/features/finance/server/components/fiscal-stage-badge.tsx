import "server-only";
import { FISCAL_DECISION_STAGE_LABELS } from "../../shared/constants/fiscal-labels";
import type { FiscalDecisionStage } from "../../shared/types/fiscal-amount";

/**
 * 議決前の案か、議決済みかを文字で示す。
 * 議決を伴わない段階（決算や予算現額）は何も出さない。
 */
export function FiscalStageBadge({
  decisionStage,
}: {
  decisionStage: FiscalDecisionStage;
}) {
  const label = FISCAL_DECISION_STAGE_LABELS[decisionStage];
  if (!label) return null;

  return (
    <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-mirai-border bg-mirai-surface px-2 py-0.5 text-xs font-medium text-mirai-text-note">
      {label}
    </span>
  );
}
