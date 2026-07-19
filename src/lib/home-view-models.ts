import type { StoredProduct } from "./server/product-store"
import type { StoredTravelPackage } from "./server/travel-package-store"

export type TravelCardViewModel = {
  id: string; href: string; title: string; imageUrl?: string; badge?: string
  durationLabel?: string; locationLabel?: string; formattedPrice: string
}

export type ProductCardViewModel = {
  id: string; href: string; name: string; imageUrl?: string; brand?: string
  moq?: string; origin?: string; formattedPrice: string
}

export function toTravelCard(item: StoredTravelPackage): TravelCardViewModel {
  const amount = item.price || item.adultPrice
  return {
    id: item.id,
    href: `/travel/${item.slug || item.id}`,
    title: item.title,
    imageUrl: item.heroImage || item.galleryImages[0] || undefined,
    badge: item.category || undefined,
    durationLabel: item.duration || undefined,
    locationLabel: item.location || item.destination || undefined,
    formattedPrice: amount ? new Intl.NumberFormat("mn-MN", { style: "currency", currency: item.priceCurrency, maximumFractionDigits: 0 }).format(amount) : "Үнэ тохиролцоно",
  }
}

export function toProductCard(item: StoredProduct): ProductCardViewModel {
  return {
    id: item.id,
    href: `/shop/products/${item.id}`,
    name: item.name,
    imageUrl: item.imageUrls[0] || item.imageUrl || undefined,
    brand: item.sellerName || item.category || undefined,
    moq: item.moq || undefined,
    origin: item.origin || undefined,
    formattedPrice: item.price || "Үнэ тохиролцоно",
  }
}
