import { Bone } from "@/components/feedback/skeletons"

export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-10 md:px-8 lg:py-14">
      <span className="sr-only">Loading Wayback Machine</span>
      <Bone className="h-20 w-80" />
      <Bone className="h-5 w-full max-w-lg" />
      <Bone className="h-11 w-full max-w-2xl rounded-md" />
      <Bone className="h-32 w-full rounded-lg" />
      <Bone className="h-56 w-full rounded-lg" />
    </main>
  )
}
