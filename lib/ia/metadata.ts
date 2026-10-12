import "server-only"
import { cacheLife } from "next/cache"
import { attempt, getJson, type Result } from "./http.ts"

export type ItemFile = {
  name: string
  format: string
  source: string
  size?: number
  /** Seconds, for audio and video. */
  length?: number
  title?: string
  track?: string
}

export type Review = { title: string; body: string; reviewer: string; date: string; stars?: number }

export type Item = {
  id: string
  title: string
  mediatype: string
  creators: string[]
  date?: string
  year?: number
  description?: string
  subjects: string[]
  languages: string[]
  collections: string[]
  license?: string
  addeddate?: string
  /** Lending library items ("access-restricted-item"). */
  restricted: boolean
  /** Withdrawn or hidden item: metadata exists but files must not be offered. */
  dark: boolean
  size?: number
  files: ItemFile[]
  reviews: Review[]
  /** Every metadata field for the raw-metadata disclosure, minus personal data. */
  raw: [string, string][]
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null || v === "" ? [] : [String(v)])
const num = (v: unknown) => (v == null || v === "" || isNaN(Number(v)) ? undefined : Number(v))

// Uploader fields hold email addresses; never surface them.
const PRIVATE_KEYS = new Set(["uploader", "updater", "submitter"])
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/

/** Subjects arrive both as arrays and as "a; b" strings. */
function splitSubjects(v: unknown): string[] {
  return arr(v)
    .flatMap((s) => s.split(/\s*;\s*/))
    .map((s) => s.trim())
    .filter(Boolean)
}

/** "1:23:45", "83:12" or plain seconds. */
export function parseLength(v: unknown): number | undefined {
  if (v == null || v === "") return undefined
  const parts = String(v).split(":").map(Number)
  if (parts.some(isNaN)) return undefined
  return parts.reduce((acc, p) => acc * 60 + p, 0)
}

type RawItem = {
  metadata?: Record<string, unknown>
  files?: Record<string, unknown>[]
  reviews?: Record<string, unknown>[]
  is_dark?: boolean
  item_size?: number
}

export function normalizeItem(json: RawItem, id?: string): Item | null {
  const m = json.metadata
  // Dark items can come back with is_dark and no metadata block at all.
  if (!m?.identifier && json.is_dark && id) {
    return { id, title: id, mediatype: "", creators: [], subjects: [], languages: [], collections: [], restricted: false, dark: true, files: [], reviews: [], raw: [] }
  }
  if (!m?.identifier) return null
  return {
    id: String(m.identifier),
    title: arr(m.title)[0] || String(m.identifier),
    mediatype: String(m.mediatype ?? ""),
    creators: arr(m.creator),
    date: arr(m.date)[0],
    year: num(arr(m.year)[0]),
    description: arr(m.description).join("\n\n") || undefined,
    subjects: splitSubjects(m.subject),
    languages: arr(m.language),
    collections: arr(m.collection),
    license: arr(m.licenseurl)[0],
    addeddate: arr(m.addeddate)[0],
    restricted: String(m["access-restricted-item"]) === "true",
    dark: json.is_dark === true,
    size: json.item_size,
    files: (json.files ?? [])
      .filter((f) => f.private !== "true" && f.private !== true)
      .map((f) => ({
        name: String(f.name),
        format: String(f.format ?? ""),
        source: String(f.source ?? ""),
        size: num(f.size),
        length: parseLength(f.length),
        title: f.title ? String(f.title) : undefined,
        track: f.track ? String(f.track) : undefined,
      })),
    reviews: (json.reviews ?? []).map((r) => ({
      title: String(r.reviewtitle ?? ""),
      body: String(r.reviewbody ?? ""),
      reviewer: String(r.reviewer ?? ""),
      date: String(r.reviewdate ?? ""),
      stars: num(r.stars),
    })),
    raw: Object.entries(m)
      .filter(([k]) => !PRIVATE_KEYS.has(k))
      .map(([k, v]) => [k, arr(v).join("; ")] as [string, string])
      .filter(([, v]) => v && !EMAIL.test(v)),
  }
}

async function fetchItem(id: string): Promise<Result<Item | null>> {
  "use cache"
  const r = await attempt(async () => normalizeItem(await getJson<RawItem>(`https://archive.org/metadata/${encodeURIComponent(id)}`), id))
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

/** Unknown identifiers come back as `{}` with status 200; that maps to not_found. */
export async function getItem(id: string): Promise<Result<Item>> {
  const r = await fetchItem(id)
  if (r.ok && !r.data) return { ok: false, error: { kind: "not_found", status: 404 } }
  return r as Result<Item>
}
