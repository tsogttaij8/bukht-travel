"use client"

import { useState } from "react"
import type { StoredTravelPackage } from "../../lib/server/travel-package-store"
import type { TravelPackageForm } from "./types"

export const emptyTravelPackageForm: TravelPackageForm = {
  title: "",
  location: "China",
  category: "Аялал",
  duration: "5 өдөр",
  groupSize: "10-20 хүн",
  transport: "Онгоц, галт тэрэг, автобус",
  hotel: "Зочид буудал",
  language: "Монгол",
  startDate: "",
  heroImage: "",
  galleryImagesText: "",
  summary: "",
  adultPrice: "",
  childPrice: "",
  infantPrice: "",
  singleRoomPrice: "",
  includedText: "Зочид буудал\nХөтөлбөрт заасан хоол\nАяллын унаа\nАяллын хөтөч",
  excludedText: "Хувийн хэрэглээний зардал\nВизийн төлбөр\nНэмэлт үзвэр үйлчилгээ",
  itinerary: [{ day: "Өдөр-1", date: "", title: "", details: "" }],
  warning: "",
}

export function useTravelPackages(setTravelPackages: (updater: (packages: StoredTravelPackage[]) => StoredTravelPackage[]) => void) {
  const [form, setForm] = useState<TravelPackageForm>(emptyTravelPackageForm)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function createTravelPackage(): Promise<void> {
    setBusy(true)
    setError("")
    const response = await fetch("/api/admin/travel-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        adultPrice: toNumber(form.adultPrice),
        childPrice: toNumber(form.childPrice),
        infantPrice: toNumber(form.infantPrice),
        singleRoomPrice: toNumber(form.singleRoomPrice),
        galleryImages: toLines(form.galleryImagesText),
        included: toLines(form.includedText),
        excluded: toLines(form.excludedText),
        itinerary: form.itinerary,
      }),
    })
    const body = (await response.json()) as { travelPackage?: StoredTravelPackage; message?: string }
    setBusy(false)
    if (!response.ok || !body.travelPackage) return setError(body.message ?? "Аялал нэмэхэд алдаа гарлаа")
    setTravelPackages((current) => [body.travelPackage!, ...current])
    setForm(emptyTravelPackageForm)
  }

  return { form, setForm, error, busy, createTravelPackage }
}

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function toNumber(value: string): number {
  return Number(value.replace(/[^\d]/g, "")) || 0
}
