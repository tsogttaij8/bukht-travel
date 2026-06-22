import type { StoredTravelPackage, TravelPackageRow } from "./travel-package-model"

export const travelPackageSelect =
  "id, owner_id, status, title, slug, short_description, full_description, destination, start_location, end_location, map_coordinates, transportation_types, price, price_currency, max_participants, payment_settings, cancellation_policy, location, category, duration, group_size, transport, hotel, language, start_date, hero_image, gallery_images, summary, adult_price, child_price, infant_price, single_room_price, included, excluded, itinerary, warning, created_at, updated_at"

export function toTravelPackageRow(item: StoredTravelPackage): TravelPackageRow {
  return {
    id: item.id,
    owner_id: item.ownerId,
    status: item.status,
    title: item.title,
    slug: item.slug,
    short_description: item.shortDescription,
    full_description: item.fullDescription,
    destination: item.destination,
    start_location: item.startLocation,
    end_location: item.endLocation,
    map_coordinates: item.mapCoordinates,
    transportation_types: JSON.stringify(item.transportationTypes),
    price: item.price,
    price_currency: item.priceCurrency,
    max_participants: item.maxParticipants,
    payment_settings: item.paymentSettings,
    cancellation_policy: item.cancellationPolicy,
    location: item.location,
    category: item.category,
    duration: item.duration,
    group_size: item.groupSize,
    transport: item.transport,
    hotel: item.hotel,
    language: item.language,
    start_date: item.startDate,
    hero_image: item.heroImage,
    gallery_images: JSON.stringify(item.galleryImages),
    summary: item.summary,
    adult_price: item.adultPrice,
    child_price: item.childPrice,
    infant_price: item.infantPrice,
    single_room_price: item.singleRoomPrice,
    included: JSON.stringify(item.included),
    excluded: JSON.stringify(item.excluded),
    itinerary: JSON.stringify(item.itinerary),
    warning: item.warning,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }
}

export function normalizeTravelPackageRow(row: TravelPackageRow): TravelPackageRow {
  return {
    ...row,
    transportation_types: stringifyJsonField(row.transportation_types, []),
    gallery_images: stringifyJsonField(row.gallery_images, []),
    included: stringifyJsonField(row.included, []),
    excluded: stringifyJsonField(row.excluded, []),
    itinerary: stringifyJsonField(row.itinerary, []),
  }
}

function stringifyJsonField(value: unknown, fallback: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? fallback)
}
