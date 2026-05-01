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

export type StoredTravelPackage = {
  id: string
  title: string
  slug: string
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
  title: string
  slug: string
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
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
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
