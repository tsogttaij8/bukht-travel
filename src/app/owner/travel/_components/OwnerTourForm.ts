import type { StoredTravelPackage } from "@/src/lib/server/travel-package-store"

export type OwnerTourForm = {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  destination: string
  startLocation: string
  endLocation: string
  mapCoordinates: string
  startDate: string
  endDate: string
  duration: string
  transportationTypesText: string
  itineraryText: string
  includedText: string
  excludedText: string
  price: string
  priceCurrency: string
  maxParticipants: string
  galleryImagesText: string
  paymentSettings: string
  cancellationPolicy: string
}

export const emptyOwnerTourForm: OwnerTourForm = {
  id: "",
  title: "",
  shortDescription: "",
  fullDescription: "",
  destination: "",
  startLocation: "",
  endLocation: "",
  mapCoordinates: "",
  startDate: "",
  endDate: "",
  duration: "",
  transportationTypesText: "",
  itineraryText: "",
  includedText: "",
  excludedText: "",
  price: "",
  priceCurrency: "MNT",
  maxParticipants: "",
  galleryImagesText: "",
  paymentSettings: "",
  cancellationPolicy: "",
}

export function formFromTour(tour: StoredTravelPackage): OwnerTourForm {
  return {
    id: tour.id,
    title: tour.title,
    shortDescription: tour.shortDescription,
    fullDescription: tour.fullDescription,
    destination: tour.destination,
    startLocation: tour.startLocation,
    endLocation: tour.endLocation,
    mapCoordinates: tour.mapCoordinates,
    startDate: tour.startDate,
    endDate: "",
    duration: tour.duration,
    transportationTypesText: tour.transportationTypes.join(", "),
    itineraryText: tour.itinerary.map((day) => [day.day, day.title, day.details].filter(Boolean).join(" | ")).join("\n"),
    includedText: tour.included.join("\n"),
    excludedText: tour.excluded.join("\n"),
    price: String(tour.price || tour.adultPrice || ""),
    priceCurrency: tour.priceCurrency,
    maxParticipants: String(tour.maxParticipants || ""),
    galleryImagesText: tour.galleryImages.join("\n"),
    paymentSettings: tour.paymentSettings,
    cancellationPolicy: tour.cancellationPolicy,
  }
}
