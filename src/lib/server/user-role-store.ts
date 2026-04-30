import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"
import { isUserRole, normalizeRoles, type UserRole, type UserRoleRow } from "./user-model"

export async function readRolesByUserIds(userIds: string[], forceLocal = false): Promise<Map<string, UserRole[]>> {
  const rolesByUserId = new Map<string, UserRole[]>()
  if (userIds.length === 0) return rolesByUserId

  if (isSupabaseEnabled() && !forceLocal) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
    if (error) throw error
    for (const row of data ?? []) addRole(rolesByUserId, row.user_id, row.role)
    return rolesByUserId
  }

  const db = await getDb()
  const result = await db.query<UserRoleRow>(
    `SELECT user_id, role
     FROM user_roles
     WHERE user_id = ANY($1)`,
    [userIds]
  )
  for (const row of result.rows) addRole(rolesByUserId, row.user_id, row.role)
  return rolesByUserId
}

export async function ensureUserRoles(userId: string, roles: UserRole[], forceLocal = false): Promise<void> {
  const normalizedRoles = normalizeRoles(roles, ["customer"])

  if (isSupabaseEnabled() && !forceLocal) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("user_roles").upsert(
      normalizedRoles.map((role) => ({ user_id: userId, role, created_at: new Date().toISOString() }))
    )
    if (error) throw error
    return
  }

  const db = await getDb()
  for (const role of normalizedRoles) {
    await db.query(
      `INSERT INTO user_roles (user_id, role, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, role) DO NOTHING`,
      [userId, role, new Date().toISOString()]
    )
  }
}

export async function replaceUserRoles(userId: string, roles: UserRole[], forceLocal = false): Promise<void> {
  const normalizedRoles = normalizeRoles(roles, ["customer"])

  if (isSupabaseEnabled() && !forceLocal) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId)
    if (error) throw error
    await ensureUserRoles(userId, normalizedRoles)
    return
  }

  const db = await getDb()
  await db.query("DELETE FROM user_roles WHERE user_id = $1", [userId])
  await ensureUserRoles(userId, normalizedRoles, true)
}

export async function writeUserRoles(inputs: Array<{ userId: string; roles: UserRole[] }>, forceLocal = false): Promise<void> {
  for (const input of inputs) await ensureUserRoles(input.userId, input.roles, forceLocal)
}

function addRole(target: Map<string, UserRole[]>, userId: string, role: string): void {
  if (!isUserRole(role)) return
  target.set(userId, [...(target.get(userId) ?? []), role])
}

