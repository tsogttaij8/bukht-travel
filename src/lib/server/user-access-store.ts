import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"
import { legacyRoleFromRoles, mapUser, nameFromEmail, normalizeUserRoles, type StoredUser, type UserRow } from "./user-model"
import { replaceUserRoles } from "./user-role-store"

const userSelect = "id, clerk_user_id, name, email, role, status, created_at"

export async function upsertStaffUser(input: {
  email: string
  name: string
  roles: string[]
  status?: "active" | "disabled"
}): Promise<StoredUser> {
  const email = input.email.trim().toLowerCase()
  const name = input.name.trim() || nameFromEmail(email)
  const roles = normalizeUserRoles(input.roles)
  const status = input.status === "disabled" ? "disabled" : "active"
  const legacyRole = legacyRoleFromRoles(roles)
  const createdAt = new Date().toISOString()

  if (isSupabaseEnabled()) {
    try {
      const user = await upsertSupabaseStaff({ email, name, legacyRole, status, createdAt })
      await replaceUserRoles(user.id, roles)
      return mapUser(user, roles)
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving staff user to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserRow>(
    `INSERT INTO users (id, name, email, role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status
     RETURNING id, clerk_user_id, name, email, role, status, created_at`,
    [randomUUID(), name, email, legacyRole, status, createdAt]
  )
  await replaceUserRoles(result.rows[0].id, roles, true)
  return mapUser(result.rows[0], roles)
}

export async function updateUserAccess(input: {
  userId: string
  name?: string
  roles: string[]
  status: "active" | "disabled"
}): Promise<StoredUser | null> {
  const roles = normalizeUserRoles(input.roles)
  const status = input.status === "disabled" ? "disabled" : "active"
  const legacyRole = legacyRoleFromRoles(roles)

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const updates: Record<string, string> = { role: legacyRole, status }
      if (input.name?.trim()) updates.name = input.name.trim()
      const { data, error } = await supabase.from("users").update(updates).eq("id", input.userId).select(userSelect).maybeSingle()
      if (error) throw error
      if (!data) return null
      await replaceUserRoles(data.id, roles)
      return mapUser(data, roles)
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Updating staff user in local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserRow>(
    `UPDATE users
     SET name = COALESCE(NULLIF($2, ''), name), role = $3, status = $4
     WHERE id = $1
     RETURNING id, clerk_user_id, name, email, role, status, created_at`,
    [input.userId, input.name?.trim() ?? "", legacyRole, status]
  )
  if (!result.rows[0]) return null
  await replaceUserRoles(result.rows[0].id, roles, true)
  return mapUser(result.rows[0], roles)
}

async function upsertSupabaseStaff(input: {
  email: string
  name: string
  legacyRole: string
  status: string
  createdAt: string
}): Promise<UserRow> {
  const supabase = getSupabaseAdmin()
  const { data: existing, error: existingError } = await supabase.from("users").select("id").eq("email", input.email).maybeSingle()
  if (existingError) throw existingError
  const query = existing
    ? supabase.from("users").update({ name: input.name, role: input.legacyRole, status: input.status }).eq("id", existing.id).select(userSelect).single()
    : supabase.from("users").insert({ id: randomUUID(), name: input.name, email: input.email, role: input.legacyRole, status: input.status, created_at: input.createdAt }).select(userSelect).single()
  const { data, error } = await query
  if (error) throw error
  return data as UserRow
}
