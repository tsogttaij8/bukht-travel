import type { OwnerTourForm } from "./OwnerTourForm"

export function formToPayload(form: OwnerTourForm) {
  const destination = form.destination.trim()
  const summary = form.shortDescription.trim()
  return {
    title: form.title,
    shortDescription: summary,
    fullDescription: form.fullDescription.trim() || summary,
    destination,
    startLocation: form.startLocation.trim() || destination,
    endLocation: form.endLocation.trim() || destination,
    mapCoordinates: "",
    duration: form.duration,
    startDate: form.startDate,
    transportationTypes: toList(form.transportationTypesText),
    itinerary: parseItinerary(form.itineraryText),
    included: toList(form.includedText),
    excluded: toList(form.excludedText),
    price: toNumber(form.price),
    priceCurrency: normalizeCurrency(form.priceCurrency),
    maxParticipants: toNumber(form.maxParticipants),
    galleryImages: toList(form.galleryImagesText),
    paymentSettings: "",
    cancellationPolicy: "",
  }
}

function parseItinerary(value: string) {
  return value.split("\n").map((line, index) => {
    const [day, title, details] = line.split("|").map((part) => part.trim())
    return { day: day || `${index + 1}-р өдөр`, date: "", title: title ?? "", details: details ?? "" }
  }).filter((day) => day.title || day.details)
}

function toList(value: string): string[] {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
}

function toNumber(value: string): number {
  return Number(value.replace(/[^\d]/g, "")) || 0
}

function normalizeCurrency(value: string): "MNT" | "CNY" {
  return value === "CNY" ? "CNY" : "MNT"
}
