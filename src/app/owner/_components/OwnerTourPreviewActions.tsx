"use client"

import Link from "@/src/components/ui/TrackedLink"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { TravelPackageStatus } from "@/src/lib/server/travel-package-store"

export default function OwnerTourPreviewActions({ tourId, status }: { tourId: string; status: TravelPackageStatus }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function updateStatus(nextStatus: TravelPackageStatus): Promise<void> {
    setBusy(true)
    setError("")
    const response = await fetch(`/api/owner/tours/${encodeURIComponent(tourId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    setBusy(false)
    if (!response.ok) {
      const body = (await response.json()) as { message?: string }
      setError(body.message ?? "Аяллын төлөв шинэчлэхэд алдаа гарлаа.")
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/owner/travel/tours/${encodeURIComponent(tourId)}`} className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-black text-blue-900 hover:bg-blue-50">Засах хэсэг рүү буцах</Link>
      <button type="button" className="rounded-md bg-blue-900 px-3 py-2 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50" disabled={busy} onClick={() => updateStatus(status === "published" ? "draft" : "published")}>
        {status === "published" ? "Нуух" : "Нийтлэх"}
      </button>
      {error ? <span className="text-sm font-bold text-red-700">{error}</span> : null}
    </div>
  )
}
