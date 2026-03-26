import { NextResponse } from "next/server"
import { createServiceRequest, listServiceRequestsByEmail, type ServiceType } from "../../../../lib/server/customer-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"

const validServiceTypes: ServiceType[] = ["travel", "cargo", "esim", "product_sourcing"]

function readSession(request: Request) {
  return readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const requests = await listServiceRequestsByEmail(session.email)
  return NextResponse.json({ requests }, { status: 200 })
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const body = (await request.json()) as {
    serviceType?: string
    title?: string
    details?: string
    budget?: string
    travelDate?: string
  }

  const serviceType = body.serviceType?.trim() ?? ""
  const title = body.title?.trim() ?? ""
  const details = body.details?.trim() ?? ""

  if (!validServiceTypes.includes(serviceType as ServiceType) || !title || !details) {
    return NextResponse.json({ message: "serviceType, title, details шаардлагатай" }, { status: 400 })
  }

  const created = await createServiceRequest({
    email: session.email,
    serviceType: serviceType as ServiceType,
    title,
    details,
    budget: body.budget,
    travelDate: body.travelDate,
  })

  return NextResponse.json({ request: created }, { status: 201 })
}
