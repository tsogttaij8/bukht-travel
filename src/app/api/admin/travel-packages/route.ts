import { NextResponse } from "next/server"
import { createTravelPackage, listTravelPackages, type TravelItineraryDay } from "../../../../lib/server/travel-package-store"
import { readSessionFromCookieHeader, sessionHasAnyRole } from "../../../../lib/server/session"

function ensureTravelManager(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!session || !sessionHasAnyRole(session, ["owner", "travel_staff"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = ensureTravelManager(request)
  if (denied) return denied

  try {
    return NextResponse.json({ travelPackages: await listTravelPackages() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Аяллын жагсаалт уншихад алдаа гарлаа"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = ensureTravelManager(request)
  if (denied) return denied

  const body = (await request.json()) as {
    title?: string
    location?: string
    category?: string
    duration?: string
    groupSize?: string
    transport?: string
    hotel?: string
    language?: string
    startDate?: string
    heroImage?: string
    galleryImages?: string[]
    summary?: string
    adultPrice?: number | string
    childPrice?: number | string
    infantPrice?: number | string
    singleRoomPrice?: number | string
    included?: string[]
    excluded?: string[]
    itinerary?: TravelItineraryDay[]
    warning?: string
  }

  const title = body.title?.trim() ?? ""
  const location = body.location?.trim() ?? ""
  const duration = body.duration?.trim() ?? ""
  const groupSize = body.groupSize?.trim() ?? ""
  const startDate = body.startDate?.trim() ?? ""
  const heroImage = body.heroImage?.trim() ?? ""
  const summary = body.summary?.trim() ?? ""
  const adultPrice = toNumber(body.adultPrice)

  if (!title || !location || !duration || !groupSize || !startDate || !heroImage || !summary || adultPrice <= 0) {
    return NextResponse.json({ message: "Гарчиг, байршил, хугацаа, хүний тоо, эхлэх огноо, нүүр зураг, тайлбар, том хүний үнэ заавал хэрэгтэй." }, { status: 400 })
  }

  try {
    const travelPackage = await createTravelPackage({
      title,
      location,
      category: body.category?.trim() || "Адал явдалт аялал",
      duration,
      groupSize,
      transport: body.transport?.trim() || "Онгоц, автобус",
      hotel: body.hotel?.trim() || "Зочид буудал",
      language: body.language?.trim() || "Монгол",
      startDate,
      heroImage,
      galleryImages: body.galleryImages ?? [],
      summary,
      adultPrice,
      childPrice: toNumber(body.childPrice),
      infantPrice: toNumber(body.infantPrice),
      singleRoomPrice: toNumber(body.singleRoomPrice),
      included: body.included ?? [],
      excluded: body.excluded ?? [],
      itinerary: body.itinerary ?? [],
      warning: body.warning?.trim() ?? "",
    })

    return NextResponse.json({ travelPackage }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Аялал нэмэхэд алдаа гарлаа"
    return NextResponse.json({ message }, { status: 500 })
  }
}

function toNumber(value: number | string | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  return Number(value.replace(/[^\d]/g, "")) || 0
}
