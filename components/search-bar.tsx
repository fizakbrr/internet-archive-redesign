"use client"

import { Search, X } from "lucide-react"
import Form from "next/form"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef } from "react"
import { cn } from "cn"
import { looksLikeUrl } from "@/lib/url"

/** Replaces the browser's search-cancel glyph. Must follow a `peer` input with a placeholder: it hides while the input is empty. */
export function ClearButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Clear search"
      onClick={(e) => {
        const input = e.currentTarget.previousElementSibling
        if (input instanceof HTMLInputElement) {
          input.value = ""
          input.focus()
        }
      }}
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-md text-fg-secondary peer-placeholder-shown:hidden hover:text-fg", className)}
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  )
}

// GET form: works without JS, navigates client-side with JS. With JS, a pasted URL goes to the Wayback lookup.
export function SearchBar({
  defaultValue = "",
  shortcut = false,
  className,
  autoFocus,
  action = "/search",
  placeholder = "Search the Archive",
  detectUrls = true,
}: {
  defaultValue?: string
  shortcut?: boolean
  className?: string
  autoFocus?: boolean
  action?: string
  placeholder?: string
  /** Global search only: a pasted URL goes to the Wayback lookup. */
  detectUrls?: boolean
}) {
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)
  const id = useId()

  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      e.preventDefault()
      ref.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut])

  return (
    <Form
      role="search"
      action={action}
      className={cn(
        "flex h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-fg has-focus-visible:border-2 has-focus-visible:border-focus has-focus-visible:px-[11px]",
        className
      )}
      onSubmit={(e) => {
        const q = ref.current?.value.trim() ?? ""
        if (!detectUrls || !looksLikeUrl(q)) return
        e.preventDefault()
        router.push(`/wayback?url=${encodeURIComponent(q)}`)
      }}
    >
      <Search className="size-5 shrink-0 text-fg-secondary" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        ref={ref}
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="peer h-full min-w-0 flex-1 bg-transparent type-body outline-none placeholder:text-fg-muted"
      />
      <ClearButton className="-mx-1.5" />
      {shortcut && (
        <kbd className="hidden rounded-sm border border-line px-1.5 type-mono text-fg-muted lg:inline" aria-hidden="true">
          /
        </kbd>
      )}
    </Form>
  )
}
