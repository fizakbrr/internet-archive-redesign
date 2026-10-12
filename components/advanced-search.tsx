"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildAdvancedQuery, EMPTY_FIELDS, type AdvancedFields } from "@/lib/advanced-query"
import { MEDIA } from "@/lib/media"

type Field = { name: keyof AdvancedFields; label: string; placeholder?: string; hint?: string }

const WORDS: Field[] = [
  { name: "all", label: "All of these words" },
  { name: "phrase", label: "This exact phrase", placeholder: "e.g. living dead" },
  { name: "none", label: "None of these words", hint: "Excludes matches" },
]
const FIELDS: Field[] = [
  { name: "title", label: "Title", placeholder: "e.g. Night of the Living Dead" },
  { name: "creator", label: "Creator", hint: "Last name first works best" },
  { name: "collection", label: "Collection", placeholder: "e.g. feature_films", hint: "The collection's identifier, from its address" },
]
const TYPES = [{ value: "", label: "Any" }, ...Object.entries(MEDIA).map(([value, m]) => ({ value, label: m.plural })), { value: "etree", label: "Concerts" }]

const input = "field-focus h-11 w-full rounded-md border border-line-strong bg-surface px-3 type-body placeholder:text-fg-muted"

function TextField({ f, value, onChange }: { f: Field; value: string; onChange: (v: string) => void }) {
  const id = `adv-${f.name}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="type-label">
        {f.label}
      </label>
      <input id={id} name={f.name} value={value} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} aria-describedby={f.hint ? `${id}-hint` : undefined} className={input} />
      {f.hint && (
        <p id={`${id}-hint`} className="type-caption text-fg-muted">
          {f.hint}
        </p>
      )}
    </div>
  )
}

/** GET form to /search/advanced, which builds the query on the server too, so it works without JS. */
export function AdvancedSearch() {
  const [fields, setFields] = useState<AdvancedFields>(EMPTY_FIELDS)
  // Once the user edits the query by hand, stop overwriting it from the fields.
  const [custom, setCustom] = useState<string | null>(null)
  const set = (k: keyof AdvancedFields) => (v: string) => setFields((f) => ({ ...f, [k]: v }))
  const query = custom ?? buildAdvancedQuery(fields)

  return (
    <form action="/search/advanced" className="flex flex-col gap-8 rounded-lg border border-line bg-surface p-5 md:p-8">
      <input type="hidden" name="go" value="1" />
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 type-h3">Find items with</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {WORDS.map((f) => (
            <TextField key={f.name} f={f} value={fields[f.name]} onChange={set(f.name)} />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 type-h3">Narrow by field</legend>
        <div className="grid gap-4 md:grid-cols-3">
          {FIELDS.map((f) => (
            <TextField key={f.name} f={f} value={fields[f.name]} onChange={set(f.name)} />
          ))}
          <div className="flex flex-col gap-1">
            <span id="adv-mediatype-label" className="type-label">
              Media type
            </span>
            <Select name="mediatype" items={TYPES} value={fields.mediatype} onValueChange={(v) => set("mediatype")(v ?? "")}>
              <SelectTrigger aria-labelledby="adv-mediatype-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField f={{ name: "language", label: "Language", placeholder: "e.g. English" }} value={fields.language} onChange={set("language")} />
          <TextField f={{ name: "subject", label: "Subject", placeholder: "e.g. horror" }} value={fields.subject} onChange={set("subject")} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 type-h3">Date</legend>
        <div className="grid gap-4 md:grid-cols-3">
          <TextField f={{ name: "from", label: "From", placeholder: "e.g. 1960", hint: "Year or YYYY-MM-DD" }} value={fields.from} onChange={set("from")} />
          <TextField f={{ name: "to", label: "To", placeholder: "e.g. 1979" }} value={fields.to} onChange={set("to")} />
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 rounded-md bg-sunken p-4">
        <label htmlFor="adv-query" className="type-label-sm text-fg-secondary">
          Query (editable)
        </label>
        <textarea
          id="adv-query"
          name="query"
          rows={2}
          value={query}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Fill in any field above, or write a query here."
          className="field-focus resize-y rounded-md border border-line-strong bg-surface px-3 py-2 type-mono placeholder:font-sans placeholder:text-fg-muted"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/search/advanced"
          onClick={() => {
            setFields(EMPTY_FIELDS)
            setCustom(null)
          }}
          className={buttonVariants({ variant: "ghost" })}
        >
          Reset
        </Link>
        <Button type="submit" variant="accent">
          <Search />
          Search
        </Button>
      </div>
    </form>
  )
}
