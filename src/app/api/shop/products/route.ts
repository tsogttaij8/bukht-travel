import { NextRequest, NextResponse } from "next/server"
import { listProducts } from "../../../../lib/server/product-store"

export const dynamic = "force-dynamic"

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 48

function numericPrice(value: string): number {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const params = request.nextUrl.searchParams
    const search = (params.get("search") ?? "").trim().toLocaleLowerCase("mn")
    const category = (params.get("category") ?? "").trim()
    const sort = params.get("sort") ?? "newest"
    const requestedPage = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.parseInt(params.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE))
    const allProducts = await listProducts()
    const categories = Array.from(new Set(allProducts.map((product) => product.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "mn"))

    const filtered = allProducts.filter((product) => {
      const matchesCategory = !category || product.category === category
      const haystack = `${product.name} ${product.summary} ${product.origin} ${product.sellerName}`.toLocaleLowerCase("mn")
      return matchesCategory && (!search || haystack.includes(search))
    })

    filtered.sort((a, b) => {
      if (sort === "price-asc") return numericPrice(a.price) - numericPrice(b.price)
      if (sort === "price-desc") return numericPrice(b.price) - numericPrice(a.price)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    const totalItems = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const page = Math.min(requestedPage, totalPages)
    const start = (page - 1) * pageSize

    return NextResponse.json({
      products: filtered.slice(start, start + pageSize),
      categories,
      pagination: { page, pageSize, totalItems, totalPages },
    }, { status: 200 })
  } catch (error) {
    console.error("Failed to load marketplace products", error)
    return NextResponse.json({ message: "Барааны мэдээлэл уншихад алдаа гарлаа." }, { status: 500 })
  }
}
