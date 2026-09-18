import type { FiscalSourceProfile } from "../shared/fiscal-source-profiles";
import { normalizeMisencodedPdfAscii } from "../shared/utils/normalize-misencoded-pdf-ascii";
import type { FiscalParserResult } from "./fiscal-parser-types";
import {
  parseCouncilBudget,
  parseGeneralBudget,
} from "./parse-budget-overview";
import { parseBudgetSectionSummary } from "./parse-budget-section-summary";
import { parseMajorMeasures } from "./parse-major-measures";
import { parseSettlementOverview } from "./parse-settlement-overview";

export function parseFiscalDocument(params: {
  profile: FiscalSourceProfile;
  text: string;
}): FiscalParserResult {
  const text = normalizeMisencodedPdfAscii(params.text);
  const fiscalYear = params.profile.fiscalYear;
  switch (params.profile.parserKind) {
    case "general_budget_2026":
      return parseGeneralBudget(text, fiscalYear);
    case "council_budget_2026":
      return parseCouncilBudget(text, fiscalYear);
    case "budget_section_summary_2026":
      return parseBudgetSectionSummary(text, fiscalYear);
    case "metadata_only":
      return { records: [], validationSummary: [] };
    case "settlement_overview_2024":
      return parseSettlementOverview(text, fiscalYear);
    case "major_measures_2024":
      return parseMajorMeasures(text, fiscalYear);
  }
}
