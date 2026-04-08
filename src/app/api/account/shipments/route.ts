import { NextResponse } from "next/server"
import { listShipmentsWithEventsByCustomerEmail } from "../../../../lib/server/shipment-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"

function readSession(request: Request) {
  return readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
}

export async function GET(request: Request): Promise<NextResponse> {
  const session = readSession(request)
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const shipments = await listShipmentsWithEventsByCustomerEmail(session.email)
  return NextResponse.json({ shipments }, { status: 200 })
}
