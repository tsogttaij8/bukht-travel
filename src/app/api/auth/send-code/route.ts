import { NextResponse } from "next/server"
import { generateLoginCode, saveLoginCode } from "../../../../lib/server/login-code-store"
import { sendLoginCodeEmail } from "../../../../lib/server/mailer"
import { ensureUserProfile } from "../../../../lib/server/customer-store"
import { checkRateLimit, readClientIp } from "../../../../lib/server/rate-limit"
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
  const clientIp = readClientIp(request)

  if (!email) {
    return NextResponse.json({ message: "Имэйл оруулна уу" }, { status: 400 })
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Имэйл формат буруу байна" }, { status: 400 })
  }

  const ipRateLimit = await checkRateLimit(`send-code:ip:${clientIp}`, 20, 10 * 60 * 1000)
  if (!ipRateLimit.ok) {
    return NextResponse.json({ message: "Хэт олон хүсэлт илгээгдлээ. Түр хүлээгээд дахин оролдоно уу." }, { status: 429 })
  }

  const emailRateLimit = await checkRateLimit(`send-code:email:${email}`, 3, 10 * 60 * 1000)
  if (!emailRateLimit.ok) {
    return NextResponse.json({ message: "Энэ имэйл рүү код хэт олон удаа илгээгдсэн байна. Түр хүлээгээд дахин оролдоно уу." }, { status: 429 })
  }

  const existing = await findUserByEmail(email)
  const effectiveName =
    name ||
    existing?.name ||
    (isAdminEmail(email) ? email.split("@")[0] || "Admin" : email.split("@")[0] || "User")

  if (mode === "register" && !name && !existing) {
    return NextResponse.json({ message: "Бүртгүүлэхийн тулд нэр оруулна уу" }, { status: 400 })
  }

  const user = await upsertUserByEmail({ email, name: effectiveName })
  await ensureUserProfile(user)

  const code = generateLoginCode()
  await saveLoginCode(email, code)

  try {
    const delivery = await sendLoginCodeEmail(email, code)

    if (delivery.mode === "dev") {
      return NextResponse.json({
        ok: true,
        devCode: code,
        deliveryMode: delivery.mode,
        deliveryProvider: delivery.provider,
        message: "Имэйл provider тохируулаагүй байна. Хэрэглэгч хадгалагдлаа, түр хугацаанд dev код ашиглаж нэвтэрнэ үү.",
      }, { status: 200 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Код илгээхэд алдаа гарлаа"
    console.error("Failed to send login code", error)
    return NextResponse.json({ message }, { status: 502 })
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, deliveryMode: "email" }, { status: 200 })
  }

  return NextResponse.json({ ok: true, deliveryMode: "email" }, { status: 200 })
}
