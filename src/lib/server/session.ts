import { createHmac } from "node:crypto"
import type { UserRole } from "./user-store"

export type SessionPayload = {
  name: string
  email: string
  role: UserRole
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

export function createSessionToken(name: string, email: string, role: UserRole): string {
  const payload: SessionPayload = {
    name,
    email,
    role,
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
    if (!payload?.email || !payload?.name || !payload?.exp || !payload?.role) return null
    if (payload.role !== "user" && payload.role !== "developer") return null
    if (Date.now() > payload.exp) return null
    return payload
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
