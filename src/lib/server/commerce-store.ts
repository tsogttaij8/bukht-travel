import { getDb } from "./db"
import { fallbackCommerceProducts } from "./commerce-fallback"
import { mapCommerceProduct, mapCommercePurchaseRequest, type CommerceProductRow, type CommercePurchaseRequestRow, type CommercePurchaseRequestStatus, type StoredCommerceProduct, type StoredCommercePurchaseRequest } from "./commerce-model"
import { buildCommerceProduct, buildCommercePurchaseRequest, applyCommerceProductUpdate, toProductRow, toRequestRow } from "./commerce-utils"
import type { CommerceProductInput, CommercePurchaseRequestInput } from "./commerce-types"
import { isCommercePurchaseRequestStatus } from "./commerce-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { CommerceProductStatus, CommercePurchaseRequestStatus, StoredCommerceProduct, StoredCommercePurchaseRequest } from "./commerce-model"

const productSelect = "id, owner_id, name, description, price, currency, category, condition, country, city, image_url, seller_name, seller_contact, status, created_at, updated_at"
const requestSelect = "id, product_id, buyer_id, buyer_email, buyer_name, buyer_contact, message, status, created_at, updated_at"
const legacyRequestSelect = "id, product_id, buyer_name, buyer_contact, message, status, created_at, updated_at"

declare global {
  var __bukhtCommerceUseFallback: boolean | undefined
}

export async function listCommerceProducts(filters: { publicOnly?: boolean; ownerId?: string } = {}): Promise<StoredCommerceProduct[]> {
  const products = await readCommerceProducts()
  return products.filter((product) => {
    if (filters.publicOnly && product.status !== "available") return false
    if (filters.ownerId && product.ownerId !== filters.ownerId) return false
    return true
  })
}

export async function getCommerceProduct(id: string): Promise<StoredCommerceProduct | null> {
  const products = await readCommerceProducts()
  return products.find((product) => product.id === id) ?? null
}

export async function createCommerceProduct(input: CommerceProductInput & { ownerId?: string }): Promise<StoredCommerceProduct> {
  const product = buildCommerceProduct(input)
  await insertCommerceProduct(product)
  return product
}

export async function updateCommerceProduct(id: string, input: Partial<CommerceProductInput>, options: { ownerId?: string } = {}): Promise<StoredCommerceProduct | null> {
  const existing = await getCommerceProduct(id)
  if (!existing || (options.ownerId && existing.ownerId !== options.ownerId)) return null
  const next = applyCommerceProductUpdate(existing, input)
  await writeCommerceProduct(next)
  return next
}

export async function deleteCommerceProduct(id: string): Promise<boolean> {
  const existing = await getCommerceProduct(id)
  if (!existing) return false
  if (await tryDeleteSupabaseProduct(id)) return true
  const db = await getDb()
  await db.query("DELETE FROM commerce_products WHERE id = $1", [id])
  return true
}

export async function listCommercePurchaseRequests(): Promise<StoredCommercePurchaseRequest[]> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("commerce_purchase_requests").select(requestSelect).order("created_at", { ascending: false })
      if (isMissingBuyerColumn(error)) {
        const legacy = await supabase.from("commerce_purchase_requests").select(legacyRequestSelect).order("created_at", { ascending: false })
        if (legacy.error) throw legacy.error
        return (legacy.data ?? []).map((row) => mapCommercePurchaseRequest(row as CommercePurchaseRequestRow))
      }
      if (error) throw error
      return (data ?? []).map((row) => mapCommercePurchaseRequest(row as CommercePurchaseRequestRow))
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Falling back to local commerce requests because Supabase is unreachable.", error)
    }
  }
  const db = await getDb()
  const result = await db.query<CommercePurchaseRequestRow>(`SELECT ${requestSelect} FROM commerce_purchase_requests ORDER BY created_at DESC`)
  return result.rows.map(mapCommercePurchaseRequest)
}

export async function listCommercePurchaseRequestsByBuyer(input: { userId: string; email: string }): Promise<StoredCommercePurchaseRequest[]> {
  const normalizedEmail = input.email.trim().toLowerCase()
  const requests = await listCommercePurchaseRequests()
  return requests.filter((request) => {
    if (request.buyerId && request.buyerId === input.userId) return true
    if (request.buyerEmail && request.buyerEmail.trim().toLowerCase() === normalizedEmail) return true
    return request.buyerContact.trim().toLowerCase() === normalizedEmail
  })
}

