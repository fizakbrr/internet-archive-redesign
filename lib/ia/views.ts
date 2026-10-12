import "server-only"
import { cacheLife } from "next/cache"
import { attempt, getJson, type Result } from "./http.ts"

export type Views = { allTime: number; last30: number }

async function fetchViews(ids: string[]): Promise<Result<Record<string, Views>>> {
  "use cache"
  const r = await attempt(async () => {
    const json = await getJson<Record<string, { have_data?: boolean; all_time?: number; last_30day?: number }>>(
      `https://be-api.us.archive.org/views/v1/short/${ids.map(encodeURIComponent).join(",")}`
    )
    const out: Record<string, Views> = {}
    for (const [id, v] of Object.entries(json)) {
      if (v.have_data) out[id] = { allTime: v.all_time ?? 0, last30: v.last_30day ?? 0 }
    }
    return out
  })
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

export async function getViews(ids: string[]): Promise<Result<Record<string, Views>>> {
  if (!ids.length) return { ok: true, data: {} }
  // Sorted so the same set of ids shares one cache entry.
  return fetchViews([...ids].sort())
}
