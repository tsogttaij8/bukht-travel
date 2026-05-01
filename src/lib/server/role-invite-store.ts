import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { findUserByEmail, updateUserAccess } from "./user-store"
import { normalizeUserRoles, type UserRole } from "./user-model"

export type RoleInvite = {
  id: string
  token: string
  email: string
  roles: UserRole[]
  invitedByEmail: string
  status: "pending" | "accepted"
  createdAt: string
  acceptedAt: string | null
}

type RoleInviteRow = {
  id: string
  token: string
  email: string
  roles: string
  invited_by_email: string
  status: "pending" | "accepted"
  created_at: string
  accepted_at: string | null
}

export async function createRoleInvite(input: { email: string; roles: string[]; invitedByEmail: string }): Promise<RoleInvite> {
  const db = await getDb()
  const now = new Date().toISOString()
  const roles = normalizeUserRoles(input.roles)
  const result = await db.query<RoleInviteRow>(
    `INSERT INTO role_invites (id, token, email, roles, invited_by_email, status, created_at, accepted_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, NULL)
     RETURNING id, token, email, roles, invited_by_email, status, created_at, accepted_at`,
    [randomUUID(), randomUUID(), input.email.trim().toLowerCase(), JSON.stringify(roles), input.invitedByEmail.trim().toLowerCase(), now]
  )
  return mapInvite(result.rows[0])
}

export async function findRoleInviteByToken(token: string): Promise<RoleInvite | null> {
  const db = await getDb()
  const result = await db.query<RoleInviteRow>(
    `SELECT id, token, email, roles, invited_by_email, status, created_at, accepted_at FROM role_invites WHERE token = $1 LIMIT 1`,
    [token]
  )
  return result.rows[0] ? mapInvite(result.rows[0]) : null
}

export async function acceptRoleInvite(token: string, sessionEmail: string): Promise<RoleInvite | null> {
  const invite = await findRoleInviteByToken(token)
  if (!invite || invite.status !== "pending") return null
  if (invite.email !== sessionEmail.trim().toLowerCase()) return null

  const user = await findUserByEmail(invite.email)
  if (!user) return null
  await updateUserAccess({ userId: user.id, name: user.name, roles: invite.roles, status: "active" })

  const db = await getDb()
  const result = await db.query<RoleInviteRow>(
    `UPDATE role_invites SET status = 'accepted', accepted_at = $2 WHERE token = $1
     RETURNING id, token, email, roles, invited_by_email, status, created_at, accepted_at`,
    [token, new Date().toISOString()]
  )
  return result.rows[0] ? mapInvite(result.rows[0]) : null
}

function mapInvite(row: RoleInviteRow): RoleInvite {
  return {
    id: row.id,
    token: row.token,
    email: row.email,
    roles: normalizeUserRoles(readRoles(row.roles)),
    invitedByEmail: row.invited_by_email,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  }
}

function readRoles(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}