export async function createCommercePurchaseRequest(input: CommercePurchaseRequestInput): Promise<StoredCommercePurchaseRequest> {
  const request = buildCommercePurchaseRequest(input)
  if (await tryInsertSupabaseRequest(request)) return request
  const db = await getDb()
  const row = toRequestRow(request)
  await db.query(
    `INSERT INTO commerce_purchase_requests (id, product_id, buyer_id, buyer_email, buyer_name, buyer_contact, message, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [row.id, row.product_id, row.buyer_id, row.buyer_email, row.buyer_name, row.buyer_contact, row.message, row.status, row.created_at, row.updated_at]
  )
  return request
}

export async function updateCommercePurchaseRequest(id: string, status: CommercePurchaseRequestStatus): Promise<StoredCommercePurchaseRequest | null> {
  if (!isCommercePurchaseRequestStatus(status)) return null
  const existing = (await listCommercePurchaseRequests()).find((request) => request.id === id)
  if (!existing) return null
  const next = { ...existing, status, updatedAt: new Date().toISOString() }
  if (await tryUpdateSupabaseRequest(next)) return next
  const db = await getDb()
  await db.query("UPDATE commerce_purchase_requests SET status = $1, updated_at = $2 WHERE id = $3", [next.status, next.updatedAt, next.id])
  return next
}

async function readCommerceProducts(): Promise<StoredCommerceProduct[]> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("commerce_products").select(productSelect).order("updated_at", { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => mapCommerceProduct(row as CommerceProductRow))
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Falling back to local commerce products because Supabase is unreachable.", error)
    }
  }
  if (globalThis.__bukhtCommerceUseFallback) return fallbackCommerceProducts
  return readLocalCommerceProducts()
}

async function readLocalCommerceProducts(): Promise<StoredCommerceProduct[]> {
  try {
    const db = await getDb()
    const result = await db.query<CommerceProductRow>(`SELECT ${productSelect} FROM commerce_products ORDER BY updated_at DESC`)
    return result.rows.map(mapCommerceProduct)
  } catch (error) {
    globalThis.__bukhtCommerceUseFallback = true
    console.warn("Falling back to bundled commerce products because local DB is unavailable.", error)
    return fallbackCommerceProducts
  }
}

async function insertCommerceProduct(product: StoredCommerceProduct): Promise<void> {
  if (await tryInsertSupabaseProduct(product)) return
  const db = await getDb()
  const row = toProductRow(product)
  await db.query(`INSERT INTO commerce_products (${productColumns}) VALUES (${productPlaceholders})`, productValues(row))
}

async function writeCommerceProduct(product: StoredCommerceProduct): Promise<void> {
  if (await tryUpdateSupabaseProduct(product)) return
  const db = await getDb()
  const row = toProductRow(product)
  await db.query(`UPDATE commerce_products SET ${productAssignments} WHERE id = $16`, [...productValues(row).slice(1), row.id])
}

async function tryInsertSupabaseProduct(product: StoredCommerceProduct): Promise<boolean> {
  return runSupabaseFallback("Saving commerce product to local DB because Supabase is unreachable.", async () => {
    const { error } = await getSupabaseAdmin().from("commerce_products").insert(toProductRow(product))
    if (error) throw error
  })
}

async function tryUpdateSupabaseProduct(product: StoredCommerceProduct): Promise<boolean> {
  return runSupabaseFallback("Updating commerce product in local DB because Supabase is unreachable.", async () => {
    const { error } = await getSupabaseAdmin().from("commerce_products").update(toProductRow(product)).eq("id", product.id)
    if (error) throw error
  })
}

async function tryDeleteSupabaseProduct(id: string): Promise<boolean> {
  return runSupabaseFallback("Deleting commerce product from local DB because Supabase is unreachable.", async () => {
    const { error } = await getSupabaseAdmin().from("commerce_products").delete().eq("id", id)
    if (error) throw error
  })
}

async function tryInsertSupabaseRequest(request: StoredCommercePurchaseRequest): Promise<boolean> {
  return runSupabaseFallback("Saving commerce request to local DB because Supabase is unreachable.", async () => {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("commerce_purchase_requests").insert(toRequestRow(request))
    if (isMissingBuyerColumn(error)) {
      const row = toRequestRow(request)
      const { error: legacyError } = await supabase.from("commerce_purchase_requests").insert({
        id: row.id,
        product_id: row.product_id,
        buyer_name: row.buyer_name,
        buyer_contact: row.buyer_contact,
        message: row.message,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
      if (legacyError) throw legacyError
      return
    }
    if (error) throw error
  })
}

async function tryUpdateSupabaseRequest(request: StoredCommercePurchaseRequest): Promise<boolean> {
  return runSupabaseFallback("Updating commerce request in local DB because Supabase is unreachable.", async () => {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("commerce_purchase_requests").update(toRequestRow(request)).eq("id", request.id)
    if (isMissingBuyerColumn(error)) {
      const row = toRequestRow(request)
      const { error: legacyError } = await supabase.from("commerce_purchase_requests").update({
        product_id: row.product_id,
        buyer_name: row.buyer_name,
        buyer_contact: row.buyer_contact,
        message: row.message,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }).eq("id", request.id)
      if (legacyError) throw legacyError
      return
    }
    if (error) throw error
  })
}

async function runSupabaseFallback(message: string, action: () => Promise<void>): Promise<boolean> {
  if (!isSupabaseEnabled()) return false
  try {
    await action()
    return true
  } catch (error) {
    if (!shouldFallbackToLocalDb(error)) throw error
    console.warn(message, error)
    return false
  }
}

const productColumns = "id, owner_id, name, description, price, currency, category, condition, country, city, image_url, seller_name, seller_contact, status, created_at, updated_at"
const productPlaceholders = Array.from({ length: 16 }, (_, index) => `$${index + 1}`).join(", ")
const productAssignments = productColumns.split(", ").slice(1).map((column, index) => `${column} = $${index + 1}`).join(", ")

function productValues(row: CommerceProductRow): unknown[] {
  return [row.id, row.owner_id, row.name, row.description, row.price, row.currency, row.category, row.condition, row.country, row.city, row.image_url, row.seller_name, row.seller_contact, row.status, row.created_at, row.updated_at]
}

function isMissingBuyerColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase()
  return message.includes("buyer_id") || message.includes("buyer_email")
}
