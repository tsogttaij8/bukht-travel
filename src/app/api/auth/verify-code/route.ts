import { NextResponse } from "next/server"
import { sessionConfig, createSessionToken } from "../../../../lib/server/session"
import { checkRateLimit, readClientIp } from "../../../../lib/server/rate-limit"
import { findUserByEmail } from "../../../../lib/server/user-store"
import { verifyAndConsumeLoginCode } from "../../../../lib/server/login-code-store"

type VerifyBody = {
  email?: string
  code?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as VerifyBody
  const email = body.email?.trim().toLowerCase() ?? ""
  const code = body.code?.trim() ?? ""
  const clientIp = readClientIp(request)

  if (!email || !code) {
    return NextResponse.json({ message: "Имэйл болон код оруулна уу" }, { status: 400 })
  }

  const verifyRateLimit = await checkRateLimit(`verify-code:${clientIp}:${email}`, 10, 10 * 60 * 1000)
  if (!verifyRateLimit.ok) {
    return NextResponse.json({ message: "Код баталгаажуулах оролдлого хэт олширлоо. Түр хүлээгээд дахин оролдоно уу." }, { status: 429 })
  }

  const isValid = await verifyAndConsumeLoginCode(email, code)

  if (!isValid) {
    return NextResponse.json({ message: "Код буруу эсвэл хугацаа дууссан" }, { status: 401 })
  }

  const user = await findUserByEmail(email)

  if (!user) {
    return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 })
  }

  if (user.status === "disabled") {
    return NextResponse.json({ message: "Энэ хэрэглэгчийн эрх идэвхгүй байна" }, { status: 403 })
  }

  const response = NextResponse.json({ user: { name: user.name, email: user.email, role: user.role, roles: user.roles } }, { status: 200 })
  response.cookies.set(sessionConfig.name, createSessionToken(user.name, user.email, user.roles), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionConfig.maxAge,
  })

  return response
}
