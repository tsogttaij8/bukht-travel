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
  type TravelPackageStatus,
} from "./travel-package-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { StoredTravelPackage, TravelItineraryDay, TravelPackageStatus, TravelPriceOption } from "./travel-package-model"

const travelPackageSelect =
  "id, owner_id, status, title, slug, short_description, full_description, destination, start_location, end_location, map_coordinates, transportation_types, price, max_participants, payment_settings, cancellation_policy, location, category, duration, group_size, transport, hotel, language, start_date, hero_image, gallery_images, summary, adult_price, child_price, infant_price, single_room_price, included, excluded, itinerary, warning, created_at, updated_at"
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

export async function getPublishedTravelPackage(idOrSlug: string): Promise<StoredTravelPackage | null> {
  const travelPackage = await getTravelPackage(idOrSlug)
  return travelPackage?.status === "published" ? travelPackage : null
}

export async function listOwnerTravelPackages(ownerId: string): Promise<StoredTravelPackage[]> {
  return (await listTravelPackages()).filter((item) => item.ownerId === ownerId)
}

export async function getOwnerTravelPackage(ownerId: string, idOrSlug: string): Promise<StoredTravelPackage | null> {
  const travelPackage = await getTravelPackage(idOrSlug)
  return travelPackage?.ownerId === ownerId ? travelPackage : null
}

