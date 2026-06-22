import type { CommerceProductStatus } from "./commerce-model"

export type CommerceProductInput = {
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

export type CommercePurchaseRequestInput = {
  productId: string
  buyerName: string
  buyerContact: string
  message?: string
}
