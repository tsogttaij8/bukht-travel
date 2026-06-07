import { NextResponse } from "next/server"
import { getPublishedTravelPackage } from "../../../../lib/server/travel-package-store"

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: Context): Promise<NextResponse> {
  const { id } = await context.params
  const tour = await getPublishedTravelPackage(id)
  return tour ? NextResponse.json({ tour }, { status: 200 }) : NextResponse.json({ message: "Tour not found." }, { status: 404 })
}
