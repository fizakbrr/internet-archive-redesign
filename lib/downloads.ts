import type { ItemFile } from "./ia/metadata.ts"
import { downloadUrl } from "./ia/urls.ts"

export type DownloadOption = {
  label: string
  format: string
  /** "Night.mp4" for one file, "12 files" for a set. */
  detail: string
  size: number
  href: string
}

// archive.org format names -> plain language, in recommendation order per media type.
const FORMATS: Record<string, [string, string][]> = {
  movies: [
    ["h.264", "MP4 video"],
    ["h.264 HD", "MP4 video (HD)"],
    ["MPEG4", "MP4 video"],
    ["512Kb MPEG4", "MP4 video (small)"],
    ["Ogg Video", "Ogg video (open format)"],
    ["Matroska", "MKV video"],
    ["VBR MP3", "MP3 audio only"],
    ["MP3", "MP3 audio only"],
    ["SubRip", "Subtitles (SRT)"],
    ["Web Video Text Tracks", "Subtitles (WebVTT)"],
    ["ISO Image", "DVD disc image (to burn)"],
  ],
  audio: [
    ["VBR MP3", "MP3"],
    ["MP3", "MP3"],
    ["Ogg Vorbis", "Ogg Vorbis (open format)"],
    ["Flac", "FLAC (lossless)"],
    ["24bit Flac", "FLAC 24-bit (lossless)"],
  ],
  texts: [
    ["Text PDF", "PDF"],
    ["EPUB", "EPUB"],
    ["DjVuTXT", "Plain text"],
    ["Kindle", "Kindle (MOBI)"],
  ],
  software: [
    ["ZIP", "ZIP archive"],
    ["ISO Image", "Disc image (ISO)"],
  ],
  image: [
    ["JPEG", "JPEG image"],
    ["PNG", "PNG image"],
    ["TIFF", "TIFF image"],
  ],
}
FORMATS.etree = FORMATS.audio

const compressUrl = (id: string, format: string) =>
  `https://archive.org/compress/${encodeURIComponent(id)}/formats=${encodeURIComponent(format)}&file=/${encodeURIComponent(id)}.zip`

/** Plain-language download choices; the first one is the recommendation. */
export function downloadOptions(id: string, mediatype: string, files: ItemFile[]): DownloadOption[] {
  const out: DownloadOption[] = []
  const seen = new Set<string>()
  for (const [format, label] of FORMATS[mediatype] ?? []) {
    const set = files.filter((f) => f.format === format)
    if (!set.length || seen.has(label)) continue
    seen.add(label)
    const size = set.reduce((n, f) => n + (f.size ?? 0), 0)
    const single = set.length === 1 ? set[0] : null
    out.push({
      label: single && format === "SubRip" && single.name.includes(".asr.") ? "Subtitles, auto-generated (SRT)" : label,
      format,
      detail: single ? single.name : `${set.length} files`,
      size,
      href: single ? downloadUrl(id, single.name) : compressUrl(id, format),
    })
  }
  return out
}

/** Short form for the main button: "MP4" from "MP4 video (HD)". */
export const shortFormat = (label: string) => label.split(/[ (]/)[0]
