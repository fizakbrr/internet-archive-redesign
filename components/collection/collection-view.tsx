import Image from "next/image"
import { Breadcrumb } from "@/components/breadcrumb"
import { CollectionCard } from "@/components/collection-card"
import { FavoriteButton, ShareButton } from "@/components/item/item-actions"
import { ItemTabs } from "@/components/item/item-tabs"
import { toHit } from "@/components/item/item-view"
import { DetailsList, RawMetadata } from "@/components/item/sections"
import { SearchView } from "@/components/search-view"
import { formatDate, formatNumber } from "@/lib/format"
import { htmlToText } from "@/lib/html"
import { getItem, type Item } from "@/lib/ia/metadata"
import { count, search, yearBuckets, type SearchInput } from "@/lib/ia/search"
import { thumbnailUrl } from "@/lib/ia/urls"
import type { SearchState } from "@/lib/search-params"
import { DecadeChart } from "./decade-chart"

const base = (input: Partial<SearchInput>): SearchInput => ({ q: "", scope: "metadata", filters: {}, sort: "relevance", page: 1, rows: 24, ...input })

export async function CollectionView({ item, state }: { item: Item; state: SearchState }) {
  const path = `/details/${encodeURIComponent(item.id)}`
  const parentId = item.collections.find((c) => !c.startsWith("fav-"))
  const [total, parent, subs, years] = await Promise.all([
    count(base({ within: item.id })),
    parentId ? getItem(parentId) : null,
    search(base({ within: item.id, filters: { mediatype: ["collection"] }, rows: 24 })),
    yearBuckets(base({ within: item.id })),
  ])
  const itemCount = total?.ok ? total.data : undefined
  const parentTitle = parent?.ok ? parent.data.title : undefined
  const subcollections = subs?.ok ? subs.data.hits : []
  const description = item.description ? htmlToText(item.description) : ""
  const summary = description.split("\n")[0]

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/search?mediatype=collection" },
          ...(parentId && parentTitle ? [{ label: parentTitle, href: `/details/${encodeURIComponent(parentId)}` }] : []),
          { label: item.title },
        ]}
      />

      <header className="flex flex-col gap-6 md:flex-row md:items-center">
        <Image
          src={thumbnailUrl(item.id)}
          alt=""
          width={160}
          height={160}
          unoptimized
          loading="eager"
          className="size-28 shrink-0 rounded-lg bg-inverse object-cover md:size-40"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="type-overline text-fg-secondary">Collection</p>
          <h1 className="type-display break-words">{item.title}</h1>
          {summary && <p className="line-clamp-3 max-w-3xl type-body-lg text-fg-secondary">{summary}</p>}
          <p className="type-body-sm text-fg-muted">
            {[itemCount !== undefined && `${formatNumber(itemCount)} items`, parentTitle && `Part of ${parentTitle}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-3">
          <FavoriteButton hit={toHit(item)} />
          <ShareButton title={item.title} />
        </div>
      </header>

      <ItemTabs
        tabs={[
          {
            value: "items",
            label: "Items",
            content: (
              <SearchView
                base={path}
                state={state}
                within={item.id}
                withinTitle={item.title}
                extra={years?.ok && !state.q ? <DecadeChart base={path} state={state} years={years.data} /> : null}
              />
            ),
          },
          ...(subcollections.length
            ? [
                {
                  value: "subcollections",
                  label: `Subcollections (${formatNumber(subs?.ok ? subs.data.total : subcollections.length)})`,
                  content: (
                    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
                      {subcollections.map((c) => (
                        <li key={c.id}>
                          <CollectionCard id={c.id} title={c.title} count={c.itemCount} />
                        </li>
                      ))}
                    </ul>
                  ),
                },
              ]
            : []),
          {
            value: "about",
            label: "About",
            content: (
              <div className="flex max-w-3xl flex-col gap-6">
                {description && <p className="type-body-lg whitespace-pre-line">{description}</p>}
                <DetailsList
                  rows={[
                    ...(item.addeddate ? [{ label: "Created", value: formatDate(item.addeddate) }] : []),
                    { label: "Identifier", value: <span className="type-mono">{item.id}</span> },
                  ]}
                />
                <RawMetadata raw={item.raw} />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
