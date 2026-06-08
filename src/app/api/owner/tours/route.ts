import { NextResponse } from "next/server"
import { createTravelPackage, listOwnerTravelPackages, type TravelItineraryDay, type TravelPackageStatus } from "../../../../lib/server/travel-package-store"
import { readSessionFromCookieHeader, sessionHasAnyRole, type SessionPayload } from "../../../../lib/server/session"

export const dynamic = "force-dynamic"

type TourBody = {
  title?: string
  shortDescription?: string
  fullDescription?: string
  destination?: string
  startLocation?: string
  endLocation?: string
  mapCoordinates?: string
  duration?: string
  transportationTypes?: string[]
  itinerary?: TravelItineraryDay[]
  included?: string[]
  excluded?: string[]
  price?: number | string
  maxParticipants?: number | string
  galleryImages?: string[]
  paymentSettings?: string
  cancellationPolicy?: string
  status?: TravelPackageStatus
}

function readOwnerSession(request: Request): { session: SessionPayload; ownerId: string } | { denied: NextResponse } {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session || !sessionHasAnyRole(session, ["owner", "travel_staff"])) {
    return { denied: NextResponse.json({ message: "Forbidden" }, { status: 403 }) }
  }
  return { session, ownerId: `email:${session.email.trim().toLowerCase()}` }
}

export async function GET(request: Request): Promise<NextResponse> {
  const auth = readOwnerSession(request)
  if ("denied" in auth) return auth.denied

  try {
    return NextResponse.json({ tours: await listOwnerTravelPackages(auth.ownerId) }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load owner tours."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = readOwnerSession(request)
  if ("denied" in auth) return auth.denied

  const body = (await request.json()) as TourBody
  const title = body.title?.trim() ?? ""
  const destination = body.destination?.trim() ?? ""
  const duration = body.duration?.trim() ?? ""
  const price = toNumber(body.price)
  const maxParticipants = toNumber(body.maxParticipants)

  if (!title || !destination || !duration || price <= 0 || maxParticipants <= 0) {
    return NextResponse.json({ message: "title, destination, duration, price, maxParticipants are required." }, { status: 400 })
  }

  try {
    const tour = await createTravelPackage({
      ownerId: auth.ownerId,
      status: body.status === "published" ? "published" : "draft",
      title,
      shortDescription: body.shortDescription ?? "",
      fullDescription: body.fullDescription ?? "",
      destination,
      startLocation: body.startLocation ?? "",
      endLocation: body.endLocation ?? "",
      mapCoordinates: body.mapCoordinates ?? "",
      transportationTypes: body.transportationTypes ?? [],
      price,
      maxParticipants,
      paymentSettings: body.paymentSettings ?? "",
      cancellationPolicy: body.cancellationPolicy ?? "",
      location: destination,
      category: "Tour",
      duration,
      groupSize: String(maxParticipants),
      transport: (body.transportationTypes ?? []).join(", "),
      hotel: "",
      language: "",
      startDate: "",
      heroImage: body.galleryImages?.[0] ?? "",
      galleryImages: body.galleryImages ?? [],
      summary: body.shortDescription?.trim() || body.fullDescription?.trim() || title,
      adultPrice: price,
      childPrice: 0,
      infantPrice: 0,
      singleRoomPrice: 0,
      included: body.included ?? [],
      excluded: body.excluded ?? [],
      itinerary: body.itinerary ?? [],
      warning: "",
    })

    return NextResponse.json({ tour }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tour."
    return NextResponse.json({ message }, { status: 500 })
  }
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  return Number(String(value).replace(/[^\d]/g, "")) || 0
}
