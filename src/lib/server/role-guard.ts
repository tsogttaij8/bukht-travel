import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { roleHomePath } from "../role-path"
import { sessionConfig, sessionHasRole, verifySessionToken, type SessionPayload } from "./session"
import { findUserByEmail } from "./user-store"
import type { UserRole } from "./user-store"

export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = await refreshSession(token ? verifySessionToken(token) : null)

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(roleHomePath([role]))}`)
  }

  if (!sessionHasRole(session, role)) {
    redirect(roleHomePath(session.roles))
  }

  return session
}

export async function requireAnyStaffRole(): Promise<SessionPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = await refreshSession(token ? verifySessionToken(token) : null)

  if (!session) {
    redirect("/login")
  }

  const path = roleHomePath(session.roles)
  if (path === "/account") {
    redirect("/login")
  }

  return session
}

async function refreshSession(session: SessionPayload | null): Promise<SessionPayload | null> {
  if (!session) return null
  try {
    const user = await findUserByEmail(session.email)
    if (!user || user.status === "disabled") return session
    return { ...session, name: user.name, email: user.email, role: user.role, roles: user.roles }
  } catch {
    return session
  }
}
