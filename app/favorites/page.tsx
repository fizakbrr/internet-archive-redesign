import type { Metadata } from "next"
import { FavoritesView } from "@/components/favorites-view"

export const metadata: Metadata = { title: "Your favorites (demo)", robots: { index: false } }

export default function FavoritesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:py-12">
      <FavoritesView />
    </main>
  )
}
