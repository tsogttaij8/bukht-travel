import { randomUUID } from "node:crypto"
import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

export type StoredProduct = {
  id: string
  name: string
  category: string
  price: string
  moq: string
  origin: string
  leadTime: string
  badge: string
  summary: string
  createdAt: string
  updatedAt: string
}

type ProductRow = {
  id: string
  name: string
  category: string
  price: string
  moq: string
  origin: string
  lead_time: string
  badge: string
  summary: string
  created_at: string
  updated_at: string
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown
      details?: unknown
      hint?: unknown
      code?: unknown
    }

    const parts = [
      typeof maybeError.message === "string" ? maybeError.message : "",
      typeof maybeError.details === "string" ? maybeError.details : "",
      typeof maybeError.hint === "string" ? maybeError.hint : "",
      typeof maybeError.code === "string" ? `code: ${maybeError.code}` : "",
    ].filter(Boolean)

    if (parts.length > 0) return parts.join(" | ")
  }
  return "Unknown error"
}

function mapProductStoreError(error: unknown): Error {
  const message = toErrorMessage(error)

  if (
    message.includes(`relation "products" does not exist`) ||
    message.includes(`Could not find the table 'public.products'`)
  ) {
    return new Error("Supabase deer `products` husnegt alga baina. `docs/supabase-schema.sql`-iin schema-g ajilluulna uu.")
  }

  if (
    message.includes(`column products.lead_time does not exist`) ||
    message.includes(`Could not find the 'lead_time' column of 'products'`)
  ) {
    return new Error("Supabase deer `products.lead_time` bagana dutuu baina. `docs/supabase-schema.sql` schema shinechleh heregtei.")
  }

  return error instanceof Error ? error : new Error(message)
}

function mapProduct(row: ProductRow): StoredProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    moq: row.moq,
    origin: row.origin,
    leadTime: row.lead_time,
    badge: row.badge,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listProducts(): Promise<StoredProduct[]> {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at")
      .order("updated_at", { ascending: false })

    if (error) throw mapProductStoreError(error)
    return (data ?? []).map((product) => mapProduct(product as ProductRow))
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
  const now = new Date().toISOString()
  const productId = randomUUID()
  const payload = {
    id: productId,
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

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("products").insert({
      id: payload.id,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      moq: payload.moq,
      origin: payload.origin,
      lead_time: payload.leadTime,
      badge: payload.badge,
      summary: payload.summary,
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    })

    if (error) throw mapProductStoreError(error)

    return {
      id: payload.id,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      moq: payload.moq,
      origin: payload.origin,
      leadTime: payload.leadTime,
      badge: payload.badge,
      summary: payload.summary,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    }
  }

  const db = await getDb()
  await db.query(
    `INSERT INTO products (
      id, name, category, price, moq, origin, lead_time, badge, summary, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      payload.id,
      payload.name,
      payload.category,
      payload.price,
      payload.moq,
      payload.origin,
      payload.leadTime,
      payload.badge,
      payload.summary,
      payload.createdAt,
      payload.updatedAt,
    ]
  )

  return {
    id: payload.id,
    name: payload.name,
    category: payload.category,
    price: payload.price,
    moq: payload.moq,
    origin: payload.origin,
    leadTime: payload.leadTime,
    badge: payload.badge,
    summary: payload.summary,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  }
}
