/**
 * Shared date range for stats APIs. No `year`/`month` → all-time (from epoch).
 * `month` without `year` uses the current calendar year (legacy).
 */
export function sessionDateFilterFromSearchParams(url: URL): { gte: Date; lte?: Date } {
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");

  if (monthParam) {
    const y = yearParam ? Number(yearParam) : new Date().getFullYear();
    const m = Number(monthParam) - 1;
    return {
      gte: new Date(y, m, 1),
      lte: new Date(y, m + 1, 0, 23, 59, 59, 999),
    };
  }
  if (yearParam) {
    const y = Number(yearParam);
    return {
      gte: new Date(y, 0, 1),
      lte: new Date(y, 11, 31, 23, 59, 59, 999),
    };
  }
  return { gte: new Date(0) };
}
