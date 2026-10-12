import "server-only"
import { cacheLife } from "next/cache"
import { attempt, getJson, type Result } from "./http.ts"
import type { Hit } from "./search.ts"

type Source = { title?: string[]; mediatype?: string[]; collection?: string[]; downloads?: number[]; creatorSorter?: string[] }

// creatorSorter is lowercased; title-case it for display.
const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())

async function fetchRelated(id: string): Promise<Result<Hit[]>> {
  "use cache"
  const r = await attempt(async () => {
    const j = await getJson<{ hits?: { hits?: { _id: string; _source: Source }[] } }>(
      `https://be-api.us.archive.org/mds/v1/get_related/all/${encodeURIComponent(id)}`
    )
    return (j.hits?.hits ?? []).map(({ _id, _source: s }) => ({
      id: _id,
      title: s.title?.[0] ?? _id,
      mediatype: s.mediatype?.[0] ?? "",
      creators: (s.creatorSorter ?? []).map(titleCase),
      downloads: s.downloads?.[0],
      collections: (s.collection ?? []).filter((c) => !c.startsWith("fav-")),
      kind: "item",
      snippets: [],
    }))
  })
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

/** archive.org's own "related items" service. */
export const getRelated = fetchRelated
