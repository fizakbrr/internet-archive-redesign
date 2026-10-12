import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { pageList } from "@/lib/pagination"

const box = "inline-flex h-11 min-w-11 items-center justify-center rounded-md px-3 type-label"

export function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  if (totalPages <= 1) return null
  const prev = page > 1 ? href(page - 1) : null
  const next = page < totalPages ? href(page + 1) : null
  const edge = (to: string | null, dir: "prev" | "next", compact: boolean) => {
    const Icon = dir === "prev" ? ChevronLeft : ChevronRight
    const text = dir === "prev" ? "Previous" : "Next"
    const content = (
      <>
        {dir === "prev" && <Icon className="size-5" aria-hidden="true" />}
        <span className={cn(compact && "sr-only")}>{text}</span>
        {dir === "next" && <Icon className="size-5" aria-hidden="true" />}
      </>
    )
    const cls = compact ? buttonVariants({ variant: "secondary", size: "icon" }) : cn(box, "gap-1 hover:bg-sunken")
    return to ? (
      <Link href={to} rel={dir} className={cls}>
        {content}
      </Link>
    ) : (
      <span aria-disabled="true" className={cn(cls, "pointer-events-none border-line text-fg-disabled")}>
        {content}
      </span>
    )
  }

  return (
    <nav aria-label="Pagination" className="flex justify-center">
      <ul className="hidden items-center gap-1 md:flex">
        <li>{edge(prev, "prev", false)}</li>
        {pageList(page, totalPages).map((p, i) => (
          <li key={i}>
            {p === "gap" ? (
              <span className="px-1 text-fg-muted" aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(box, p === page ? "bg-primary text-on-primary" : "hover:bg-sunken")}
              >
                {formatNumber(p)}
              </Link>
            )}
          </li>
        ))}
        <li>{edge(next, "next", false)}</li>
      </ul>
      <div className="flex w-full items-center justify-between gap-4 md:hidden">
        {edge(prev, "prev", true)}
        <p className="type-label">
          Page {formatNumber(page)} of {formatNumber(totalPages)}
        </p>
        {edge(next, "next", true)}
      </div>
    </nav>
  )
}
