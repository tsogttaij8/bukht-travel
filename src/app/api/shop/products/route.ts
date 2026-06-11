import { NextResponse } from "next/server"
import { listProducts } from "../../../../lib/server/product-store"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ products: await listProducts() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Барааны мэдээлэл уншихад алдаа гарлаа."
    return NextResponse.json({ message }, { status: 500 })
  }
}
