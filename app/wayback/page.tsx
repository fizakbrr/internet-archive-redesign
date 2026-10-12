import { ExternalLink, Search } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { cn } from "cn"
import { Bone } from "@/components/feedback/skeletons"
import { StatePanel } from "@/components/feedback/state-panel"
import { ErrorPanel } from "@/components/search-view"
import { buttonVariants } from "@/components/ui/button"
import { WaybackWordmark } from "@/components/wayback-wordmark"
import { formatNumber, plural } from "@/lib/format"
import { waybackUrl } from "@/lib/ia/urls"
import { getCaptures, getSparkline } from "@/lib/ia/wayback"
import { looksLikeUrl } from "@/lib/url"
import { daysInMonth, displayUrl, formatStampDay, formatStampFull, MONTHS, stampToDate } from "@/lib/wayback-time"

export const metadata: Metadata = { title: "Wayback Machine" }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""
const href = (url: string, year?: number, month?: number) =>
  `/wayback?${new URLSearchParams({ url, ...(year ? { year: String(year) } : {}), ...(month ? { month: String(month) } : {}) })}`

export default async function WaybackPage({ searchParams }: PageProps<"/wayback">) {
  const sp = await searchParams
  const url = first(sp.url).trim().slice(0, 2048)
  const valid = looksLikeUrl(url)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 lg:py-14">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1>
          <WaybackWordmark className="h-16 md:h-20" />
        </h1>
        <p className="type-body-lg text-fg-secondary">See how a web page looked in the past. More than 1 trillion pages saved since 1996.</p>
        <form action="/wayback" className="flex w-full max-w-2xl flex-col gap-1 text-left">
          <label htmlFor="wayback-url" className="type-label">
            Web address
          </label>
          <div className="flex gap-2">
            <input
              id="wayback-url"
              name="url"
              type="text"
              inputMode="url"
              defaultValue={url}
              placeholder="example.com"
              aria-invalid={url && !valid ? true : undefined}
              aria-describedby={url && !valid ? "wayback-url-error" : undefined}
              className="field-focus h-11 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3 type-body aria-invalid:border-danger"
            />
            <button type="submit" className={buttonVariants({ variant: "accent" })}>
              <Search />
              Look up
            </button>
          </div>
          {url && !valid && (
            <p id="wayback-url-error" className="type-body-sm text-danger">
              Enter a web address like example.com or https://example.com/page.
            </p>
          )}
        </form>
      </section>

      {valid && <Results url={url} year={Number(first(sp.year)) || undefined} month={Number(first(sp.month)) || undefined} />}
    </main>
  )
}

