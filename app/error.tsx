"use client"

import Link from "next/link"
import { StatePanel } from "@/components/feedback/state-panel"
import { Button, buttonVariants } from "@/components/ui/button"
import { useOnline } from "@/lib/use-online"

/** Catches render errors in any page. Offline gets its own message; everything else offers a retry. */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const online = useOnline()
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      {online ? (
        <StatePanel
          kind="error"
          title="This page could not be shown"
          headingLevel={1}
          actions={
            <>
              <Button onClick={() => retry()}>Try again</Button>
              <Link href="/" className={buttonVariants({ variant: "ghost" })}>
                Go to the home page
              </Link>
            </>
          }
        >
          Something went wrong while loading it. Trying again usually works.
        </StatePanel>
      ) : (
        <StatePanel kind="offline" title="You are offline" headingLevel={1} actions={<Button onClick={() => retry()}>Try again</Button>}>
          Check your connection. The page will load once you are back online.
        </StatePanel>
      )}
    </main>
  )
}
