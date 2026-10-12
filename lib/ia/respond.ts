import "server-only"
import type { Result } from "./http.ts"

const STATUS = { rate_limited: 429, not_found: 404, unavailable: 503, network: 502, bad_response: 502 } as const

/** JSON for the client-side proxies: the Result body, with an HTTP status that matches it. */
export function respond<T>(r: Result<T>): Response {
  if (r.ok) return Response.json(r, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } })
  const headers: Record<string, string> = { "Cache-Control": "no-store" }
  if (r.error.retryAfter) headers["Retry-After"] = String(r.error.retryAfter)
  return Response.json(r, { status: STATUS[r.error.kind], headers })
}

export const badRequest = (message: string) => Response.json({ ok: false, error: { kind: "bad_request", message } }, { status: 400 })
