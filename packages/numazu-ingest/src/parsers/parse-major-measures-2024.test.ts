import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseMajorMeasures2024 } from "./parse-major-measures-2024";

const fixture = readFileSync(
  new URL(
    "./__fixtures__/fiscal-major-measures-2024-layout.txt",
    import.meta.url
  ),
  "utf8"
);

/**
 * 令和6年度 市政報告書 一般会計歳出の款別金額。
 * 当初予算額・予算現額・決算額・執行率は公式表の値をそのまま写している。
 */
const EXPENDITURE_ROWS = [
  {
    key: "council_expense",
    label: "議会費",
    initial: "460162000",
    current: "464149000",
    actual: "449516456",
    rate: "96.8",
  },
  {
    key: "general_affairs",
    label: "総務費",
    initial: "10465779000",
    current: "14039124000",
    actual: "13008809583",
    rate: "92.7",
  },
  {
    key: "welfare",
    label: "民生費",
    initial: "30308896000",
    current: "36060256000",
    actual: "34457605986",
    rate: "95.6",
  },
  {
    key: "public_health",
    label: "衛生費",
    initial: "8882092000",
    current: "11025012000",
    actual: "9840733146",
    rate: "89.3",
  },
  {
    key: "labor",
    label: "労働費",
    initial: "99701000",
    current: "101280000",
    actual: "92454018",
    rate: "91.3",
  },
  {
    key: "agriculture_forestry_fisheries",
    label: "農林水産業費",
    initial: "830155000",
    current: "1018122000",
    actual: "928658964",
    rate: "91.2",
  },
  {
    key: "commerce_and_industry",
    label: "商工費",
    initial: "1199435000",
    current: "1199611000",
    actual: "981992599",
    rate: "81.9",
  },
  {
    key: "civil_engineering",
    label: "土木費",
    initial: "17654397000",
    current: "23215118000",
    actual: "16096988873",
    rate: "69.3",
  },
  {
    key: "fire_service",
    label: "消防費",
    initial: "2949873000",
    current: "3006960000",
    actual: "2973680081",
    rate: "98.9",
  },
  {
    key: "education",
    label: "教育費",
    initial: "8441782000",
    current: "9376667000",
    actual: "7228712334",
    rate: "77.1",
  },
  {
    key: "disaster_recovery",
    label: "災害復旧費",
    initial: "35420000",
    current: "309809000",
    actual: "268739640",
    rate: "86.7",
  },
  {
    key: "debt_service",
    label: "公債費",
    initial: "6532308000",
    current: "6532308000",
    actual: "6408677438",
    rate: "98.1",
  },
  {
    key: "reserve_fund",
    label: "予備費",
    initial: "100000000",
    current: "82000000",
    actual: "0",
    rate: "0.0",
  },
] as const;

const TOTAL_ROW = {
  initial: "87960000000",
  current: "106430416000",
  actual: "92736569118",
  rate: "87.1",
} as const;

function toSummary(record: { parsedPayload: { [key: string]: unknown } }) {
  return {
    amountYen: record.parsedPayload.amountYen,
    classificationKey: record.parsedPayload.classificationKey,
    eventKind: record.parsedPayload.eventKind,
    asOfDate: record.parsedPayload.asOfDate,
  };
}

/** 款ごとに当初予算・予算現額・決算が並ぶ、公式表と同じ順序の期待値。 */
function expectedRecordSummaries() {
  return [
    ...EXPENDITURE_ROWS.flatMap((row) => [
      {
        amountYen: row.initial,
        classificationKey: row.key,
        eventKind: "initial_budget",
        asOfDate: null,
      },
      {
        amountYen: row.current,
        classificationKey: row.key,
        eventKind: "available_budget_snapshot",
        asOfDate: "2025-03-31",
      },
      {
        amountYen: row.actual,
        classificationKey: row.key,
        eventKind: "settlement",
        asOfDate: null,
      },
    ]),
    {
      amountYen: TOTAL_ROW.initial,
      classificationKey: null,
      eventKind: "initial_budget",
      asOfDate: null,
    },
    {
      amountYen: TOTAL_ROW.current,
      classificationKey: null,
      eventKind: "available_budget_snapshot",
      asOfDate: "2025-03-31",
    },
    {
      amountYen: TOTAL_ROW.actual,
      classificationKey: null,
      eventKind: "settlement",
      asOfDate: null,
    },
  ];
}

