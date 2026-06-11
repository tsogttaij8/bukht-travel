import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import {
  isCommerceProductStatus,
  isCommercePurchaseRequestStatus,
  mapCommerceProduct,
  mapCommercePurchaseRequest,
  type CommerceProductRow,
  type CommerceProductStatus,
  type CommercePurchaseRequestRow,
  type CommercePurchaseRequestStatus,
  type StoredCommerceProduct,
  type StoredCommercePurchaseRequest,
} from "./commerce-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { CommerceProductStatus, CommercePurchaseRequestStatus, StoredCommerceProduct, StoredCommercePurchaseRequest } from "./commerce-model"

const productSelect = "id, owner_id, name, description, price, currency, category, condition, country, city, image_url, seller_name, seller_contact, status, created_at, updated_at"
const requestSelect = "id, product_id, buyer_name, buyer_contact, message, status, created_at, updated_at"

const fallbackProducts: StoredCommerceProduct[] = [
  {
    id: "commerce-fallback-silk-scarf",
    ownerId: "seed",
    name: "Silk scarf from Hangzhou",
    description: "Lightweight scarf brought back from a recent sourcing trip.",
    price: 89000,
    currency: "MNT",
    category: "Fashion",
    condition: "New",
    country: "China",
    city: "Hangzhou",
    imageUrl: "/travel-guangzhou-city-highlights.jpeg",
    sellerName: "BUKHT traveler",
    sellerContact: "",
    status: "available",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "commerce-fallback-tea-set",
    ownerId: "seed",
    name: "Porcelain travel tea set",
    description: "Compact tea set for home or office gifting.",
    price: 145000,
    currency: "MNT",
    category: "Home",
    condition: "New",
    country: "China",
    city: "Guangzhou",
    imageUrl: "/travel-yiwu-international-trade-center.jpeg",
    sellerName: "Anu",
    sellerContact: "Hidden",
    status: "available",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
]

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
  const product = buildProduct(input)
  await insertCommerceProduct(product)
  return product
}

export async function updateCommerceProduct(id: string, input: Partial<CommerceProductInput>, options: { ownerId?: string } = {}): Promise<StoredCommerceProduct | null> {
  const existing = await getCommerceProduct(id)
  if (!existing || (options.ownerId && existing.ownerId !== options.ownerId)) return null

  const next: StoredCommerceProduct = {
    ...existing,
    name: input.name?.trim() ?? existing.name,
    description: input.description?.trim() ?? existing.description,
    price: input.price !== undefined ? sanitizePrice(input.price) : existing.price,
    currency: input.currency?.trim() || existing.currency,
    category: input.category?.trim() ?? existing.category,
    condition: input.condition?.trim() ?? existing.condition,
    country: input.country?.trim() ?? existing.country,
    city: input.city?.trim() ?? existing.city,
    imageUrl: input.imageUrl?.trim() ?? existing.imageUrl,
    sellerName: input.sellerName?.trim() ?? existing.sellerName,
    sellerContact: input.sellerContact?.trim() ?? existing.sellerContact,
    status: input.status && isCommerceProductStatus(input.status) ? input.status : existing.status,
    updatedAt: new Date().toISOString(),
  }
  await writeCommerceProduct(next)
  return next
}

export async function deleteCommerceProduct(id: string): Promise<boolean> {
  const existing = await getCommerceProduct(id)
  if (!existing) return false

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("commerce_products").delete().eq("id", id)
      if (error) throw error
      return true
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Deleting commerce product from local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  await db.query("DELETE FROM commerce_products WHERE id = $1", [id])
  return true
}

export async function listCommercePurchaseRequests(): Promise<StoredCommercePurchaseRequest[]> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("commerce_purchase_requests").select(requestSelect).order("created_at", { ascending: false })
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

