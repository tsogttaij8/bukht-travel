import { NextResponse } from "next/server"
import { deleteTravelPackage, getOwnerTravelPackage, updateTravelPackage, type TravelItineraryDay, type TravelPackageStatus } from "../../../../../lib/server/travel-package-store"
import { readSessionFromCookieHeader, sessionHasAnyRole, type SessionPayload } from "../../../../../lib/server/session"

export const dynamic = "force-dynamic"

type Context = {
  params: Promise<{ id: string }>
}

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

export async function GET(request: Request, context: Context): Promise<NextResponse> {
  const auth = readOwnerSession(request)
  if ("denied" in auth) return auth.denied

  const { id } = await context.params
  const tour = await getOwnerTravelPackage(auth.ownerId, id)
  return tour ? NextResponse.json({ tour }, { status: 200 }) : NextResponse.json({ message: "Tour not found." }, { status: 404 })
}

export async function PUT(request: Request, context: Context): Promise<NextResponse> {
  const auth = readOwnerSession(request)
  if ("denied" in auth) return auth.denied

  const { id } = await context.params
  const body = (await request.json()) as TourBody
  const patch = toTourPatch(body)

  if (patch.title !== undefined && !patch.title.trim()) return NextResponse.json({ message: "title is required." }, { status: 400 })
  if (patch.destination !== undefined && !patch.destination.trim()) return NextResponse.json({ message: "destination is required." }, { status: 400 })
  if (patch.duration !== undefined && !patch.duration.trim()) return NextResponse.json({ message: "duration is required." }, { status: 400 })
  if (patch.price !== undefined && patch.price <= 0) return NextResponse.json({ message: "price must be greater than 0." }, { status: 400 })
  if (patch.maxParticipants !== undefined && patch.maxParticipants <= 0) return NextResponse.json({ message: "maxParticipants must be greater than 0." }, { status: 400 })

  try {
    const tour = await updateTravelPackage(auth.ownerId, id, patch)
    return tour ? NextResponse.json({ tour }, { status: 200 }) : NextResponse.json({ message: "Tour not found." }, { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tour."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: Context): Promise<NextResponse> {
  const auth = readOwnerSession(request)
  if ("denied" in auth) return auth.denied

  const { id } = await context.params
  const deleted = await deleteTravelPackage(auth.ownerId, id)
  return deleted ? NextResponse.json({ ok: true }, { status: 200 }) : NextResponse.json({ message: "Tour not found." }, { status: 404 })
}

function toTourPatch(body: TourBody) {
  const destination = body.destination?.trim()
  const transportationTypes = body.transportationTypes?.map((item) => item.trim()).filter(Boolean)
  const price = body.price === undefined ? undefined : toNumber(body.price)
  const maxParticipants = body.maxParticipants === undefined ? undefined : toNumber(body.maxParticipants)
  return {
    status: body.status === "published" ? "published" as const : body.status === "draft" ? "draft" as const : undefined,
    title: body.title,
    shortDescription: body.shortDescription,
    fullDescription: body.fullDescription,
    destination,
    startLocation: body.startLocation,
    endLocation: body.endLocation,
    mapCoordinates: body.mapCoordinates,
    transportationTypes,
    price,
    maxParticipants,
    paymentSettings: body.paymentSettings,
    cancellationPolicy: body.cancellationPolicy,
    location: destination,
    duration: body.duration,
    groupSize: maxParticipants === undefined ? undefined : String(maxParticipants),
    transport: transportationTypes?.join(", "),
    heroImage: body.galleryImages?.[0],
    galleryImages: body.galleryImages,
    summary: body.shortDescription,
    adultPrice: price,
    included: body.included,
    excluded: body.excluded,
    itinerary: body.itinerary,
  }
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  return Number(String(value).replace(/[^\d]/g, "")) || 0
}
