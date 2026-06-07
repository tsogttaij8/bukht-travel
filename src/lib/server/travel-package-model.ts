import { toErrorMessage } from "./shared-store"

export type TravelItineraryDay = {
  day: string
  date: string
  title: string
  details: string
}

export type TravelPriceOption = {
  label: string
  price: number
}

export type TravelPackageStatus = "draft" | "published"

export type StoredTravelPackage = {
  id: string
  ownerId: string
  status: TravelPackageStatus
  title: string
  slug: string
  shortDescription: string
  fullDescription: string
  destination: string
  startLocation: string
  endLocation: string
  mapCoordinates: string
  transportationTypes: string[]
  price: number
  maxParticipants: number
  paymentSettings: string
  cancellationPolicy: string
  location: string
  category: string
  duration: string
  groupSize: string
  transport: string
  hotel: string
  language: string
  startDate: string
  heroImage: string
  galleryImages: string[]
  summary: string
  adultPrice: number
  childPrice: number
  infantPrice: number
  singleRoomPrice: number
  included: string[]
  excluded: string[]
  itinerary: TravelItineraryDay[]
  warning: string
  createdAt: string
  updatedAt: string
}

export type TravelPackageRow = {
  id: string
  owner_id?: string | null
  status?: string | null
  title: string
  slug: string
  short_description?: string | null
  full_description?: string | null
  destination?: string | null
  start_location?: string | null
  end_location?: string | null
  map_coordinates?: string | null
  transportation_types?: string | string[] | null
  price?: number | null
  max_participants?: number | null
  payment_settings?: string | null
  cancellation_policy?: string | null
  location: string
  category: string
  duration: string
  group_size: string
  transport: string
  hotel: string
  language: string
  start_date: string
  hero_image: string
  gallery_images: string
  summary: string
  adult_price: number
  child_price: number
  infant_price: number
  single_room_price: number
  included: string
  excluded: string
  itinerary: string
  warning: string
  created_at: string
  updated_at: string
}

export function mapTravelPackage(row: TravelPackageRow): StoredTravelPackage {
  const transportationTypes = parseJson<string[]>(row.transportation_types ?? "[]", [])
  const status = row.status === "draft" ? "draft" : "published"
  const price = Number(row.price ?? row.adult_price) || 0
  const maxParticipants = Number(row.max_participants) || parseParticipantCount(row.group_size)
  const shortDescription = row.short_description?.trim() || row.summary
  const fullDescription = row.full_description?.trim() || row.summary
  const destination = row.destination?.trim() || row.location
  const transport = row.transport

  return {
    id: row.id,
    ownerId: row.owner_id ?? "",
    status,
    title: row.title,
    slug: row.slug,
    shortDescription,
    fullDescription,
    destination,
    startLocation: row.start_location ?? "",
    endLocation: row.end_location ?? "",
    mapCoordinates: row.map_coordinates ?? "",
    transportationTypes: transportationTypes.length ? transportationTypes : transport.split(",").map((item) => item.trim()).filter(Boolean),
    price,
    maxParticipants,
    paymentSettings: row.payment_settings ?? "",
    cancellationPolicy: row.cancellation_policy ?? "",
    location: row.location,
    category: row.category,
    duration: row.duration,
    groupSize: row.group_size,
    transport: row.transport,
    hotel: row.hotel,
    language: row.language,
    startDate: row.start_date,
    heroImage: row.hero_image,
    galleryImages: parseJson<string[]>(row.gallery_images, []),
    summary: row.summary,
    adultPrice: Number(row.adult_price) || 0,
    childPrice: Number(row.child_price) || 0,
    infantPrice: Number(row.infant_price) || 0,
    singleRoomPrice: Number(row.single_room_price) || 0,
    included: parseJson<string[]>(row.included, []),
    excluded: parseJson<string[]>(row.excluded, []),
    itinerary: parseJson<TravelItineraryDay[]>(row.itinerary, []),
    warning: row.warning,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapTravelPackageStoreError(error: unknown): Error {
  const message = toErrorMessage(error)
  if (message.includes(`relation "travel_packages" does not exist`) || message.includes(`Could not find the table 'public.travel_packages'`)) {
    return new Error("Supabase deer `travel_packages` husnegt alga baina. `docs/supabase-schema.sql` schema-g shinechlene uu.")
  }
  return error instanceof Error ? error : new Error(message)
}

function parseJson<T>(value: string | T, fallback: T): T {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function parseParticipantCount(value: string): number {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) || 0 : 0
}
