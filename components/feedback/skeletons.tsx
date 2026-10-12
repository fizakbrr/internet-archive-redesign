import { cn } from "cn"

export const Bone = ({ className }: { className?: string }) => <div className={cn("rounded-sm bg-sunken", className)} />

export function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <Bone className="aspect-[3/2] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Bone className="h-4 w-24" />
        <Bone className="h-5 w-4/5" />
        <Bone className="h-4 w-3/5" />
        <Bone className="h-3 w-16" />
      </div>
    </div>
  )
}

/** Results grid placeholder; keeps the layout stable while the response arrives. */
export function ResultsSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading results</span>
      <Bone className="h-10 w-2/3 max-w-xl" />
      <Bone className="h-4 w-48" />
      <div className="grid gap-8 lg:grid-cols-[264px_minmax(0,1fr)]">
        <div className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 8 }, (_, i) => (
            <Bone key={i} className="h-6 w-full" />
          ))}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <li key={i}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
