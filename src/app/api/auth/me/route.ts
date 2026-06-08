import { NextResponse } from "next/server"
import { ensureUserProfile, findUserProfileByEmail } from "../../../../lib/server/customer-store"
import { createSessionToken, readSessionFromCookieHeader, sessionConfig, type SessionPayload } from "../../../../lib/server/session"
import { findUserByEmail, upsertUserByEmail } from "../../../../lib/server/user-store"

export const dynamic = "force-dynamic"

export async function GET(request: Request): Promise<NextResponse> {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const payload = await refreshPayload(readSessionFromCookieHeader(cookieHeader))

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const profile = await readProfile(payload.email)
  const response = NextResponse.json({ user: sessionUser(payload), profile }, { status: 200 })

  response.cookies.set(sessionConfig.name, createSessionToken(payload.name, payload.email, payload.roles), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionConfig.maxAge,
  })
  return response
}

async function refreshPayload(payload: SessionPayload | null): Promise<SessionPayload | null> {
  if (!payload) return null
  try {
    const existingUser = await findUserByEmail(payload.email)
    if (existingUser?.status === "disabled") return null
    const user = existingUser ?? (await upsertUserByEmail({ email: payload.email, name: payload.name }))
    await ensureUserProfile(user)
    return { name: user.name, email: user.email, role: user.role, roles: user.roles, exp: payload.exp }
  } catch {
    return payload
  }
}

async function readProfile(email: string) {
  try {
    const user = await findUserByEmail(email)
    return user ? (await findUserProfileByEmail(email)) ?? (await ensureUserProfile(user)) : null
  } catch {
    return null
  }
}

function sessionUser(payload: SessionPayload) {
  return { name: payload.name, email: payload.email, role: payload.role, roles: payload.roles }
}
