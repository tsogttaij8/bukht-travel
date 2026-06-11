import { NextResponse } from "next/server"
import { createCommercePurchaseRequest, getCommerceProduct, listCommercePurchaseRequests } from "../../../../lib/server/commerce-store"
import { readSessionFromCookieHeader, sessionHasAnyRole } from "../../../../lib/server/session"

export const dynamic = "force-dynamic"

function ensureStaff(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  return session && sessionHasAnyRole(session, ["owner", "cargo_staff", "support_staff"])
    ? null
    : NextResponse.json({ message: "Forbidden" }, { status: 403 })
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = ensureStaff(request)
  if (denied) return denied

  try {
    return NextResponse.json({ requests: await listCommercePurchaseRequests() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load purchase requests."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  const productId = stringField(body.productId)
  const buyerName = stringField(body.buyerName)
  const buyerContact = stringField(body.buyerContact)

  if (!productId || !buyerName || !buyerContact) {
    return NextResponse.json({ message: "buyerName, buyerContact, and productId are required." }, { status: 400 })
  }

  const product = await getCommerceProduct(productId)
  if (!product || product.status !== "available") {
    return NextResponse.json({ message: "Product is not available." }, { status: 404 })
  }

  try {
    const purchaseRequest = await createCommercePurchaseRequest({
      productId,
      buyerName,
      buyerContact,
      message: stringField(body.message),
    })
    return NextResponse.json({ request: purchaseRequest }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit purchase request."
    return NextResponse.json({ message }, { status: 500 })
  }
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
