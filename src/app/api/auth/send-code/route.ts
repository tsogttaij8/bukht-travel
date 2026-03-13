import { NextResponse } from "next/server"
import { generateLoginCode, saveLoginCode } from "../../../../lib/server/login-code-store"
import { sendLoginCodeEmail } from "../../../../lib/server/mailer"
import { findUserByEmail, isAdminEmail, upsertUserByEmail } from "../../../../lib/server/user-store"

type SendCodeBody = {
  email?: string
  name?: string
  mode?: "register" | "login"
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as SendCodeBody
  const email = body.email?.trim().toLowerCase() ?? ""
  const name = body.name?.trim() ?? ""
  const mode = body.mode === "register" ? "register" : "login"

  if (!email) {
    return NextResponse.json({ message: "Имэйл оруулна уу" }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Имэйл формат буруу байна" }, { status: 400 })
  }

  if (mode === "register") {
    if (!name) {
      return NextResponse.json({ message: "Бүртгүүлэхийн тулд нэр оруулна уу" }, { status: 400 })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ message: "Энэ имэйл бүртгэлтэй байна. Нэвтрэхийг сонгоно уу." }, { status: 409 })
    }

    await upsertUserByEmail({ email, name })
  } else {
    const existing = await findUserByEmail(email)

    if (!existing) {
      if (isAdminEmail(email)) {
        // Admin email is auto-provisioned as developer account.
        await upsertUserByEmail({ email })
      } else {
        return NextResponse.json({ message: "Эхлээд бүртгүүлнэ үү" }, { status: 404 })
      }
    } else if (isAdminEmail(email)) {
      await upsertUserByEmail({ email, name: existing.name })
    }
  }

  const code = generateLoginCode()
  await saveLoginCode(email, code)

  try {
    await sendLoginCodeEmail(email, code)
  } catch {
    return NextResponse.json({ message: "Код илгээхэд алдаа гарлаа" }, { status: 502 })
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, devCode: code }, { status: 200 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
