import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { mapProduct, mapProductStoreError, type ProductRow, type StoredProduct } from "./product-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { StoredProduct } from "./product-model"

const productSelect = "id, name, category, price, moq, origin, lead_time, badge, summary, image_url, image_urls, seller_name, seller_email, created_at, updated_at"
const legacyProductSelect = "id, name, category, price, moq, origin, lead_time, badge, summary, image_url, seller_name, seller_email, created_at, updated_at"
const fallbackProducts: StoredProduct[] = [
  {
    id: "fallback-kitchen-storage-set",
    name: "Kitchen Storage Set",
    category: "Ger ahui",
    price: "29,900 - 69,900 MNT",
    moq: "MOQ 12",
    origin: "Guangzhou",
    leadTime: "7-10 honog",
    badge: "Hot deal",
    summary: "Home goods and reseller-friendly storage bundle.",
    imageUrl: "",
    imageUrls: [],
    sellerName: "BUKHT",
    sellerEmail: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fallback-mini-beauty-device",
    name: "Mini Beauty Device",
    category: "Goo saihan",
    price: "48,000 - 118,000 MNT",
    moq: "MOQ 6",
    origin: "Shenzhen",
    leadTime: "5-8 honog",
    badge: "Trending",
    summary: "Compact beauty gadget suited for online sales.",
    imageUrl: "",
    imageUrls: [],
    sellerName: "BUKHT",
    sellerEmail: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "fallback-streetwear-capsule",
    name: "Streetwear Capsule",
    category: "Huvtsas",
    price: "39,000 - 92,000 MNT",
    moq: "MOQ 20",
    origin: "Hangzhou",
    leadTime: "8-12 honog",
    badge: "New arrival",
    summary: "Youth-focused capsule collection for small batches.",
    imageUrl: "",
    imageUrls: [],
    sellerName: "BUKHT",
    sellerEmail: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
]

declare global {
  var __buhktProductsUseFallback: boolean | undefined
}

export async function listProducts(): Promise<StoredProduct[]> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("products").select(productSelect).order("updated_at", { ascending: false })
      if (error) throw mapProductStoreError(error)
      return (data ?? []).map((product) => mapProduct(product as ProductRow))
    } catch (error) {
      if (isMissingImageUrlsColumn(error)) return listLegacySupabaseProducts()
      if (!shouldFallbackToLocalDb(error)) throw mapProductStoreError(error)
      console.warn("Falling back to local product DB because Supabase is unreachable.", error)
    }
  }

  if (globalThis.__buhktProductsUseFallback) {
    return fallbackProducts
  }

  try {
    const db = await getDb()
    const result = await db.query<ProductRow>(
      `SELECT id, name, category, price, moq, origin, lead_time, badge, summary, image_url, image_urls, seller_name, seller_email, created_at, updated_at
       FROM products
       ORDER BY updated_at DESC`
    )
    return result.rows.map(mapProduct)
  } catch (error) {
    globalThis.__buhktProductsUseFallback = true
    console.warn("Falling back to bundled shop products because the local product DB is unavailable.", error)
    return fallbackProducts
  }
}

export async function getProduct(id: string): Promise<StoredProduct | null> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase.from("products").select(productSelect).eq("id", id).maybeSingle()
      if (error) throw mapProductStoreError(error)
      return data ? mapProduct(data as ProductRow) : null
    } catch (error) {
      if (isMissingImageUrlsColumn(error)) return getLegacySupabaseProduct(id)
      if (!shouldFallbackToLocalDb(error)) throw mapProductStoreError(error)
      console.warn("Falling back to local product DB because Supabase is unreachable.", error)
    }
  }

  if (globalThis.__buhktProductsUseFallback) {
    return fallbackProducts.find((product) => product.id === id) ?? null
  }

  try {
    const db = await getDb()
    const result = await db.query<ProductRow>(
      `SELECT id, name, category, price, moq, origin, lead_time, badge, summary, image_url, image_urls, seller_name, seller_email, created_at, updated_at
       FROM products
       WHERE id = $1
       LIMIT 1`,
      [id]
    )
    return result.rows[0] ? mapProduct(result.rows[0]) : null
  } catch (error) {
    globalThis.__buhktProductsUseFallback = true
    console.warn("Falling back to bundled shop products because the local product DB is unavailable.", error)
    return fallbackProducts.find((product) => product.id === id) ?? null
  }
}