describe("parseMajorMeasures2024", () => {
  it("一般会計と13款の当初予算・予算現額・決算を公式表の順に抽出する", () => {
    const result = parseMajorMeasures2024(fixture);

    expect(result.records).toHaveLength(42);
    expect(result.records.map(toSummary)).toEqual(expectedRecordSummaries());
  });

  it("13款すべての公表執行率と円単位の再計算が一致する", () => {
    const result = parseMajorMeasures2024(fixture);

    for (const row of [
      ...EXPENDITURE_ROWS.map((entry) => ({
        classificationKey: entry.key,
        label: entry.label,
        rate: entry.rate,
      })),
      {
        classificationKey: "total",
        label: "一般会計合計",
        rate: TOTAL_ROW.rate,
      },
    ]) {
      expect(result.validationSummary).toContainEqual(
        expect.objectContaining({
          ruleCode: "major_measures_execution_rate_matched",
          severity: "info",
          classificationKey: row.classificationKey,
          publishedMetricValue: row.rate,
          calculatedMetricValue: row.rate,
        })
      );
    }
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_control_totals_passed",
        severity: "info",
      })
    );
  });

  it("公表執行率と円単位の再計算が不一致ならhard errorにする", () => {
    const result = parseMajorMeasures2024(fixture.replace("96.8", "96.7"));

    expect(result.records).toHaveLength(42);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_execution_rate_mismatch",
        severity: "hard_error",
        classificationKey: "council_expense",
      })
    );
  });

  it("予算推移の本文と歳出表合計が不一致ならhard errorにする", () => {
    const result = parseMajorMeasures2024(
      fixture.replace("87,960,000 千円", "87,960,001 千円")
    );

    expect(result.records).toHaveLength(42);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_budget_control_total_mismatch",
        severity: "hard_error",
      })
    );
  });

  it("款別の合計と総計が不一致ならhard errorにする", () => {
    const changed = fixture.replace("449,516,456", "449,516,457");
    expect(changed).not.toBe(fixture);
    const result = parseMajorMeasures2024(changed);

    expect(result.records).toHaveLength(42);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_expenditure_control_total_mismatch",
        severity: "hard_error",
      })
    );
  });

  it("款の並び・名称が想定と違う場合は静かに誤読せず失敗する", () => {
    const changed = fixture.replace(
      "８ 土        木   費",
      "８ 土        木   費X"
    );
    expect(changed).not.toBe(fixture);
    const result = parseMajorMeasures2024(changed);

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_expenditure_rows_changed",
        severity: "hard_error",
      })
    );
  });

  it("歳出表の列数が変わった場合は値を返さず失敗する", () => {
    const changed = fixture.replace(/^\s*計\s.*$/m, "");
    expect(changed).not.toBe(fixture);
    const result = parseMajorMeasures2024(changed);

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_expenditure_columns_changed",
        severity: "hard_error",
      })
    );
  });

  it("金額セルを整数化できない場合は値を返さず失敗する", () => {
    const changed = fixture.replace("460,162,000", "460,162,00");
    expect(changed).not.toBe(fixture);
    const result = parseMajorMeasures2024(changed);

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_amount_invalid",
        severity: "hard_error",
      })
    );
  });

  it("列見出しが変わった場合は静かに誤読せず失敗する", () => {
    const changed = fixture.replace("当初予算額", "変更された列");
    expect(changed).not.toBe(fixture);
    const result = parseMajorMeasures2024(changed);

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_table_schema_missing",
        severity: "hard_error",
      })
    );
  });

  it("対象年度が変わった場合は値を返さず失敗する", () => {
    const result = parseMajorMeasures2024(
      fixture.replace("令和６年度", "令和７年度")
    );

    expect(result.records).toEqual([]);
    expect(result.validationSummary).toContainEqual(
      expect.objectContaining({
        ruleCode: "major_measures_document_identity_mismatch",
        severity: "hard_error",
      })
    );
  });

  it("年度見出しに空白が入っても対象資料として処理する", () => {
    const changed = fixture.replace("令和６年度", "令和 ６ 年度");

    expect(parseMajorMeasures2024(changed).records).toHaveLength(42);
  });
});
