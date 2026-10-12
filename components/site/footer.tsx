import { ChevronDown } from "lucide-react"
import { FOOTER_GROUPS } from "@/lib/nav"
import { Logo } from "./logo"

const linkClass = "inline-flex min-h-11 items-center type-body-sm text-fg-inverse hover:underline lg:min-h-7"

export function Footer() {
  return (
    <footer className="bg-inverse text-fg-inverse">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
          <div className="flex max-w-80 flex-col gap-3">
            <Logo className="self-start" />
            <p className="type-body-sm">
              A non-profit library of millions of free books, movies, software, music, websites, and more.
            </p>
          </div>
          {/* Columns on desktop; native disclosures on smaller screens. */}
          <div className="hidden grid-cols-4 gap-8 lg:grid">
            {FOOTER_GROUPS.map((g) => (
              <nav key={g.title} aria-label={g.title}>
                <h2 className="mb-2 type-overline">{g.title}</h2>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className={linkClass}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="lg:hidden">
            {FOOTER_GROUPS.map((g) => (
              <details key={g.title} className="group border-b border-line-inverse">
                <summary className="flex h-14 cursor-pointer list-none items-center justify-between type-label [&::-webkit-details-marker]:hidden">
                  {g.title}
                  <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="pb-3">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className={linkClass}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
        <p className="mt-12 type-caption">
          Unofficial redesign concept. Item data comes live from archive.org public APIs. Internet Archive and its logo
          are trademarks of the Internet Archive.
        </p>
      </div>
    </footer>
  )
}
