import { verifyToken } from "@clerk/backend"
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createSessionToken, sessionConfig } from "../../../../lib/server/session"
import { ensureUserProfile } from "../../../../lib/server/customer-store"
import { findUserByEmail, upsertUserByEmail, type StoredUser } from "../../../../lib/server/user-store"

export const dynamic = "force-dynamic"

export async function POST(request: Request): Promise<NextResponse> {
  const token = readBearerToken(request.headers.get("authorization"))
  if (!token) return NextResponse.json({ code: "INVALID_SESSION" }, { status: 401 })

  let userId = ""

  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    userId = typeof verified.sub === "string" ? verified.sub : ""
  } catch (error) {
    console.error("[clerk-sync] token verify failed", error)
    return NextResponse.json({ code: "INVALID_SESSION" }, { status: 401 })
  }

  if (!userId) return NextResponse.json({ code: "INVALID_SESSION" }, { status: 401 })

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const email = clerkUser.primaryEmailAddress?.emailAddress
  if (!email) return NextResponse.json({ message: "Email hayag oldsonggui" }, { status: 400 })

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0]
  const user = await syncUser(email, name, userId).catch((error) => {
    console.error("[clerk-sync] syncUser failed", error)
    return null
  })
  if (!user) return NextResponse.json({ code: "SYNC_FAILED" }, { status: 500 })
  if (user.status === "disabled") return NextResponse.json({ code: "USER_DISABLED", message: "User account is disabled or suspended" }, { status: 403 })

  const response = NextResponse.json({ user: { name: user.name, email: user.email, role: user.role, roles: user.roles } })
  try {
    console.error("[clerk-sync] createSessionToken start", { email: user.email, roles: user.roles })
    const sessionToken = createSessionToken(user.name, user.email, user.roles)
    console.error("[clerk-sync] createSessionToken ok", { email: user.email })
    response.cookies.set(sessionConfig.name, sessionToken, {
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
    console.error("[clerk-sync] cookie creation ok", { email: user.email })
  } catch (error) {
    console.error("[clerk-sync] createSessionToken/cookie failed", error)
    return NextResponse.json({ code: "SESSION_COOKIE_FAILED" }, { status: 500 })
  }
  return response
}

function readBearerToken(header: string | null): string {
  const [scheme, token] = header?.split(" ") ?? []
  return scheme?.toLowerCase() === "bearer" && token ? token : ""
}

async function syncUser(email: string, name: string, clerkUserId: string): Promise<StoredUser> {
  console.error("[clerk-sync] findUserByEmail start", { email })
  let user = await findUserByEmail(email)
  console.error("[clerk-sync] findUserByEmail ok", { email, found: Boolean(user), status: user?.status, roles: user?.roles })
  if (!user) {
    console.error("[clerk-sync] upsertUserByEmail start", { email, name })
    user = await upsertUserByEmail({ email, name, clerkUserId })
    console.error("[clerk-sync] upsertUserByEmail ok", { email: user.email, id: user.id, status: user.status, roles: user.roles })
  } else if (user.clerkUserId !== clerkUserId) {
    user = await upsertUserByEmail({ email, name, clerkUserId })
  }
  console.error("[clerk-sync] ensureUserProfile start", { email: user.email, id: user.id })
  await ensureUserProfile(user)
  console.error("[clerk-sync] ensureUserProfile ok", { email: user.email, id: user.id })
  return user
}
