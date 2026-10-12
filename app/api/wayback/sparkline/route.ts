import type { NextRequest } from "next/server"
import { badRequest, respond } from "@/lib/ia/respond"
import { getSparkline } from "@/lib/ia/wayback"
import { looksLikeUrl } from "@/lib/url"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? ""
  if (url.length > 2048 || !looksLikeUrl(url)) return badRequest("url must be a web address")
  return respond(await getSparkline(url.trim()))
}
