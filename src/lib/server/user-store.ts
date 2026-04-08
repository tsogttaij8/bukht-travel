import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type UserRole = "user" | "developer"

export type StoredUser = {
  id: string
  name: string
  email: string
  role: UserRole
  passwordHash?: string
  createdAt: string
}

type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
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

export async function readUsers(): Promise<StoredUser[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === "developer" ? "developer" : "user",
      createdAt: user.created_at,
    }))
  }

  const db = await getDb()
  const result = await db.query<UserRow>(
    `SELECT id, name, email, role, created_at
     FROM users
     ORDER BY created_at DESC`
  )

  return result.rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "developer" ? "developer" : "user",
    createdAt: user.created_at,
  }))
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: deleteError } = await supabase.from("users").delete().neq("id", "")
    if (deleteError) throw deleteError

    if (users.length === 0) return

    const { error: insertError } = await supabase.from("users").insert(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        role: user.role,
        created_at: user.createdAt,
      }))
    )

    if (insertError) throw insertError
    return
  }

  const db = await getDb()
  await db.exec("DELETE FROM users")

  for (const user of users) {
    await db.query(
      `INSERT INTO users (id, name, email, role, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, user.name, user.email.trim().toLowerCase(), user.role, user.createdAt]
    )
  }
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalizedEmail = email.trim().toLowerCase()

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .eq("email", normalizedEmail)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role === "developer" ? "developer" : "user",
        createdAt: data.created_at,
      }
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Falling back to local user DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserRow>(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [normalizedEmail]
  )

  const user = result.rows[0]
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "developer" ? "developer" : "user",
    createdAt: user.created_at,
  }
}

export function isAdminEmail(email: string): boolean {
  const adminList = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return adminList.includes(email.trim().toLowerCase())
}

export function roleFromEmail(email: string): UserRole {
  return isAdminEmail(email) ? "developer" : "user"
}

export function nameFromEmail(email: string): string {
  return email.split("@")[0]?.trim() || "User"
}

export async function upsertUserByEmail(input: { email: string; name?: string }): Promise<StoredUser> {
  const email = input.email.trim().toLowerCase()
  const role = roleFromEmail(email)
  const name = input.name?.trim() || nameFromEmail(email)
  const createdAt = new Date().toISOString()

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert({
          id: randomUUID(),
          name,
          email,
          role,
          created_at: createdAt,
        })
        .select("id, name, email, role, created_at")
        .single()

      if (!insertError && inserted) {
        return {
          id: inserted.id,
          name: inserted.name,
          email: inserted.email,
          role: inserted.role === "developer" ? "developer" : "user",
          createdAt: inserted.created_at,
        }
      }

      if (insertError?.code !== "23505") throw insertError

      const { error: updateError } = await supabase
        .from("users")
        .update({ name, role })
        .eq("email", email)

      if (updateError) throw updateError

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, created_at")
        .eq("email", email)
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role === "developer" ? "developer" : "user",
        createdAt: data.created_at,
      }
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving user to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserRow>(
    `INSERT INTO users (id, name, email, role, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
     RETURNING id, name, email, role, created_at`,
    [randomUUID(), name, email, role, createdAt]
  )

  const user = result.rows[0]
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "developer" ? "developer" : "user",
    createdAt: user.created_at,
  }
}
