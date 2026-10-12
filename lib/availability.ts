// Mirrors AVAIL_CLAUSE in lib/ia/search.ts so a card's label matches the facet it is counted under.

export type Availability = "Free to download" | "Borrow only" | "Public domain" | "Stream only" | "Restricted" | "Unavailable"

export function availabilityOf(x: {
  collections: string[]
  license?: string
  lendingStatus?: string
  kind?: string
  restricted?: boolean
  dark?: boolean
}): Availability {
  if (x.dark) return "Unavailable"
  // TV caption hits are broadcast clips: watchable, never downloadable.
  if (x.kind === "tv_clip" || x.collections.includes("stream_only")) return "Stream only"
  if (x.collections.some((c) => c === "inlibrary" || c === "lendinglibrary") || x.lendingStatus === "is_lendable")
    return "Borrow only"
  // Print-disabled-only books are open to qualifying readers, not the public.
  if (x.collections.includes("printdisabled") || x.restricted) return "Restricted"
  if (x.license?.includes("publicdomain")) return "Public domain"
  return "Free to download"
}
