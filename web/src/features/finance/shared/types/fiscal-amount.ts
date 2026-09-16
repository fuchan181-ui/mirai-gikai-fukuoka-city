/** 財政イベントの種類。予算の段階を表す。 */
export type FiscalEventKind =
  | "initial_budget"
  | "available_budget_snapshot"
  | "settlement";

/** 議決段階。議決を伴わない段階は not_applicable を使う。 */
export type FiscalDecisionStage = "proposed" | "passed" | "not_applicable";

/**
 * 画面に出す金額の意味。歳入と歳出、予算と決算を混ぜないために分ける。
 * DB の enum には補正差額や資産・負債なども含まれるが、それらは
 * この画面で扱わないため、読み出し時に落とす。
 */
export type FiscalMeasure =
  | "revenue_budget"
  | "expenditure_budget"
  | "revenue_actual"
  | "expenditure_actual";

/**
 * 公開正本から読み出した金額1行。
 * classificationKey が null の行は、その金額セットの合計を表す。
 */
export type FiscalAmountLine = {
  classificationKey: string | null;
  label: string | null;
  /** 金額の意味。歳入と歳出は同じ金額セットに同居できる。 */
  measure: FiscalMeasure;
  /** 円単位の10進文字列。null のときは nullReason に理由が入る。 */
  amountYen: string | null;
  nullReason: string | null;
};

/**
 * 同じ資料・同じ段階でまとまった金額の集合。
 * 金額の意味（歳入・歳出・決算）はセットではなく行ごとに決まる。
 */
export type FiscalAmountSet = {
  id: string;
  fiscalYear: number;
  eventKind: FiscalEventKind;
  decisionStage: FiscalDecisionStage;
  asOfDate: string | null;
  effectiveOn: string | null;
  lines: FiscalAmountLine[];
};

/** 金額の出典。公式資料の名前とURLを画面に出すために使う。 */
export type FiscalSourceRef = {
  title: string;
  url: string;
  publisher: string | null;
  fetchedAt: string | null;
  publishedAt: string | null;
};

export type FiscalYearAmounts = {
  fiscalYear: number;
  amountSets: FiscalAmountSet[];
  sources: FiscalSourceRef[];
};
