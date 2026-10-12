"use client"

import { WifiOff } from "lucide-react"
import { useEffect } from "react"
import { useOnline } from "@/lib/use-online"

/**
 * Shown under the header while the browser reports no connection. Offline, the Next router turns a failed
 * navigation into a full page load, which lands on the browser's error page; so in-app links and searches are held here instead.
 */
export function OfflineBanner() {
  const online = useOnline()

  useEffect(() => {
    if (online) return
    const sameOrigin = (url: string) => new URL(url, location.href).origin === location.origin
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href]")
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey) return
      if (sameOrigin(a.href) && !a.getAttribute("href")?.startsWith("#")) e.preventDefault()
    }
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement
      if (form.method === "get" && sameOrigin(form.action)) e.preventDefault()
    }
    document.addEventListener("click", onClick, true)
    document.addEventListener("submit", onSubmit, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("submit", onSubmit, true)
    }
  }, [online])

  return (
    <div role="status" aria-live="polite">
      {!online && (
        <div className="border-b border-line bg-surface">
          <p className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 type-body-sm md:px-8">
            <WifiOff className="size-5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">You are offline.</span> This page stays readable; new pages and searches will load once you reconnect.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
