import { toErrorMessage } from "./shared-store"

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
  imageUrl: string
  sellerName: string
  sellerEmail: string
  createdAt: string
  updatedAt: string
}

export type ProductRow = {
  id: string
  name: string
  category: string
  price: string
  moq: string
  origin: string
  lead_time: string
  badge: string
  summary: string
  image_url?: string | null
  seller_name?: string | null
  seller_email?: string | null
  created_at: string
  updated_at: string
}

export function mapProduct(row: ProductRow): StoredProduct {
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
    imageUrl: row.image_url ?? "",
    sellerName: row.seller_name ?? "BUKHT",
    sellerEmail: row.seller_email ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapProductStoreError(error: unknown): Error {
  const message = toErrorMessage(error)
  if (message.includes(`relation "products" does not exist`) || message.includes(`Could not find the table 'public.products'`)) {
    return new Error("Supabase deer `products` husnegt alga baina. `docs/supabase-schema.sql`-iin schema-g ajilluulna uu.")
  }
  if (message.includes(`column products.lead_time does not exist`) || message.includes(`Could not find the 'lead_time' column of 'products'`)) {
    return new Error("Supabase deer `products.lead_time` bagana dutuu baina. `docs/supabase-schema.sql` schema shinechleh heregtei.")
  }
  if (message.includes(`column products.image_url does not exist`) || message.includes(`Could not find the 'image_url' column of 'products'`)) {
    return new Error("Supabase deer `products.image_url`, `seller_name`, `seller_email` baganuud dutuu baina. `docs/supabase-schema.sql` schema shinechleh heregtei.")
  }
  return error instanceof Error ? error : new Error(message)
}
