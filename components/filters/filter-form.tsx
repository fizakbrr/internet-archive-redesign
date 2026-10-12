"use client"

import { Check, ChevronDown } from "lucide-react"
import Form from "next/form"
import { useId, useRef } from "react"
import { cn } from "cn"
import { formatNumber } from "@/lib/format"
import { mediaInfo } from "@/lib/media"
import { AVAILABILITY, type ListFacet, type SearchState } from "@/lib/search-params"

export type FacetData = {
  buckets: Partial<Record<ListFacet, { key: string; count: number }[]>>
  years: { key: string; count: number }[]
  availCounts: Partial<Record<string, number>>
  collectionTitles: Record<string, string>
}

const GROUPS: { facet: ListFacet; title: string; open: boolean }[] = [
  { facet: "mediatype", title: "Media type", open: true },
  { facet: "language", title: "Language", open: true },
  { facet: "subject", title: "Subject", open: false },
  { facet: "collection", title: "Collection", open: false },
  { facet: "creator", title: "Creator", open: false },
]
const VISIBLE = 4

type Option = { name: string; value: string; label: string; count: number | undefined; checked: boolean }

function OptionRow({ o }: { o: Option }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 type-body-sm hover:bg-sunken lg:min-h-10">
      <span className="relative flex size-5 shrink-0">
        <input
          type="checkbox"
          name={o.name}
          value={o.value}
          defaultChecked={o.checked}
          className="peer size-5 cursor-pointer appearance-none rounded-sm border-2 border-line-strong bg-surface checked:border-inverse checked:bg-inverse"
        />
        <Check className="pointer-events-none absolute inset-0.5 hidden size-4 text-fg-inverse peer-checked:block" strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{o.label}</span>
      {o.count !== undefined && <span className="type-caption text-fg-muted">{formatNumber(o.count)}</span>}
    </label>
  )
}

function Group({ title, open, options }: { title: string; open: boolean; options: Option[] }) {
  if (!options.length) return null
  // Checked options always stay visible, even past the "Show more" fold.
  const shown = options.filter((o, i) => i < VISIBLE || o.checked)
  const more = options.filter((o, i) => i >= VISIBLE && !o.checked)
  return (
    <details open={open} className="group/g border-b border-line-subtle py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between type-h4 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-5 transition-transform group-open/g:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-2">
        {shown.map((o) => (
          <OptionRow key={o.value} o={o} />
        ))}
        {more.length > 0 && (
          <details className="group/m">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 px-2 type-label underline [&::-webkit-details-marker]:hidden">
              <span className="group-open/m:hidden">Show {more.length} more</span>
              <span className="hidden group-open/m:inline">Show fewer</span>
              <ChevronDown className="size-4 transition-transform group-open/m:rotate-180" aria-hidden="true" />
            </summary>
            {more.map((o) => (
              <OptionRow key={o.value} o={o} />
            ))}
          </details>
        )}
      </div>
    </details>
  )
}

