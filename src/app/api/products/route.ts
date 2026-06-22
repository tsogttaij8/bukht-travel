import { NextResponse } from "next/server"
import { createProduct } from "../../../lib/server/product-store"
import { readSessionFromCookieHeader } from "../../../lib/server/session"

const maxImageLength = 1_250_000

export async function POST(request: Request): Promise<NextResponse> {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session) return NextResponse.json({ message: "Нэвтэрсний дараа бараа нийтэлнэ." }, { status: 401 })

  const body = (await request.json()) as {
    name?: string
    category?: string
    price?: string
    summary?: string
    imageUrl?: string
  }

  const name = body.name?.trim() ?? ""
  const category = body.category?.trim() ?? ""
  const price = body.price?.trim() ?? ""
  const summary = body.summary?.trim() ?? ""
  const imageUrl = body.imageUrl?.trim() ?? ""

  if (!name || !category || !price || !summary) {
    return NextResponse.json({ message: "Барааны нэр, ангилал, үнэ, тайлбар шаардлагатай." }, { status: 400 })
  }

  if (imageUrl && (!imageUrl.startsWith("data:image/") || imageUrl.length > maxImageLength)) {
    return NextResponse.json({ message: "Зураг буруу эсвэл хэт том байна." }, { status: 400 })
  }

  try {
    const product = await createProduct({
      name,
      category,
      price,
      summary,
      imageUrl,
      sellerName: session.name,
      sellerEmail: session.email,
      moq: "Хэрэглэгчийн пост",
      origin: "Marketplace",
      leadTime: "Шууд тохиролцоно",
      badge: "User post",
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Бараа нийтлэхэд алдаа гарлаа."
    return NextResponse.json({ message }, { status: 500 })
  }
}
