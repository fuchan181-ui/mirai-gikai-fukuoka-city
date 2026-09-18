import {
  EXPENDITURE_SECTION_CLASSIFICATIONS,
  SECTION_SCHEME,
} from "../shared/fiscal-classifications";
import { compactFiscalText as compact } from "../shared/utils/compact-fiscal-text";
import {
  formatFiscalYearLabel,
  includesFiscalYearLabel,
} from "../shared/utils/fiscal-year-label";
import { parseFiscalInteger } from "../shared/utils/parse-fiscal-amount-value";
import {
  buildFiscalAmountRecord,
  type FiscalParserResult,
  type FiscalParserValidation,
} from "./fiscal-parser-types";

/**
 * 歳出予算節別集計表（予算概要 s-6）から節ごとの歳出額を読む。
 *
 * 表は2ページ構成で、1ページ目に款1〜6と節名、2ページ目に款7〜13と合計列が
 * 並ぶ。節名は1ページ目にしか印字されないため、両ページの行を節の並び順で
 * 突き合わせて1件の金額にする。全額が0の節は2ページ目に行自体を印字しない
 * 年度があり（令和5年度の貸付金・投資及び出資金・寄附金）、行数だけでは
 * 対応が決まらない。そこで1ページ目の款別額と2ページ目の行合計が一致する
 * 組み合わせを数え、一意に決まるときだけ採用する。
 */

/** 款13・節27と予備費の2ページ構成。 */
const PAGE_COUNT = 2;
const SECTION_ROW_COUNT = 27;
/** 1ページ目の款1〜6の金額列。 */
const PURPOSE_COLUMN_COUNT = 6;
/** 2ページ目の款7〜13と合計列。 */
const SUMMARY_COLUMN_COUNT = 8;
/** 合計列の位置。 */
const TOTAL_COLUMN = SUMMARY_COLUMN_COUNT - 1;
/** 印刷の字位置は年度で1文字ずれるため、列の割り当てに許容幅を持たせる。 */
const COLUMN_TOLERANCE = 3;
/** 一意性だけを判定するため、解の数は2で止める。 */
const SOLUTION_LIMIT = 2;

const AMOUNT_PATTERN = /\d{1,3}(?:,\d{3})+|\d+/g;
/**
 * 款見出しは折り返しで年度により前後するため、番号と款名の並びだけを照合する。
 * 1ページ目は款1〜6、2ページ目は款7〜13で、並びが変われば列対応が崩れる。
 * 11款の災害復旧費は「災害」と「復旧費」に折り返されるため個別に確認する。
 */
const PURPOSE_HEADER = "1議会費2総務費3民生費4衛生費5労働費6";
const PURPOSE_HEADER_WRAPPED = ["農林水", "産業費"];
const SUMMARY_HEADER_HEAD = "7商工費8土木費9消防費10教育費11";
const SUMMARY_HEADER_TAIL = "12公債費13予備費";
const SUMMARY_HEADER_WRAPPED = ["災害", "復旧費"];

type Cell = {
  column: number;
  value: bigint;
  text: string;
};

type AmountToken = {
  text: string;
  end: number;
};

type AmountRow = {
  cells: Cell[];
};

function failure(message: string): FiscalParserResult {
  return {
    records: [],
    validationSummary: [
      {
        ruleCode: "budget_section_summary_validation_failed",
        severity: "hard_error",
        message,
      },
    ],
  };
}

/** 行に印字された金額と、その右端の字位置。 */
function amountTokens(line: string): AmountToken[] {
  return [...line.matchAll(AMOUNT_PATTERN)].map((match) => ({
    text: match[0],
    end: (match.index ?? 0) + match[0].length,
  }));
}

function parseValues(tokens: readonly AmountToken[]): bigint[] | null {
  const values: bigint[] = [];
  for (const token of tokens) {
    const parsed = parseFiscalInteger(token.text);
    if (parsed === null) return null;
    values.push(parsed);
  }
  return values;
}

/**
 * 行の金額を、見出し行の金額と同じ字位置にある列へ割り当てる。
 * 空欄の列は飛ばせるが、列の前後関係は入れ替えない。位置のずれが最小の
 * 割り当てを選び、どの列とも離れすぎた金額は受け付けない。
 */
