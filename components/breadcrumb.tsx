import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

export type Crumb = { label: string; href?: string }

/** Desktop: full trail. Mobile: a back link to the parent only. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const parent = [...items].reverse().find((c) => c.href)
  return (
    <nav aria-label="Breadcrumb" className="flex min-h-11 items-center type-body-sm">
      <ol className="hidden flex-wrap items-center gap-1 md:flex">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-4 text-fg-muted" aria-hidden="true" />}
            {c.href ? (
              <Link href={c.href} className="underline hover:text-fg-secondary">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 text-fg-secondary">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      {parent && (
        <Link href={parent.href!} className="flex min-h-11 items-center gap-1 underline md:hidden">
          <ChevronLeft className="size-4" aria-hidden="true" />
          {parent.label}
        </Link>
      )}
    </nav>
  )
}
