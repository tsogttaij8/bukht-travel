import { NextResponse } from "next/server"
import { ensureUserProfile, findUserProfileByEmail } from "../../../../lib/server/customer-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
import { findUserByEmail } from "../../../../lib/server/user-store"

export const dynamic = "force-dynamic"

function readSession(request: Request) {
  return readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const user = await findUserByEmail(session.email)
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const profile = (await findUserProfileByEmail(user.email)) ?? (await ensureUserProfile(user))

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      phone: profile.phone,
      city: profile.city,
      companyName: profile.companyName,
    },
  }, { status: 200 })
}
