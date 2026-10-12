import type { Metadata } from "next"
import { SearchView } from "@/components/search-view"
import { parseSearch } from "@/lib/search-params"

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = parseSearch(await searchParams)
  return { title: q ? `Results for “${q}”` : "Search", robots: { index: false } }
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const state = parseSearch(await searchParams)
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:py-12">
      <SearchView base="/search" state={state} />
    </main>
  )
}