function matchColumns(
  tokens: readonly AmountToken[],
  templateEnds: readonly number[]
): Cell[] | null {
  const values = parseValues(tokens);
  if (values === null) return null;
  const memo = new Map<string, { cost: number; cells: Cell[] } | null>();
  const search = (
    tokenIndex: number,
    columnStart: number
  ): { cost: number; cells: Cell[] } | null => {
    if (tokenIndex === tokens.length) return { cost: 0, cells: [] };
    if (columnStart >= templateEnds.length) return null;
    const key = `${tokenIndex}:${columnStart}`;
    if (memo.has(key)) return memo.get(key) ?? null;
    const token = tokens[tokenIndex];
    const value = values[tokenIndex];
    const template = templateEnds[columnStart];
    let best = search(tokenIndex, columnStart + 1);
    if (token !== undefined && value !== undefined && template !== undefined) {
      const distance = Math.abs(token.end - template);
      const rest = search(tokenIndex + 1, columnStart + 1);
      if (rest !== null && distance <= COLUMN_TOLERANCE) {
        const candidate = {
          cost: rest.cost + distance,
          cells: [
            { column: columnStart, value, text: token.text },
            ...rest.cells,
          ],
        };
        if (best === null || candidate.cost < best.cost) best = candidate;
      }
    }
    memo.set(key, best);
    return best;
  };
  return search(0, 0)?.cells ?? null;
}

/** 見出し行の金額列を定義として、行の金額をその列へ割り当てる。 */
function toAmountRow(
  tokens: readonly AmountToken[],
  templateEnds: readonly number[]
): AmountRow | null {
  const cells = matchColumns(tokens, templateEnds);
  return cells === null ? null : { cells };
}

/** 見出し行の金額の右端位置。行の金額を割り当てる列になる。 */
function columnEnds(line: string): number[] {
  return amountTokens(line).map((token) => token.end);
}

function valueAt(row: AmountRow, column: number): bigint {
  return row.cells.find((cell) => cell.column === column)?.value ?? 0n;
}

function hasColumn(row: AmountRow, column: number): boolean {
  return row.cells.some((cell) => cell.column === column);
}

function sumColumn(rows: readonly AmountRow[], column: number): bigint {
  return rows.reduce((total, row) => total + valueAt(row, column), 0n);
}

/** 節と金額行の金額が対応するか判定する関数を作る。 */
function createRowMatcher(
  sectionSums: readonly bigint[],
  rows: readonly AmountRow[]
): (index: number, rowIndex: number) => boolean {
  const rowTotal = (row: AmountRow): bigint =>
    row.cells
      .filter((cell) => cell.column < TOTAL_COLUMN)
      .reduce((total, cell) => total + cell.value, 0n);
  return (index, rowIndex) => {
    const row = rows[rowIndex];
    if (row === undefined) return false;
    return (
      valueAt(row, TOTAL_COLUMN) === rowTotal(row) + (sectionSums[index] ?? 0n)
    );
  };
}

/**
 * counts[i][j]: 節 i 以降と金額行 j 以降を過不足なく組にする組み合わせの数。
 * 一意性の判定に必要な分だけ数え、SOLUTION_LIMIT で頭打ちにする。
 */
function countAlignments(
  sectionSums: readonly bigint[],
  rows: readonly AmountRow[]
): number[][] {
  const matches = createRowMatcher(sectionSums, rows);
  const sectionCount = sectionSums.length;
  const rowCount = rows.length;
  const counts: number[][] = Array.from({ length: sectionCount + 1 }, () =>
    Array.from({ length: rowCount + 1 }, () => 0)
  );
  const countAt = (index: number, rowIndex: number): number =>
    counts[index]?.[rowIndex] ?? 0;
  const setCount = (index: number, rowIndex: number, value: number): void => {
    const line = counts[index];
    if (line !== undefined) line[rowIndex] = value;
  };
  setCount(sectionCount, rowCount, 1);
  for (let index = sectionCount - 1; index >= 0; index -= 1) {
    // 金額行が残っていないときは、額の無い節だけが残っていなければならない。
    const rest = countAt(index + 1, rowCount);
    setCount(index, rowCount, sectionSums[index] === 0n ? rest : 0);
  }
  for (let index = sectionCount - 1; index >= 0; index -= 1) {
    for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
      const skip = sectionSums[index] === 0n ? countAt(index + 1, rowIndex) : 0;
      const assign = matches(index, rowIndex)
        ? countAt(index + 1, rowIndex + 1)
        : 0;
      setCount(index, rowIndex, Math.min(skip + assign, SOLUTION_LIMIT));
    }
  }
  return counts;
}

