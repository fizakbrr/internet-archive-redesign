const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const full = new Intl.NumberFormat("en")

/** 4.8K, 303K, 1.2M */
export const compactNumber = (n: number) => compact.format(n)
/** 1,013 */
export const formatNumber = (n: number) => full.format(n)

export const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`

const UNITS = ["B", "KB", "MB", "GB", "TB"]
export function formatBytes(n: number): string {
  let i = 0
  while (n >= 1024 && i < UNITS.length - 1) {
    n /= 1024
    i++
  }
  return `${n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)} ${UNITS[i]}`
}

/** 3723 -> "1:02:03", 83 -> "1:23" */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`
}

const longDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" })

/** "2007-04-23 23:34:10" -> "April 23, 2007". Bare years and unparseable values pass through. */
export function formatDate(s: string): string {
  if (/^\d{4}$/.test(s.trim())) return s.trim()
  const iso = s.trim().replace(" ", "T")
  const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) || !iso.includes("T") ? iso : iso + "Z")
  return isNaN(d.getTime()) ? s : longDate.format(d)
}
