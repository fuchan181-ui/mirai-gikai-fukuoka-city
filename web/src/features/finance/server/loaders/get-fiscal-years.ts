import "server-only";
import {
  findPublishedFiscalYearAmounts,
  findPublishedFiscalYears,
} from "../repositories/fiscal-repository";

export const getPublishedFiscalYears = findPublishedFiscalYears;
export const getPublishedFiscalYearAmounts = findPublishedFiscalYearAmounts;
