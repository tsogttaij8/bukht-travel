import { randomUUID } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { getDb } from "./db"
import {
  mapTravelPackage,
  mapTravelPackageStoreError,
  type StoredTravelPackage,
  type TravelItineraryDay,
  type TravelPackageRow,
} from "./travel-package-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { StoredTravelPackage, TravelItineraryDay, TravelPriceOption } from "./travel-package-model"

const travelPackageSelect =
  "id, title, slug, location, category, duration, group_size, transport, hotel, language, start_date, hero_image, gallery_images, summary, adult_price, child_price, infant_price, single_room_price, included, excluded, itinerary, warning, created_at, updated_at"
const LOCAL_TRAVEL_PACKAGES_PATH = path.join(process.cwd(), "data", "travel-packages.json")

export async function listTravelPackages(): Promise<StoredTravelPackage[]> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("travel_packages").select(travelPackageSelect).order("updated_at", { ascending: false })
      if (error) throw mapTravelPackageStoreError(error)
      return (data ?? []).map((item) => mapTravelPackage(normalizeRow(item as TravelPackageRow)))
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
      console.warn("Falling back to local travel package DB because Supabase is unreachable.", error)
    }
  }

  try {
    const db = await getDb()
    const result = await db.query<TravelPackageRow>(
      `SELECT ${travelPackageSelect}
       FROM travel_packages
       ORDER BY updated_at DESC`
    )
    return result.rows.map(mapTravelPackage)
  } catch {
    return readLocalTravelPackages()
  }
}

export async function getTravelPackage(idOrSlug: string): Promise<StoredTravelPackage | null> {
  const packages = await listTravelPackages()
  return packages.find((item) => item.id === idOrSlug || item.slug === idOrSlug) ?? null
}

export async function createTravelPackage(input: {
  title: string
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
}): Promise<StoredTravelPackage> {
  const item = buildTravelPackage(input)

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("travel_packages").insert(toTravelPackageRow(item))
      if (error) throw mapTravelPackageStoreError(error)
      return item
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
      console.warn("Saving travel package to local DB because Supabase is unreachable.", error)
    }
  }

  try {
    const db = await getDb()
    const row = toTravelPackageRow(item)
    await db.query(
      `INSERT INTO travel_packages (
        id, title, slug, location, category, duration, group_size, transport, hotel, language,
        start_date, hero_image, gallery_images, summary, adult_price, child_price, infant_price,
        single_room_price, included, excluded, itinerary, warning, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )`,
      [
        row.id,
        row.title,
        row.slug,
        row.location,
        row.category,
        row.duration,
        row.group_size,
        row.transport,
        row.hotel,
        row.language,
        row.start_date,
        row.hero_image,
        row.gallery_images,
        row.summary,
        row.adult_price,
        row.child_price,
        row.infant_price,
        row.single_room_price,
        row.included,
        row.excluded,
        row.itinerary,
        row.warning,
        row.created_at,
        row.updated_at,
      ]
    )
  } catch {
    await saveLocalTravelPackage(item)
  }

  return item
}

function buildTravelPackage(input: Parameters<typeof createTravelPackage>[0]): StoredTravelPackage {
  const now = new Date().toISOString()
  const id = randomUUID()
  return {
    id,
    title: input.title.trim(),
    slug: `${slugify(input.title)}-${id.slice(0, 8)}`,
    location: input.location.trim(),
    category: input.category.trim(),
    duration: input.duration.trim(),
    groupSize: input.groupSize.trim(),
    transport: input.transport.trim(),
    hotel: input.hotel.trim(),
    language: input.language.trim(),
    startDate: input.startDate.trim(),
    heroImage: input.heroImage.trim(),
    galleryImages: input.galleryImages.map((image) => image.trim()).filter(Boolean),
    summary: input.summary.trim(),
    adultPrice: sanitizePrice(input.adultPrice),
    childPrice: sanitizePrice(input.childPrice),
    infantPrice: sanitizePrice(input.infantPrice),
    singleRoomPrice: sanitizePrice(input.singleRoomPrice),
    included: input.included.map((item) => item.trim()).filter(Boolean),
    excluded: input.excluded.map((item) => item.trim()).filter(Boolean),
    itinerary: input.itinerary
      .map((day) => ({ day: day.day.trim(), date: day.date.trim(), title: day.title.trim(), details: day.details.trim() }))
      .filter((day) => day.title || day.details),
    warning: input.warning.trim(),
    createdAt: now,
    updatedAt: now,
  }
}

function toTravelPackageRow(item: StoredTravelPackage): TravelPackageRow {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    location: item.location,
    category: item.category,
    duration: item.duration,
    group_size: item.groupSize,
    transport: item.transport,
    hotel: item.hotel,
    language: item.language,
    start_date: item.startDate,
    hero_image: item.heroImage,
    gallery_images: JSON.stringify(item.galleryImages),
    summary: item.summary,
    adult_price: item.adultPrice,
    child_price: item.childPrice,
    infant_price: item.infantPrice,
    single_room_price: item.singleRoomPrice,
    included: JSON.stringify(item.included),
    excluded: JSON.stringify(item.excluded),
    itinerary: JSON.stringify(item.itinerary),
    warning: item.warning,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

function normalizeRow(row: TravelPackageRow): TravelPackageRow {
  return {
    ...row,
    gallery_images: typeof row.gallery_images === "string" ? row.gallery_images : JSON.stringify(row.gallery_images),
    included: typeof row.included === "string" ? row.included : JSON.stringify(row.included),
    excluded: typeof row.excluded === "string" ? row.excluded : JSON.stringify(row.excluded),
    itinerary: typeof row.itinerary === "string" ? row.itinerary : JSON.stringify(row.itinerary),
  }
}

function sanitizePrice(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "travel"
}

async function readLocalTravelPackages(): Promise<StoredTravelPackage[]> {
  try {
    const raw = await readFile(LOCAL_TRAVEL_PACKAGES_PATH, "utf8")
    const parsed = JSON.parse(raw) as StoredTravelPackage[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveLocalTravelPackage(item: StoredTravelPackage): Promise<void> {
  const current = await readLocalTravelPackages()
  await writeFile(LOCAL_TRAVEL_PACKAGES_PATH, JSON.stringify([item, ...current], null, 2), "utf8")
}
