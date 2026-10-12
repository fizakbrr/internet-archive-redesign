import { CircleAlert, Search, WifiOff, Ban, type LucideIcon } from "lucide-react"
import { cn } from "cn"

const ICONS: Record<"search" | "error" | "offline" | "unavailable", { Icon: LucideIcon; className: string }> = {
  search: { Icon: Search, className: "bg-sunken text-fg" },
  // White on red uses text/inverse (on-primary is ink, for yellow only).
  error: { Icon: CircleAlert, className: "bg-danger text-fg-inverse" },
  offline: { Icon: WifiOff, className: "bg-sunken text-fg" },
  unavailable: { Icon: Ban, className: "bg-sunken text-fg" },
}

/** Empty, error, offline and unavailable states. Always offers a next step. */
export function StatePanel({
  kind,
  title,
  children,
  actions,
  headingLevel = 2,
  className,
}: {
  kind: keyof typeof ICONS
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
  headingLevel?: 1 | 2
  className?: string
}) {
  const { Icon, className: iconClass } = ICONS[kind]
  const H = `h${headingLevel}` as const
  return (
    <div role={kind === "error" ? "alert" : undefined} className={cn("mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-line bg-surface px-6 py-8 text-center", className)}>
      <span className={cn("flex size-16 items-center justify-center rounded-full", iconClass)}>
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <H className="type-h3">{title}</H>
      {children && <div className="type-body text-fg-secondary">{children}</div>}
      {actions && <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  )
}
