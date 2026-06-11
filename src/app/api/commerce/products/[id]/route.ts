import { NextResponse } from "next/server"
import { deleteCommerceProduct, getCommerceProduct, updateCommerceProduct } from "../../../../../lib/server/commerce-store"
import { readSessionFromCookieHeader, sessionHasAnyRole } from "../../../../../lib/server/session"

export const dynamic = "force-dynamic"

type Context = {
  params: Promise<{ id: string }>
}

function ensureStaff(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  return session && sessionHasAnyRole(session, ["owner", "cargo_staff", "support_staff"])
    ? null
    : NextResponse.json({ message: "Forbidden" }, { status: 403 })
}

export async function GET(_request: Request, context: Context): Promise<NextResponse> {
  const { id } = await context.params
  const product = await getCommerceProduct(id)
  if (!product || product.status === "hidden") return NextResponse.json({ message: "Product not found." }, { status: 404 })
  return NextResponse.json({ product }, { status: 200 })
}

export async function PATCH(request: Request, context: Context): Promise<NextResponse> {
  const denied = ensureStaff(request)
  if (denied) return denied

  const { id } = await context.params
  const body = await request.json()
  try {
    const product = await updateCommerceProduct(id, {
      name: stringOrUndefined(body.name),
      description: stringOrUndefined(body.description),
      price: body.price,
      currency: stringOrUndefined(body.currency),
      category: stringOrUndefined(body.category),
      condition: stringOrUndefined(body.condition),
      country: stringOrUndefined(body.country),
      city: stringOrUndefined(body.city),
      imageUrl: stringOrUndefined(body.imageUrl),
      sellerName: stringOrUndefined(body.sellerName),
      sellerContact: stringOrUndefined(body.sellerContact),
      status: stringOrUndefined(body.status),
    })
    return product ? NextResponse.json({ product }, { status: 200 }) : NextResponse.json({ message: "Product not found." }, { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update commerce product."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: Context): Promise<NextResponse> {
  const denied = ensureStaff(request)
  if (denied) return denied

  const { id } = await context.params
  const deleted = await deleteCommerceProduct(id)
  return deleted ? NextResponse.json({ ok: true }, { status: 200 }) : NextResponse.json({ message: "Product not found." }, { status: 404 })
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined
}