export async function createProduct(input: {
  name: string
  category: string
  price: string
  moq: string
  origin: string
  leadTime: string
  badge?: string
  summary: string
  imageUrl?: string
  imageUrls?: string[]
  sellerName?: string
  sellerEmail?: string
}): Promise<StoredProduct> {
  const product = buildProduct(input)

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("products").insert(toProductRow(product))
      if (error) throw mapProductStoreError(error)
      return product
    } catch (error) {
      if (isMissingImageUrlsColumn(error)) {
        const supabase = getSupabaseAdmin()
        const { error: legacyError } = await supabase.from("products").insert(toLegacyProductRow(product))
        if (legacyError) throw mapProductStoreError(legacyError)
        return product
      }
      if (!shouldFallbackToLocalDb(error)) throw mapProductStoreError(error)
      console.warn("Saving product to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  await db.query(
    `INSERT INTO products (
      id, name, category, price, moq, origin, lead_time, badge, summary, image_url, image_urls, seller_name, seller_email, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      product.id,
      product.name,
      product.category,
      product.price,
      product.moq,
      product.origin,
      product.leadTime,
      product.badge,
      product.summary,
      product.imageUrl,
      JSON.stringify(product.imageUrls),
      product.sellerName,
      product.sellerEmail,
      product.createdAt,
      product.updatedAt,
    ]
  )

  return product
}

export async function updateProduct(id: string, input: {
  name: string
  category: string
  price: string
  moq: string
  origin: string
  leadTime: string
  summary: string
  imageUrl?: string
  imageUrls?: string[]
}): Promise<StoredProduct | null> {
  const existing = await getProduct(id)
  if (!existing) return null

  const imageUrls = Array.from(new Set((input.imageUrls ?? [input.imageUrl ?? ""]).map((image) => image.trim()).filter(Boolean)))
  const product: StoredProduct = {
    ...existing,
    name: input.name.trim(),
    category: input.category.trim(),
    price: input.price.trim(),
    moq: input.moq.trim(),
    origin: input.origin.trim(),
    leadTime: input.leadTime.trim(),
    summary: input.summary.trim(),
    imageUrl: imageUrls[0] ?? "",
    imageUrls,
    updatedAt: new Date().toISOString(),
  }

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("products").update(toProductRow(product)).eq("id", id)
      if (error) throw mapProductStoreError(error)
      return product
    } catch (error) {
      if (isMissingImageUrlsColumn(error)) {
        const supabase = getSupabaseAdmin()
        const { error: legacyError } = await supabase.from("products").update(toLegacyProductRow(product)).eq("id", id)
        if (legacyError) throw mapProductStoreError(legacyError)
        return product
      }
      if (!shouldFallbackToLocalDb(error)) throw mapProductStoreError(error)
      console.warn("Updating product in local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  await db.query(
    `UPDATE products
     SET name = $2, category = $3, price = $4, moq = $5, origin = $6, lead_time = $7, summary = $8, image_url = $9, image_urls = $10, updated_at = $11
     WHERE id = $1`,
    [product.id, product.name, product.category, product.price, product.moq, product.origin, product.leadTime, product.summary, product.imageUrl, JSON.stringify(product.imageUrls), product.updatedAt]
  )

  return product
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw mapProductStoreError(error)
      return true
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapProductStoreError(error)
      console.warn("Deleting product from local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  await db.query("DELETE FROM products WHERE id = $1", [id])
  return true
}

function buildProduct(input: Parameters<typeof createProduct>[0]): StoredProduct {
  const now = new Date().toISOString()
  const imageUrls = Array.from(new Set((input.imageUrls ?? [input.imageUrl ?? ""]).map((image) => image.trim()).filter(Boolean)))
  return {
    id: randomUUID(),
    name: input.name.trim(),
    category: input.category.trim(),
    price: input.price.trim(),
    moq: input.moq.trim(),
    origin: input.origin.trim(),
    leadTime: input.leadTime.trim(),
    badge: input.badge?.trim() || "New",
    summary: input.summary.trim(),
    imageUrl: imageUrls[0] ?? "",
    imageUrls,
    sellerName: input.sellerName?.trim() || "BUKHT",
    sellerEmail: input.sellerEmail?.trim().toLowerCase() ?? "",
    createdAt: now,
    updatedAt: now,
  }
}

function toProductRow(product: StoredProduct): ProductRow {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    moq: product.moq,
    origin: product.origin,
    lead_time: product.leadTime,
    badge: product.badge,
    summary: product.summary,
    image_url: product.imageUrl,
    image_urls: product.imageUrls,
    seller_name: product.sellerName,
    seller_email: product.sellerEmail,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }
}

async function listLegacySupabaseProducts(): Promise<StoredProduct[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from("products").select(legacyProductSelect).order("updated_at", { ascending: false })
  if (error) throw mapProductStoreError(error)
  return (data ?? []).map((product) => mapProduct(product as ProductRow))
}

async function getLegacySupabaseProduct(id: string): Promise<StoredProduct | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from("products").select(legacyProductSelect).eq("id", id).maybeSingle()
  if (error) throw mapProductStoreError(error)
  return data ? mapProduct(data as ProductRow) : null
}

function toLegacyProductRow(product: StoredProduct): Omit<ProductRow, "image_urls"> {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    moq: product.moq,
    origin: product.origin,
    lead_time: product.leadTime,
    badge: product.badge,
    summary: product.summary,
    image_url: product.imageUrl,
    seller_name: product.sellerName,
    seller_email: product.sellerEmail,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }
}

function isMissingImageUrlsColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes("products.image_urls") || message.includes("'image_urls' column") || message.includes("image_urls")
}
