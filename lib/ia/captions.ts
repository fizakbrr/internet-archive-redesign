import "server-only"
import { cacheLife } from "next/cache"
import { attempt, getText, type Result } from "./http.ts"
import { downloadUrl } from "./urls.ts"

/**
 * SRT and WebVTT differ in the header and the fraction separator. archive.org's
 * auto-generated (.asr.) files use two-digit centiseconds ("00:00:03,01"); VTT needs milliseconds.
 */
export function srtToVtt(srt: string): string {
  if (srt.trimStart().startsWith("WEBVTT")) return srt
  return (
    "WEBVTT\n\n" +
    srt
      .replace(/^\uFEFF/, "")
      .replace(/\r/g, "")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{1,3})\b/g, (_, t: string, f: string) => `${t}.${f.padEnd(3, "0")}`)
  )
}

async function fetchCaptions(id: string, file: string): Promise<Result<string>> {
  "use cache"
  const r = await attempt(async () => srtToVtt(await getText(downloadUrl(id, file))))
  if (r.ok) cacheLife("hours")
  else cacheLife("failure")
  return r
}

export const getCaptions = fetchCaptions
