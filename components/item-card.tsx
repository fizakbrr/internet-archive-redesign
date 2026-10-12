import { Eye, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "cn"
import { MediaIcon } from "@/components/media-icon"
import { availabilityOf } from "@/lib/availability"
import { compactNumber } from "@/lib/format"
import type { Hit } from "@/lib/ia/search"
import { thumbnailUrl } from "@/lib/ia/urls"

/** Full-text snippet with {{{matches}}} shown in semibold (no tinted highlight). */
function Snippet({ text }: { text: string }) {
  return (
    <p className="line-clamp-3 type-body-sm text-fg-secondary">
      {text.split(/\{\{\{|\}\}\}/).map((part, i) => (i % 2 ? <strong key={i} className="font-semibold text-fg">{part}</strong> : part))}
    </p>
  )
}

export function ItemCard({
  hit,
  view = "grid",
  headingLevel = 3,
  eager,
}: {
  hit: Hit
  view?: "grid" | "list"
  headingLevel?: 2 | 3
  /** Above-the-fold cards: load the thumbnail right away (LCP). */
  eager?: boolean
}) {
  const H = `h${headingLevel}` as const
  const byline = [hit.creators.slice(0, 2).join(", ") || "Unknown creator", hit.year].filter(Boolean).join(" · ")
  const list = view === "list"
  return (
    <article
      className={cn(
        "relative flex overflow-hidden rounded-lg border border-line bg-surface card-focus transition-shadow duration-150 hover:shadow-raised",
        list ? "flex-row" : "h-full flex-col"
      )}
    >
      <div className={cn("relative shrink-0 bg-inverse", list ? "w-28 sm:w-44" : "aspect-[3/2] w-full")}>
        <Image src={thumbnailUrl(hit.id)} alt="" fill unoptimized loading={eager ? "eager" : "lazy"} sizes="(min-width: 1024px) 280px, 100vw" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="relative z-10 flex items-center gap-3 type-label-sm font-semibold text-fg-secondary">
          <MediaIcon type={hit.mediatype} />
          <span>{availabilityOf(hit)}</span>
        </div>
        <H className={cn("type-h4", !list && "line-clamp-2 min-h-[52px]")}>
          {/* Stretched link: the whole card is one link target; the media icon sits above it. */}
          <Link href={`/details/${encodeURIComponent(hit.id)}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {hit.title}
          </Link>
        </H>
        <p className="line-clamp-1 type-body-sm text-fg-secondary">{byline}</p>
        {hit.snippets[0] && <Snippet text={hit.snippets[0]} />}
        {(hit.downloads !== undefined || !!hit.favorites) && (
          <p className="mt-auto flex items-center gap-4 type-caption text-fg-muted">
            {hit.downloads !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Eye className="size-4" aria-hidden="true" />
                {compactNumber(hit.downloads)}
                <span className="sr-only">views</span>
              </span>
            )}
            {!!hit.favorites && (
              <span className="inline-flex items-center gap-1">
                <Heart className="size-4" aria-hidden="true" />
                {compactNumber(hit.favorites)}
                <span className="sr-only">favorites</span>
              </span>
            )}
          </p>
        )}
      </div>
    </article>
  )
}
