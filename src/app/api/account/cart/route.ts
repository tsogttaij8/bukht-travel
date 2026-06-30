import { NextResponse } from "next/server"
import { listCommerceProducts, listCommercePurchaseRequestsByBuyer } from "../../../../lib/server/commerce-store"
import { listServiceRequestsByEmail } from "../../../../lib/server/customer-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
import { findUserByEmail } from "../../../../lib/server/user-store"

export const dynamic = "force-dynamic"

function readSession(request: Request) {
  return readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const user = await findUserByEmail(session.email)
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })

  const [serviceRequests, commerceRequests, products] = await Promise.all([
    listServiceRequestsByEmail(user.email),
    listCommercePurchaseRequestsByBuyer({ userId: user.id, email: user.email }),
    listCommerceProducts(),
  ])
  const productById = new Map(products.map((product) => [product.id, product]))

  const trips = serviceRequests
    .filter((item) => item.serviceType === "travel")
    .map((item) => ({
      title: item.title,
      details: item.details,
      status: item.status,
      budget: item.budget,
      travelDate: item.travelDate,
      createdAt: item.createdAt,
    }))

  const productsInCart = [
    ...commerceRequests.map((item) => {
      const product = productById.get(item.productId)
      return {
        title: product?.name ?? "Барааны хүсэлт",
        details: item.message,
        status: item.status,
        price: product?.price ?? 0,
        currency: product?.currency ?? "MNT",
        imageUrl: product?.imageUrl ?? "",
        createdAt: item.createdAt,
      }
    }),
    ...serviceRequests
      .filter((item) => item.serviceType === "product_sourcing")
      .map((item) => ({
        title: item.title,
        details: item.details,
        status: item.status,
        price: 0,
        currency: "MNT",
        imageUrl: "",
        createdAt: item.createdAt,
      })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ trips, products: productsInCart }, { status: 200 })
}
