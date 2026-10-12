import Link from "next/link"
import { cn } from "cn"

// Stand-in temple mark from the Figma Logo component; swap for the official SVG in production.
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex min-h-11 items-center gap-3", className)}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M12 0 24 5H0z" />
        <path d="M1 6h22v2H1zM3 9h3v11H3zm5 0h3v11H8zm5 0h3v11h-3zm5 0h3v11h-3zM1 21h22v3H1z" />
      </svg>
      <span className="font-serif text-[13px] leading-[13px] font-semibold tracking-[0.12em]">
        INTERNET
        <br />
        ARCHIVE
      </span>
      <span className="sr-only">, home</span>
    </Link>
  )
}