export async function createCommercePurchaseRequest(input: {
  productId: string
  buyerName: string
  buyerContact: string
  message?: string
}): Promise<StoredCommercePurchaseRequest> {
  const now = new Date().toISOString()
  const request: StoredCommercePurchaseRequest = {
    id: randomUUID(),
    productId: input.productId,
    buyerName: input.buyerName.trim(),
    buyerContact: input.buyerContact.trim(),
    message: input.message?.trim() ?? "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("commerce_purchase_requests").insert(toRequestRow(request))
      if (error) throw error
      return request
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving commerce request to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const row = toRequestRow(request)
  await db.query(
    `INSERT INTO commerce_purchase_requests (id, product_id, buyer_name, buyer_contact, message, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [row.id, row.product_id, row.buyer_name, row.buyer_contact, row.message, row.status, row.created_at, row.updated_at]
  )
  return request
}

export async function updateCommercePurchaseRequest(id: string, status: CommercePurchaseRequestStatus): Promise<StoredCommercePurchaseRequest | null> {
  if (!isCommercePurchaseRequestStatus(status)) return null
  const requests = await listCommercePurchaseRequests()
  const existing = requests.find((request) => request.id === id)
  if (!existing) return null
  const next = { ...existing, status, updatedAt: new Date().toISOString() }

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("commerce_purchase_requests").update(toRequestRow(next)).eq("id", id)
      if (error) throw error
      return next
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Updating commerce request in local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  await db.query("UPDATE commerce_purchase_requests SET status = $1, updated_at = $2 WHERE id = $3", [next.status, next.updatedAt, next.id])
  return next
}

type CommerceProductInput = {
  name: string
  description?: string
  price: number | string
  currency?: string
  category?: string
  condition?: string
  country?: string
  city?: string
  imageUrl?: string
  sellerName?: string
  sellerContact?: string
  status?: CommerceProductStatus | string
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

  if (globalThis.__bukhtCommerceUseFallback) return fallbackProducts

  try {
    const db = await getDb()
    const result = await db.query<CommerceProductRow>(`SELECT ${productSelect} FROM commerce_products ORDER BY updated_at DESC`)
    return result.rows.map(mapCommerceProduct)
  } catch (error) {
    globalThis.__bukhtCommerceUseFallback = true
    console.warn("Falling back to bundled commerce products because local DB is unavailable.", error)
    return fallbackProducts
  }
}

async function insertCommerceProduct(product: StoredCommerceProduct): Promise<void> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("commerce_products").insert(toProductRow(product))
      if (error) throw error
      return
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Saving commerce product to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const row = toProductRow(product)
  await db.query(
    `INSERT INTO commerce_products (
      id, owner_id, name, description, price, currency, category, condition, country, city,
      image_url, seller_name, seller_contact, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [row.id, row.owner_id, row.name, row.description, row.price, row.currency, row.category, row.condition, row.country, row.city, row.image_url, row.seller_name, row.seller_contact, row.status, row.created_at, row.updated_at]
  )
}

async function writeCommerceProduct(product: StoredCommerceProduct): Promise<void> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("commerce_products").update(toProductRow(product)).eq("id", product.id)
      if (error) throw error
      return
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw error
      console.warn("Updating commerce product in local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  const row = toProductRow(product)
  await db.query(
    `UPDATE commerce_products SET owner_id = $1, name = $2, description = $3, price = $4, currency = $5,
      category = $6, condition = $7, country = $8, city = $9, image_url = $10, seller_name = $11,
      seller_contact = $12, status = $13, updated_at = $14 WHERE id = $15`,
    [row.owner_id, row.name, row.description, row.price, row.currency, row.category, row.condition, row.country, row.city, row.image_url, row.seller_name, row.seller_contact, row.status, row.updated_at, row.id]
  )
}

function buildProduct(input: CommerceProductInput & { ownerId?: string }): StoredCommerceProduct {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    ownerId: input.ownerId?.trim() ?? "",
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    price: sanitizePrice(input.price),
    currency: input.currency?.trim() || "MNT",
    category: input.category?.trim() ?? "",
    condition: input.condition?.trim() ?? "",
    country: input.country?.trim() ?? "",
    city: input.city?.trim() ?? "",
    imageUrl: input.imageUrl?.trim() ?? "",
    sellerName: input.sellerName?.trim() ?? "",
    sellerContact: input.sellerContact?.trim() ?? "",
    status: input.status && isCommerceProductStatus(input.status) ? input.status : "available",
    createdAt: now,
    updatedAt: now,
  }
}

function toProductRow(product: StoredCommerceProduct): CommerceProductRow {
  return {
    id: product.id,
    owner_id: product.ownerId,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    category: product.category,
    condition: product.condition,
    country: product.country,
    city: product.city,
    image_url: product.imageUrl,
    seller_name: product.sellerName,
    seller_contact: product.sellerContact,
    status: product.status,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }
}

function toRequestRow(request: StoredCommercePurchaseRequest): CommercePurchaseRequestRow {
  return {
    id: request.id,
    product_id: request.productId,
    buyer_name: request.buyerName,
    buyer_contact: request.buyerContact,
    message: request.message,
    status: request.status,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
  }
}

function sanitizePrice(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""))
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0
}
