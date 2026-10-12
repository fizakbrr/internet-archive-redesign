"use client"

import { Check, Copy, Heart, Quote, Share2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useFavorites } from "@/lib/favorites"
import type { Hit } from "@/lib/ia/search"

export function FavoriteButton({ hit }: { hit: Hit }) {
  const { has, toggle } = useFavorites()
  const on = has(hit.id)
  return (
    <Button variant="secondary" aria-pressed={on} onClick={() => toggle(hit)}>
      <Heart className={on ? "fill-current" : undefined} />
      {on ? "Favorited" : "Favorite"}
      <span className="sr-only"> (demo, saved in this browser)</span>
    </Button>
  )
}

export function ShareButton({ title }: { title: string }) {
  const [status, setStatus] = useState("")
  return (
    <>
      <Button
        variant="secondary"
        onClick={async () => {
          const url = location.href
          if (navigator.share) {
            await navigator.share({ title, url }).catch(() => {})
            return
          }
          await navigator.clipboard.writeText(url)
          setStatus("Link copied")
          setTimeout(() => setStatus(""), 2500)
        }}
      >
        {status ? <Check /> : <Share2 />}
        {status || "Share"}
      </Button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  )
}

export function CiteButton({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" />}>
        <Quote />
        Cite
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Cite this item</DialogTitle>
        <DialogDescription>A plain citation you can paste into a reference list.</DialogDescription>
        <p className="rounded-md border border-line bg-sunken p-4 type-body select-all">{citation}</p>
        <Button
          variant="secondary"
          className="self-start"
          onClick={async () => {
            await navigator.clipboard.writeText(citation)
            setCopied(true)
          }}
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy citation"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
