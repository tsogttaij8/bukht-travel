import { NextResponse } from "next/server"
import { createProduct } from "../../../lib/server/product-store"
import { readSessionFromCookieHeader } from "../../../lib/server/session"

const maxImageLength = 1_250_000
const maxImages = 6

export async function POST(request: Request): Promise<NextResponse> {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session) return NextResponse.json({ message: "Нэвтэрсний дараа бараа нийтэлнэ." }, { status: 401 })

  const body = (await request.json()) as {
    name?: string
    category?: string
    price?: string
    moq?: string
    origin?: string
    leadTime?: string
    summary?: string
    imageUrl?: string
    imageUrls?: string[]
  }

  const name = body.name?.trim() ?? ""
  const category = body.category?.trim() ?? ""
  const price = body.price?.trim() ?? ""
  const moq = body.moq?.trim() ?? ""
  const origin = body.origin?.trim() ?? ""
  const leadTime = body.leadTime?.trim() ?? ""
  const summary = body.summary?.trim() ?? ""
  const imageUrls = Array.from(new Set((body.imageUrls ?? [body.imageUrl ?? ""]).map((image) => image.trim()).filter(Boolean))).slice(0, maxImages)

  if (!name || !category || !price || !moq || !summary) {
    return NextResponse.json({ message: "Барааны нэр, ангилал, 1 ширхэг үнэ, олноор авах нөхцөл, тайлбар шаардлагатай." }, { status: 400 })
  }

  if (imageUrls.some((image) => !isProductImageUrl(image))) {
    return NextResponse.json({ message: "Зураг буруу эсвэл хэт том байна." }, { status: 400 })
  }

  try {
    const product = await createProduct({
      name,
      category,
      price,
      moq,
      origin,
      leadTime,
      summary,
      imageUrl: imageUrls[0] ?? "",
      imageUrls,
      sellerName: session.name,
      sellerEmail: session.email,
      badge: "User post",
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Бараа нийтлэхэд алдаа гарлаа."
    return NextResponse.json({ message }, { status: 500 })
  }
}

function isProductImageUrl(value: string): boolean {
  if (value.startsWith("data:image/")) return value.length <= maxImageLength
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
