import Link from "next/link"
import { cn } from "cn"
import { formatNumber } from "@/lib/format"
import type { Bucket } from "@/lib/ia/search"
import { toDecades } from "@/lib/decades"
import { hrefWith, type SearchState } from "@/lib/search-params"

/** Each bar is a link that filters to its decade; works without JS. */
export function DecadeChart({ base, state, years }: { base: string; state: SearchState; years: Bucket[] }) {
  // Very long spans become unreadable; keep the most recent 16 decades.
  const decades = toDecades(years).slice(-16)
  if (decades.length < 2) return null
  const max = Math.max(...decades.map((d) => d.count))
  const selected = (d: number) => state.from !== undefined && state.to !== undefined && d + 9 >= state.from && d <= state.to
  const label =
    state.from !== undefined && state.to !== undefined
      ? `${Math.floor(state.from / 10) * 10}s${Math.floor(state.to / 10) !== Math.floor(state.from / 10) ? ` to ${Math.floor(state.to / 10) * 10}s` : ""} selected`
      : null

  return (
    <section aria-labelledby="decades-heading" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="decades-heading" className="type-h4">
          Browse by decade
        </h2>
        {label && (
          <p className="flex items-center gap-2 type-body-sm text-fg-secondary">
            {label}
            <Link href={hrefWith(base, state, { from: undefined, to: undefined })} scroll={false} className="flex min-h-11 items-center px-1 type-label text-fg underline">
              Clear
            </Link>
          </p>
        )}
      </div>
      <ul className="flex h-36 items-stretch gap-1 overflow-x-auto md:gap-2">
        {decades.map(({ decade, count }) => {
          const on = selected(decade)
          const isOnly = on && state.from === decade && state.to === decade + 9
          return (
            <li key={decade} className="flex min-w-10 flex-1">
              <Link
                href={hrefWith(base, state, isOnly ? { from: undefined, to: undefined } : { from: decade, to: decade + 9 })}
                scroll={false}
                aria-label={`${decade}s, ${formatNumber(count)} items${on ? ", selected" : ""}`}
                aria-current={on ? "true" : undefined}
                className="group flex flex-1 flex-col justify-end gap-2"
              >
                <span className="flex flex-1 items-end">
                  <span
                    className={cn("block min-h-0.5 w-full rounded-t-sm transition-colors", on ? "bg-primary" : "bg-line group-hover:bg-line-strong")}
                    style={{ height: `${(count / max) * 100}%` }}
                  />
                </span>
                <span className="text-center type-caption text-fg-secondary">{decade}s</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
