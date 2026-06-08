import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createSessionToken, sessionConfig } from "../../../../lib/server/session"
import { ensureUserProfile } from "../../../../lib/server/customer-store"
import { findUserByEmail, upsertUserByEmail, type StoredUser } from "../../../../lib/server/user-store"

export const dynamic = "force-dynamic"

export async function POST(request: Request): Promise<NextResponse> {
  const token = readBearerToken(request.headers.get("authorization"))
  if (!token) return NextResponse.json({ code: "INVALID_SESSION" }, { status: 401 })

  const { userId } = await auth({ acceptsToken: "session_token" })
  if (!userId) return NextResponse.json({ code: "INVALID_SESSION" }, { status: 401 })

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.primaryEmailAddress?.emailAddress
  if (!email) return NextResponse.json({ message: "Email hayag oldsonggui" }, { status: 400 })

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0]
  const existing = await findUserByEmail(email).catch(() => null)
  if (!existing) return NextResponse.json({ code: "USER_NOT_REGISTERED" }, { status: 404 })

  const user = await syncUser(email, name).catch(() => null)
  if (!user) return NextResponse.json({ code: "SYNC_FAILED" }, { status: 500 })

  const response = NextResponse.json({ user: { name: user.name, email: user.email, role: user.role, roles: user.roles } })
  response.cookies.set(sessionConfig.name, createSessionToken(user.name, user.email, user.roles), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionConfig.maxAge,
  })
  response.cookies.set(sessionConfig.logoutMarkerName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return response
}

function readBearerToken(header: string | null): string {
  const [scheme, token] = header?.split(" ") ?? []
  return scheme?.toLowerCase() === "bearer" && token ? token : ""
}

async function syncUser(email: string, name: string): Promise<StoredUser> {
  const user = await upsertUserByEmail({ email, name })
  await ensureUserProfile(user)
  return user
}
