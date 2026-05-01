import { NextResponse } from "next/server"
import { acceptRoleInvite } from "../../../../lib/server/role-invite-store"
import { createSessionToken, readSessionFromCookieHeader, sessionConfig } from "../../../../lib/server/session"
import { findUserByEmail } from "../../../../lib/server/user-store"

export async function POST(request: Request): Promise<NextResponse> {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session) return NextResponse.json({ message: "Эхлээд нэвтэрнэ үү" }, { status: 401 })

  const body = (await request.json()) as { token?: string }
  const token = body.token?.trim() ?? ""
  if (!token) return NextResponse.json({ message: "Invite token олдсонгүй" }, { status: 400 })

  const invite = await acceptRoleInvite(token, session.email)
  if (!invite) return NextResponse.json({ message: "Invite буруу, ашиглагдсан, эсвэл таны email-тэй таарахгүй байна" }, { status: 400 })

  const user = await findUserByEmail(session.email)
  const response = NextResponse.json({ invite }, { status: 200 })
  if (user) {
    response.cookies.set(sessionConfig.name, createSessionToken(user.name, user.email, user.roles), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionConfig.maxAge,
    })
  }
  return response
}
