import "server-only"
import { cacheLife } from "next/cache"
import { attempt, badResponse, getJson, type Result } from "./http.ts"

export type Scope = "metadata" | "fts" | "tvs" | "rcs"
export type Sort = "relevance" | "downloads" | "newest" | "oldest" | "title" | "added"
export const FACETS = ["mediatype", "collection", "creator", "language", "subject"] as const
export type Facet = (typeof FACETS)[number]

export type Avail = "free" | "borrow" | "pd"

export type SearchInput = {
  q: string
  scope: Scope
  filters: Partial<Record<Facet, string[]>>
  avail?: Avail[]
  yearFrom?: number
  yearTo?: number
  sort: Sort
  page: number
  rows: number
  /** Collection page: results limited to this collection. */
  within?: string
}

export type Hit = {
  id: string
  title: string
  mediatype: string
  creators: string[]
  year?: number
  downloads?: number
  collections: string[]
  license?: string
  lendingStatus?: string
  favorites?: number
  /** Collections only: number of items inside. */
  itemCount?: number
  /** "item", or "tv_clip" / "asr_text" / "text" for caption, transcript and full-text hits. */
  kind: string
  /** Full-text matches; the matched words are wrapped in {{{ }}}. */
  snippets: string[]
}

export type Bucket = { key: string; count: number }

export type SearchResult = {
  total: number
  hits: Hit[]
  facets: Partial<Record<Facet, Bucket[]>>
  years: Bucket[]
  collectionTitles: Record<string, string>
  /** "advancedsearch" means the fallback ran: no facets. */
  source: "page_production" | "advancedsearch"
}

// Both search APIs refuse to page past 10,000 results.
export const MAX_RESULTS = 10_000
const THIS_YEAR = new Date().getFullYear()

const SORTS: Record<Exclude<Sort, "relevance">, string> = {
  downloads: "downloads:desc",
  newest: "date:desc",
  oldest: "date:asc",
  title: "titleSorter:asc",
  added: "addeddate:desc",
}

const quote = (v: string) => `"${v.replace(/["\\]/g, "\\$&")}"`
const orList = (field: string, values: string[]) => `${field}:(${values.map(quote).join(" OR ")})`

// Same rules as lib/availability.ts, expressed as Lucene clauses.
const LENDING = "collection:(inlibrary OR lendinglibrary)"
export const AVAIL_CLAUSE: Record<Avail, string> = {
  borrow: LENDING,
  pd: "licenseurl:*publicdomain*",
  free: "NOT collection:(inlibrary OR lendinglibrary OR printdisabled)",
}

function baseQuery(input: SearchInput): string | null {
  const q = input.q.trim()
  if (q) return q
  if (input.within) return `collection:${quote(input.within)}`
  for (const f of FACETS) {
    const v = input.filters[f]
    if (v?.length) return orList(f, v)
  }
  return null
}

/** page_production requires user_query; an empty search becomes a field query on the scope. */
export function effectiveQuery(input: SearchInput): string | null {
  const base = baseQuery(input)
  if (!base || !input.avail?.length) return base
  return `(${base}) AND (${input.avail.map((a) => `(${AVAIL_CLAUSE[a]})`).join(" OR ")})`
}

/** Relevance is meaningless without words, so browsing defaults to most downloaded. */
export function effectiveSort(input: SearchInput): Sort {
  return input.sort === "relevance" && !input.q.trim() ? "downloads" : input.sort
}

