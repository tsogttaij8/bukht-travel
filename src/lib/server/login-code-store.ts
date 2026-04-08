import { createHash, randomInt } from "node:crypto"
import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

type LoginCodeRow = {
  email: string
  code_hash: string
  expires_at: number
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
    message.includes("dns")
  )
}

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex")
}

export function generateLoginCode(): string {
  return String(randomInt(100000, 1000000))
}

export async function saveLoginCode(email: string, code: string, ttlMs = 10 * 60 * 1000): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const now = Date.now()
  const codeHash = hashCode(normalizedEmail, code)
  const expiresAt = now + ttlMs

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error: cleanupError } = await supabase.from("login_codes").delete().lte("expires_at", now)
      if (cleanupError) throw cleanupError

      const { error: upsertError } = await supabase.from("login_codes").upsert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
      }, { onConflict: "email" })

      if (upsertError) throw upsertError
      return
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving login code to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()

  await db.query("DELETE FROM login_codes WHERE expires_at <= $1", [now])
  await db.query(
    `INSERT INTO login_codes (email, code_hash, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (email)
     DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at`,
    [normalizedEmail, codeHash, expiresAt]
  )
}

export async function verifyAndConsumeLoginCode(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  const now = Date.now()
  const targetHash = hashCode(normalizedEmail, code)

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: cleanupError } = await supabase.from("login_codes").delete().lte("expires_at", now)
    if (cleanupError) throw cleanupError

    const { data, error } = await supabase
      .from("login_codes")
      .delete()
      .select("email")
      .eq("email", normalizedEmail)
      .eq("code_hash", targetHash)
      .gt("expires_at", now)
      .limit(1)

    if (error) throw error
    return Boolean(data?.length)
  }

  const db = await getDb()

  await db.query("DELETE FROM login_codes WHERE expires_at <= $1", [now])

  const result = await db.query<LoginCodeRow>(
    `DELETE FROM login_codes
     WHERE email = $1 AND code_hash = $2 AND expires_at > $3
     RETURNING email, code_hash, expires_at`,
    [normalizedEmail, targetHash, now]
  )

  return Boolean(result.rows[0])
}
