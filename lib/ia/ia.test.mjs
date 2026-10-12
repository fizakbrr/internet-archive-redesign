import assert from "node:assert/strict"
import { test } from "node:test"
import { parseRetryAfter, toIAError } from "./http.ts"
import { normalizeItem, parseLength } from "./metadata.ts"
import { advancedSearchUrl, effectiveQuery, effectiveSort, pageProductionUrl } from "./search.ts"

const base = { q: "", scope: "metadata", filters: {}, sort: "relevance", page: 1, rows: 24 }

test("parseRetryAfter", () => {
  assert.equal(parseRetryAfter("5"), 5)
  assert.equal(parseRetryAfter(null), undefined)
  assert.equal(parseRetryAfter("Thu, 01 Jan 2099 00:00:10 GMT", Date.parse("Thu, 01 Jan 2099 00:00:00 GMT")), 10)
})

test("toIAError", () => {
  assert.deepEqual(toIAError(new TypeError("fetch failed")), { kind: "network" })
})

test("empty searches become field queries sorted by downloads", () => {
  assert.equal(effectiveQuery(base), null)
  assert.equal(effectiveQuery({ ...base, within: "feature_films" }), 'collection:"feature_films"')
  assert.equal(effectiveQuery({ ...base, filters: { mediatype: ["movies", "texts"] } }), 'mediatype:("movies" OR "texts")')
  assert.equal(effectiveSort(base), "downloads")
  assert.equal(effectiveSort({ ...base, q: "dead" }), "relevance")
})

test("pageProductionUrl", () => {
  const input = { ...base, q: "dead", filters: { mediatype: ["movies"] }, yearFrom: 1960, sort: "newest" }
  const u = new URL(pageProductionUrl(input, "dead"))
  assert.equal(u.searchParams.get("user_query"), "dead")
  assert.equal(u.searchParams.get("sort"), "date:desc")
  const fm = JSON.parse(u.searchParams.get("filter_map"))
  assert.deepEqual(fm.mediatype, { movies: "inc" })
  assert.equal(fm.year["1960"], "gte")
  assert.equal(fm.year[String(new Date().getFullYear())], "lte", "newest caps junk future years")
  assert.equal(new URL(pageProductionUrl({ ...base, q: "x" }, "x")).searchParams.has("sort"), false)
})

test("advancedSearchUrl escapes quotes in filter values", () => {
  const u = new URL(advancedSearchUrl({ ...base, q: "a", filters: { creator: ['Say "hi"'] } }, "a"))
  assert.equal(u.searchParams.get("q"), '(a) AND creator:("Say \\"hi\\"")')
})

test("normalizeItem", () => {
  assert.equal(normalizeItem({}), null)
  const item = normalizeItem({
    metadata: { identifier: "x", title: "T", mediatype: "movies", uploader: "me@example.com", notes: "mail a@b.co", subject: "horror; zombies" },
    files: [{ name: "a.mp4", format: "h.264", length: "1:02:03" }, { name: "secret", private: "true" }],
  })
  assert.deepEqual(item.subjects, ["horror", "zombies"])
  assert.deepEqual(item.files.map((f) => f.name), ["a.mp4"])
  assert.equal(item.files[0].length, 3723)
  assert.ok(!item.raw.some(([k, v]) => k === "uploader" || v.includes("@")), "no emails in raw metadata")
  assert.equal(parseLength("83.5"), 83.5)
})

test("srtToVtt", async () => {
  const { srtToVtt } = await import("./captions.ts")
  assert.equal(srtToVtt("\uFEFF1\r\n00:00:01,500 --> 00:00:02,000\r\nHi\r\n"), "WEBVTT\n\n1\n00:00:01.500 --> 00:00:02.000\nHi\n")
  assert.equal(srtToVtt("WEBVTT\n\nx"), "WEBVTT\n\nx")
  assert.equal(srtToVtt("00:00:00,18 --> 00:00:03,01"), "WEBVTT\n\n00:00:00.180 --> 00:00:03.010")
})

test("collection items exclude subcollections unless asked for", () => {
  const fm = (input) => JSON.parse(new URL(pageProductionUrl(input, "x")).searchParams.get("filter_map"))
  assert.equal(fm({ ...base, within: "feature_films" }).mediatype.collection, "exc")
  assert.equal(fm({ ...base, within: "feature_films", filters: { mediatype: ["collection"] } }).mediatype.collection, "inc")
  // Browsing already queries collection:"id"; the duplicate filter made page_production answer 400.
  assert.equal(fm({ ...base, within: "feature_films" }).collection, undefined)
  assert.equal(fm({ ...base, q: "chaplin", within: "feature_films" }).collection.feature_films, "inc")
})

test("dark items without a metadata block stay dark, not missing", () => {
  const item = normalizeItem({ is_dark: true }, "x")
  assert.equal(item.dark, true)
  assert.equal(normalizeItem({}, "x"), null)
})