function YearGroup({ state, years }: { state: SearchState; years: FacetData["years"] }) {
  const id = useId()
  const bars = years.map((b) => ({ year: Number(b.key), count: b.count })).filter((b) => b.year > 0).sort((a, b) => a.year - b.year)
  const max = Math.max(1, ...bars.map((b) => b.count))
  const inRange = (y: number) => (state.from === undefined || y >= state.from) && (state.to === undefined || y <= state.to)
  const hasRange = state.from !== undefined || state.to !== undefined
  return (
    <details open className="group/g border-b border-line-subtle py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between type-h4 [&::-webkit-details-marker]:hidden">
        Year
        <ChevronDown className="size-5 transition-transform group-open/g:rotate-180" aria-hidden="true" />
      </summary>
      {bars.length > 1 && (
        // Decorative: the From/To fields below are the control. Bars are the most common years, not every year.
        <div className="flex h-12 items-end gap-0.5 px-1 pt-2" aria-hidden="true">
          {bars.map((b) => (
            <div
              key={b.year}
              className={cn("min-h-0.5 flex-1 rounded-t-[1px]", hasRange && inRange(b.year) ? "bg-primary" : "bg-line")}
              style={{ height: `${(b.count / max) * 100}%` }}
            />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 px-1 pt-3 pb-3">
        {(["from", "to"] as const).map((k) => (
          <div key={k} className="flex flex-col gap-1">
            <label htmlFor={`${id}-${k}`} className="type-label-sm text-fg-secondary">
              {k === "from" ? "From" : "To"}
            </label>
            <input
              id={`${id}-${k}`}
              name={k}
              type="text"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              defaultValue={state[k]}
              placeholder={k === "from" ? String(bars[0]?.year ?? "") : String(bars.at(-1)?.year ?? "")}
              className="field-focus h-11 w-full rounded-md border border-line-strong bg-surface px-3 type-body placeholder:text-fg-muted"
            />
          </div>
        ))}
      </div>
    </details>
  )
}

/**
 * The filter rail as a GET form: works without JS through the submit button.
 * With autoApply (desktop rail) each checkbox change submits at once.
 */
export function FilterForm({
  action,
  state,
  data,
  autoApply,
  footer,
}: {
  action: string
  state: SearchState
  data: FacetData
  autoApply?: boolean
  footer?: React.ReactNode
}) {
  const ref = useRef<HTMLFormElement>(null)
  const labelFor = (facet: ListFacet, key: string) =>
    facet === "mediatype" ? mediaInfo(key).plural : facet === "collection" ? data.collectionTitles[key] ?? key : key

  const options = (facet: ListFacet): Option[] => {
    const buckets = data.buckets[facet] ?? []
    const selected = state.filters[facet]
    const rows: Option[] = buckets.map((b) => ({ name: facet, value: b.key, label: labelFor(facet, b.key), count: b.count, checked: selected.includes(b.key) }))
    // A selected value can drop out of the top buckets; keep it so it can be unchecked.
    for (const v of selected) if (!buckets.some((b) => b.key === v)) rows.unshift({ name: facet, value: v, label: labelFor(facet, v), count: undefined, checked: true })
    return rows
  }

  return (
    <Form
      ref={ref}
      action={action}
      scroll={false}
      onSubmit={(e) => {
        // Leave empty fields (an unset year) out of the URL.
        const empty = [...e.currentTarget.querySelectorAll<HTMLInputElement>("input[name]")].filter((el) => !el.value)
        for (const el of empty) el.disabled = true
        // FormData is read synchronously after this handler; re-enable for the next edit.
        setTimeout(() => empty.forEach((el) => (el.disabled = false)))
      }}
      onChange={(e) => {
        if (autoApply && e.target instanceof HTMLInputElement && e.target.type === "checkbox") ref.current?.requestSubmit()
      }}
      className="flex flex-col"
    >
      {state.q && <input type="hidden" name="q" value={state.q} />}
      {state.scope !== "metadata" && <input type="hidden" name="scope" value={state.scope} />}
      {state.sort !== "relevance" && <input type="hidden" name="sort" value={state.sort} />}
      {state.view !== "grid" && <input type="hidden" name="view" value={state.view} />}

      <Group
        title="Availability"
        open
        options={AVAILABILITY.map((a) => ({ name: "avail", value: a.value, label: a.label, count: data.availCounts[a.value], checked: state.avail.includes(a.value) }))}
      />
      <Group {...GROUPS[0]} options={options("mediatype")} />
      <YearGroup state={state} years={data.years} />
      {GROUPS.slice(1).map((g) => (
        <Group key={g.facet} {...g} options={options(g.facet)} />
      ))}

      {footer ?? (
        // Applies the year fields (and everything else without JS).
        <button type="submit" className={cn("mt-4 h-11 rounded-md border border-line-strong bg-surface type-label hover:bg-secondary-hover", autoApply && "sr-only focus:not-sr-only")}>
          Apply filters
        </button>
      )}
    </Form>
  )
}
