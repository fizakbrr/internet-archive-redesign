import type { NextRequest } from "next/server"
import { badRequest, respond } from "@/lib/ia/respond"
import { getCaptures } from "@/lib/ia/wayback"
import { looksLikeUrl } from "@/lib/url"

const STAMP = /^\d{4,14}$/

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const url = p.get("url") ?? ""
  const from = p.get("from") ?? ""
  const to = p.get("to") ?? ""
  if (url.length > 2048 || !looksLikeUrl(url)) return badRequest("url must be a web address")
  if (!STAMP.test(from) || !STAMP.test(to)) return badRequest("from and to must be timestamps like 2024 or 20240131")
  return respond(await getCaptures(url.trim(), from, to))
}
