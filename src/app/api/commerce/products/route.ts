import { NextResponse } from "next/server"
import { createCommerceProduct, listCommerceProducts } from "../../../../lib/server/commerce-store"
import { readSessionFromCookieHeader, sessionHasAnyRole, type SessionPayload } from "../../../../lib/server/session"

export const dynamic = "force-dynamic"

function readStaffSession(request: Request): { session: SessionPayload; ownerId: string } | { denied: NextResponse } {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session || !sessionHasAnyRole(session, ["owner", "cargo_staff", "support_staff"])) {
    return { denied: NextResponse.json({ message: "Forbidden" }, { status: 403 }) }
  }
  return { session, ownerId: `email:${session.email.trim().toLowerCase()}` }
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const scope = url.searchParams.get("scope")
  const auth = scope === "owner" || scope === "admin" ? readStaffSession(request) : null
  if (auth && "denied" in auth) return auth.denied

  try {
    const products = await listCommerceProducts({
      publicOnly: scope !== "admin" && scope !== "owner",
      ownerId: auth && "ownerId" in auth ? auth.ownerId : undefined,
    })
    return NextResponse.json({ products }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load commerce products."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = readStaffSession(request)
  if ("denied" in auth) return auth.denied

  const body = await request.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const price = body.price

  if (!name || Number(String(price).replace(/[^\d.]/g, "")) <= 0) {
    return NextResponse.json({ message: "Product name and price are required." }, { status: 400 })
  }

  try {
    const product = await createCommerceProduct({
      ownerId: auth.ownerId,
      name,
      description: stringField(body.description),
      price,
      currency: stringField(body.currency) || "MNT",
      category: stringField(body.category),
      condition: stringField(body.condition),
      country: stringField(body.country),
      city: stringField(body.city),
      imageUrl: stringField(body.imageUrl),
      sellerName: stringField(body.sellerName) || auth.session.name,
      sellerContact: stringField(body.sellerContact),
      status: stringField(body.status),
    })
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create commerce product."
    return NextResponse.json({ message }, { status: 500 })
  }
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
