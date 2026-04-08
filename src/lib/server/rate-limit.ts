import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

type RateLimitRow = {
  allowed: boolean
  count: number
  reset_at: number
}

type SupabaseRateLimitRow = {
  allowed: boolean
  remaining: number
  retry_after_ms: number
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown }
    const parts = [
      typeof maybeError.message === "string" ? maybeError.message : "",
      typeof maybeError.details === "string" ? maybeError.details : "",
      typeof maybeError.hint === "string" ? maybeError.hint : "",
      typeof maybeError.code === "string" ? `code: ${maybeError.code}` : "",
    ].filter(Boolean)
    if (parts.length > 0) return parts.join(" | ")
  }
  return "Unknown error"
}

function shouldFallbackToLocalDb(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase()

  return (
    message.includes("fetch failed") ||
    message.includes("getaddrinfo enotfound") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("network") ||
    message.includes("dns") ||
    message.includes("consume_rate_limit") ||
    message.includes("could not find the function") ||
    message.includes("rpc")
  )
}

export function readClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()

  return forwardedFor || realIp || "unknown"
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now()

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.rpc("consume_rate_limit", {
        input_key: key,
        input_limit: limit,
        input_now: now,
        input_window_ms: windowMs,
      })

      if (error) throw error

      const row = Array.isArray(data) ? (data[0] as SupabaseRateLimitRow | undefined) : undefined
      return {
        ok: row?.allowed ?? false,
        remaining: row?.remaining ?? 0,
        retryAfterMs: row?.retry_after_ms ?? 0,
      }
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Falling back to local rate limit DB because Supabase RPC is unavailable.", error)
    }
  }

  const db = await getDb()
  await db.query("DELETE FROM rate_limits WHERE reset_at <= $1", [now])

  const result = await db.query<RateLimitRow>(
    `WITH existing AS (
       SELECT key, count, reset_at
       FROM rate_limits
       WHERE key = $1
     ),
     upserted AS (
       INSERT INTO rate_limits AS rl (key, count, reset_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (key)
       DO UPDATE SET
         count = CASE
           WHEN rl.reset_at <= $3 THEN 1
           WHEN rl.count < $4 THEN rl.count + 1
           ELSE rl.count
         END,
         reset_at = CASE
           WHEN rl.reset_at <= $3 THEN $2
           ELSE rl.reset_at
         END
       RETURNING count, reset_at
     )
     SELECT
       CASE
         WHEN existing.key IS NULL THEN true
         WHEN existing.reset_at <= $3 THEN true
         WHEN existing.count < $4 THEN true
         ELSE false
       END AS allowed,
       upserted.count,
       upserted.reset_at
     FROM upserted
     LEFT JOIN existing ON true`,
    [key, now + windowMs, now, limit]
  )

  const row = result.rows[0]
  const ok = row.allowed
  const retryAfterMs = ok ? 0 : Math.max(row.reset_at - now, 0)

  return {
    ok,
    remaining: ok ? Math.max(limit - row.count, 0) : 0,
    retryAfterMs,
  }
}
