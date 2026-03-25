import { NextResponse } from "next/server"
import {
  appendShipmentEvent,
  createShipment,
  findShipmentByTrackingCode,
  getShipmentTracking,
  listShipmentsWithEvents,
  type ShipmentStatus,
} from "../../../../lib/server/shipment-store"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"

const validStatuses: ShipmentStatus[] = ["registered", "received", "in_transit", "arrived", "delivered"]

function isValidStatus(value: string): value is ShipmentStatus {
  return validStatuses.includes(value as ShipmentStatus)
}

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

  const trackingCode = new URL(request.url).searchParams.get("trackingCode")?.trim()

  if (trackingCode) {
    const tracking = await getShipmentTracking(trackingCode)
    return tracking
      ? NextResponse.json(tracking, { status: 200 })
      : NextResponse.json({ message: "Shipment олдсонгүй" }, { status: 404 })
  }

  return NextResponse.json({ shipments: await listShipmentsWithEvents() }, { status: 200 })
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = ensureDeveloper(request)
  if (denied) return denied

  const body = (await request.json()) as {
    trackingCode?: string
    customerName?: string
    customerEmail?: string
    origin?: string
    destination?: string
    currentStatus?: string
    notes?: string
  }

  const trackingCode = body.trackingCode?.trim() ?? ""
  const customerName = body.customerName?.trim() ?? ""
  const customerEmail = body.customerEmail?.trim().toLowerCase() ?? ""
  const origin = body.origin?.trim() ?? ""
  const destination = body.destination?.trim() ?? ""
  const currentStatus = body.currentStatus?.trim() ?? ""

  if (!trackingCode || !customerName || !customerEmail || !origin || !destination || !isValidStatus(currentStatus)) {
    return NextResponse.json({ message: "Шаардлагатай талбарууд дутуу байна" }, { status: 400 })
  }

  if (await findShipmentByTrackingCode(trackingCode)) {
    return NextResponse.json({ message: "Энэ tracking code бүртгэлтэй байна" }, { status: 409 })
  }

  const shipment = await createShipment({
    trackingCode,
    customerName,
    customerEmail,
    origin,
    destination,
    currentStatus,
    notes: body.notes?.trim(),
  })

  const tracking = await getShipmentTracking(shipment.trackingCode)

  return NextResponse.json(tracking, { status: 201 })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const denied = ensureDeveloper(request)
  if (denied) return denied

  const body = (await request.json()) as {
    trackingCode?: string
    status?: string
    details?: string
    location?: string
  }

  const trackingCode = body.trackingCode?.trim() ?? ""
  const status = body.status?.trim() ?? ""
  const details = body.details?.trim() ?? ""
  const location = body.location?.trim() ?? ""

  if (!trackingCode || !isValidStatus(status) || !details || !location) {
    return NextResponse.json({ message: "trackingCode, status, details, location шаардлагатай" }, { status: 400 })
  }

  try {
    const updated = await appendShipmentEvent({
      trackingCode,
      status,
      details,
      location,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch {
    return NextResponse.json({ message: "Shipment олдсонгүй" }, { status: 404 })
  }
}
