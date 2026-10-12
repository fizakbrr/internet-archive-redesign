import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AdvancedSearch } from "@/components/advanced-search"
import { buildAdvancedQuery, EMPTY_FIELDS, type AdvancedFields } from "@/lib/advanced-query"

export const metadata: Metadata = { title: "Advanced search" }

const first = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").slice(0, 500)

// Reads searchParams inside Suspense so the form itself stays in the static shell.
async function SubmitRedirect({ searchParams }: { searchParams: PageProps<"/search/advanced">["searchParams"] }) {
  const sp = await searchParams
  if (!sp.go) return null
  // The editable query wins; without JS it is empty, so build it from the fields here.
  const fields = Object.fromEntries(Object.keys(EMPTY_FIELDS).map((k) => [k, first(sp[k])])) as AdvancedFields
  const q = first(sp.query).trim() || buildAdvancedQuery(fields)
  redirect(q ? `/search?${new URLSearchParams({ q })}` : "/search/advanced")
}

export default function AdvancedSearchPage({ searchParams }: PageProps<"/search/advanced">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 lg:py-12">
      <Suspense>
        <SubmitRedirect searchParams={searchParams} />
      </Suspense>
      <div className="flex flex-col gap-1">
        <h1 className="type-h1">Advanced search</h1>
        <p className="type-body text-fg-secondary">Combine words, fields and dates. Every field is optional.</p>
      </div>
      <AdvancedSearch />
    </main>
  )
}
