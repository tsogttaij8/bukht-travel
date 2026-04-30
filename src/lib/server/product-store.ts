import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { mapProduct, mapProductStoreError, type ProductRow, type StoredProduct } from "./product-model"
import { shouldFallbackToLocalDb } from "./shared-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type { StoredProduct } from "./product-model"

const productSelect = "id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at"

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

  const db = await getDb()
  const result = await db.query<ProductRow>(
    `SELECT id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at
     FROM products
     ORDER BY updated_at DESC`
  )
  return result.rows.map(mapProduct)
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

