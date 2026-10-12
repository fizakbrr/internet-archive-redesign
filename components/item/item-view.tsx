import { Download, ExternalLink, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Breadcrumb } from "@/components/breadcrumb"
import { HandoffDialog } from "@/components/feedback/handoff-dialog"
import { StatePanel } from "@/components/feedback/state-panel"
import { ItemCard } from "@/components/item-card"
import { MediaIcon } from "@/components/media-icon"
import { Button, buttonVariants } from "@/components/ui/button"
import { availabilityOf } from "@/lib/availability"
import { downloadOptions, shortFormat } from "@/lib/downloads"
import { compactNumber, formatBytes, formatDate, formatNumber } from "@/lib/format"
import { htmlToText } from "@/lib/html"
import { getItem, type Item } from "@/lib/ia/metadata"
import { getRelated } from "@/lib/ia/related"
import { count, type Hit } from "@/lib/ia/search"
import { archiveUrl, downloadUrl, thumbnailUrl } from "@/lib/ia/urls"
import { getViews } from "@/lib/ia/views"
import { licenseLabel } from "@/lib/license"
import { mediaInfo } from "@/lib/media"
import { CiteButton, FavoriteButton, ShareButton } from "./item-actions"
import { ItemTabs } from "./item-tabs"
import { AudioPlayer, VideoPlayer, type Track } from "./players"
import {
  AtAGlance,
  Card,
  CollectionsCard,
  DetailsList,
  DownloadCard,
  FilesTable,
  RawMetadata,
  Reviews,
  type CollectionSummary,
  type DetailRow,
} from "./sections"

const VIDEO_TYPES: Record<string, string> = { "h.264": "video/mp4", "h.264 HD": "video/mp4", MPEG4: "video/mp4", "512Kb MPEG4": "video/mp4", "Ogg Video": "video/ogg", WebM: "video/webm" }

const field = (item: Item, key: string) => item.raw.find(([k]) => k === key)?.[1]
const searchLink = (param: string, value: string) => `/search?${new URLSearchParams({ [param]: value })}`

export const toHit = (item: Item): Hit => ({
  id: item.id,
  title: item.title,
  mediatype: item.mediatype,
  creators: item.creators,
  year: item.year,
  collections: item.collections,
  license: item.license,
  kind: "item",
  snippets: [],
})

async function collectionSummaries(ids: string[]): Promise<CollectionSummary[]> {
  return Promise.all(
    ids.map(async (id) => {
      const [meta, n] = await Promise.all([getItem(id), count({ q: "", scope: "metadata", filters: {}, sort: "relevance", page: 1, rows: 1, within: id })])
      return { id, title: meta.ok ? meta.data.title : id, count: n?.ok ? n.data : undefined }
    })
  )
}

