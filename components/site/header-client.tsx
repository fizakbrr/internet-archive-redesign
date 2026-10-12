"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "cn"
import { SearchBar } from "@/components/search-bar"
import { ARCHIVE_ORG, EXPLORE } from "@/lib/nav"

export function HeaderSearch() {
  const pathname = usePathname()
  const params = useSearchParams()
  if (pathname === "/" || (pathname === "/search" && !params.get("q"))) return null
  return (
    <SearchBar
      key={params.get("q") ?? ""}
      defaultValue={params.get("q") ?? ""}
      shortcut
      className="hidden w-full max-w-[520px] lg:flex"
    />
  )
}

export function NavRow() {
  const pathname = usePathname()
  const type = useSearchParams().get("mediatype")
  const active = EXPLORE.find((l) => (l.mediatype ? pathname === "/search" && type === l.mediatype : pathname === l.href))
  return <NavLinks active={active?.href ?? null} />
}

export function NavLinks({ active }: { active: string | null }) {
  return (
    <div className="mx-auto flex h-11 max-w-7xl items-stretch justify-between px-8">
      <ul className="flex items-stretch gap-2">
        {EXPLORE.map(({ label, href, Icon }) => (
          <li key={href} className="flex">
            <Link
              href={href}
              aria-current={active === href ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 px-3 type-label text-fg-secondary hover:text-fg",
                "aria-[current=page]:font-semibold aria-[current=page]:text-fg aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-inverse"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <ul className="flex items-stretch gap-2">
        <li className="flex">
          <a href={`${ARCHIVE_ORG}/about/`} className="flex items-center px-3 type-label text-fg-secondary hover:text-fg">
            About
          </a>
        </li>
        <li className="flex">
          <a href="https://help.archive.org" className="flex items-center px-3 type-label text-fg-secondary hover:text-fg">
            Help
          </a>
        </li>
      </ul>
    </div>
  )
}
