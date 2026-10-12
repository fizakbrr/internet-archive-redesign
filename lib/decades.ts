const THIS_YEAR = new Date().getFullYear()

/** Sums year buckets into a continuous run of decades. Years outside 1000 to next year are bad data. */
export function toDecades(years: { key: string; count: number }[]): { decade: number; count: number }[] {
  const sums = new Map<number, number>()
  for (const b of years) {
    const y = Number(b.key)
    if (!Number.isInteger(y) || y < 1000 || y > THIS_YEAR + 1) continue
    const d = Math.floor(y / 10) * 10
    sums.set(d, (sums.get(d) ?? 0) + b.count)
  }
  if (!sums.size) return []
  const keys = [...sums.keys()]
  const out = []
  for (let d = Math.min(...keys); d <= Math.max(...keys); d += 10) out.push({ decade: d, count: sums.get(d) ?? 0 })
  return out
}
