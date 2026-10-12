"use client"

import { Check, Download, Heart, Info } from "lucide-react"
import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { cn } from "cn"
import { StatePanel } from "@/components/feedback/state-panel"
import { ItemCard } from "@/components/item-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useFavorites } from "@/lib/favorites"
import { plural } from "@/lib/format"
import { mediaInfo } from "@/lib/media"

const noop = () => () => {}

export function FavoritesView() {
  const { list, remove } = useFavorites()
  // Favorites live in localStorage; render nothing list-shaped until the client has read it.
  const hydrated = useSyncExternalStore(noop, () => true, () => false)
  const [type, setType] = useState<string | null>(null)
  const types = [...new Set(list.map((h) => h.mediatype))]
  const shown = type ? list.filter((h) => h.mediatype === type) : list

  const exportList = () => {
    const blob = new Blob([JSON.stringify(list.map(({ id, title, mediatype }) => ({ id, title, mediatype, url: `https://archive.org/details/${id}` })), null, 2)], {
      type: "application/json",
    })
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "archive-favorites.json" })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-3 rounded-md border border-l-4 border-inverse bg-surface p-4">
        <Info className="size-5 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="type-label">This is a demo account</p>
          <p className="type-body-sm text-fg-secondary">
            Favorites here are saved only in this browser and are never sent anywhere. To keep favorites on every device, sign in on archive.org.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="type-h1">Your favorites</h1>
          {hydrated && <p className="type-body-sm text-fg-secondary">{plural(list.length, "item")} · saved in this browser</p>}
        </div>
        {hydrated && list.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportList}>
              <Download />
              Export list
            </Button>
            <Dialog>
              <DialogTrigger render={<Button variant="ghost" />}>Clear all</DialogTrigger>
              <DialogContent>
                <DialogTitle>Remove all favorites?</DialogTitle>
                <DialogDescription>This removes every favorite saved in this browser. It cannot be undone.</DialogDescription>
                <DialogFooter>
                  <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                  <DialogClose render={<Button />} onClick={() => list.forEach((h) => remove(h.id))}>
                    Remove all
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {!hydrated ? null : list.length === 0 ? (
        <StatePanel
          kind="search"
          title="No favorites yet"
          actions={
            <Link href="/search?mediatype=collection" className={buttonVariants()}>
              Browse the collections
            </Link>
          }
        >
          <span className="inline-flex flex-wrap items-center justify-center gap-1">
            Use the <Heart className="size-4" aria-hidden="true" /> Favorite button on any item to keep it here.
          </span>
        </StatePanel>
      ) : (
        <>
          {types.length > 1 && (
            <div role="group" aria-label="Filter by media type" className="flex flex-wrap gap-2">
              {[null, ...types].map((t) => {
                const on = type === t
                const n = t ? list.filter((h) => h.mediatype === t).length : list.length
                return (
                  <button
                    key={t ?? "all"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setType(t)}
                    className={cn(
                      "inline-flex h-11 items-center gap-1.5 rounded-full border px-3 type-label lg:h-9",
                      on ? "border-transparent bg-primary text-on-primary hover:bg-primary-hover" : "border-line-strong bg-surface hover:bg-secondary-hover"
                    )}
                  >
                    {on && <Check className="size-4" aria-hidden="true" />}
                    {t ? mediaInfo(t).plural : "All"} ({n})
                  </button>
                )
              })}
            </div>
          )}
          <h2 className="sr-only">Saved items</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {shown.map((hit) => (
              <li key={hit.id}>
                <ItemCard hit={hit} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
