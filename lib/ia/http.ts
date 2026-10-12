import "server-only"

export type IAErrorKind = "rate_limited" | "unavailable" | "not_found" | "network" | "bad_response"
export type IAError = { kind: IAErrorKind; status?: number; retryAfter?: number }
export type Result<T> = { ok: true; data: T } | { ok: false; error: IAError }

// archive.org/developers/bots.html asks for a descriptive User-Agent.
const USER_AGENT = "InternetArchiveRedesignConcept/0.1 (unofficial redesign concept; read-only)"
const TIMEOUT_MS = 10_000
const MAX_INLINE_WAIT_S = 3

const blockedUntil = new Map<string, number>()

class IAFetchError extends Error {
  readonly info: IAError
  constructor(info: IAError) {
    super(`ia:${info.kind}:${info.status ?? ""}:${info.retryAfter ?? ""}`)
    this.info = info
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function parseRetryAfter(header: string | null, now = Date.now()): number | undefined {
  if (!header) return undefined
  const s = Number(header)
  if (Number.isFinite(s)) return Math.max(0, Math.ceil(s))
  const at = Date.parse(header)
  return Number.isNaN(at) ? undefined : Math.max(0, Math.ceil((at - now) / 1000))
}

// Throws IAFetchError; the cached callers catch it with attempt() and return a Result.
async function request(url: string, accept: string, timeoutMs: number): Promise<Response> {
  // QA only: IA_SIMULATE_ERROR=429|503|network forces failures in `next dev` (ignored in production).
  const simulate = process.env.NODE_ENV !== "production" ? process.env.IA_SIMULATE_ERROR : undefined
  if (simulate === "429") throw new IAFetchError({ kind: "rate_limited", status: 429, retryAfter: 30 })
  if (simulate === "503") throw new IAFetchError({ kind: "unavailable", status: 503 })
  if (simulate === "network") throw new IAFetchError({ kind: "network" })

  const host = new URL(url).host
  const until = blockedUntil.get(host) ?? 0
  if (until > Date.now()) {
    throw new IAFetchError({ kind: "rate_limited", status: 429, retryAfter: Math.ceil((until - Date.now()) / 1000) })
  }

  for (let attempt = 0; ; attempt++) {
    let res: Response
    try {
      res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: accept },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch {
      throw new IAFetchError({ kind: "network" })
    }

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(res.headers.get("retry-after")) ?? 30
      if (attempt === 0 && retryAfter <= MAX_INLINE_WAIT_S) {
        await sleep(retryAfter * 1000)
        continue
      }
      blockedUntil.set(host, Date.now() + retryAfter * 1000)
      throw new IAFetchError({ kind: "rate_limited", status: 429, retryAfter })
    }
    if (res.status === 404) throw new IAFetchError({ kind: "not_found", status: 404 })
    if (res.status >= 500) throw new IAFetchError({ kind: "unavailable", status: res.status })
    if (!res.ok) throw new IAFetchError({ kind: "bad_response", status: res.status })

    return res
  }
}

export async function getJson<T>(url: string, timeoutMs = TIMEOUT_MS): Promise<T> {
  const res = await request(url, "application/json", timeoutMs)
  try {
    return (await res.json()) as T
  } catch {
    throw new IAFetchError({ kind: "bad_response", status: res.status })
  }
}

export async function getText(url: string, timeoutMs = TIMEOUT_MS): Promise<string> {
  return (await request(url, "text/plain, */*", timeoutMs)).text()
}

export const toIAError = (e: unknown): IAError => (e instanceof IAFetchError ? e.info : { kind: "network" })

/** Runs inside each "use cache" scope, so errors become data before they could cross the cache boundary. */
export async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    // Anything that is not an upstream failure is a bug; keep it visible in the server log.
    if (!(e instanceof IAFetchError)) console.error("[lib/ia] unexpected error", e)
    return { ok: false, error: toIAError(e) }
  }
}

export const badResponse = () => new IAFetchError({ kind: "bad_response" })
