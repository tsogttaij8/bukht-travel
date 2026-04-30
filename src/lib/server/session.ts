import { createHmac } from "node:crypto"
import { userRoles, type LegacyUserRole, type UserRole } from "./user-store"

export type SessionPayload = {
  name: string
  email: string
  role: LegacyUserRole
  roles: UserRole[]
  exp: number
}

const SESSION_COOKIE_NAME = "buhkt_session"
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7
const SESSION_SECRET = process.env.SESSION_SECRET ?? "buhkt-dev-secret-change-me"

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url")
}

function isUserRole(role: string): role is UserRole {
  return (userRoles as readonly string[]).includes(role)
}

function normalizeSessionRoles(roles: unknown, legacyRole?: string): UserRole[] {
  const parsedRoles = Array.isArray(roles) ? roles.filter((role): role is UserRole => typeof role === "string" && isUserRole(role)) : []
  const unique = Array.from(new Set(parsedRoles))
  if (unique.length > 0) return unique
  return legacyRole === "developer" ? ["owner"] : ["customer"]
}

function legacyRoleFromRoles(roles: UserRole[]): LegacyUserRole {
  return roles.some((role) => role !== "customer") ? "developer" : "user"
}

export function createSessionToken(name: string, email: string, roles: UserRole[]): string {
  const normalizedRoles = normalizeSessionRoles(roles)
  const payload: SessionPayload = {
    name,
    email,
    role: legacyRoleFromRoles(normalizedRoles),
    roles: normalizedRoles,
    exp: Date.now() + SESSION_AGE_SECONDS * 1000,
  }

  const encoded = toBase64Url(JSON.stringify(payload))
  const signature = sign(encoded)

  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  if (sign(encoded) !== signature) return null

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SessionPayload
    if (!payload?.email || !payload?.name || !payload?.exp) return null
    const roles = normalizeSessionRoles(payload.roles, payload.role)
    const role = legacyRoleFromRoles(roles)
    if (Date.now() > payload.exp) return null
    return { ...payload, role, roles }
  } catch {
    return null
  }
}

export function readSessionFromCookieHeader(cookieHeader: string): SessionPayload | null {
  const tokenMatch = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionConfig.name}=`))

  const token = tokenMatch?.split("=").slice(1).join("=") ?? ""
  if (!token) return null

  return verifySessionToken(token)
}

export const sessionConfig = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_AGE_SECONDS,
}

export function sessionHasRole(session: Pick<SessionPayload, "roles">, role: UserRole): boolean {
  return session.roles.includes(role)
}

export function sessionHasAnyRole(session: Pick<SessionPayload, "roles">, roles: UserRole[]): boolean {
  return roles.some((role) => sessionHasRole(session, role))
}

export function sessionCanAccessAdmin(session: Pick<SessionPayload, "roles">): boolean {
  return sessionHasAnyRole(session, ["owner", "cargo_staff", "travel_staff", "esim_staff", "finance_staff", "support_staff"])
}
