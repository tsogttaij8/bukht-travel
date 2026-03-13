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

  if (isSupabaseEnabled()) {
    const existing = await findUserByEmail(email)

    if (existing) {
      const updated: StoredUser = {
        ...existing,
        name: input.name?.trim() || existing.name || nameFromEmail(email),
        role,
      }

      const supabase = getSupabaseAdmin()
      const { error } = await supabase
        .from("users")
        .update({ name: updated.name, role: updated.role })
        .eq("email", email)

      if (error) throw error
      return updated
    }

    const created: StoredUser = {
      id: randomUUID(),
      name: input.name?.trim() || nameFromEmail(email),
      email,
      role,
      createdAt: new Date().toISOString(),
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("users").insert({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      created_at: created.createdAt,
    })

    if (error) throw error
    return created
  }

  const db = await getDb()
  const existing = await findUserByEmail(email)

  if (existing) {
    const updated: StoredUser = {
      ...existing,
      name: input.name?.trim() || existing.name || nameFromEmail(email),
      role,
    }

    await db.query(
      `UPDATE users
       SET name = $1, role = $2
       WHERE email = $3`,
      [updated.name, updated.role, email]
    )

    return updated
  }

  const created: StoredUser = {
    id: randomUUID(),
    name: input.name?.trim() || nameFromEmail(email),
    email,
    role,
    createdAt: new Date().toISOString(),
  }

  await db.query(
    `INSERT INTO users (id, name, email, role, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [created.id, created.name, created.email, created.role, created.createdAt]
  )

  return created
}
