import type { FiscalSourceProfile } from "../shared/fiscal-source-profiles";
import type { FiscalParserResult } from "./fiscal-parser-types";
import {
  parseCouncilBudget2026,
  parseGeneralBudget2026,
} from "./parse-budget-overview-2026";
import { parseMajorMeasures2024 } from "./parse-major-measures-2024";
import { parseSettlementOverview2024 } from "./parse-settlement-overview-2024";

export function parseFiscalDocument(params: {
  profile: FiscalSourceProfile;
  text: string;
}): FiscalParserResult {
  switch (params.profile.parserKind) {
    case "general_budget_2026":
      return parseGeneralBudget2026(params.text);
    case "council_budget_2026":
      return parseCouncilBudget2026(params.text);
    case "metadata_only":
      return { records: [], validationSummary: [] };
    case "settlement_overview_2024":
      return parseSettlementOverview2024(params.text);
    case "major_measures_2024":
      return parseMajorMeasures2024(params.text);
  }
}
