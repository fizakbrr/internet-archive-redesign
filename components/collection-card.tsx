import Image from "next/image"
import Link from "next/link"
import { formatNumber } from "@/lib/format"
import { thumbnailUrl } from "@/lib/ia/urls"

/** Square cover, name, item count. The whole card is one link. */
export function CollectionCard({ id, title, count }: { id: string; title: string; count?: number }) {
  return (
    <Link
      href={`/details/${encodeURIComponent(id)}`}
      className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow duration-150 hover:shadow-raised"
    >
      <div className="relative aspect-square w-full bg-inverse">
        <Image src={thumbnailUrl(id)} alt="" fill unoptimized sizes="(min-width: 1024px) 240px, 50vw" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 min-h-[52px] type-h4">{title}</h3>
        {count !== undefined && <p className="type-caption text-fg-muted">{formatNumber(count)} items</p>}
      </div>
    </Link>
  )
}
