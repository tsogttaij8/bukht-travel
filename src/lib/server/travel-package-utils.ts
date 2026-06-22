import { randomUUID } from "node:crypto"
import type { StoredTravelPackage, TravelItineraryDay } from "./travel-package-model"
import type { TravelPackageInput } from "./travel-package-types"

export function buildTravelPackage(input: TravelPackageInput): StoredTravelPackage {
  const now = new Date().toISOString()
  const id = randomUUID()
  const shortDescription = input.shortDescription?.trim() || input.summary.trim()
  const fullDescription = input.fullDescription?.trim() || input.summary.trim()
  const destination = input.destination?.trim() || input.location.trim()
  const transportationTypes = input.transportationTypes?.map((item) => item.trim()).filter(Boolean) ?? input.transport.split(",").map((item) => item.trim()).filter(Boolean)
  return {
    id,
    ownerId: input.ownerId?.trim() ?? "",
    status: input.status ?? "draft",
    title: input.title.trim(),
    slug: `${slugify(input.title)}-${id.slice(0, 8)}`,
    shortDescription,
    fullDescription,
    destination,
    startLocation: input.startLocation?.trim() ?? "",
    endLocation: input.endLocation?.trim() ?? "",
    mapCoordinates: input.mapCoordinates?.trim() ?? "",
    transportationTypes,
    price: sanitizePrice(input.price ?? input.adultPrice),
    priceCurrency: normalizePriceCurrency(input.priceCurrency),
    maxParticipants: sanitizeCount(input.maxParticipants ?? parseParticipantCount(input.groupSize)),
    paymentSettings: input.paymentSettings?.trim() ?? "",
    cancellationPolicy: input.cancellationPolicy?.trim() ?? "",
    location: input.location.trim(),
    category: input.category.trim(),
    duration: input.duration.trim(),
    groupSize: input.groupSize.trim(),
    transport: input.transport.trim(),
    hotel: input.hotel.trim(),
    language: input.language.trim(),
    startDate: input.startDate.trim(),
    heroImage: input.heroImage.trim(),
    galleryImages: input.galleryImages.map((image) => image.trim()).filter(Boolean),
    summary: input.summary.trim(),
    adultPrice: sanitizePrice(input.adultPrice),
    childPrice: sanitizePrice(input.childPrice),
    infantPrice: sanitizePrice(input.infantPrice),
    singleRoomPrice: sanitizePrice(input.singleRoomPrice),
    included: input.included.map((item) => item.trim()).filter(Boolean),
    excluded: input.excluded.map((item) => item.trim()).filter(Boolean),
    itinerary: input.itinerary.map(cleanItineraryDay).filter((day) => day.title || day.details),
    warning: input.warning.trim(),
    createdAt: now,
    updatedAt: now,
  }
}

export function applyTravelPackageUpdate(existing: StoredTravelPackage, ownerId: string, input: Partial<TravelPackageInput>): StoredTravelPackage {
  return {
    ...existing,
    ownerId,
    status: input.status ?? existing.status,
    title: input.title?.trim() ?? existing.title,
    shortDescription: input.shortDescription?.trim() ?? existing.shortDescription,
    fullDescription: input.fullDescription?.trim() ?? existing.fullDescription,
    destination: input.destination?.trim() ?? existing.destination,
    startLocation: input.startLocation?.trim() ?? existing.startLocation,
    endLocation: input.endLocation?.trim() ?? existing.endLocation,
    mapCoordinates: input.mapCoordinates?.trim() ?? existing.mapCoordinates,
    transportationTypes: input.transportationTypes?.map((item) => item.trim()).filter(Boolean) ?? existing.transportationTypes,
    price: input.price !== undefined ? sanitizePrice(input.price) : existing.price,
    priceCurrency: input.priceCurrency ? normalizePriceCurrency(input.priceCurrency) : existing.priceCurrency,
    maxParticipants: input.maxParticipants !== undefined ? sanitizeCount(input.maxParticipants) : existing.maxParticipants,
    paymentSettings: input.paymentSettings?.trim() ?? existing.paymentSettings,
    cancellationPolicy: input.cancellationPolicy?.trim() ?? existing.cancellationPolicy,
    location: input.location?.trim() ?? existing.location,
    category: input.category?.trim() ?? existing.category,
    duration: input.duration?.trim() ?? existing.duration,
    groupSize: input.groupSize?.trim() ?? existing.groupSize,
    transport: input.transport?.trim() ?? existing.transport,
    hotel: input.hotel?.trim() ?? existing.hotel,
    language: input.language?.trim() ?? existing.language,
    startDate: input.startDate?.trim() ?? existing.startDate,
    heroImage: input.heroImage?.trim() ?? existing.heroImage,
    galleryImages: input.galleryImages?.map((image) => image.trim()).filter(Boolean) ?? existing.galleryImages,
    summary: input.summary?.trim() ?? existing.summary,
    adultPrice: input.adultPrice !== undefined ? sanitizePrice(input.adultPrice) : existing.adultPrice,
    childPrice: input.childPrice !== undefined ? sanitizePrice(input.childPrice) : existing.childPrice,
    infantPrice: input.infantPrice !== undefined ? sanitizePrice(input.infantPrice) : existing.infantPrice,
    singleRoomPrice: input.singleRoomPrice !== undefined ? sanitizePrice(input.singleRoomPrice) : existing.singleRoomPrice,
    included: input.included?.map((item) => item.trim()).filter(Boolean) ?? existing.included,
    excluded: input.excluded?.map((item) => item.trim()).filter(Boolean) ?? existing.excluded,
    itinerary: input.itinerary?.map(cleanItineraryDay).filter((day) => day.title || day.details) ?? existing.itinerary,
    warning: input.warning?.trim() ?? existing.warning,
    updatedAt: new Date().toISOString(),
  }
}

export function sanitizePrice(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function sanitizeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function normalizePriceCurrency(value: string | undefined): "MNT" | "CNY" {
  return value === "CNY" ? "CNY" : "MNT"
}

function parseParticipantCount(value: string): number {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) || 0 : 0
}

function cleanItineraryDay(day: TravelItineraryDay): TravelItineraryDay {
  return { day: day.day.trim(), date: day.date.trim(), title: day.title.trim(), details: day.details.trim() }
}

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]+/g, "-").replace(/^-+|-+$/g, "")
  return slug || "travel"
}
