/** "20261009114527" (Wayback timestamp, UTC) -> Date. */
export function stampToDate(stamp: string): Date {
  const p = (a: number, b: number) => Number(stamp.slice(a, b) || (a === 4 || a === 6 ? 1 : 0))
  return new Date(Date.UTC(p(0, 4), p(4, 6) - 1, p(6, 8), p(8, 10), p(10, 12), p(12, 14)))
}

const day = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" })
const time = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })

export const formatStampDay = (stamp: string) => day.format(stampToDate(stamp))
export const formatStampFull = (stamp: string) => `${day.format(stampToDate(stamp))} at ${time.format(stampToDate(stamp))} UTC`

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

/** Strips the scheme and a trailing slash for display: "https://www.nasa.gov/" -> "www.nasa.gov". */
export const displayUrl = (url: string) => url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "")
