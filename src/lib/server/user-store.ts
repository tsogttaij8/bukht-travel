import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"
import {
  legacyRoleFromRoles,
  mapUser,
  nameFromEmail,
  type LegacyUserRole,
  type StoredUser,
  type UserRow,
  type UserRole,
} from "./user-model"
import { ensureUserRoles, readRolesByUserIds, writeUserRoles } from "./user-role-store"

export type { LegacyUserRole, StoredUser, UserRole } from "./user-model"
export { canAccessAdmin, hasAnyRole, hasRole, nameFromEmail, normalizeUserRoles, userRoles } from "./user-model"
export { updateUserAccess, upsertStaffUser } from "./user-access-store"

const userSelect = "id, clerk_user_id, name, email, role, status, created_at"
const bootstrapAdminEmails = ["tsogttaij8@gmail.com"]

export async function readUsers(): Promise<StoredUser[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("users").select(userSelect).order("created_at", { ascending: false })
    if (error) throw error
    const rolesByUserId = await readRolesByUserIds((data ?? []).map((user) => user.id))
    return (data ?? []).map((user) => mapUser(user, rolesByUserId.get(user.id) ?? []))
  }

  const db = await getDb()
  const result = await db.query<UserRow>(`SELECT ${userSelect} FROM users ORDER BY created_at DESC`)
  const rolesByUserId = await readRolesByUserIds(result.rows.map((user) => user.id), true)
  return result.rows.map((user) => mapUser(user, rolesByUserId.get(user.id) ?? []))
}

export async function writeUsers(users: StoredUser[]): Promise<void> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error: rolesDeleteError } = await supabase.from("user_roles").delete().neq("user_id", "")
    if (rolesDeleteError) throw rolesDeleteError
    const { error: deleteError } = await supabase.from("users").delete().neq("id", "")
    if (deleteError) throw deleteError
    if (users.length === 0) return
    const { error: insertError } = await supabase.from("users").insert(users.map(toUserInsert))
    if (insertError) throw insertError
    await writeUserRoles(users.map((user) => ({ userId: user.id, roles: user.roles })))
    return
  }

  const db = await getDb()
  await db.exec("DELETE FROM user_roles")
  await db.exec("DELETE FROM users")
  for (const user of users) {
    await db.query(
      `INSERT INTO users (id, clerk_user_id, name, email, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, user.clerkUserId ?? null, user.name, user.email.trim().toLowerCase(), legacyRoleFromRoles(user.roles), user.status, user.createdAt]
    )
  }
  await writeUserRoles(users.map((user) => ({ userId: user.id, roles: user.roles })), true)
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalizedEmail = email.trim().toLowerCase()

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("users").select(userSelect).eq("email", normalizedEmail).maybeSingle()
      if (error) throw error
      if (!data) return null
      const rolesByUserId = await readRolesByUserIds([data.id])
      const roles = rolesByUserId.get(data.id) ?? []
      if (isAdminEmail(normalizedEmail) && !roles.includes("owner")) {
        await ensureUserRoles(data.id, ["owner"])
        return mapUser(data, ["owner"])
      }
      return mapUser(data, roles)
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Falling back to local user DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserRow>(`SELECT ${userSelect} FROM users WHERE email = $1 LIMIT 1`, [normalizedEmail])
  const user = result.rows[0]
  if (!user) return null
  const rolesByUserId = await readRolesByUserIds([user.id], true)
  const roles = rolesByUserId.get(user.id) ?? []
  if (isAdminEmail(normalizedEmail) && !roles.includes("owner")) {
    await ensureUserRoles(user.id, ["owner"], true)
    return mapUser(user, ["owner"])
  }
  return mapUser(user, roles)
}

export function isAdminEmail(email: string): boolean {
  const adminList = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .concat(bootstrapAdminEmails)
  return adminList.includes(email.trim().toLowerCase())
}

export function roleFromEmail(email: string): LegacyUserRole {
  return isAdminEmail(email) ? "developer" : "user"
}

export async function upsertUserByEmail(input: { email: string; name?: string }): Promise<StoredUser> {
  const email = input.email.trim().toLowerCase()
  const defaultRoles: UserRole[] = isAdminEmail(email) ? ["owner"] : ["customer"]
  const role = legacyRoleFromRoles(defaultRoles)
  const name = input.name?.trim() || nameFromEmail(email)
  const createdAt = new Date().toISOString()

  if (isSupabaseEnabled()) {
    try {
      return await upsertSupabaseUser({ email, name, role, defaultRoles, createdAt })
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving user to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const result = await db.query<UserRow>(
    `INSERT INTO users (id, name, email, role, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email)
     DO UPDATE SET name = EXCLUDED.name
     RETURNING ${userSelect}`,
    [randomUUID(), name, email, role, "active", createdAt]
  )
  const user = result.rows[0]
  const roles = (await readRolesByUserIds([user.id], true)).get(user.id) ?? defaultRoles
  if (defaultRoles.includes("owner") && !roles.includes("owner")) {
    await ensureUserRoles(user.id, defaultRoles, true)
    return mapUser(user, defaultRoles)
  }
  await ensureUserRoles(user.id, roles, true)
  return mapUser(user, roles)
}

async function upsertSupabaseUser(input: {
  email: string
  name: string
  role: LegacyUserRole
  defaultRoles: UserRole[]
  createdAt: string
}): Promise<StoredUser> {
  const supabase = getSupabaseAdmin()
  const { data: inserted, error: insertError } = await supabase.from("users").insert({
    id: randomUUID(),
    name: input.name,
    email: input.email,
    role: input.role,
    status: "active",
    created_at: input.createdAt,
  }).select(userSelect).single()
  if (!insertError && inserted) {
    await ensureUserRoles(inserted.id, input.defaultRoles)
    return mapUser(inserted, input.defaultRoles)
  }
  if (insertError?.code !== "23505") throw insertError
  const { error: updateError } = await supabase.from("users").update({ name: input.name }).eq("email", input.email)
  if (updateError) throw updateError
  const { data, error } = await supabase.from("users").select(userSelect).eq("email", input.email).single()
  if (error) throw error
  const roles = (await readRolesByUserIds([data.id])).get(data.id) ?? input.defaultRoles
  await ensureUserRoles(data.id, roles)
  return mapUser(data, roles)
}

function toUserInsert(user: StoredUser) {
  return {
    id: user.id,
    clerk_user_id: user.clerkUserId ?? null,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    role: legacyRoleFromRoles(user.roles),
    status: user.status,
    created_at: user.createdAt,
  }
}
