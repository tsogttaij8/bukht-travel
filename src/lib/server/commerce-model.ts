export const commerceProductStatuses = ["available", "sold", "hidden"] as const
export const commercePurchaseRequestStatuses = ["pending", "accepted", "rejected"] as const

export type CommerceProductStatus = (typeof commerceProductStatuses)[number]
export type CommercePurchaseRequestStatus = (typeof commercePurchaseRequestStatuses)[number]

export type CommerceProductRow = {
  id: string
  owner_id: string
  name: string
  description: string | null
  price: number | string
  currency: string | null
  category: string | null
  condition: string | null
  country: string | null
  city: string | null
  image_url: string | null
  seller_name: string | null
  seller_contact: string | null
  status: CommerceProductStatus | string | null
  created_at: string
  updated_at: string
}

export type CommercePurchaseRequestRow = {
  id: string
  product_id: string
  buyer_id?: string | null
  buyer_email?: string | null
  buyer_name: string
  buyer_contact: string
  message: string | null
  status: CommercePurchaseRequestStatus | string | null
  created_at: string
  updated_at: string
}

export type StoredCommerceProduct = {
  id: string
  ownerId: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  condition: string
  country: string
  city: string
  imageUrl: string
  sellerName: string
  sellerContact: string
  status: CommerceProductStatus
  createdAt: string
  updatedAt: string
}

export type StoredCommercePurchaseRequest = {
  id: string
  productId: string
  buyerId: string
  buyerEmail: string
  buyerName: string
  buyerContact: string
  message: string
  status: CommercePurchaseRequestStatus
  createdAt: string
  updatedAt: string
}

export function isCommerceProductStatus(value: unknown): value is CommerceProductStatus {
  return typeof value === "string" && commerceProductStatuses.includes(value as CommerceProductStatus)
}

export function isCommercePurchaseRequestStatus(value: unknown): value is CommercePurchaseRequestStatus {
  return typeof value === "string" && commercePurchaseRequestStatuses.includes(value as CommercePurchaseRequestStatus)
}

export function mapCommerceProduct(row: CommerceProductRow): StoredCommerceProduct {
  return {
    id: row.id,
    ownerId: row.owner_id ?? "",
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price) || 0,
    currency: row.currency || "MNT",
    category: row.category ?? "",
    condition: row.condition ?? "",
    country: row.country ?? "",
    city: row.city ?? "",
    imageUrl: row.image_url ?? "",
    sellerName: row.seller_name ?? "",
    sellerContact: row.seller_contact ?? "",
    status: isCommerceProductStatus(row.status) ? row.status : "available",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCommercePurchaseRequest(row: CommercePurchaseRequestRow): StoredCommercePurchaseRequest {
  return {
    id: row.id,
    productId: row.product_id,
    buyerId: row.buyer_id ?? "",
    buyerEmail: row.buyer_email ?? "",
    buyerName: row.buyer_name,
    buyerContact: row.buyer_contact,
    message: row.message ?? "",
    status: isCommercePurchaseRequestStatus(row.status) ? row.status : "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
