type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

const PAGE_SIZE = 1000;

/**
 * Supabase の1リクエストあたりの取得上限を越えて読み切る。
 * 途中でエラーになった場合は、途中までの行を返さずエラーを返す。
 */
export async function fetchAllRows<T>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<PageResult<T>> {
  const data: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const result = await loadPage(from, from + PAGE_SIZE - 1);
    if (result.error) return { data: null, error: result.error };
    const page = result.data ?? [];
    data.push(...page);
    if (page.length < PAGE_SIZE) return { data, error: null };
  }
}
