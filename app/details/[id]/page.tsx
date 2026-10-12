import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CollectionView } from "@/components/collection/collection-view"
import { ItemView } from "@/components/item/item-view"
import { ErrorPanel } from "@/components/search-view"
import { htmlToText } from "@/lib/html"
import { getItem } from "@/lib/ia/metadata"
import { thumbnailUrl } from "@/lib/ia/urls"
import { parseSearch } from "@/lib/search-params"

export async function generateMetadata({ params }: PageProps<"/details/[id]">): Promise<Metadata> {
  const { id } = await params
  const r = await getItem(decodeURIComponent(id))
  if (!r.ok) return { title: "Item" }
  const description = r.data.description ? htmlToText(r.data.description).slice(0, 160) : undefined
  return {
    title: r.data.title,
    description,
    openGraph: { title: r.data.title, description, images: [thumbnailUrl(r.data.id)] },
  }
}

export default async function DetailsPage({ params, searchParams }: PageProps<"/details/[id]">) {
  const id = decodeURIComponent((await params).id)
  const r = await getItem(id)
  if (!r.ok && r.error.kind === "not_found") notFound()
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 lg:py-8">
      {!r.ok ? (
        <ErrorPanel error={r.error} retryHref={`/details/${encodeURIComponent(id)}`} title="This item could not be loaded" />
      ) : r.data.mediatype === "collection" ? (
        <CollectionView item={r.data} state={parseSearch(await searchParams)} />
      ) : (
        <ItemView item={r.data} />
      )}
    </main>
  )
}