export function pageProductionUrl(input: SearchInput, query: string, aggregations = 40): string {
  const filterMap: Record<string, Record<string, string>> = {}
  for (const f of FACETS) {
    for (const v of input.filters[f] ?? []) (filterMap[f] ??= {})[v] = "inc"
  }
  // Browsing already queries collection:"id"; repeating it as a filter alongside the mediatype
  // exclusion makes page_production answer 400 (feature_films, aggregations_size 40).
  if (input.within && input.q.trim()) (filterMap.collection ??= {})[input.within] = "inc"
  // Inside a collection, subcollections have their own tab; keep them out of the items.
  if (input.within && !input.filters.mediatype?.length) (filterMap.mediatype ??= {}).collection = "exc"
  const sort = effectiveSort(input)
  // Date sorts surface junk years (2389 seen live); cap at the current year.
  const yearTo = input.yearTo ?? (sort === "newest" ? THIS_YEAR : undefined)
  if (input.yearFrom !== undefined) (filterMap.year ??= {})[String(input.yearFrom)] = "gte"
  if (yearTo !== undefined) (filterMap.year ??= {})[String(yearTo)] = "lte"

  const p = new URLSearchParams({
    service_backend: input.scope,
    user_query: query,
    hits_per_page: String(input.rows),
    page: String(input.page),
    aggregations_size: String(aggregations),
  })
  if (Object.keys(filterMap).length) p.set("filter_map", JSON.stringify(filterMap))
  if (sort !== "relevance") p.set("sort", SORTS[sort])
  return `https://archive.org/services/search/beta/page_production/?${p}`
}

export function advancedSearchUrl(input: SearchInput, query: string): string {
  const clauses = [input.q.trim() ? `(${query})` : query]
  for (const f of FACETS) {
    const v = input.filters[f]
    if (v?.length) clauses.push(orList(f, v))
  }
  if (input.within && input.q.trim()) clauses.push(`collection:${quote(input.within)}`)
  if (input.within && !input.filters.mediatype?.length) clauses.push("NOT mediatype:collection")
  if (input.yearFrom !== undefined || input.yearTo !== undefined)
    clauses.push(`year:[${input.yearFrom ?? "*"} TO ${input.yearTo ?? "*"}]`)

  const p = new URLSearchParams({ q: clauses.join(" AND "), rows: String(input.rows), page: String(input.page), output: "json" })
  for (const f of ["identifier", "title", "mediatype", "creator", "year", "downloads", "collection", "licenseurl"]) p.append("fl[]", f)
  const sort = effectiveSort(input)
  if (sort !== "relevance") p.append("sort[]", SORTS[sort].replace(":", " "))
  return `https://archive.org/advancedsearch.php?${p}`
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v == null || v === "" ? [] : [String(v)])
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v !== "" && !isNaN(+v) ? +v : undefined)

type RawFields = Record<string, unknown>
function toHit(f: RawFields, snippets: string[] = [], kind = "item"): Hit {
  return {
    id: String(f.identifier),
    title: arr(f.title)[0] || String(f.identifier),
    mediatype: String(f.mediatype ?? ""),
    creators: arr(f.creator),
    year: num(f.year),
    downloads: num(f.downloads),
    collections: arr(f.collection),
    license: arr(f.licenseurl)[0],
    lendingStatus: typeof f.lending___status === "string" ? f.lending___status : undefined,
    favorites: num(f.num_favorites),
    itemCount: num(f.item_count),
    kind,
    snippets,
  }
}

type PPResponse = {
  response?: {
    body?: {
      hits: { total: number; hits: { fields: RawFields; hit_type?: string; highlight?: { text?: string[] } | null }[] }
      aggregations?: Record<string, { buckets?: { key: string | number; doc_count: number }[] }>
      collection_titles?: Record<string, string>
    } | null
  }
}

// Cached functions return a Result instead of throwing: a throw inside "use cache" aborts prerendering,
// and production builds replace its message. Failures get the "failure" profile (next.config.ts), so they
// are regenerated on the next request and never prerendered.

