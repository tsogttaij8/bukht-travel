import { NextResponse } from "next/server"
import { ensureUserProfile, findUserProfileByEmail, upsertUserProfileByEmail } from "../../../../lib/server/customer-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
import { findUserByEmail, updateUserNameByEmail } from "../../../../lib/server/user-store"

export const dynamic = "force-dynamic"

function readSession(request: Request) {
  return readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const user = await findUserByEmail(session.email)
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const profile = (await findUserProfileByEmail(session.email)) ?? (await ensureUserProfile(user))
  return NextResponse.json({ profile: toAccountProfile(user.name, profile) }, { status: 200 })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const body = (await request.json()) as {
    name?: string
    phone?: string
    city?: string
    companyName?: string
  }

  const currentUser = await findUserByEmail(session.email)
  if (!currentUser) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const name = stringField(body.name) || currentUser.name
  const user = (await updateUserNameByEmail(session.email, name)) ?? currentUser
  const profile = await upsertUserProfileByEmail({
    email: session.email,
    phone: body.phone,
    city: body.city,
    companyName: body.companyName,
  })

  return NextResponse.json({ profile: toAccountProfile(user.name, profile) }, { status: 200 })
}

function toAccountProfile(name: string, profile: { email: string; phone: string; city: string; companyName: string }) {
  return {
    name,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    companyName: profile.companyName,
  }
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
