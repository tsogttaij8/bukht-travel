import { NextResponse } from "next/server"
import { ensureUserProfile, findUserProfileByEmail } from "../../../../lib/server/customer-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
import { findUserByEmail } from "../../../../lib/server/user-store"

export async function GET(request: Request): Promise<NextResponse> {
  const payload = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  const user = await findUserByEmail(payload.email)
  const profile = user ? (await findUserProfileByEmail(payload.email)) ?? (await ensureUserProfile(user)) : null

  return NextResponse.json(
    { user: { name: payload.name, email: payload.email, role: payload.role }, profile },
    { status: 200 }
  )
}
