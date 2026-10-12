import "server-only"
import { cacheLife } from "next/cache"
import { attempt, badResponse, getJson, type Result } from "./http.ts"

export type Sparkline = {
  first?: string
  last?: string
  /** Capture counts per month, January first. */
  years: Record<string, number[]>
}
export type Capture = { timestamp: string; status: string }
export type Snapshot = { url: string; timestamp: string; status: string }

async function fetchSparkline(url: string): Promise<Result<Sparkline>> {
  "use cache"
  const r = await attempt(async () => {
    const p = new URLSearchParams({ output: "json", url, collection: "web" })
    const j = await getJson<{ years?: Record<string, number[]>; first_ts?: string | null; last_ts?: string | null }>(
      `https://web.archive.org/__wb/sparkline?${p}`
    )
    if (!j.years) throw badResponse()
    return { first: j.first_ts ?? undefined, last: j.last_ts ?? undefined, years: j.years }
  })
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

// One capture per day (collapse on yyyymmdd), capped so a busy site cannot flood the response.
async function fetchCaptures(url: string, from: string, to: string): Promise<Result<Capture[]>> {
  "use cache"
  const r = await attempt(async () => {
    const p = new URLSearchParams({ url, from, to, output: "json", fl: "timestamp,statuscode", collapse: "timestamp:8", limit: "400" })
    // CDX is slow (about 9s seen for 10 days of a busy site).
    const rows = await getJson<string[][]>(`https://web.archive.org/cdx/search/cdx?${p}`, 25_000)
    return rows.slice(1).map(([timestamp, status]) => ({ timestamp, status }))
  })
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

async function fetchClosest(url: string, timestamp?: string): Promise<Result<Snapshot | null>> {
  "use cache"
  const r = await attempt(async () => {
    const p = new URLSearchParams({ url })
    if (timestamp) p.set("timestamp", timestamp)
    const j = await getJson<{ archived_snapshots?: { closest?: Snapshot & { available: boolean } } }>(
      `https://archive.org/wayback/available?${p}`
    )
    const c = j.archived_snapshots?.closest
    return c?.available ? { url: c.url, timestamp: c.timestamp, status: c.status } : null
  })
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

export const getSparkline = fetchSparkline
export const getCaptures = fetchCaptures
export const getClosest = fetchClosest