async function pageProduction(input: SearchInput, query: string): Promise<Result<SearchResult>> {
  "use cache"
  // Browsing without words (a whole mediatype or collection) is slow upstream (14s seen for all texts)
  // and changes slowly, so it is cached longer and given more time.
  const browse = !input.q.trim()
  const r = await attempt(async () => {
    const json = await getJson<PPResponse>(pageProductionUrl(input, query), browse ? 20_000 : undefined)
    const body = json.response?.body
    if (!body) throw badResponse()
    const aggs = body.aggregations ?? {}
    const buckets = (k: string): Bucket[] => (aggs[k]?.buckets ?? []).map((b) => ({ key: String(b.key), count: b.doc_count }))
    return {
      total: body.hits.total,
      hits: body.hits.hits.map((h) => toHit(h.fields, h.highlight?.text?.slice(0, 2), h.hit_type)),
      facets: Object.fromEntries(FACETS.map((f) => [f, buckets(f)])),
      years: buckets("year"),
      collectionTitles: body.collection_titles ?? {},
      source: "page_production" as const,
    }
  })
  if (!r.ok) cacheLife("failure")
  else if (browse) cacheLife("hours")
  else cacheLife("minutes")
  return r
}

async function advancedSearch(input: SearchInput, query: string): Promise<Result<SearchResult>> {
  "use cache"
  const r = await attempt(async () => {
    const json = await getJson<{ response?: { numFound: number; docs: RawFields[] } }>(advancedSearchUrl(input, query))
    if (!json.response) throw badResponse()
    return {
      total: json.response.numFound,
      hits: json.response.docs.map((d) => toHit(d)),
      facets: {},
      years: [],
      collectionTitles: {},
      source: "advancedsearch" as const,
    }
  })
  if (r.ok) cacheLife("minutes")
  else cacheLife("failure")
  return r
}

/** The only caller of page_production (an undocumented beta). Falls back to advancedsearch for metadata scope. */
export async function search(input: SearchInput): Promise<Result<SearchResult> | null> {
  const query = effectiveQuery(input)
  if (!query) return null
  const page = Math.min(input.page, Math.ceil(MAX_RESULTS / input.rows))
  const capped = { ...input, page }
  const primary = await pageProduction(capped, query)
  if (primary.ok || input.scope !== "metadata" || primary.error.kind === "rate_limited") return primary
  return advancedSearch(capped, query)
}

async function countCached(input: SearchInput, query: string): Promise<Result<number>> {
  "use cache"
  const r = await attempt(async () => {
    // advancedsearch answers metadata counts in about 1s; page_production took 7 to 9s for a whole mediatype.
    if (input.scope === "metadata") {
      const j = await getJson<{ response?: { numFound?: number } }>(advancedSearchUrl({ ...input, rows: 0, page: 1 }, query))
      if (typeof j.response?.numFound !== "number") throw badResponse()
      return j.response.numFound
    }
    // One row, not zero: fts omits hits.total when hits_per_page=0.
    const json = await getJson<PPResponse>(pageProductionUrl({ ...input, rows: 1, page: 1 }, query, 0))
    const total = json.response?.body?.hits.total
    if (typeof total !== "number") throw badResponse()
    return total
  })
  if (r.ok) cacheLife("minutes")
  else cacheLife("failure")
  return r
}

/** Total hits only, for scope and availability counts. */
export async function count(input: SearchInput): Promise<Result<number> | null> {
  const query = effectiveQuery(input)
  return query ? countCached(input, query) : null
}

async function yearsCached(input: SearchInput, query: string): Promise<Result<Bucket[]>> {
  "use cache"
  const r = await attempt(async () => {
    // 200 buckets covers every year in practice (feature_films: 140 years, sum_other_doc_count 0).
    const json = await getJson<PPResponse>(pageProductionUrl({ ...input, rows: 1, page: 1 }, query, 200), 20_000)
    const buckets = json.response?.body?.aggregations?.year?.buckets
    if (!buckets) throw badResponse()
    return buckets.map((b) => ({ key: String(b.key), count: b.doc_count }))
  })
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

/** Every year bucket for a query (for decade charts); the regular search only keeps the top 40. */
export async function yearBuckets(input: SearchInput): Promise<Result<Bucket[]> | null> {
  const query = effectiveQuery(input)
  return query ? yearsCached(input, query) : null
}