function Hero({ item }: { item: Item }) {
  const files = item.files
  if (item.mediatype === "movies") {
    const sources = Object.keys(VIDEO_TYPES)
      .flatMap((fmt) => files.filter((f) => f.format === fmt))
      .map((f) => ({ src: downloadUrl(item.id, f.name), type: VIDEO_TYPES[f.format] }))
    if (!sources.length) return null
    const caption = files.find((f) => f.format === "SubRip" || f.format === "Web Video Text Tracks")
    return (
      <VideoPlayer
        title={item.title}
        poster={thumbnailUrl(item.id)}
        sources={sources}
        captions={
          caption && {
            src: `/api/captions?${new URLSearchParams({ id: item.id, file: caption.name })}`,
            label: caption.name.includes(".asr.") ? "English (auto-generated)" : "Captions",
          }
        }
      />
    )
  }
  if (item.mediatype === "audio" || item.mediatype === "etree") {
    const mp3 = files.filter((f) => f.format === "VBR MP3" || f.format === "MP3")
    const tracks: Track[] = mp3
      .sort((a, b) => (Number(a.track) || 0) - (Number(b.track) || 0) || a.name.localeCompare(b.name))
      .map((f) => ({ src: downloadUrl(item.id, f.name), title: f.title || f.name.replace(/\.[^.]+$/, ""), length: f.length }))
    return tracks.length ? <AudioPlayer tracks={tracks} poster={thumbnailUrl(item.id)} title={item.title} /> : null
  }
  if (item.mediatype === "texts" && !item.restricted) {
    return (
      <iframe
        src={`https://archive.org/embed/${encodeURIComponent(item.id)}`}
        title={`Read ${item.title}`}
        allowFullScreen
        loading="lazy"
        className="aspect-[4/5] max-h-[80vh] w-full rounded-lg border border-line bg-surface sm:aspect-[4/3]"
      />
    )
  }
  if (item.mediatype === "image") {
    const img = files.find((f) => f.format === "JPEG" && f.source === "original") ?? files.find((f) => f.format === "JPEG")
    if (!img) return null
    return (
      <div className="flex justify-center rounded-lg bg-inverse p-4">
        {/* Archive originals can be any size; let the browser scale them down only. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={downloadUrl(item.id, img.name)} alt={item.title} className="max-h-[75vh] max-w-full object-contain" />
      </div>
    )
  }
  return null
}

export async function ItemView({ item }: { item: Item }) {
  if (item.dark) {
    return (
      <StatePanel kind="unavailable" title="This item is not available" headingLevel={1} actions={<Link href={searchLink("q", item.title)} className={buttonVariants()}>Search for similar items</Link>}>
        It was removed from public access on archive.org. Its record still exists, but its files cannot be shown.
      </StatePanel>
    )
  }

  const shownCollections = item.collections.filter((c) => !c.startsWith("fav-")).slice(0, 3)
  const [views, related, collections] = await Promise.all([getViews([item.id]), getRelated(item.id), collectionSummaries(shownCollections)])

  const media = mediaInfo(item.mediatype)
  const availability = availabilityOf({ ...item, lendingStatus: undefined })
  const borrow = availability === "Borrow only" || availability === "Restricted"
  // Stream-only items list their files, but archive.org refuses the downloads.
  const options = borrow || availability === "Stream only" ? [] : downloadOptions(item.id, item.mediatype, item.files)
  const primary = options[0]
  const firstCollection = collections[0]
  const description = item.description ? htmlToText(item.description) : ""
  const viewCount = views.ok ? views.data[item.id]?.allTime : undefined
  const hit = toHit(item)
  const pages = field(item, "imagecount")
  const publisher = field(item, "publisher")
  const picture = [field(item, "color"), field(item, "sound")].filter(Boolean).map((s) => s!.replace(/^./, (c) => c.toUpperCase()))

  const subline = [
    item.creators.length ? item.creators.join(", ") : item.mediatype === "movies" ? null : "Unknown creator",
    publisher,
    item.year ?? item.date,
    ...(item.mediatype === "movies" ? picture : []),
    pages && `${pages} pages`,
    firstCollection?.title,
  ].filter(Boolean)

  const rows: DetailRow[] = [
    item.creators.length > 0 && {
      label: item.mediatype === "texts" ? "Author" : "Creator",
      value: item.creators.map((c, i) => (
        <span key={c}>
          {i > 0 && ", "}
          <Link href={searchLink("creator", c)} className="underline">
            {c}
          </Link>
        </span>
      )),
    },
    publisher && { label: "Publisher", value: publisher },
    item.date && { label: item.mediatype === "texts" ? "Published" : "Released", value: formatDate(item.date) },
    pages && { label: "Pages", value: pages },
    item.languages.length > 0 && { label: "Language", value: item.languages.join(", ") },
    item.subjects.length > 0 && {
      label: "Topics",
      value: item.subjects.slice(0, 12).map((s, i) => (
        <span key={s}>
          {i > 0 && ", "}
          <Link href={searchLink("q", s)} className="underline">
            {s}
          </Link>
        </span>
      )),
    },
    item.mediatype === "movies" && picture.length > 0 && { label: "Picture", value: picture.join(", ") },
    licenseLabel(item.license) && {
      label: "Usage rights",
      value: (
        <a href={item.license} className="underline" target="_blank" rel="noopener noreferrer">
          {licenseLabel(item.license)}
        </a>
      ),
    },
    item.collections.includes("printdisabled") && {
      label: "Accessibility",
      value: (
        <a href="https://archive.org/details/printdisabled" className="underline">
          Print-disability access available
        </a>
      ),
    },
    item.addeddate && { label: "Added", value: formatDate(item.addeddate) },
    { label: "Identifier", value: <span className="type-mono">{item.id}</span> },
  ].filter(Boolean) as DetailRow[]

  const citation = `${item.creators.join(", ") || "Unknown creator"}. (${item.year ?? "n.d."}). ${item.title} [${media.label}]. Internet Archive. ${archiveUrl(item.id)}`
  const relatedHits = related.ok ? related.data.slice(0, 4) : []
  const hero = Hero({ item })
  const borrowHref = archiveUrl(item.id)

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: media.plural, href: searchLink("mediatype", item.mediatype) },
          ...(firstCollection ? [{ label: firstCollection.title, href: `/details/${encodeURIComponent(firstCollection.id)}` }] : []),
          { label: item.title },
        ]}
      />

      {hero}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {!hero && (
              <Image
                src={thumbnailUrl(item.id)}
                alt=""
                width={180}
                height={260}
                unoptimized
                loading="eager"
                className="h-auto w-36 shrink-0 self-start rounded-md border border-line shadow-raised sm:w-44"
              />
            )}
            <div className="flex min-w-0 flex-col gap-3">
              <p className="flex items-center gap-3 type-label-sm font-semibold text-fg-secondary">
                <MediaIcon type={item.mediatype} />
                {availability}
              </p>
              <h1 className="type-h1 break-words">{item.title}</h1>
              {subline.length > 0 && <p className="type-body-lg text-fg-secondary">{subline.join(" · ")}</p>}
            </div>
          </div>

          {borrow && (
            <div className="flex gap-3 rounded-md border border-inverse border-l-4 bg-surface p-4">
              <Info className="size-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="type-label">{availability === "Borrow only" ? "Why can I only borrow this?" : "Why is access restricted?"}</p>
                <p className="type-body-sm text-fg-secondary">
                  {availability === "Borrow only"
                    ? "It is still in copyright. You can borrow it free on archive.org with a free account, like a library loan. It cannot be downloaded."
                    : "It is in copyright and available only to readers with a qualifying print disability, through archive.org."}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {borrow ? (
              <HandoffDialog
                title="Borrow on archive.org"
                body="Borrowing needs a free archive.org account. The book opens there in a new tab; your place here is kept."
                href={borrowHref}
                trigger={
                  <Button>
                    <ExternalLink />
                    {availability === "Borrow only" ? "Borrow on archive.org" : "Open on archive.org"}
                  </Button>
                }
              />
            ) : (
              primary && (
                <a href={primary.href} className={buttonVariants()}>
                  <Download />
                  Download {shortFormat(primary.label)} · {formatBytes(primary.size)}
                </a>
              )
            )}
            {item.mediatype === "software" && (
              <a href={borrowHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                <ExternalLink />
                Run in your browser on archive.org
              </a>
            )}
            <FavoriteButton hit={hit} />
            <ShareButton title={item.title} />
            <CiteButton citation={citation} />
          </div>

          <ItemTabs
            tabs={[
              {
                value: "about",
                label: "About",
                content: (
                  <div className="flex flex-col gap-8">
                    {description && (
                      <div className="flex flex-col gap-2">
                        <p className="max-w-prose type-body-lg whitespace-pre-line">{description}</p>
                        <p className="type-caption text-fg-muted">Description provided by the uploader.</p>
                      </div>
                    )}
                    <section className="flex flex-col gap-4" aria-labelledby="details-heading">
                      <h2 id="details-heading" className="type-h2">
                        Details
                      </h2>
                      <DetailsList rows={rows} />
                      <RawMetadata raw={item.raw} />
                    </section>
                  </div>
                ),
              },
              ...(item.files.length
                ? [{ value: "files", label: `All files (${formatNumber(item.files.length)})`, content: <FilesTable id={item.id} files={item.files} /> }]
                : []),
              { value: "reviews", label: `Reviews (${formatNumber(item.reviews.length)})`, content: <Reviews reviews={item.reviews} id={item.id} /> },
            ]}
          />
        </div>

        <aside className="flex flex-col gap-6" aria-label="Item details">
          {options.length > 0 && <DownloadCard id={item.id} mediatype={item.mediatype} options={options} fileCount={item.files.length} size={item.size} />}
          {item.mediatype === "texts" && borrow && (
            <Card title="Reading">
              <p className="type-body-sm text-fg-secondary">Pages open in the Archive&apos;s BookReader, with keyboard page turns, zoom and full screen. Borrowing starts there.</p>
              <a href={borrowHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary" })}>
                <ExternalLink />
                Open in BookReader
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Card>
          )}
          <AtAGlance
            stats={[
              viewCount !== undefined && { value: compactNumber(viewCount), label: "views" },
              { value: formatNumber(item.reviews.length), label: "reviews" },
              item.size !== undefined && { value: formatBytes(item.size), label: "total size" },
            ].filter((s): s is { value: string; label: string } => !!s)}
          />
          <CollectionsCard collections={collections} />
        </aside>
      </div>

      {relatedHits.length > 0 && (
        <section aria-labelledby="similar-heading" className="flex flex-col gap-4">
          <h2 id="similar-heading" className="type-h2">
            Similar items
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {relatedHits.map((h) => (
              <li key={h.id}>
                <ItemCard hit={h} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
