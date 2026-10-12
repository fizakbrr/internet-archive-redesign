import { SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { Chip } from "@/components/chip"
import { FilterSheet, SortSelect, ViewToggle } from "@/components/filters/controls"
import { FilterForm, type FacetData } from "@/components/filters/filter-form"
import { StatePanel } from "@/components/feedback/state-panel"
import { ItemCard } from "@/components/item-card"
import { Pagination } from "@/components/pagination"
import { SearchBar } from "@/components/search-bar"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import { formatNumber, plural } from "@/lib/format"
import type { IAError } from "@/lib/ia/http"
import { count, MAX_RESULTS, search, type Avail, type SearchInput } from "@/lib/ia/search"
import { mediaInfo } from "@/lib/media"
import {
  activeFilterCount,
  AVAILABILITY,
  hrefWith,
  LIST_FACETS,
  toQuery,
  ROWS,
  SCOPES,
  type SearchState,
} from "@/lib/search-params"

const SUGGESTIONS = ["night of the living dead", "grateful dead", "oregon trail", "tom sawyer"]
const NO_FILTERS = { mediatype: [], language: [], subject: [], collection: [], creator: [] }

const toInput = (s: SearchState, within?: string): SearchInput => ({
  q: s.q,
  scope: s.scope,
  filters: s.filters,
  avail: s.avail as Avail[],
  yearFrom: s.from,
  yearTo: s.to,
  sort: s.sort,
  page: s.page,
  rows: ROWS,
  within,
})

const value = async <T,>(p: Promise<{ ok: true; data: T } | { ok: false } | null>) => {
  const r = await p
  return r?.ok ? r.data : undefined
}

export function ErrorPanel({
  error,
  retryHref,
  q,
  title = "Search is unavailable",
}: {
  error: IAError
  retryHref: string
  q?: string
  title?: string
}) {
  const limited = error.kind === "rate_limited"
  return (
    <StatePanel
      kind="error"
      title={limited ? "Too many requests" : title}
      actions={
        <>
          <a href={retryHref} className={buttonVariants()}>
            Try again
          </a>
          {q && (
            <a href={`https://archive.org/search?query=${encodeURIComponent(q)}`} className={buttonVariants({ variant: "ghost" })}>
              Search on archive.org
            </a>
          )}
        </>
      }
    >
      {limited
        ? `archive.org asked us to slow down.${error.retryAfter ? ` Try again in ${plural(error.retryAfter, "second")}.` : " Try again in a moment."}`
        : `archive.org did not respond${error.status ? ` (HTTP ${error.status})` : ""}. This usually clears up within a few minutes.`}
    </StatePanel>
  )
}

export async function SearchView({
  base,
  state,
  within,
  withinTitle,
  extra,
}: {
  base: string
  state: SearchState
  /** Collection pages: results limited to this collection, no filter rail (the page renders its own h1). */
  within?: string
  withinTitle?: string
  /** Rendered above the results (the collection decade chart). */
  extra?: React.ReactNode
}) {
  const input = toInput(state, within)
  const filtered = activeFilterCount(state) > 0
  // Scope counts and "across everything" describe the query alone.
  const unfiltered = { ...input, filters: NO_FILTERS, avail: [], yearFrom: undefined, yearTo: undefined }
  const [result, availCounts, scopeCounts, everything] = await Promise.all([
    search(input),
    state.scope === "metadata" && !within
      ? Promise.all(AVAILABILITY.map((a) => value(count({ ...input, avail: [a.value] }))))
      : Promise.resolve([]),
    state.q && !within
      ? Promise.all(SCOPES.map((s) => (s.value === state.scope ? undefined : value(count({ ...unfiltered, scope: s.value })))))
      : Promise.resolve([]),
    filtered && state.q ? value(count(unfiltered)) : undefined,
  ])

  const title = within ? null : (
    <h1 className="type-h1">{state.q ? `Results for “${state.q}”` : within ? "Browse" : `Browse ${mediaInfo(state.filters.mediatype[0] ?? "").plural}`}</h1>
  )

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="type-h1">Search the Archive</h1>
        <SearchBar autoFocus className="h-14 w-full max-w-2xl" />
        <p className="type-body text-fg-secondary">Books, film, audio, software, images and archived web pages.</p>
      </div>
    )
  }

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-8">
        {title}
        <ErrorPanel error={result.error} retryHref={base + hrefWith("", state, { page: state.page })} q={state.q} />
      </div>
    )
  }

  const { total, hits } = result.data
  const data: FacetData = {
    buckets: Object.fromEntries(LIST_FACETS.map((f) => [f, result.data.facets[f] ?? []])),
    years: result.data.years,
    availCounts: Object.fromEntries(AVAILABILITY.map((a, i) => [a.value, availCounts[i]])),
    collectionTitles: result.data.collectionTitles,
  }
  const totalPages = Math.ceil(Math.min(total, MAX_RESULTS) / ROWS)
  const onlyType = state.filters.mediatype.length === 1 ? mediaInfo(state.filters.mediatype[0]).plural : null
  const clearAll = hrefWith(base, state, { avail: [], from: undefined, to: undefined, filters: NO_FILTERS })

  const activeChips = [
    ...state.avail.map((a) => ({ label: AVAILABILITY.find((x) => x.value === a)!.label, href: hrefWith(base, state, { avail: state.avail.filter((x) => x !== a) }) })),
    ...LIST_FACETS.flatMap((f) =>
      state.filters[f].map((v) => ({
        label: f === "mediatype" ? mediaInfo(v).plural : f === "collection" ? data.collectionTitles[v] ?? v : v,
        href: hrefWith(base, state, { filters: { ...state.filters, [f]: state.filters[f].filter((x) => x !== v) } }),
      }))
    ),
    ...(state.from !== undefined || state.to !== undefined
      ? [{ label: `${state.from ?? "…"} to ${state.to ?? "…"}`, href: hrefWith(base, state, { from: undefined, to: undefined }) }]
      : []),
  ]

  const sortAndView = (
    <div className="hidden items-center gap-3 lg:flex">
      <SortSelect action={base} state={state} />
      <ViewToggle base={base} state={state} />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {within ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar
            key={state.q}
            action={base}
            defaultValue={state.q}
            placeholder={`Search within ${withinTitle ?? "this collection"}`}
            detectUrls={false}
            className="lg:w-[400px]"
          />
          <div className="flex items-center gap-2">
            {SCOPES.slice(0, 2).map((s) => (
              <Chip key={s.value} href={hrefWith(base, state, { scope: s.value })} selected={s.value === state.scope}>
                {s.label}
              </Chip>
            ))}
          </div>
          <div className="lg:ml-auto">{sortAndView}</div>
        </div>
      ) : (
        <SearchBar defaultValue={state.q} className="lg:hidden" key={state.q} />
      )}

      {!within && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title}
            <p className="type-body-sm text-fg-secondary">
              {plural(total, "result")}
              {onlyType && ` in ${onlyType}`}
              {everything !== undefined && ` · ${formatNumber(everything)} across everything`}
              {total > MAX_RESULTS && ` · the first ${formatNumber(MAX_RESULTS)} can be browsed`}
            </p>
          </div>
          {sortAndView}
        </div>
      )}

      <div className="flex gap-3 lg:hidden">
        {!within && <FilterSheet action={base} state={state} data={data} />}
        <SortSelect action={base} state={state} className="flex-1" />
      </div>

      {state.q && !within && (
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <span className="shrink-0 type-label text-fg-secondary">Search in</span>
          {SCOPES.map((s, i) => (
            <Chip key={s.value} href={hrefWith(base, state, { scope: s.value })} selected={s.value === state.scope}>
              {s.label}
              {scopeCounts[i] !== undefined && ` (${formatNumber(scopeCounts[i]!)})`}
            </Chip>
          ))}
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-label text-fg-secondary">Filters</span>
          {activeChips.map((c) => (
            <Chip key={c.href} href={c.href} removable label={`Remove filter: ${c.label}`}>
              {c.label}
            </Chip>
          ))}
          <Link href={clearAll} scroll={false} className="flex h-11 items-center px-2 type-label underline lg:h-9">
            Clear all
          </Link>
        </div>
      )}

      {extra}

      <div className={cn("grid gap-8", !within && "lg:grid-cols-[264px_minmax(0,1fr)]")}>
        {!within && (
          <aside aria-label="Filters" className="hidden lg:block">
            {result.data.source === "advancedsearch" ? (
              <p className="type-body-sm text-fg-secondary">Filters are unavailable while search runs in fallback mode.</p>
            ) : (
              <FilterForm key={toQuery(state)} action={base} state={state} data={data} autoApply />
            )}
            <Link href="/search/advanced" className="mt-4 inline-flex min-h-11 items-center gap-2 type-label underline">
              <SlidersHorizontal className="size-5" aria-hidden="true" />
              Advanced search
            </Link>
          </aside>
        )}

        <section aria-labelledby="results-heading" className="flex min-w-0 flex-col gap-8">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>
          {hits.length === 0 ? (
            <div className="flex flex-col items-center gap-6">
              <StatePanel
                kind="search"
                title={state.q ? `No results for “${state.q}”` : "No results"}
                actions={
                  <>
                    {filtered && (
                      <Link href={clearAll} className={buttonVariants()}>
                        Clear filters
                      </Link>
                    )}
                    {state.q && state.scope === "metadata" && (
                      <Link href={hrefWith(base, state, { scope: "fts" })} className={buttonVariants({ variant: filtered ? "ghost" : "primary" })}>
                        Search text contents
                      </Link>
                    )}
                  </>
                }
              >
                Check the spelling, remove a filter, or search text contents instead.
              </StatePanel>
              {!within && (
                <div className="flex flex-col items-center gap-3">
                  <p className="type-overline text-fg-secondary">Try searching for</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <Chip key={s} href={`/search?q=${encodeURIComponent(s)}`}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className={cn("grid gap-4 lg:gap-6", state.view === "list" ? "grid-cols-1" : within ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-3")}>
              {hits.map((hit, i) => (
                <li key={hit.id}>
                  <ItemCard hit={hit} view={state.view} eager={i < 3} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={Math.min(state.page, totalPages)} totalPages={totalPages} href={(p) => hrefWith(base, state, { page: p })} />
        </section>
      </div>
    </div>
  )
}
