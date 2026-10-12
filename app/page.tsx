import { ArrowRight, ChevronRight, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { Bone, CardSkeleton } from "@/components/feedback/skeletons"
import { HeroSearch } from "@/components/home/hero-search"
import { ItemCard } from "@/components/item-card"
import { WaybackWordmark } from "@/components/wayback-wordmark"
import { compactNumber, formatNumber } from "@/lib/format"
import { getItem } from "@/lib/ia/metadata"
import { count, search, type Hit, type SearchInput } from "@/lib/ia/search"
import { thumbnailUrl } from "@/lib/ia/urls"
import { MEDIA, type MediaType } from "@/lib/media"

const input = (over: Partial<SearchInput>): SearchInput => ({ q: "", scope: "metadata", filters: {}, sort: "downloads", page: 1, rows: 2, ...over })

const TILES: MediaType[] = ["texts", "movies", "audio", "software", "image"]
// Curated per collection: a global "most viewed this week" surfaces spam (see .llm-wiki/api.md).
const FEATURED = ["feature_films", "americana", "GratefulDead", "internetarcade"]
const POPULAR: [string, number][] = [
  ["feature_films", 2],
  ["americana", 1],
  ["GratefulDead", 1],
  ["softwarelibrary_msdos_games", 1],
]
const GUIDES = [
  { title: "Read and borrow books", body: "Millions of books are free to read. Books still in copyright can be borrowed for an hour with a free account.", href: "/search?mediatype=texts" },
  { title: "Watch films and TV news", body: "Public-domain features, silent films, newsreels and TV news clips with searchable captions.", href: "/search?mediatype=movies" },
  { title: "Explore the Wayback Machine", body: "Look up any web address and travel through more than 1 trillion saved pages since 1996.", href: "/wayback" },
]

const ok = <T,>(r: { ok: true; data: T } | { ok: false } | null) => (r?.ok ? r.data : undefined)

// The page shell is static; each live section streams in behind its own Suspense boundary, so a slow or
// failing archive.org call (cached for seconds only) never blocks the rest of the page.
async function TileCount({ type }: { type: MediaType }) {
  const n = ok(await count(input({ filters: { mediatype: [type] } })))
  return n !== undefined ? <span className="type-caption text-fg-secondary">{compactNumber(n)} items</span> : null
}

async function FeaturedList() {
  const featured = await Promise.all(
    FEATURED.map(async (id) => {
      const [meta, n] = await Promise.all([getItem(id), count(input({ within: id }))])
      return { id, title: ok(meta)?.title ?? id, count: ok(n) }
    })
  )
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {featured.map((c) => (
        <li key={c.id}>
          <Link href={`/details/${c.id}`} className="flex h-full min-h-11 items-center gap-3 rounded-lg border border-line bg-surface p-3 transition-shadow hover:shadow-raised">
            <Image src={thumbnailUrl(c.id)} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 rounded-sm bg-inverse object-cover" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="line-clamp-1 type-h4">{c.title}</span>
              {c.count !== undefined && <span className="type-caption text-fg-muted">{formatNumber(c.count)} items</span>}
            </span>
            <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

async function PopularList() {
  const popular = (await Promise.all(POPULAR.map(async ([id, n]) => (ok(await search(input({ within: id, rows: n })))?.hits ?? []) as Hit[]))).flat()
  if (!popular.length) return <p className="type-body text-fg-secondary">Popular items could not be loaded right now.</p>
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {popular.map((hit) => (
        <li key={hit.id}>
          <ItemCard hit={hit} />
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  return (
    <main className="flex flex-col">
      <section className="flex flex-col items-center gap-6 px-4 pt-14 pb-12 text-center md:pt-20">
        <p className="type-overline text-fg-secondary">A non-profit library of the world&apos;s culture</p>
        <h1 className="type-display">Universal access to all knowledge</h1>
        <p className="max-w-xl type-body-lg text-fg-secondary">Free books, films, music, software and more than 1 trillion archived web pages.</p>
        <HeroSearch />
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-20 md:px-8">
        <nav aria-label="Browse by media type">
          {/* Film strip: frames scroll sideways on small screens, like the reel they imitate. */}
          <div className="overflow-x-auto rounded-md bg-inverse text-fg-inverse">
            <div className="flex min-w-max flex-col gap-2 p-2 lg:min-w-0">
              <Sprockets />
              <ul className="flex gap-2">
                {TILES.map((t) => {
                  const { plural, Icon } = MEDIA[t]
                  return (
                    <li key={t} className="flex w-36 shrink-0 lg:w-auto lg:flex-1">
                      <Tile href={`/search?mediatype=${t}`} Icon={Icon} title={plural}>
                        <Suspense fallback={<Bone className="mt-1 h-3 w-16" />}>
                          <TileCount type={t} />
                        </Suspense>
                      </Tile>
                    </li>
                  )
                })}
                <li className="flex w-36 shrink-0 lg:w-auto lg:flex-1">
                  {/* archive.org's own published figure; the Wayback APIs do not expose a total. */}
                  <Tile href="/wayback" Icon={Globe} title="Web pages">
                    <span className="type-caption text-fg-secondary">1T+ pages</span>
                  </Tile>
                </li>
              </ul>
              <Sprockets />
            </div>
          </div>
        </nav>

        <section className="flex flex-col items-start gap-4 rounded-lg bg-primary p-6 text-on-primary md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex flex-col gap-3">
            <h2>
              <WaybackWordmark />
            </h2>
            <p className="max-w-xl type-body">See how any website looked in the past. Paste a URL into search and we take you straight there.</p>
          </div>
          <Link href="/wayback" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-inverse px-4 type-label text-fg-inverse hover:bg-line-inverse">
            Open the Wayback Machine
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </section>

        <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
          <SectionHeader id="featured-heading" title="Featured collections" sub="Hand-picked libraries inside the Archive" href="/search?mediatype=collection" link="All collections" />
          <Suspense
            fallback={
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                {FEATURED.map((id) => (
                  <Bone key={id} className="h-[74px] rounded-lg" />
                ))}
              </div>
            }
          >
            <FeaturedList />
          </Suspense>
        </section>

        <section aria-labelledby="popular-heading" className="flex flex-col gap-4">
          <SectionHeader
            id="popular-heading"
            title="Popular in the collections"
            sub="Most viewed from Feature Films, American Libraries, Grateful Dead and MS-DOS Games"
            href="/search?collection=feature_films&sort=downloads"
            link="See all"
          />
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <PopularList />
          </Suspense>
        </section>

        <section aria-labelledby="guides-heading" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="flex flex-col gap-2">
            <h2 id="guides-heading" className="type-h2">
              New to the Archive?
            </h2>
            <p className="type-body-lg text-fg-secondary">Three good places to start. Everything here is free.</p>
          </div>
          <ol className="border-t border-line">
            {GUIDES.map((g) => (
              <li key={g.href} className="border-b border-line">
                <Link href={g.href} className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-6 hover:bg-sunken md:px-2">
                  <span className="flex flex-col gap-1">
                    <span className="type-h3 group-hover:underline">{g.title}</span>
                    <span className="type-body text-fg-secondary">{g.body}</span>
                  </span>
                  <ArrowRight className="mt-1.5 size-5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}

function Tile({ href, Icon, title, children }: { href: string; Icon: React.ComponentType<{ className?: string }>; title: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="flex w-full min-h-11 flex-col gap-3 rounded-sm bg-canvas p-4 text-fg transition-colors duration-150 hover:bg-sunken">
      <Icon className="size-6" aria-hidden="true" />
      <span className="flex flex-col">
        <span className="type-h4">{title}</span>
        {children}
      </span>
    </Link>
  )
}

/** A row of film perforations; extra holes are clipped by the strip. */
function Sprockets() {
  return (
    // w-0 min-w-full: the frames set the strip width; surplus holes are clipped.
    <div className="flex h-2.5 w-0 min-w-full gap-3 overflow-hidden px-1" aria-hidden="true">
      {Array.from({ length: 64 }, (_, i) => (
        <span key={i} className="h-full w-4 shrink-0 rounded-[2px] bg-canvas" />
      ))}
    </div>
  )
}

function SectionHeader({ id, title, sub, href, link }: { id: string; title: string; sub: string; href: string; link: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="type-h2">
          {title}
        </h2>
        <p className="type-body-sm text-fg-secondary">{sub}</p>
      </div>
      <Link href={href} className="inline-flex min-h-11 items-center gap-1 type-label underline">
        {link}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
