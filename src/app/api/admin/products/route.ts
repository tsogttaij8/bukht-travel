import { NextResponse } from "next/server"
import { createProduct, listProducts } from "../../../../lib/server/product-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"

function ensureDeveloper(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!session || session.role !== "developer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = ensureDeveloper(request)
  if (denied) return denied

  try {
    return NextResponse.json({ products: await listProducts() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Барааны жагсаалт уншихад алдаа гарлаа"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = ensureDeveloper(request)
  if (denied) return denied

  const body = (await request.json()) as {
    name?: string
    category?: string
    price?: string
    moq?: string
    origin?: string
    leadTime?: string
    badge?: string
    summary?: string
  }

  const name = body.name?.trim() ?? ""
  const category = body.category?.trim() ?? ""
  const price = body.price?.trim() ?? ""
  const moq = body.moq?.trim() ?? ""
  const origin = body.origin?.trim() ?? ""
  const leadTime = body.leadTime?.trim() ?? ""
  const summary = body.summary?.trim() ?? ""

  if (!name || !category || !price || !moq || !origin || !leadTime || !summary) {
    return NextResponse.json({ message: "Шаардлагатай талбарууд дутуу байна" }, { status: 400 })
  }

  try {
    const product = await createProduct({
      name,
      category,
      price,
      moq,
      origin,
      leadTime,
      badge: body.badge?.trim(),
      summary,
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Бараа нэмэхэд алдаа гарлаа"
    return NextResponse.json({ message }, { status: 500 })
  }
}
