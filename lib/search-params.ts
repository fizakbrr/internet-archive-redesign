// URL state for /search and collection pages. Shared by server pages and client controls.

export const SCOPES = [
  { value: "metadata", label: "Metadata" },
  { value: "fts", label: "Text contents" },
  { value: "tvs", label: "TV captions" },
  { value: "rcs", label: "Radio transcripts" },
] as const

export const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "downloads", label: "Most viewed" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title (A to Z)" },
  { value: "added", label: "Recently added" },
] as const

export const AVAILABILITY = [
  { value: "free", label: "Free to download" },
  { value: "borrow", label: "Borrow only" },
  { value: "pd", label: "Public domain" },
] as const

export const LIST_FACETS = ["mediatype", "language", "subject", "collection", "creator"] as const

export type ScopeValue = (typeof SCOPES)[number]["value"]
export type SortValue = (typeof SORTS)[number]["value"]
export type AvailValue = (typeof AVAILABILITY)[number]["value"]
export type ListFacet = (typeof LIST_FACETS)[number]

export type SearchState = {
  q: string
  scope: ScopeValue
  sort: SortValue
  view: "grid" | "list"
  page: number
  from?: number
  to?: number
  avail: AvailValue[]
  filters: Record<ListFacet, string[]>
}

export const ROWS = 24

type Raw = Record<string, string | string[] | undefined>

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean)
const first = (v: string | string[] | undefined) => list(v)[0] ?? ""
const oneOf = <T extends string>(v: string, options: readonly { value: T }[], fallback: T): T =>
  options.some((o) => o.value === v) ? (v as T) : fallback
const year = (v: string) => (/^\d{1,4}$/.test(v) ? Number(v) : undefined)

export function parseSearch(raw: Raw): SearchState {
  return {
    q: first(raw.q).slice(0, 500),
    scope: oneOf(first(raw.scope), SCOPES, "metadata"),
    sort: oneOf(first(raw.sort), SORTS, "relevance"),
    view: first(raw.view) === "list" ? "list" : "grid",
    page: Math.max(1, Math.floor(Number(first(raw.page)) || 1)),
    from: year(first(raw.from)),
    to: year(first(raw.to)),
    avail: list(raw.avail).filter((v): v is AvailValue => AVAILABILITY.some((a) => a.value === v)),
    filters: Object.fromEntries(LIST_FACETS.map((f) => [f, list(raw[f]).slice(0, 20)])) as SearchState["filters"],
  }
}

/** Serialize, leaving out defaults so URLs stay short. */
export function toQuery(s: SearchState): string {
  const p = new URLSearchParams()
  if (s.q) p.set("q", s.q)
  if (s.scope !== "metadata") p.set("scope", s.scope)
  for (const v of s.avail) p.append("avail", v)
  for (const f of LIST_FACETS) for (const v of s.filters[f]) p.append(f, v)
  if (s.from !== undefined) p.set("from", String(s.from))
  if (s.to !== undefined) p.set("to", String(s.to))
  if (s.sort !== "relevance") p.set("sort", s.sort)
  if (s.view !== "grid") p.set("view", s.view)
  if (s.page > 1) p.set("page", String(s.page))
  const q = p.toString()
  return q ? `?${q}` : ""
}

/** Any change other than paging goes back to page 1. */
export function hrefWith(base: string, s: SearchState, change: Partial<SearchState>): string {
  return base + toQuery({ ...s, page: 1, ...change })
}

export function activeFilterCount(s: SearchState): number {
  return s.avail.length + LIST_FACETS.reduce((n, f) => n + s.filters[f].length, 0) + (s.from !== undefined || s.to !== undefined ? 1 : 0)
}
