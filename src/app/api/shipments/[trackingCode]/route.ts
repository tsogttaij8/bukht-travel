import { NextResponse } from "next/server"
import { getShipmentTracking } from "../../../../lib/server/shipment-store"

type Context = {
  params: Promise<{ trackingCode: string }>
}

export async function GET(_: Request, context: Context): Promise<NextResponse> {
  const { trackingCode } = await context.params
  const tracking = await getShipmentTracking(trackingCode)

  if (!tracking) {
    return NextResponse.json({ message: "Tracking олдсонгүй" }, { status: 404 })
  }

  return NextResponse.json(tracking, { status: 200 })
}
