"use client"

import { Check, Search } from "lucide-react"
import Form from "next/form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef } from "react"
import { ClearButton } from "@/components/search-bar"
import { Button } from "@/components/ui/button"
import { looksLikeUrl } from "@/lib/url"

const SCOPES = [
  { value: "metadata", label: "Everything" },
  { value: "fts", label: "Text contents" },
  { value: "tvs", label: "TV captions" },
  { value: "rcs", label: "Radio transcripts" },
  { value: "wayback", label: "Wayback Machine" },
]

/** Hero search: one input plus scope chips (radio buttons). Wayback scope or a pasted URL goes to /wayback. */
export function HeroSearch() {
  const router = useRouter()
  const ref = useRef<HTMLFormElement>(null)
  return (
    <Form
      ref={ref}
      action="/search"
      role="search"
      className="flex w-full max-w-3xl flex-col items-center gap-4"
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget)
        const q = String(data.get("q") ?? "").trim()
        if (data.get("scope") === "wayback" || looksLikeUrl(q)) {
          e.preventDefault()
          router.push(`/wayback${q ? `?url=${encodeURIComponent(q)}` : ""}`)
        }
      }}
    >
      <div className="flex h-15 w-full items-center gap-2 rounded-lg border border-line-strong bg-surface p-1 pl-4 has-focus-visible:border-2 has-focus-visible:border-focus has-focus-visible:pl-[15px]">
        <Search className="size-5 shrink-0 text-fg-secondary" aria-hidden="true" />
        <label htmlFor="hero-q" className="sr-only">
          Search the Archive
        </label>
        <input
          id="hero-q"
          name="q"
          type="search"
          placeholder="Search books, films, music, software and web pages"
          className="peer h-full min-w-0 flex-1 bg-transparent type-body-lg outline-none placeholder:text-fg-muted"
        />
        <ClearButton />
        <Button type="submit" variant="accent" className="h-12 shrink-0">
          <Search className="max-sm:hidden" />
          Search
        </Button>
      </div>
      <fieldset className="flex flex-wrap justify-center gap-2">
        <legend className="sr-only">Search in</legend>
        {SCOPES.map((s) => (
          <label key={s.value} className="relative">
            <input type="radio" name="scope" value={s.value} defaultChecked={s.value === "metadata"} className="peer sr-only" />
            <span className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 type-label transition-colors peer-checked:border-transparent peer-checked:bg-primary peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus hover:bg-secondary-hover peer-checked:hover:bg-primary-hover lg:h-9 [&>svg]:hidden peer-checked:[&>svg]:block">
              <Check className="size-4" aria-hidden="true" />
              {s.label}
            </span>
          </label>
        ))}
        <Link href="/search/advanced" className="inline-flex h-11 items-center px-2 type-label underline lg:h-9">
          Advanced search
        </Link>
      </fieldset>
    </Form>
  )
}
