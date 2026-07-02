import { getDb } from "./db"
import { deleteLocalTravelPackage, readLocalTravelPackages, replaceLocalTravelPackage, saveLocalTravelPackage } from "./travel-package-local"
import { mapTravelPackage, mapTravelPackageStoreError, type StoredTravelPackage, type TravelPackageRow } from "./travel-package-model"
import { normalizeTravelPackageRow, toTravelPackageRow, travelPackageSelect } from "./travel-package-row"
import { applyTravelPackageUpdate, buildTravelPackage } from "./travel-package-utils"
import type { TravelPackageInput } from "./travel-package-types"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { StoredTravelPackage, TravelItineraryDay, TravelPackageStatus, TravelPriceOption } from "./travel-package-model"

export async function listTravelPackages(): Promise<StoredTravelPackage[]> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("travel_packages").select(travelPackageSelect).order("updated_at", { ascending: false })
      if (error) throw mapTravelPackageStoreError(error)
      return (data ?? []).map((item) => mapTravelPackage(normalizeTravelPackageRow(item as TravelPackageRow)))
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
      console.warn("Falling back to local travel package DB because Supabase is unreachable.", error)
    }
  }

  try {
    const db = await getDb()
    const result = await db.query<TravelPackageRow>(`SELECT ${travelPackageSelect} FROM travel_packages ORDER BY updated_at DESC`)
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
  return (await listTravelPackages()).filter((item) => canOwnerManageTravelPackage(ownerId, item))
}

export async function getOwnerTravelPackage(ownerId: string, idOrSlug: string): Promise<StoredTravelPackage | null> {
  const travelPackage = await getTravelPackage(idOrSlug)
  return travelPackage && canOwnerManageTravelPackage(ownerId, travelPackage) ? travelPackage : null
}

export async function createTravelPackage(input: TravelPackageInput): Promise<StoredTravelPackage> {
  const item = buildTravelPackage(input)
  if (await tryInsertSupabaseTravelPackage(item)) return item

  try {
    const db = await getDb()
    await insertLocalDbTravelPackage(db, item)
  } catch {
    await saveLocalTravelPackage(item)
  }
  return item
}

export async function updateTravelPackage(ownerId: string, id: string, input: Partial<TravelPackageInput>): Promise<StoredTravelPackage | null> {
  const existing = await getOwnerTravelPackage(ownerId, id)
  if (!existing) return null
  const next = applyTravelPackageUpdate(existing, ownerId, input)
  await writeTravelPackage(next, existing.ownerId)
  return next
}

export async function deleteTravelPackage(ownerId: string, id: string): Promise<boolean> {
  const existing = await getOwnerTravelPackage(ownerId, id)
  if (!existing) return false

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("travel_packages").delete().eq("id", id).in("owner_id", ownerScope(ownerId))
      if (error) throw mapTravelPackageStoreError(error)
      return true
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
      console.warn("Deleting travel package from local DB because Supabase is unreachable.", error)
    }
  }

  try {
    const db = await getDb()
    await db.query("DELETE FROM travel_packages WHERE id = $1 AND owner_id = ANY($2)", [id, ownerScope(ownerId)])
  } catch {
    await deleteLocalTravelPackage(ownerId, id)
  }
  return true
}

async function tryInsertSupabaseTravelPackage(item: StoredTravelPackage): Promise<boolean> {
  if (!isSupabaseEnabled()) return false
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("travel_packages").insert(toTravelPackageRow(item))
    if (error) throw mapTravelPackageStoreError(error)
    return true
  } catch (error) {
    if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
    console.warn("Saving travel package to local DB because Supabase is unreachable.", error)
    return false
  }
}

async function writeTravelPackage(item: StoredTravelPackage, previousOwnerId: string): Promise<void> {
  if (await tryUpdateSupabaseTravelPackage(item, previousOwnerId)) return
  try {
    const db = await getDb()
    await updateLocalDbTravelPackage(db, item, previousOwnerId)
  } catch {
    await replaceLocalTravelPackage(item)
  }
}

async function tryUpdateSupabaseTravelPackage(item: StoredTravelPackage, previousOwnerId: string): Promise<boolean> {
  if (!isSupabaseEnabled()) return false
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("travel_packages").update(toTravelPackageRow(item)).eq("id", item.id).in("owner_id", ownerScope(item.ownerId, previousOwnerId))
    if (error) throw mapTravelPackageStoreError(error)
    return true
  } catch (error) {
    if (!shouldFallbackToLocalDb(error)) throw mapTravelPackageStoreError(error)
    console.warn("Updating travel package in local DB because Supabase is unreachable.", error)
    return false
  }
}

async function insertLocalDbTravelPackage(db: Awaited<ReturnType<typeof getDb>>, item: StoredTravelPackage): Promise<void> {
  const row = toTravelPackageRow(item)
  await db.query(
    `INSERT INTO travel_packages (${insertColumns}) VALUES (${insertPlaceholders})`,
    insertValues(row)
  )
}

async function updateLocalDbTravelPackage(db: Awaited<ReturnType<typeof getDb>>, item: StoredTravelPackage, previousOwnerId: string): Promise<void> {
  const row = toTravelPackageRow(item)
  await db.query(`UPDATE travel_packages SET ${updateAssignments} WHERE id = $37 AND owner_id = ANY($38)`, updateValues(row, previousOwnerId))
}

const insertColumns = "id, owner_id, status, title, slug, short_description, full_description, destination, start_location, end_location, map_coordinates, transportation_types, price, price_currency, max_participants, payment_settings, cancellation_policy, location, category, duration, group_size, transport, hotel, language, start_date, hero_image, gallery_images, summary, adult_price, child_price, infant_price, single_room_price, included, excluded, itinerary, warning, created_at, updated_at"
const insertPlaceholders = Array.from({ length: 38 }, (_, index) => `$${index + 1}`).join(", ")
const updateColumns = insertColumns.split(", ").filter((column) => !["id", "created_at"].includes(column))
const updateAssignments = updateColumns.map((column, index) => `${column} = $${index + 1}`).join(", ")

function insertValues(row: TravelPackageRow): unknown[] {
  return [row.id, ...travelPackageBodyValues(row), row.created_at, row.updated_at]
}

function updateValues(row: TravelPackageRow, previousOwnerId: string): unknown[] {
  return [...travelPackageBodyValues(row), row.updated_at, row.id, ownerScope(row.owner_id ?? "", previousOwnerId)]
}

function travelPackageBodyValues(row: TravelPackageRow): unknown[] {
  return [row.owner_id, row.status, row.title, row.slug, row.short_description, row.full_description, row.destination, row.start_location, row.end_location, row.map_coordinates, row.transportation_types, row.price, row.price_currency, row.max_participants, row.payment_settings, row.cancellation_policy, row.location, row.category, row.duration, row.group_size, row.transport, row.hotel, row.language, row.start_date, row.hero_image, row.gallery_images, row.summary, row.adult_price, row.child_price, row.infant_price, row.single_room_price, row.included, row.excluded, row.itinerary, row.warning]
}

function canOwnerManageTravelPackage(ownerId: string, item: StoredTravelPackage): boolean {
  return item.ownerId === ownerId || item.ownerId === ""
}

function ownerScope(ownerId: string, previousOwnerId = ""): string[] {
  return Array.from(new Set([ownerId, previousOwnerId, ""].map((value) => value.trim())))
}