/** 組み合わせが1通りに決まるときだけ、節を金額行へ先頭から割り当てる。 */
function reconstructAlignment(
  sectionSums: readonly bigint[],
  rows: readonly AmountRow[],
  counts: readonly number[][]
): number[] | null {
  const matches = createRowMatcher(sectionSums, rows);
  const countAt = (index: number, rowIndex: number): number =>
    counts[index]?.[rowIndex] ?? 0;
  const mapping: number[] = [];
  let rowIndex = 0;
  for (let index = 0; index < sectionSums.length; index += 1) {
    if (matches(index, rowIndex) && countAt(index + 1, rowIndex + 1) > 0) {
      mapping.push(rowIndex);
      rowIndex += 1;
    } else if (sectionSums[index] === 0n && countAt(index + 1, rowIndex) > 0) {
      mapping.push(-1);
    } else {
      return null;
    }
  }
  return mapping;
}

/**
 * 1ページ目の節の並びと2ページ目の金額行を組み合わせる。
 * 解が2通り以上あるときは、どの節の額か決められないため採用しない。
 */
function resolveRowMapping(
  sectionSums: readonly bigint[],
  rows: readonly AmountRow[]
): number[] | null {
  const counts = countAlignments(sectionSums, rows);
  if ((counts[0]?.[0] ?? 0) !== 1) return null;
  return reconstructAlignment(sectionSums, rows, counts);
}

/** 1ページ目の節行（款1〜6の金額付き）と、印字の無い予備費行を読む。 */
function parseSectionRows(
  lines: readonly string[],
  templateEnds: readonly number[]
): AmountRow[] | null {
  const rows: AmountRow[] = [];
  let lastRowIndex = -1;
  let reserveRowIndex = -1;
  for (const [lineIndex, line] of lines.entries()) {
    if (/^\s*予備費\s*$/.test(line)) {
      reserveRowIndex = lineIndex;
      continue;
    }
    const match = /^(\s*)(\d{1,2})(\s+)(\S+)/.exec(line);
    if (match === null) continue;
    const index = Number(match[2]);
    // 節は1から順に印字される。番号が飛んだり入れ替わったりした行は採用せず、
    // 27行そろわなければ解析を中止する。並びが崩れたまま金額を当てないため。
    if (index !== rows.length + 1) continue;
    const expected = EXPENDITURE_SECTION_CLASSIFICATIONS[index - 1];
    if (expected === undefined || expected.label !== match[4]) continue;
    // 行番号と節名を空白へ置き換え、金額の字位置を他の行と比べられるようにする。
    const masked = `${" ".repeat(match[0].length)}${line.slice(match[0].length)}`;
    // 款1〜6に金額が無い節は、空欄の行として持つ。
    const row = toAmountRow(amountTokens(masked), templateEnds);
    if (row === null) return null;
    rows.push(row);
    lastRowIndex = lineIndex;
  }
  if (rows.length !== SECTION_ROW_COUNT) return null;
  if (reserveRowIndex <= lastRowIndex) return null;
  return rows;
}

type PageTable = {
  total: AmountRow;
  rows: AmountRow[];
};

/**
 * 1ページ目（款1〜6）の款別合計と節27行を読む。表題や款の並びが違うとき、
 * 節別額と款別合計が合わないときは、検証結果に残す文言を返す。
 */
