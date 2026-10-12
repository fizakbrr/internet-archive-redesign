import type { NextRequest } from "next/server"
import { getCaptions } from "@/lib/ia/captions"
import { badRequest, respond } from "@/lib/ia/respond"

// archive.org identifiers, and caption files inside the item (no path traversal).
const ID = /^[\w.-]{1,100}$/
const FILE = /^[^/\\][^\\]{0,250}\.(srt|vtt)$/i

/** Serves an item's SRT subtitles as WebVTT, the only format <track> accepts. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? ""
  const file = req.nextUrl.searchParams.get("file") ?? ""
  if (!ID.test(id) || !FILE.test(file) || file.includes("..")) return badRequest("id and an .srt or .vtt file are required")
  const r = await getCaptions(id, file)
  if (!r.ok) return respond(r)
  return new Response(r.data, {
    headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  })
}
