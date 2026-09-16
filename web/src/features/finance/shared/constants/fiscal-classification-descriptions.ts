/**
 * 款や歳入項目の名前だけでは「何に使われるお金か」が伝わらないため、
 * 画面で補足する短い説明を分類キーごとに持つ。
 * 金額や割合はここに書かない。数字は必ず公開正本から取り出す。
 * 分類キーは `fiscal_classifications.canonical_key` と対応する。
 */
const DESCRIPTIONS: Record<string, string> = {
  // 歳出の款
  council_expense: "市議会の運営と、議員の活動に使われるお金です。",
  general_affairs:
    "市役所の運営、戸籍・住民票、選挙、統計など、市全体の仕事に使われるお金です。",
  welfare:
    "高齢者・障害のある人・子どもと子育て世帯の福祉や、生活の支えに使われるお金です。",
  public_health:
    "健康づくりや予防接種、ごみ処理、環境の保全に使われるお金です。",
  labor: "就労の相談や勤労者の支援に使われるお金です。",
  agriculture_forestry_fisheries:
    "農業・林業・水産業の振興と、担い手の支援に使われるお金です。",
  commerce_and_industry:
    "商店街や地元企業の支援、観光の振興に使われるお金です。",
  civil_engineering:
    "道路・公園・河川・市営住宅など、まちの基盤をつくるために使われるお金です。",
  fire_service: "消防や救急の体制、火災や災害への備えに使われるお金です。",
  education:
    "小中学校などの学校運営、教育施設の整備、生涯学習に使われるお金です。",
  disaster_recovery:
    "災害で被害を受けた道路や施設を元に戻すために使われるお金です。",
  debt_service:
    "過去に借りた市債（市の借金）の元金と利子の返済に使われるお金です。",
  reserve_fund:
    "予定していなかった支出に備えて、あらかじめ確保しておくお金です。",

  // 歳入の項目
  city_tax: "市民税や固定資産税など、市民・企業が納める税金です。",
  local_transfer_tax: "国が集めた税金の一部が、市に配分されたお金です。",
  interest_portion_grant: "県民税の利子割の一部が、市に配分されたお金です。",
  dividend_portion_grant: "県民税の配当割の一部が、市に配分されたお金です。",
  capital_gains_portion_grant:
    "県民税の株式等譲渡所得割の一部が、市に配分されたお金です。",
  corporate_business_tax_grant:
    "県が集めた法人事業税の一部が、市に配分されたお金です。",
  local_consumption_tax_grant: "消費税の一部が、市に配分されたお金です。",
  golf_course_tax_grant:
    "県が集めたゴルフ場利用税の一部が、市に配分されたお金です。",
  environmental_performance_grant:
    "自動車の環境性能割の一部が、市に配分されたお金です。",
  national_property_grant: "国が使う施設がある市町村に交付されるお金です。",
  local_special_grant: "国の制度変更に伴って、市に交付されるお金です。",
  local_allocation_tax: "国が集めた税金を配分し、市の財源を支えるお金です。",
  traffic_safety_grant:
    "交通反則金をもとに、交通安全対策のために交付されるお金です。",
  contributions: "工事や事業で利益を受ける人が、費用の一部を負担するお金です。",
  fees_and_charges: "市の施設の使用料や、証明書の発行手数料などです。",
  national_treasury_disbursements: "国から交付される補助金や負担金です。",
  prefectural_treasury_disbursements: "県から交付される補助金や負担金です。",
  property_revenue: "市が持つ土地や建物の売却・貸付けによる収入です。",
  donations: "企業や個人からの寄附金です。",
  transfers_in: "積み立ててきた基金（市の貯金）から取り崩して充てるお金です。",
  carryover_funds: "前年度から繰り越されたお金です。",
  miscellaneous_revenue:
    "上のどれにも当てはまらない少額の収入をまとめたものです。",
  municipal_bonds: "国や銀行から借りるお金で、返済は後年度になります。",
  automobile_acquisition_tax_grant:
    "自動車取得税の一部が市に配分されていたお金です。現在は交付されていません。",
};

/**
 * 分類キーに対応する説明。対応表に無いキーは null を返し、
 * 画面は説明なしで金額だけを出す。
 */
export function findFiscalClassificationDescription(
  classificationKey: string
): string | null {
  return DESCRIPTIONS[classificationKey] ?? null;
}
