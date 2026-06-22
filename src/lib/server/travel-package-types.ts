import type { TravelItineraryDay, TravelPackageStatus } from "./travel-package-model"

export type TravelPackageInput = {
  ownerId?: string
  status?: TravelPackageStatus
  title: string
  shortDescription?: string
  fullDescription?: string
  destination?: string
  startLocation?: string
  endLocation?: string
  mapCoordinates?: string
  transportationTypes?: string[]
  price?: number
  priceCurrency?: "MNT" | "CNY"
  maxParticipants?: number
  paymentSettings?: string
  cancellationPolicy?: string
  location: string
  category: string
  duration: string
  groupSize: string
  transport: string
  hotel: string
  language: string
  startDate: string
  heroImage: string
  galleryImages: string[]
  summary: string
  adultPrice: number
  childPrice: number
  infantPrice: number
  singleRoomPrice: number
  included: string[]
  excluded: string[]
  itinerary: TravelItineraryDay[]
  warning: string
}