export async function createTravelPackage(input: {
  ownerId?: string
  status?: TravelPackageStatus
  title: string
  shortDescription?: string
  fullDescription?: string
  destination?: string
  startLocation?: string
  endLocation?: string
  mapCoordinates?: string
  transportationTypes?: string[]
  price?: number
  maxParticipants?: number
  paymentSettings?: string
  cancellationPolicy?: string
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
        id, owner_id, status, title, slug, short_description, full_description, destination,
        start_location, end_location, map_coordinates, transportation_types, price, max_participants,
        payment_settings, cancellation_policy, location, category, duration, group_size, transport,
        hotel, language, start_date, hero_image, gallery_images, summary, adult_price, child_price,
        infant_price, single_room_price, included, excluded, itinerary, warning, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
      )`,
      [
        row.id,
        row.owner_id,
        row.status,
        row.title,
        row.slug,
        row.short_description,
        row.full_description,
        row.destination,
        row.start_location,
        row.end_location,
        row.map_coordinates,
        row.transportation_types,
        row.price,
        row.max_participants,
        row.payment_settings,
        row.cancellation_policy,
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

export async function updateTravelPackage(ownerId: string, id: string, input: Partial<Parameters<typeof createTravelPackage>[0]>): Promise<StoredTravelPackage | null> {
  const existing = await getOwnerTravelPackage(ownerId, id)
  if (!existing) return null

  const next: StoredTravelPackage = {
    ...existing,
    ownerId,
    status: input.status ?? existing.status,
    title: input.title?.trim() ?? existing.title,
    shortDescription: input.shortDescription?.trim() ?? existing.shortDescription,
    fullDescription: input.fullDescription?.trim() ?? existing.fullDescription,
    destination: input.destination?.trim() ?? existing.destination,
    startLocation: input.startLocation?.trim() ?? existing.startLocation,
    endLocation: input.endLocation?.trim() ?? existing.endLocation,
    mapCoordinates: input.mapCoordinates?.trim() ?? existing.mapCoordinates,
    transportationTypes: input.transportationTypes?.map((item) => item.trim()).filter(Boolean) ?? existing.transportationTypes,
    price: input.price !== undefined ? sanitizePrice(input.price) : existing.price,
    maxParticipants: input.maxParticipants !== undefined ? sanitizeCount(input.maxParticipants) : existing.maxParticipants,
    paymentSettings: input.paymentSettings?.trim() ?? existing.paymentSettings,
    cancellationPolicy: input.cancellationPolicy?.trim() ?? existing.cancellationPolicy,
    location: input.location?.trim() ?? existing.location,
    category: input.category?.trim() ?? existing.category,
    duration: input.duration?.trim() ?? existing.duration,
    groupSize: input.groupSize?.trim() ?? existing.groupSize,
    transport: input.transport?.trim() ?? existing.transport,
    hotel: input.hotel?.trim() ?? existing.hotel,
    language: input.language?.trim() ?? existing.language,
    startDate: input.startDate?.trim() ?? existing.startDate,
    heroImage: input.heroImage?.trim() ?? existing.heroImage,
    galleryImages: input.galleryImages?.map((image) => image.trim()).filter(Boolean) ?? existing.galleryImages,
    summary: input.summary?.trim() ?? existing.summary,
    adultPrice: input.adultPrice !== undefined ? sanitizePrice(input.adultPrice) : existing.adultPrice,
    childPrice: input.childPrice !== undefined ? sanitizePrice(input.childPrice) : existing.childPrice,
    infantPrice: input.infantPrice !== undefined ? sanitizePrice(input.infantPrice) : existing.infantPrice,
    singleRoomPrice: input.singleRoomPrice !== undefined ? sanitizePrice(input.singleRoomPrice) : existing.singleRoomPrice,
    included: input.included?.map((item) => item.trim()).filter(Boolean) ?? existing.included,
    excluded: input.excluded?.map((item) => item.trim()).filter(Boolean) ?? existing.excluded,
    itinerary: input.itinerary?.map(cleanItineraryDay).filter((day) => day.title || day.details) ?? existing.itinerary,
    warning: input.warning?.trim() ?? existing.warning,
    updatedAt: new Date().toISOString(),
  }

  await writeTravelPackage(next)
  return next
}

export async function deleteTravelPackage(ownerId: string, id: string): Promise<boolean> {
  const existing = await getOwnerTravelPackage(ownerId, id)
  if (!existing) return false

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("travel_packages").delete().eq("id", id).eq("owner_id", ownerId)
      if (error) throw mapTravelPackageStoreError(error)
      return true
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
      console.warn("Deleting travel package from local DB because Supabase is unreachable.", error)
    }
  }

  try {
    const db = await getDb()
    await db.query("DELETE FROM travel_packages WHERE id = $1 AND owner_id = $2", [id, ownerId])
  } catch {
    const current = await readLocalTravelPackages()
    await writeFile(LOCAL_TRAVEL_PACKAGES_PATH, JSON.stringify(current.filter((item) => item.id !== id || item.ownerId !== ownerId), null, 2), "utf8")
  }
  return true
}

function buildTravelPackage(input: Parameters<typeof createTravelPackage>[0]): StoredTravelPackage {
  const now = new Date().toISOString()
  const id = randomUUID()
  const shortDescription = input.shortDescription?.trim() || input.summary.trim()
  const fullDescription = input.fullDescription?.trim() || input.summary.trim()
  const destination = input.destination?.trim() || input.location.trim()
  const transportationTypes = input.transportationTypes?.map((item) => item.trim()).filter(Boolean) ?? input.transport.split(",").map((item) => item.trim()).filter(Boolean)
  const price = sanitizePrice(input.price ?? input.adultPrice)
  const maxParticipants = sanitizeCount(input.maxParticipants ?? parseParticipantCount(input.groupSize))
  return {
    id,
    ownerId: input.ownerId?.trim() ?? "",
    status: input.status ?? "draft",
    title: input.title.trim(),
    slug: `${slugify(input.title)}-${id.slice(0, 8)}`,
    shortDescription,
    fullDescription,
    destination,
    startLocation: input.startLocation?.trim() ?? "",
    endLocation: input.endLocation?.trim() ?? "",
    mapCoordinates: input.mapCoordinates?.trim() ?? "",
    transportationTypes,
    price,
    maxParticipants,
    paymentSettings: input.paymentSettings?.trim() ?? "",
    cancellationPolicy: input.cancellationPolicy?.trim() ?? "",
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
    owner_id: item.ownerId,
    status: item.status,
    title: item.title,
    slug: item.slug,
    short_description: item.shortDescription,
    full_description: item.fullDescription,
    destination: item.destination,
    start_location: item.startLocation,
    end_location: item.endLocation,
    map_coordinates: item.mapCoordinates,
    transportation_types: JSON.stringify(item.transportationTypes),
    price: item.price,
    max_participants: item.maxParticipants,
    payment_settings: item.paymentSettings,
    cancellation_policy: item.cancellationPolicy,
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
    transportation_types: typeof row.transportation_types === "string" ? row.transportation_types : JSON.stringify(row.transportation_types ?? []),
    gallery_images: typeof row.gallery_images === "string" ? row.gallery_images : JSON.stringify(row.gallery_images),
    included: typeof row.included === "string" ? row.included : JSON.stringify(row.included),
    excluded: typeof row.excluded === "string" ? row.excluded : JSON.stringify(row.excluded),
    itinerary: typeof row.itinerary === "string" ? row.itinerary : JSON.stringify(row.itinerary),
  }
}

async function writeTravelPackage(item: StoredTravelPackage): Promise<void> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("travel_packages").update(toTravelPackageRow(item)).eq("id", item.id).eq("owner_id", item.ownerId)
      if (error) throw mapTravelPackageStoreError(error)
      return
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
      console.warn("Updating travel package in local DB because Supabase is unreachable.", error)
    }
  }

  try {
    const db = await getDb()
    const row = toTravelPackageRow(item)
    await db.query(
      `UPDATE travel_packages SET
        owner_id = $1, status = $2, title = $3, short_description = $4, full_description = $5,
        destination = $6, start_location = $7, end_location = $8, map_coordinates = $9,
        transportation_types = $10, price = $11, max_participants = $12, payment_settings = $13,
        cancellation_policy = $14, location = $15, category = $16, duration = $17, group_size = $18,
        transport = $19, hotel = $20, language = $21, start_date = $22, hero_image = $23,
        gallery_images = $24, summary = $25, adult_price = $26, child_price = $27, infant_price = $28,
        single_room_price = $29, included = $30, excluded = $31, itinerary = $32, warning = $33,
        updated_at = $34
       WHERE id = $35 AND owner_id = $36`,
      [
        row.owner_id,
        row.status,
        row.title,
        row.short_description,
        row.full_description,
        row.destination,
        row.start_location,
        row.end_location,
        row.map_coordinates,
        row.transportation_types,
        row.price,
        row.max_participants,
        row.payment_settings,
        row.cancellation_policy,
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
        row.updated_at,
        row.id,
        row.owner_id,
      ]
    )
  } catch {
    const current = await readLocalTravelPackages()
    await writeFile(LOCAL_TRAVEL_PACKAGES_PATH, JSON.stringify(current.map((existing) => existing.id === item.id ? item : existing), null, 2), "utf8")
  }
}

function sanitizePrice(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function sanitizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function parseParticipantCount(value: string): number {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) || 0 : 0
}

function cleanItineraryDay(day: TravelItineraryDay): TravelItineraryDay {
  return { day: day.day.trim(), date: day.date.trim(), title: day.title.trim(), details: day.details.trim() }
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
