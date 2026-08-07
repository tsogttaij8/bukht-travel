import { createHmac, timingSafeEqual } from "node:crypto"
import { userRoles, type LegacyUserRole, type UserRole } from "./user-store"

export type SessionPayload = {
  name: string
  email: string
  role: LegacyUserRole
  roles: UserRole[]
  exp: number
}

const SESSION_COOKIE_NAME = "buhkt_session"
const LOGOUT_MARKER_COOKIE_NAME = "buhkt_logged_out"
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7
const LOGOUT_MARKER_AGE_SECONDS = 60 * 5
const DEVELOPMENT_SESSION_SECRET = "buhkt-dev-secret-change-me"
const MIN_PRODUCTION_SECRET_LENGTH = 43

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url")
}

function getSessionSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET?.trim() ?? ""

  if (process.env.NODE_ENV === "development") {
    return configuredSecret || DEVELOPMENT_SESSION_SECRET
  }

  if (
    !configuredSecret ||
    configuredSecret === DEVELOPMENT_SESSION_SECRET ||
    configuredSecret.length < MIN_PRODUCTION_SECRET_LENGTH
  ) {
    throw new Error("SESSION_SECRET_CONFIGURATION_ERROR")
  }

  return configuredSecret
}

function signaturesMatch(expected: string, actual: string): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(actual)) return false

  try {
    const expectedBuffer = Buffer.from(expected, "base64url")
    const actualBuffer = Buffer.from(actual, "base64url")
    return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
  } catch {
    return false
  }
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
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [encoded, signature] = parts
  if (!encoded || !signature) return null

  try {
    if (!signaturesMatch(sign(encoded), signature)) return null
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
  logoutMarkerName: LOGOUT_MARKER_COOKIE_NAME,
  maxAge: SESSION_AGE_SECONDS,
  logoutMarkerMaxAge: LOGOUT_MARKER_AGE_SECONDS,
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
