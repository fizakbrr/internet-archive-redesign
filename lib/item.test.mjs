import assert from "node:assert/strict"
import { test } from "node:test"
import { downloadOptions } from "./downloads.ts"
import { htmlToText } from "./html.ts"
import { licenseLabel } from "./license.ts"

test("htmlToText keeps paragraphs and drops markup", () => {
  assert.equal(htmlToText("A<br>B<p>C</p><script>alert(1)</script>D &amp; E &#39;f&#39; <a href='x' onclick='y'>link</a>"), "A\nB\n\nC\n\nD & E 'f' link")
  assert.equal(htmlToText("<img src=x onerror=alert(1)>"), "")
  assert.equal(htmlToText("&bogus; &#xFFFFFFF;"), "&bogus; &#xFFFFFFF;")
})

test("downloadOptions", () => {
  const files = [
    { name: "Night.mp4", format: "h.264", source: "derivative", size: 596e6 },
    { name: "Night.asr.srt", format: "SubRip", source: "original", size: 52611 },
    { name: "a.mp3", format: "VBR MP3", source: "derivative", size: 1 },
    { name: "b.mp3", format: "VBR MP3", source: "derivative", size: 2 },
    { name: "Night_meta.xml", format: "Metadata", source: "original", size: 9 },
  ]
  const opts = downloadOptions("x y", "movies", files)
  assert.deepEqual(opts.map((o) => o.label), ["MP4 video", "MP3 audio only", "Subtitles, auto-generated (SRT)"])
  assert.equal(opts[0].href, "https://archive.org/download/x%20y/Night.mp4")
  assert.equal(opts[1].detail, "2 files")
  assert.equal(opts[1].size, 3)
  assert.match(opts[1].href, /^https:\/\/archive\.org\/compress\/x%20y\/formats=VBR%20MP3/)
  assert.deepEqual(downloadOptions("x", "unknown", files), [])
})

test("licenseLabel", () => {
  assert.match(licenseLabel("http://creativecommons.org/publicdomain/mark/1.0/"), /^Public domain/)
  assert.match(licenseLabel("https://creativecommons.org/licenses/by-nc-sa/4.0/"), /^Creative Commons BY-NC-SA 4\.0/)
  assert.equal(licenseLabel(undefined), null)
})
