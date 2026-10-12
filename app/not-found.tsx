import Link from "next/link"
import { StatePanel } from "@/components/feedback/state-panel"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      <StatePanel
        kind="unavailable"
        title="This page or item does not exist"
        headingLevel={1}
        actions={
          <>
            <Link href="/search" className={buttonVariants()}>
              Search the Archive
            </Link>
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              Go to the home page
            </Link>
          </>
        }
      >
        The address may be mistyped, or the item may have been removed from archive.org.
      </StatePanel>
    </main>
  )
}
