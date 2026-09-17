export type FiscalSourceClassification = {
  label: string;
  key: string;
};

export const PURPOSE_SCHEME = "purpose";
export const REVENUE_SCHEME = "revenue_source";

/**
 * 歳入款の公式表記と分類キー。公式表の並び順・款名のいずれかが変われば解析を中止する。
 * 分類キーは `fiscal_classifications.scheme = 'revenue_source'` の安定キーとして使う。
 */
export const REVENUE_SOURCE_CLASSIFICATIONS = [
  { label: "市税", key: "city_tax" },
  { label: "地方譲与税", key: "local_transfer_tax" },
  { label: "利子割交付金", key: "interest_portion_grant" },
  { label: "配当割交付金", key: "dividend_portion_grant" },
  { label: "株式等譲渡所得割交付金", key: "capital_gains_portion_grant" },
  { label: "法人事業税交付金", key: "corporate_business_tax_grant" },
  { label: "地方消費税交付金", key: "local_consumption_tax_grant" },
  { label: "ゴルフ場利用税交付金", key: "golf_course_tax_grant" },
  { label: "環境性能割交付金", key: "environmental_performance_grant" },
  {
    label: "国有提供施設等所在市町村助成交付金",
    key: "national_property_grant",
  },
  { label: "地方特例交付金", key: "local_special_grant" },
  { label: "地方交付税", key: "local_allocation_tax" },
  { label: "交通安全対策特別交付金", key: "traffic_safety_grant" },
  { label: "分担金及び負担金", key: "contributions" },
  { label: "使用料及び手数料", key: "fees_and_charges" },
  { label: "国庫支出金", key: "national_treasury_disbursements" },
  { label: "県支出金", key: "prefectural_treasury_disbursements" },
  { label: "財産収入", key: "property_revenue" },
  { label: "寄附金", key: "donations" },
  { label: "繰入金", key: "transfers_in" },
  { label: "繰越金", key: "carryover_funds" },
  { label: "諸収入", key: "miscellaneous_revenue" },
  { label: "市債", key: "municipal_bonds" },
] as const satisfies readonly FiscalSourceClassification[];

/**
 * 歳出款の公式表記と分類キー。議会費は既存stagingと同じ `council_expense` を維持する。
 * 決算・予算概要のどちらの歳出表も、この並び順で款を検出する。
 */
export const EXPENDITURE_PURPOSE_CLASSIFICATIONS = [
  { label: "議会費", key: "council_expense" },
  { label: "総務費", key: "general_affairs" },
  { label: "民生費", key: "welfare" },
  { label: "衛生費", key: "public_health" },
  { label: "労働費", key: "labor" },
  { label: "農林水産業費", key: "agriculture_forestry_fisheries" },
  { label: "商工費", key: "commerce_and_industry" },
  { label: "土木費", key: "civil_engineering" },
  { label: "消防費", key: "fire_service" },
  { label: "教育費", key: "education" },
  { label: "災害復旧費", key: "disaster_recovery" },
  { label: "公債費", key: "debt_service" },
  { label: "予備費", key: "reserve_fund" },
] as const satisfies readonly FiscalSourceClassification[];

export const SECTION_SCHEME = "section";

/**
 * 歳出予算節別集計表（s-6）の節の公式表記と分類キー。地方自治法施行規則が
 * 定める節の並びに予備費を加えた28行で、表の並び順が変われば金額の対応が
 * 崩れるため解析を中止する。款とは別の集計軸なので scheme を分ける。
 * 寄附金は歳入款にも同名があるが、支出側の意味なので key を分けている。
 */
export const EXPENDITURE_SECTION_CLASSIFICATIONS = [
  { label: "報酬", key: "remuneration" },
  { label: "給料", key: "salary" },
  { label: "職員手当等", key: "employee_allowances" },
  { label: "共済費", key: "social_insurance_contributions" },
  { label: "災害補償費", key: "disaster_compensation" },
  { label: "恩給及び退職年金", key: "pensions_and_retirement_annuities" },
  { label: "報償費", key: "rewards" },
  { label: "旅費", key: "travel_expenses" },
  { label: "交際費", key: "entertainment_expenses" },
  { label: "需用費", key: "supplies_expenses" },
  { label: "役務費", key: "service_fees" },
  { label: "委託料", key: "contract_fees" },
  { label: "使用料及び賃借料", key: "rent_and_lease_fees" },
  { label: "工事請負費", key: "construction_contract_fees" },
  { label: "原材料費", key: "raw_material_costs" },
  { label: "公有財産購入費", key: "public_property_purchase" },
  { label: "備品購入費", key: "equipment_purchase" },
  { label: "負担金補助及び交付金", key: "subsidies_and_grants" },
  { label: "扶助費", key: "public_assistance" },
  { label: "貸付金", key: "loans" },
  { label: "補償補塡及び賠償金", key: "compensation_and_indemnity" },
  { label: "償還金利子及び割引料", key: "redemption_and_interest" },
  { label: "投資及び出資金", key: "investments_and_contributions" },
  { label: "積立金", key: "fund_reserves" },
  { label: "寄附金", key: "donations_paid" },
  { label: "公課費", key: "public_dues" },
  { label: "繰出金", key: "transfers_out" },
  { label: "予備費", key: "reserve_fund" },
] as const satisfies readonly FiscalSourceClassification[];
