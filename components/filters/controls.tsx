"use client"

import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { activeFilterCount, hrefWith, LIST_FACETS, SORTS, toQuery, type SearchState } from "@/lib/search-params"
import { FilterForm, type FacetData } from "./filter-form"

/** Hidden inputs that carry the current search state through a GET form. */
export function HiddenState({ state, omit }: { state: SearchState; omit: string[] }) {
  const fields: [string, string][] = []
  if (state.q) fields.push(["q", state.q])
  if (state.scope !== "metadata") fields.push(["scope", state.scope])
  for (const a of state.avail) fields.push(["avail", a])
  for (const f of LIST_FACETS) for (const v of state.filters[f]) fields.push([f, v])
  if (state.from !== undefined) fields.push(["from", String(state.from)])
  if (state.to !== undefined) fields.push(["to", String(state.to)])
  if (state.sort !== "relevance") fields.push(["sort", state.sort])
  if (state.view !== "grid") fields.push(["view", state.view])
  return fields
    .filter(([k]) => !omit.includes(k))
    .map(([k, v], i) => <input key={`${k}${i}`} type="hidden" name={k} value={v} />)
}

export function SortSelect({ action, state, className }: { action: string; state: SearchState; className?: string }) {
  const router = useRouter()
  // Without words to rank, results are sorted by views (see effectiveSort).
  const value = !state.q && state.sort === "relevance" ? "downloads" : state.sort
  return (
    <Select items={SORTS} value={value} onValueChange={(v) => v && router.push(hrefWith(action, state, { sort: v }), { scroll: false })}>
      <SelectTrigger aria-label="Sort results" className={cn("w-auto type-label", className)}>
        <span className="text-fg-secondary">Sort:</span>
        <SelectValue className="font-medium" />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-48">
        {SORTS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ViewToggle({ base, state }: { base: string; state: SearchState }) {
  const views = [
    { value: "grid", label: "Grid view", Icon: LayoutGrid },
    { value: "list", label: "List view", Icon: List },
  ] as const
  return (
    <div className="flex rounded-md border border-line-strong bg-surface p-0.5" role="group" aria-label="Result layout">
      {views.map(({ value, label, Icon }) => (
        <Link
          key={value}
          href={hrefWith(base, state, { view: value, page: state.page })}
          scroll={false}
          aria-label={label}
          aria-current={state.view === value ? "true" : undefined}
          className={cn("flex size-10 items-center justify-center rounded-sm", state.view === value ? "bg-inverse text-fg-inverse" : "hover:bg-sunken")}
        >
          <Icon className="size-5" aria-hidden="true" />
        </Link>
      ))}
    </div>
  )
}

/** Mobile and tablet: the same filter form in a sheet, applied with one button. */
export function FilterSheet({ action, state, data }: { action: string; state: SearchState; data: FacetData }) {
  const [open, setOpen] = useState(false)
  const n = activeFilterCount(state)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="secondary" className="flex-1" />}>
        <SlidersHorizontal />
        Filters{n ? ` (${n})` : ""}
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[92dvh] gap-0 rounded-t-xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line-subtle px-4">
          <SheetTitle className="type-h3">Filters</SheetTitle>
          <div className="flex items-center gap-1">
            <Link href={hrefWith(action, state, { avail: [], from: undefined, to: undefined, filters: { mediatype: [], language: [], subject: [], collection: [], creator: [] } })} onClick={() => setOpen(false)} className="flex h-11 items-center px-3 type-label underline">
              Reset
            </Link>
            <SheetClose render={<Button variant="ghost" size="icon" />}>
              <X />
              <span className="sr-only">Close filters</span>
            </SheetClose>
          </div>
        </div>
        {/* Submit bubbles from the form; close the sheet as the results navigate. */}
        <div className="overflow-y-auto px-4" onSubmit={() => setOpen(false)}>
          <FilterForm
            key={toQuery(state)}
            action={action}
            state={state}
            data={data}
            footer={
              <div className="sticky bottom-0 -mx-4 mt-2 border-t border-line-subtle bg-surface p-4">
                <Button type="submit" className="w-full">
                  Show results
                </Button>
              </div>
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