function readPurposePage(
  firstPage: string,
  fiscalYear: number,
  fiscalYearLabel: string
): PageTable | string {
  const compactPage = compact(firstPage);
  if (
    !includesFiscalYearLabel(firstPage, fiscalYear) ||
    !compactPage.includes("一般会計") ||
    !compactPage.includes(PURPOSE_HEADER) ||
    !PURPOSE_HEADER_WRAPPED.every((label) => compactPage.includes(label))
  )
    return `${fiscalYearLabel}一般会計1ページ目の表題または款の並びを確認できません`;

  const lines = firstPage.split("\n");
  const totalLine = lines.find((line) => /^\s*計\s+[\d,]/.test(line));
  const templateEnds = totalLine === undefined ? [] : columnEnds(totalLine);
  if (templateEnds.length !== PURPOSE_COLUMN_COUNT)
    return `${fiscalYearLabel}1ページ目の款別合計の列数を確認できません`;
  const total =
    totalLine === undefined
      ? null
      : toAmountRow(amountTokens(totalLine), templateEnds);
  const rows = parseSectionRows(lines, templateEnds);
  if (total === null || rows === null)
    return `${fiscalYearLabel}1ページ目の節行または款別合計を読み取れません`;
  for (let column = 0; column < PURPOSE_COLUMN_COUNT; column += 1) {
    if (sumColumn(rows, column) !== valueAt(total, column))
      return `${fiscalYearLabel}1ページ目の節別額と款別合計が一致しません`;
  }
  return { total, rows };
}

/**
 * 2ページ目（款7〜13と合計列）の款別合計と金額行を読む。表題や単位が違う
 * とき、節別額と款別合計が合わないときは、検証結果に残す文言を返す。
 */
function readSummaryPage(
  secondPage: string,
  fiscalYearLabel: string
): PageTable | string {
  const compactPage = compact(secondPage);
  if (
    !compactPage.includes("歳出予算節別集計表") ||
    !compactPage.includes("(単位千円)") ||
    !compactPage.includes(SUMMARY_HEADER_HEAD) ||
    !compactPage.includes(SUMMARY_HEADER_TAIL) ||
    !SUMMARY_HEADER_WRAPPED.every((label) => compactPage.includes(label))
  )
    return `${fiscalYearLabel}歳出予算節別集計表の表題・単位または2ページ目の款の並びを確認できません`;

  const lines = secondPage
    .split("\n")
    .filter((line) => /^[\s\d,]+$/.test(line) && /\d/.test(line));
  const totalLine = lines.at(-1);
  const templateEnds = totalLine === undefined ? [] : columnEnds(totalLine);
  if (templateEnds.length !== SUMMARY_COLUMN_COUNT)
    return `${fiscalYearLabel}2ページ目の款別合計の列数を確認できません`;
  const total =
    totalLine === undefined
      ? null
      : toAmountRow(amountTokens(totalLine), templateEnds);
  const rows = lines.slice(0, -1).flatMap((line) => {
    const row = toAmountRow(amountTokens(line), templateEnds);
    return row === null ? [] : [row];
  });
  if (
    total === null ||
    rows.length !== lines.length - 1 ||
    rows.length > SECTION_ROW_COUNT + 1 ||
    rows.some((row) => !hasColumn(row, TOTAL_COLUMN))
  )
    return `${fiscalYearLabel}2ページ目の金額行または合計列を読み取れません`;
  for (let column = 0; column < SUMMARY_COLUMN_COUNT; column += 1) {
    if (sumColumn(rows, column) !== valueAt(total, column))
      return `${fiscalYearLabel}2ページ目の節別額と款別合計が一致しません`;
  }
  return { total, rows };
}

/**
 * 款別合計と歳出予算の総額を突合し、一致すれば公表されている総額を返す。
 * 歳出予算の総額は、款1〜6と款7〜13の合計列の和として表に載る。
 */
function verifyPublishedTotal(
  purposeTotal: AmountRow,
  summaryTotal: AmountRow
): bigint | null {
  const purposeTotalSum = Array.from(
    { length: PURPOSE_COLUMN_COUNT },
    (_, column) => valueAt(purposeTotal, column)
  ).reduce((total, value) => total + value, 0n);
  const summaryColumnSum = Array.from({ length: TOTAL_COLUMN }, (_, column) =>
    valueAt(summaryTotal, column)
  ).reduce((total, value) => total + value, 0n);
  const publishedTotal = valueAt(summaryTotal, TOTAL_COLUMN);
  return purposeTotalSum + summaryColumnSum === publishedTotal
    ? publishedTotal
    : null;
}

