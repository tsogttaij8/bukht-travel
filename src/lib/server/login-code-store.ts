import { createHash, randomInt } from "node:crypto"
import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

type LoginCodeRow = {
  email: string
  code_hash: string
  expires_at: number
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

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: deleteError } = await supabase
      .from("login_codes")
      .delete()
      .or(`expires_at.lte.${now},email.eq.${normalizedEmail}`)

    if (deleteError) throw deleteError

    const { error: insertError } = await supabase.from("login_codes").insert({
      email: normalizedEmail,
      code_hash: hashCode(normalizedEmail, code),
      expires_at: now + ttlMs,
    })

    if (insertError) throw insertError
    return
  }

  const db = await getDb()

  await db.query("DELETE FROM login_codes WHERE expires_at <= $1 OR email = $2", [now, normalizedEmail])
  await db.query(
    `INSERT INTO login_codes (email, code_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [normalizedEmail, hashCode(normalizedEmail, code), now + ttlMs]
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
      .select("email, code_hash, expires_at")
      .eq("email", normalizedEmail)
      .eq("code_hash", targetHash)
      .gt("expires_at", now)
      .maybeSingle()

    if (error) throw error
    if (!data) return false

    const { error: deleteError } = await supabase
      .from("login_codes")
      .delete()
      .eq("email", normalizedEmail)
      .eq("code_hash", targetHash)

    if (deleteError) throw deleteError
    return true
  }

  const db = await getDb()

  await db.query("DELETE FROM login_codes WHERE expires_at <= $1", [now])

  const result = await db.query<LoginCodeRow>(
    `SELECT email, code_hash, expires_at
     FROM login_codes
     WHERE email = $1 AND code_hash = $2 AND expires_at > $3
     LIMIT 1`,
    [normalizedEmail, targetHash, now]
  )

  const matched = result.rows[0]

  if (matched) {
    await db.query("DELETE FROM login_codes WHERE email = $1 AND code_hash = $2", [normalizedEmail, targetHash])
    return true
  }

  return false
}
