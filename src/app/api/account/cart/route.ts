import { NextResponse } from "next/server"
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

  const serviceRequests = await listServiceRequestsByEmail(user.email)

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
