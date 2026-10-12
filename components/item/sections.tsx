import { ArrowRight, ChevronDown, ChevronRight, Download, FileText, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import type { DownloadOption } from "@/lib/downloads"
import { formatBytes, formatDate, formatNumber } from "@/lib/format"
import type { Item, Review } from "@/lib/ia/metadata"
import { downloadUrl, thumbnailUrl } from "@/lib/ia/urls"
import { mediaInfo } from "@/lib/media"

export function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-lg border border-line bg-surface p-5", className)}>
      <h2 className="type-h3">{title}</h2>
      {children}
    </section>
  )
}

export function DownloadCard({
  id,
  mediatype,
  options,
  fileCount,
  size,
}: {
  id: string
  mediatype: string
  options: DownloadOption[]
  fileCount: number
  size?: number
}) {
  return (
    <Card title="Download">
      <p className="type-body-sm text-fg-secondary">Free to download. Choose a format:</p>
      <ul className="flex flex-col gap-3">
        {options.slice(0, 5).map((o, i) => {
          const Icon = i === 0 ? mediaInfo(mediatype).Icon : FileText
          return (
            <li
              key={o.label}
              className={cn("flex items-center gap-3 rounded-md border bg-surface p-3", i === 0 ? "border-2 border-inverse" : "border-line")}
            >
              <Icon className="size-5 shrink-0 text-fg-secondary" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="flex flex-wrap items-center gap-x-2 type-label">
                  {o.label}
                  {i === 0 && <span className="type-label-sm text-fg-secondary">Recommended</span>}
                </p>
                <p className="truncate type-mono text-fg-muted">
                  {o.detail} · {formatBytes(o.size)}
                </p>
              </div>
              <a href={o.href} className={buttonVariants({ variant: "secondary", size: "icon" })} aria-label={`Download ${o.label}, ${formatBytes(o.size)}`}>
                <Download />
              </a>
            </li>
          )
        })}
      </ul>
      <a href={`https://archive.org/download/${encodeURIComponent(id)}`} className="inline-flex min-h-11 items-center gap-1 type-label underline">
        All {formatNumber(fileCount)} files{size ? ` (${formatBytes(size)})` : ""}
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
    </Card>
  )
}

export function AtAGlance({ stats }: { stats: { value: string; label: string }[] }) {
  if (!stats.length) return null
  return (
    <Card title="At a glance">
      <dl className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse">
            <dt className="type-caption text-fg-muted">{s.label}</dt>
            <dd className="font-serif text-2xl font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export type CollectionSummary = { id: string; title: string; count?: number }

export function CollectionsCard({ collections }: { collections: CollectionSummary[] }) {
  if (!collections.length) return null
  return (
    <Card title="In collections">
      <ul className="flex flex-col gap-3">
        {collections.map((c) => (
          <li key={c.id}>
            <Link
              href={`/details/${encodeURIComponent(c.id)}`}
              className="flex min-h-11 items-center gap-3 rounded-md border border-line p-2 transition-shadow hover:shadow-raised"
            >
              <Image src={thumbnailUrl(c.id)} alt="" width={56} height={56} unoptimized className="size-14 shrink-0 rounded-sm bg-inverse object-cover" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-2 type-label">{c.title}</span>
                {c.count !== undefined && <span className="type-caption text-fg-muted">{formatNumber(c.count)} items</span>}
              </span>
              <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export type DetailRow = { label: string; value: React.ReactNode }

export function DetailsList({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="divide-y divide-line-subtle border-y border-line-subtle">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-1 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
          <dt className="type-body-sm text-fg-secondary">{r.label}</dt>
          <dd className="type-body break-words">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RawMetadata({ raw }: { raw: Item["raw"] }) {
  return (
    <details className="group">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 type-label underline [&::-webkit-details-marker]:hidden">
        Show all metadata ({raw.length} fields)
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <dl className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
        {raw.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
            <dt className="type-mono text-fg-secondary">{k}</dt>
            <dd className="type-body-sm break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

function Stars({ n }: { n?: number }) {
  if (!n) return null
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-4", i < n ? "fill-current text-fg" : "text-line-strong")} aria-hidden="true" />
      ))}
    </span>
  )
}

export function Reviews({ reviews, id }: { reviews: Review[]; id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <a
        href={`https://archive.org/write-review.php?identifier=${encodeURIComponent(id)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "secondary", className: "self-start" })}
      >
        Write a review on archive.org
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      {reviews.length === 0 ? (
        <p className="type-body text-fg-secondary">No reviews yet.</p>
      ) : (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          {reviews.map((r, i) => (
            <li key={i} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <Stars n={r.stars} />
                <h3 className="type-h4">{r.title || "Untitled review"}</h3>
              </div>
              <p className="type-body whitespace-pre-line">{r.body}</p>
              <p className="type-caption text-fg-muted">
                {r.reviewer}
                {r.date && ` · ${formatDate(r.date)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FilesTable({ id, files }: { id: string; files: Item["files"] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[520px] text-left">
        <caption className="sr-only">All files in this item</caption>
        <thead className="bg-sunken type-label-sm text-fg-secondary">
          <tr>
            <th scope="col" className="px-3 py-2">File</th>
            <th scope="col" className="px-3 py-2">Format</th>
            <th scope="col" className="px-3 py-2 text-right">Size</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle type-body-sm">
          {files.map((f) => (
            <tr key={f.name}>
              <td className="max-w-80 px-3 py-2">
                <a href={downloadUrl(id, f.name)} className="break-all underline">
                  {f.name}
                </a>
              </td>
              <td className="px-3 py-2 text-fg-secondary">{f.format}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap text-fg-secondary">{f.size !== undefined ? formatBytes(f.size) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
