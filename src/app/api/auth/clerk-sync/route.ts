import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createSessionToken, sessionConfig } from "../../../../lib/server/session"
import { ensureUserProfile } from "../../../../lib/server/customer-store"
import { isAdminEmail, upsertUserByEmail, type StoredUser, type UserRole } from "../../../../lib/server/user-store"

export async function POST(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  if (!email) return NextResponse.json({ message: "Email hayag oldsonggui" }, { status: 400 })

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0]
  const user = await syncUser(email, name)

  const response = NextResponse.json({ user: { name: user.name, email: user.email, role: user.role, roles: user.roles } })
  response.cookies.set(sessionConfig.name, createSessionToken(user.name, user.email, user.roles), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionConfig.maxAge,
  })
  return response
}

async function syncUser(email: string, name: string): Promise<StoredUser> {
  try {
    const user = await upsertUserByEmail({ email, name })
    await ensureUserProfile(user)
    return user
  } catch {
    const roles: UserRole[] = isAdminEmail(email) ? ["owner"] : ["customer"]
    return {
      id: `clerk:${email}`,
      name,
      email: email.trim().toLowerCase(),
      role: roles.includes("owner") ? "developer" : "user",
      roles,
      status: "active",
      createdAt: new Date().toISOString(),
    }
  }
}
