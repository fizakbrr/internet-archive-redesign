import assert from "node:assert/strict"
import { test } from "node:test"
import { looksLikeUrl } from "./url.ts"

test("looksLikeUrl", () => {
  for (const s of ["example.com", "https://archive.org/details/x", "www.nasa.gov", " http://a.b.co:8080/p?q=1 "])
    assert.equal(looksLikeUrl(s), true, s)
  for (const s of ["", "night of the living dead", "grateful dead 1977", "e.g", "v1.2", "archive org"])
    assert.equal(looksLikeUrl(s), false, s)
})
