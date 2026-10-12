import assert from "node:assert/strict"
import { test } from "node:test"
import { pageList } from "./pagination.ts"
import { parseSearch, toQuery } from "./search-params.ts"

test("pageList", () => {
  assert.deepEqual(pageList(1, 1), [1])
  assert.deepEqual(pageList(3, 7), [1, 2, 3, 4, 5, 6, 7])
  assert.deepEqual(pageList(1, 113), [1, 2, 3, 4, 5, "gap", 113])
  assert.deepEqual(pageList(7, 113), [1, "gap", 6, 7, 8, "gap", 113])
  assert.deepEqual(pageList(112, 113), [1, "gap", 109, 110, 111, 112, 113])
})

test("search params round-trip and reject junk", () => {
  const s = parseSearch({ q: "dead", mediatype: ["movies", "texts"], avail: ["pd", "nope"], sort: "bogus", page: "-3", from: "1920", to: "abc" })
  assert.deepEqual(s.filters.mediatype, ["movies", "texts"])
  assert.deepEqual(s.avail, ["pd"])
  assert.equal(s.sort, "relevance")
  assert.equal(s.page, 1)
  assert.equal(s.from, 1920)
  assert.equal(s.to, undefined)
  assert.equal(toQuery(s), "?q=dead&avail=pd&mediatype=movies&mediatype=texts&from=1920")
  assert.deepEqual(parseSearch(Object.fromEntries(new URLSearchParams(toQuery(s))))?.q, "dead")
})

test("toDecades fills gaps and drops junk years", async () => {
  const { toDecades } = await import("./decades.ts")
  assert.deepEqual(toDecades([{ key: "1931", count: 2 }, { key: "1939", count: 3 }, { key: "1955", count: 1 }, { key: "2389", count: 9 }, { key: "0", count: 4 }]), [
    { decade: 1930, count: 5 },
    { decade: 1940, count: 0 },
    { decade: 1950, count: 1 },
  ])
  assert.deepEqual(toDecades([]), [])
})

test("wayback timestamps", async () => {
  const { stampToDate, daysInMonth, displayUrl, formatStampFull } = await import("./wayback-time.ts")
  assert.equal(stampToDate("20261009114527").toISOString(), "2026-10-09T11:45:27.000Z")
  assert.equal(stampToDate("2024").toISOString(), "2024-01-01T00:00:00.000Z")
  assert.equal(daysInMonth(2024, 2), 29)
  assert.equal(daysInMonth(2023, 2), 28)
  assert.equal(displayUrl("https://www.nasa.gov/"), "www.nasa.gov")
  assert.equal(formatStampFull("20261008142800"), "October 8, 2026 at 14:28 UTC")
})

test("buildAdvancedQuery", async () => {
  const { buildAdvancedQuery, EMPTY_FIELDS } = await import("./advanced-query.ts")
  assert.equal(
    buildAdvancedQuery({ ...EMPTY_FIELDS, all: "night living dead", none: "remake", creator: "Romero, George A.", collection: "feature_films", mediatype: "movies", subject: "horror", from: "1960", to: "1979" }),
    '(night AND living AND dead) AND -remake AND creator:("Romero, George A.") AND collection:(feature_films) AND mediatype:(movies) AND subject:(horror) AND year:[1960 TO 1979]'
  )
  assert.equal(buildAdvancedQuery({ ...EMPTY_FIELDS, phrase: 'say "hi"', to: "1999-05-01" }), '"say \\"hi\\"" AND year:[* TO 1999]')
  assert.equal(buildAdvancedQuery(EMPTY_FIELDS), "")
})
