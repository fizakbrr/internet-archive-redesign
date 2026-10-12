import { Bone } from "@/components/feedback/skeletons"

export default function Loading() {
  return (
    <main aria-busy="true" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 lg:py-8">
      <span className="sr-only">Loading item</span>
      <Bone className="h-5 w-64" />
      <Bone className="aspect-video w-full rounded-lg" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Bone className="h-4 w-28" />
          <Bone className="h-10 w-3/4" />
          <Bone className="h-5 w-1/2" />
          <div className="flex gap-3">
            <Bone className="h-11 w-44 rounded-md" />
            <Bone className="h-11 w-28 rounded-md" />
          </div>
        </div>
        <Bone className="h-80 w-full rounded-lg" />
      </div>
    </main>
  )
}
