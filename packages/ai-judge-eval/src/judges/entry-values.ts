/**
 * TypeSafe SDK に渡すリテラルを組み立てるヘルパー。
 *
 * `criteria` は `as const` で定義して `key` や `severity` のリテラル型を
 * 保ちたいが、SDK の `EntryType` は可変の `JsonValue[]` しか受け付けない。
 * `as const` は入れ子の配列まで読み取り専用にするため、配列だけを関数の
 * 戻り値として組み立てて可変にしておく。
 */
export function stringList(...values: string[]): string[] {
  return values;
}
