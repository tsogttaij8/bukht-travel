export const userRoles = ["owner", "cargo_staff", "travel_staff", "esim_staff", "finance_staff", "support_staff", "customer"] as const
export type UserRole = (typeof userRoles)[number]
export type LegacyUserRole = "user" | "developer"

export type StoredUser = {
  id: string
  clerkUserId?: string | null
  name: string
  email: string
  role: LegacyUserRole
  roles: UserRole[]
  status: "active" | "disabled"
  passwordHash?: string
  createdAt: string
}

export type UserRow = {
  id: string
  clerk_user_id?: string | null
  name: string
  email: string
  role: LegacyUserRole
  status?: "active" | "disabled"
  created_at: string
}

export type UserRoleRow = {
  user_id: string
  role: string
}

export function isUserRole(role: string): role is UserRole {
  return (userRoles as readonly string[]).includes(role)
}

export function normalizeRoles(roles: string[] | undefined, fallback: UserRole[]): UserRole[] {
  const normalized = (roles ?? []).filter(isUserRole)
  const unique = Array.from(new Set(normalized))
  return unique.length > 0 ? unique : fallback
}

export function legacyRoleFromRoles(roles: UserRole[]): LegacyUserRole {
  return roles.some((role) => role !== "customer") ? "developer" : "user"
}

export function mapUser(row: UserRow, roles: UserRole[]): StoredUser {
  const normalizedRoles = normalizeRoles(roles, row.role === "developer" ? ["owner"] : ["customer"])
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id ?? null,
    name: row.name,
    email: row.email,
    role: legacyRoleFromRoles(normalizedRoles),
    roles: normalizedRoles,
    status: row.status === "disabled" ? "disabled" : "active",
    createdAt: row.created_at,
  }
}

export function hasRole(user: Pick<StoredUser, "roles">, role: UserRole): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: Pick<StoredUser, "roles">, roles: UserRole[]): boolean {
  return roles.some((role) => hasRole(user, role))
}

export function canAccessAdmin(user: Pick<StoredUser, "roles">): boolean {
  return hasAnyRole(user, ["owner", "cargo_staff", "travel_staff", "esim_staff", "finance_staff", "support_staff"])
}

export function normalizeUserRoles(roles: string[] | undefined): UserRole[] {
  return normalizeRoles(roles, ["customer"])
}

export function nameFromEmail(email: string): string {
  return email.split("@")[0]?.trim() || "User"
}
