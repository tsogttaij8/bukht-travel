import { NextResponse } from "next/server"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
import { ensureUserProfile, findUserProfileByEmail, upsertUserProfileByEmail, type CustomerType } from "../../../../lib/server/customer-store"
import { findUserByEmail } from "../../../../lib/server/user-store"

const validCustomerTypes: CustomerType[] = ["traveler", "merchant", "cargo_customer", "esim_customer"]

function readSession(request: Request) {
  return readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const user = await findUserByEmail(session.email)
  if (!user) return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 })

  const profile = (await findUserProfileByEmail(session.email)) ?? (await ensureUserProfile(user))
  return NextResponse.json({ profile }, { status: 200 })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const body = (await request.json()) as {
    phone?: string
    companyName?: string
    telegramHandle?: string
    customerTypes?: string[]
    notes?: string
  }

  const customerTypes = Array.isArray(body.customerTypes)
    ? body.customerTypes.filter((item): item is CustomerType => validCustomerTypes.includes(item as CustomerType))
    : undefined

  const profile = await upsertUserProfileByEmail({
    email: session.email,
    phone: body.phone,
    companyName: body.companyName,
    telegramHandle: body.telegramHandle,
    customerTypes,
    notes: body.notes,
  })

  return NextResponse.json({ profile }, { status: 200 })
}
