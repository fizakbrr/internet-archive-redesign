import { Check, X } from "lucide-react"
import Link from "next/link"
import { cn } from "cn"

/** Pill link. Selected = yellow with a check; removable = yellow with an x. */
export function Chip({
  href,
  children,
  selected,
  removable,
  label,
  className,
}: {
  href: string
  children: React.ReactNode
  selected?: boolean
  removable?: boolean
  /** Accessible name when the visible text needs context, e.g. "Remove filter: Video". */
  label?: string
  className?: string
}) {
  const on = selected || removable
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 type-label whitespace-nowrap transition-colors duration-150 lg:h-9",
        on ? "border-transparent bg-primary text-on-primary hover:bg-primary-hover" : "border-line-strong bg-surface text-fg hover:bg-secondary-hover",
        className
      )}
    >
      {selected && <Check className="size-4" aria-hidden="true" />}
      {children}
      {removable && <X className="size-4" aria-hidden="true" />}
    </Link>
  )
}
