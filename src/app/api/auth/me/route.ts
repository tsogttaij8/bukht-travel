import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { ensureUserProfile, findUserProfileByEmail } from "../../../../lib/server/customer-store"
import { createSessionToken, readSessionFromCookieHeader, sessionConfig, type SessionPayload } from "../../../../lib/server/session"
import { findUserByEmail, isAdminEmail, upsertUserByEmail, type StoredUser, type UserRole } from "../../../../lib/server/user-store"

export async function GET(request: Request): Promise<NextResponse> {
  const payload = readSessionFromCookieHeader(request.headers.get("cookie") ?? "") ?? (await clerkPayload())

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

async function clerkPayload(): Promise<SessionPayload | null> {
  const { userId } = await auth()
  if (!userId) return null
  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  if (!email) return null

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0]
  const user = await syncUser(email, name)
  return { name: user.name, email: user.email, role: user.role, roles: user.roles, exp: Date.now() + sessionConfig.maxAge * 1000 }
}

async function syncUser(email: string, name: string): Promise<StoredUser> {
  try {
    const user = await upsertUserByEmail({ email, name })
    await ensureUserProfile(user)
    return user
  } catch (error) {
    console.error("Using Clerk session without local profile because persistence failed.", error)
    const roles: UserRole[] = isAdminEmail(email) ? ["owner"] : ["customer"]
    return { id: `clerk:${email}`, name, email: email.trim().toLowerCase(), role: roles.includes("owner") ? "developer" : "user", roles, status: "active", createdAt: new Date().toISOString() }
  }
}

async function readProfile(email: string) {
  try {
    const user = await findUserByEmail(email)
    return user ? (await findUserProfileByEmail(email)) ?? (await ensureUserProfile(user)) : null
  } catch (error) {
    console.error("Account profile skipped because persistence failed.", error)
    return null
  }
}

function sessionUser(payload: SessionPayload) {
  return { name: payload.name, email: payload.email, role: payload.role, roles: payload.roles }
}