async function Results({ url, year: yearParam, month }: { url: string; year?: number; month?: number }) {
  const r = await getSparkline(url)
  if (!r.ok) return <ErrorPanel error={r.error} retryHref={href(url)} title="The Wayback Machine is unavailable" />
  const { years, first, last } = r.data
  const entries = Object.entries(years)
    .map(([y, months]) => ({ year: Number(y), months, total: months.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => a.year - b.year)
  const total = entries.reduce((n, e) => n + e.total, 0)
  const name = displayUrl(url)
  const saveHref = `https://web.archive.org/save/${url}`

  if (!total || !first || !last) {
    return (
      <StatePanel
        kind="search"
        title={`${name} has not been saved yet`}
        actions={
          <a href={saveHref} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
            <ExternalLink />
            Save it with Save Page Now
          </a>
        }
      >
        Check the spelling of the address, or save the page now. Saving needs a free archive.org account.
      </StatePanel>
    )
  }

  // Default to the most recent year so months show right away.
  const selected = entries.find((e) => e.year === yearParam) ?? [...entries].reverse().find((e) => e.total > 0)!
  const max = Math.max(...entries.map((e) => e.total))

  return (
    <>
      <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="type-h2 break-words">
            {name} has been saved {formatNumber(total)} times
          </h2>
          <p className="type-body text-fg-secondary">
            Between {formatStampDay(first)} and {formatStampDay(last)}. Most recent capture: {formatStampFull(last)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={waybackUrl(last, url)} className={buttonVariants()}>
            <ExternalLink />
            Open latest capture
          </a>
          <a href={waybackUrl(first, url)} className={buttonVariants({ variant: "secondary" })}>
            <ExternalLink />
            Open first capture
          </a>
        </div>
      </section>

      <section aria-labelledby="years-heading" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="years-heading" className="type-h3">
            Captures per year
          </h2>
          <p className="type-body-sm text-fg-secondary">Select a year to see months and days</p>
        </div>
        <ul className="flex h-40 items-stretch gap-0.5 overflow-x-auto md:gap-1">
          {entries.map((e, i) => {
            const on = e.year === selected.year
            return (
              <li key={e.year} className="flex min-w-3 flex-1">
                <Link
                  href={href(url, e.year)}
                  scroll={false}
                  aria-label={`${e.year}: ${plural(e.total, "capture")}${on ? ", selected" : ""}`}
                  aria-current={on ? "true" : undefined}
                  className="group flex flex-1 flex-col justify-end gap-1"
                >
                  <span className="flex flex-1 items-end">
                    {/* Square-root scale keeps the early, sparse years visible. */}
                    <span
                      className={cn("block min-h-0.5 w-full rounded-t-[2px]", on ? "bg-primary" : "bg-line group-hover:bg-line-strong")}
                      style={{ height: `${Math.sqrt(e.total / max) * 100}%` }}
                    />
                  </span>
                  <span className={cn("h-4 text-center type-caption text-fg-secondary", i % 5 && i !== entries.length - 1 && "invisible")}>{e.year}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="type-caption text-fg-muted">Bar height uses a square-root scale so early years stay visible.</p>
      </section>

      <section aria-labelledby="months-heading" className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 md:p-6">
        <h2 id="months-heading" className="type-h3">
          {selected.year}: {plural(selected.total, "capture")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MONTHS.map((m, i) => {
            const n = selected.months[i] ?? 0
            const on = month === i + 1 && n > 0
            const body = (
              <>
                <span className="type-label">{m}</span>
                <span className="type-caption text-fg-muted">{n ? plural(n, "capture") : "No captures"}</span>
              </>
            )
            return (
              <li key={m}>
                {n ? (
                  <Link
                    href={href(url, selected.year, i + 1)}
                    scroll={false}
                    aria-current={on ? "true" : undefined}
                    className={cn("flex min-h-11 flex-col rounded-md border p-3 hover:bg-sunken", on ? "border-2 border-inverse p-[11px]" : "border-line")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-11 flex-col rounded-md border border-line-subtle p-3 text-fg-disabled">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
        {month && (selected.months[month - 1] ?? 0) > 0 && (
          <Suspense key={`${selected.year}-${month}`} fallback={<DaysSkeleton />}>
            <Days url={url} year={selected.year} month={month} />
          </Suspense>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <h2 className="type-h4">Want to save a page now?</h2>
          <p className="type-body-sm text-fg-secondary">Save Page Now runs on web.archive.org and needs a free archive.org account.</p>
        </div>
        <a href={saveHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
          <ExternalLink />
          Save Page Now
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </section>
    </>
  )
}

function DaysSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading days</span>
      <Bone className="h-6 w-48" />
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-10 lg:grid-cols-[repeat(16,minmax(0,1fr))]">
        {Array.from({ length: 31 }, (_, i) => (
          <Bone key={i} className="h-11 rounded-md" />
        ))}
      </div>
    </div>
  )
}

/** Day level from CDX (slow, so it streams in). Filled days link to that day's first capture. */
async function Days({ url, year, month }: { url: string; year: number; month: number }) {
  const mm = String(month).padStart(2, "0")
  const r = await getCaptures(url, `${year}${mm}01`, `${year}${mm}${daysInMonth(year, month)}`)
  const title = `${MONTHS[month - 1]} ${year}: choose a day`
  if (!r.ok) {
    return (
      <p role="alert" className="type-body-sm text-fg-secondary">
        Day-by-day captures could not be loaded right now (the capture index is busy).{" "}
        <a href={`https://web.archive.org/web/${year}${mm}*/${url}`} className="underline">
          Browse {MONTHS[month - 1]} {year} on web.archive.org
        </a>
        .
      </p>
    )
  }
  const byDay = new Map(r.data.map((c) => [stampToDate(c.timestamp).getUTCDate(), c.timestamp]))
  return (
    <div className="flex flex-col gap-3">
      <h3 className="type-h4">{title}</h3>
      <ul className="grid grid-cols-7 gap-2 sm:grid-cols-10 lg:grid-cols-[repeat(16,minmax(0,1fr))]">
        {Array.from({ length: daysInMonth(year, month) }, (_, i) => {
          const d = i + 1
          const stamp = byDay.get(d)
          return (
            <li key={d}>
              {stamp ? (
                <a
                  href={waybackUrl(stamp, url)}
                  aria-label={`${MONTHS[month - 1]} ${d}, ${year}: open capture`}
                  className="flex h-11 items-center justify-center rounded-md bg-inverse type-label text-fg-inverse hover:bg-line-inverse"
                >
                  {d}
                </a>
              ) : (
                <span aria-label={`${MONTHS[month - 1]} ${d}: no capture`} className="flex h-11 items-center justify-center rounded-md border border-line-subtle type-label text-fg-disabled">
                  {d}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="type-caption text-fg-muted">Filled days have captures. Times are UTC.</p>
    </div>
  )
}
