export type AdvancedFields = {
  all: string
  phrase: string
  none: string
  title: string
  creator: string
  collection: string
  mediatype: string
  language: string
  subject: string
  from: string
  to: string
}

export const EMPTY_FIELDS: AdvancedFields = { all: "", phrase: "", none: "", title: "", creator: "", collection: "", mediatype: "", language: "", subject: "", from: "", to: "" }

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean)
const quote = (s: string) => `"${s.trim().replace(/["\\]/g, "\\$&")}"`
// Single words go in bare; anything with spaces or punctuation is quoted.
const value = (s: string) => (/^[\p{L}\p{N}_.-]+$/u.test(s.trim()) ? s.trim() : quote(s))

/** Lucene query for the search APIs, e.g. (night AND living) AND -remake AND creator:("Romero, George A.") AND year:[1960 TO 1979] */
export function buildAdvancedQuery(f: AdvancedFields): string {
  const parts: string[] = []
  const all = words(f.all).map(value)
  if (all.length) parts.push(all.length > 1 ? `(${all.join(" AND ")})` : all[0])
  if (f.phrase.trim()) parts.push(quote(f.phrase))
  for (const w of words(f.none)) parts.push(`-${value(w)}`)
  for (const k of ["title", "creator", "collection", "mediatype", "language", "subject"] as const) {
    if (f[k].trim()) parts.push(`${k}:(${value(f[k])})`)
  }
  const from = f.from.trim().match(/^\d{4}/)?.[0]
  const to = f.to.trim().match(/^\d{4}/)?.[0]
  if (from || to) parts.push(`year:[${from ?? "*"} TO ${to ?? "*"}]`)
  return parts.join(" AND ")
}
