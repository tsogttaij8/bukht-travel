import { NextResponse } from "next/server"
import { createEsimPackage, listEsimPackages } from "../../../../lib/server/esim-package-store"
import { readSessionFromCookieHeader, sessionHasAnyRole } from "../../../../lib/server/session"

function ensureEsimAccess(request: Request) {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session || !sessionHasAnyRole(session, ["owner", "esim_staff"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = ensureEsimAccess(request)
  if (denied) return denied
  return NextResponse.json({ esimPackages: await listEsimPackages() }, { status: 200 })
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = ensureEsimAccess(request)
  if (denied) return denied
  const body = (await request.json()) as { name?: string; dataAmount?: string; validity?: string; price?: string; note?: string; badge?: string }
  const name = body.name?.trim() ?? ""
  const dataAmount = body.dataAmount?.trim() ?? ""
  const validity = body.validity?.trim() ?? ""
  const price = body.price?.trim() ?? ""
  if (!name || !dataAmount || !validity || !price) {
    return NextResponse.json({ message: "name, dataAmount, validity, price шаардлагатай" }, { status: 400 })
  }
  const esimPackage = await createEsimPackage({
    name,
    dataAmount,
    validity,
    price,
    note: body.note ?? "",
    badge: body.badge ?? "",
  })
  return NextResponse.json({ esimPackage }, { status: 201 })
}
