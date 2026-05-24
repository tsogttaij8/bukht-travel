import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { mapProduct, mapProductStoreError, type ProductRow, type StoredProduct } from "./product-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { StoredProduct } from "./product-model"

const productSelect = "id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at"
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
      `SELECT id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at
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

export async function createProduct(input: {
  name: string
  category: string
  price: string
  moq: string
  origin: string
  leadTime: string
  badge?: string
  summary: string
}): Promise<StoredProduct> {
  const product = buildProduct(input)

  if (isSupabaseEnabled()) {
    try {
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from("products").insert(toProductRow(product))
      if (error) throw mapProductStoreError(error)
      return product
    } catch (error) {
      if (!shouldFallbackToLocalDb(error)) throw mapProductStoreError(error)
      console.warn("Saving product to local DB because Supabase is unreachable.", error)
    }
  }

  const db = await getDb()
  await db.query(
    `INSERT INTO products (
      id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
      product.createdAt,
      product.updatedAt,
    ]
  )

  return product
}

function buildProduct(input: Parameters<typeof createProduct>[0]): StoredProduct {
  const now = new Date().toISOString()
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
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }
}