/** 節ごとの歳出予算額を、2ページ目の合計列の金額で組み立てる。 */
function buildSectionRecords(
  fiscalYear: number,
  mapping: readonly number[],
  rows: readonly AmountRow[]
) {
  return EXPENDITURE_SECTION_CLASSIFICATIONS.map((classification, index) => {
    const rowIndex = mapping[index] ?? -1;
    const row = rowIndex < 0 ? undefined : rows[rowIndex];
    const amount = row === undefined ? 0n : valueAt(row, TOTAL_COLUMN);
    const sourceValueText =
      row === undefined
        ? ""
        : (row.cells.find((cell) => cell.column === TOTAL_COLUMN)?.text ?? "");
    return buildFiscalAmountRecord({
      fiscalYear,
      eventKind: "initial_budget",
      decisionStage: "proposed",
      measure: "expenditure_budget",
      amountYen: amount * 1000n,
      sourceValueText,
      sourceValueNumeric: amount.toString(),
      sourceUnit: "thousand_yen",
      sourcePrecisionYen: 1000,
      // 金額は2ページ目の合計列、節名は1ページ目から取る。
      sourcePage: 2,
      sourceTable: "一般会計 歳出予算節別集計表",
      classificationKey: classification.key,
      classificationScheme: SECTION_SCHEME,
      sourceClassificationLabel: classification.label,
    });
  });
}

export function parseBudgetSectionSummary(
  text: string,
  fiscalYear: number
): FiscalParserResult {
  const fiscalYearLabel = formatFiscalYearLabel(fiscalYear);
  const pages = text.replace(/\f\s*$/, "").split("\f");
  if (pages.length !== PAGE_COUNT)
    return failure(
      `${fiscalYearLabel}歳出予算節別集計表の2ページ構成を確認できません`
    );
  const [firstPage = "", secondPage = ""] = pages;

  const purposePage = readPurposePage(firstPage, fiscalYear, fiscalYearLabel);
  if (typeof purposePage === "string") return failure(purposePage);
  const summaryPage = readSummaryPage(secondPage, fiscalYearLabel);
  if (typeof summaryPage === "string") return failure(summaryPage);
  const publishedTotal = verifyPublishedTotal(
    purposePage.total,
    summaryPage.total
  );
  if (publishedTotal === null)
    return failure(`${fiscalYearLabel}款別合計と歳出予算の総額が一致しません`);

  // 予備費には1ページ目の金額が無いため、節と同じく合計0として並べる。
  const sectionSums = [
    ...purposePage.rows.map((row) =>
      row.cells.reduce((total, cell) => total + cell.value, 0n)
    ),
    0n,
  ];
  const mapping = resolveRowMapping(sectionSums, summaryPage.rows);
  if (mapping === null)
    return failure(
      `${fiscalYearLabel}1ページ目の節と2ページ目の金額行を一意に組み合わせられません`
    );

  const omittedLabels = EXPENDITURE_SECTION_CLASSIFICATIONS.flatMap(
    (classification, index) =>
      mapping[index] === -1 ? [classification.label] : []
  );
  const validationSummary: FiscalParserValidation[] = [
    {
      ruleCode: "budget_section_summary_totals_passed",
      severity: "info",
      message: `節${SECTION_ROW_COUNT}行と予備費の款別額・総額（${publishedTotal.toString()}千円）を突合しました`,
    },
    {
      ruleCode: "budget_section_summary_alignment_resolved",
      severity: "info",
      message:
        "1ページ目の節名と2ページ目の金額行を、款別額が一致する組み合わせとして一意に整列しました",
    },
  ];
  if (omittedLabels.length > 0) {
    validationSummary.push({
      ruleCode: "budget_section_summary_zero_rows_omitted",
      severity: "info",
      message: `${omittedLabels.join("・")}は資料に印字が無いため、金額0千円として取り込みました`,
    });
  }
  return {
    records: buildSectionRecords(fiscalYear, mapping, summaryPage.rows),
    validationSummary,
  };
}
