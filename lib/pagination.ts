/** Page numbers with gaps: 1 2 3 4 5 … 113, 1 … 6 7 8 … 113, 1 … 109 110 111 112 113. */
export function pageList(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, "gap", total]
  if (page >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total]
  return [1, "gap", page - 1, page, page + 1, "gap", total]
}
