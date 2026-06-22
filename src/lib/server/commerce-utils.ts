import { randomUUID } from "node:crypto"
import { isCommerceProductStatus, type CommerceProductRow, type CommercePurchaseRequestRow, type StoredCommerceProduct, type StoredCommercePurchaseRequest } from "./commerce-model"
import type { CommerceProductInput, CommercePurchaseRequestInput } from "./commerce-types"

export function buildCommerceProduct(input: CommerceProductInput & { ownerId?: string }): StoredCommerceProduct {
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

export function applyCommerceProductUpdate(existing: StoredCommerceProduct, input: Partial<CommerceProductInput>): StoredCommerceProduct {
  return {
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
}

export function buildCommercePurchaseRequest(input: CommercePurchaseRequestInput): StoredCommercePurchaseRequest {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    productId: input.productId,
    buyerName: input.buyerName.trim(),
    buyerContact: input.buyerContact.trim(),
    message: input.message?.trim() ?? "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }
}

export function toProductRow(product: StoredCommerceProduct): CommerceProductRow {
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

export function toRequestRow(request: StoredCommercePurchaseRequest): CommercePurchaseRequestRow {
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
