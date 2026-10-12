import { ResultsSkeleton } from "@/components/feedback/skeletons"

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:py-12">
      <ResultsSkeleton />
    </main>
  )
}
