"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import OwnerEmptyState from "../../_components/OwnerEmptyState"
import OwnerStat from "../../_components/OwnerStat"
import OwnerTourEditor, { formFromTour, type OwnerTourForm } from "./OwnerTourEditor"
import { formToPayload } from "./OwnerTravelPayload"
import OwnerTravelTable from "./OwnerTravelTable"
import type { StoredTravelPackage, TravelPackageStatus } from "@/src/lib/server/travel-package-store"
import { useAppLoading } from "@/src/components/ui/LoadingProvider"

type Mode = "dashboard" | "tours" | "new" | "edit"

type OwnerTravelManagerProps = {
  mode: Mode
  tourId?: string
}

export default function OwnerTravelManager({ mode, tourId }: OwnerTravelManagerProps) {
  const { runWithLoading } = useAppLoading()
  const [tours, setTours] = useState<StoredTravelPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const selectedTour = tourId ? tours.find((tour) => tour.id === tourId || tour.slug === tourId) : undefined
  const stats = useMemo(() => ({
    total: tours.length,
    draft: tours.filter((tour) => tour.status === "draft").length,
    published: tours.filter((tour) => tour.status === "published").length,
  }), [tours])

  const loadTours = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError("")
    try {
      const response = await runWithLoading(() => fetch("/api/owner/tours", { cache: "no-store" }))
      const body = (await response.json()) as { tours?: StoredTravelPackage[]; message?: string }
      if (!response.ok) throw new Error(body.message ?? "Аяллын жагсаалт ачаалахад алдаа гарлаа.")
      setTours(body.tours ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Аяллын жагсаалт ачаалахад алдаа гарлаа.")
    } finally {
      setLoading(false)
    }
  }, [runWithLoading])

  useEffect(() => {
    loadTours()
  }, [loadTours])

  async function saveTour(form: OwnerTourForm, status: TravelPackageStatus): Promise<StoredTravelPackage | null> {
    setSaving(true)
    setError("")
    try {
      const response = await runWithLoading(() => fetch(form.id ? `/api/owner/tours/${encodeURIComponent(form.id)}` : "/api/owner/tours", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formToPayload(form), status }),
      }))
      const body = (await response.json()) as { tour?: StoredTravelPackage; message?: string }
      if (!response.ok || !body.tour) throw new Error(body.message ?? "Аялал хадгалахад алдаа гарлаа.")
      setTours((current) => form.id ? current.map((tour) => tour.id === body.tour!.id ? body.tour! : tour) : [body.tour!, ...current])
      return body.tour
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Аялал хадгалахад алдаа гарлаа.")
      return null
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(tour: StoredTravelPackage, status: TravelPackageStatus): Promise<void> {
    setError("")
    const response = await fetch(`/api/owner/tours/${encodeURIComponent(tour.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const body = (await response.json()) as { tour?: StoredTravelPackage; message?: string }
    if (!response.ok || !body.tour) {
      setError(body.message ?? "Аяллын төлөв шинэчлэхэд алдаа гарлаа.")
      return
    }
    setTours((current) => current.map((item) => item.id === body.tour!.id ? body.tour! : item))
  }

  async function deleteTour(tour: StoredTravelPackage): Promise<void> {
    if (!window.confirm(`"${tour.title}" аяллыг устгах уу?`)) return
    setError("")
    const response = await fetch(`/api/owner/tours/${encodeURIComponent(tour.id)}`, { method: "DELETE" })
    if (!response.ok) {
      const body = (await response.json()) as { message?: string }
      setError(body.message ?? "Аялал устгахад алдаа гарлаа.")
      return
    }
    setTours((current) => current.filter((item) => item.id !== tour.id))
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">Аяллын мэдээлэл ачаалж байна...</div>
  if (mode === "new") return <OwnerTourEditor saving={saving} error={error} onSave={saveTour} />
  if (mode === "edit") return selectedTour ? <OwnerTourEditor initialForm={formFromTour(selectedTour)} saving={saving} error={error} onSave={saveTour} /> : <MissingTourState />

  return (
    <div className="grid gap-5">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <OwnerStat label="Нийт аялал" value={String(stats.total)} detail="Owner-ийн бодит аяллууд" />
        <OwnerStat label="Ноорог" value={String(stats.draft)} detail="Зөвхөн owner харна" />
        <OwnerStat label="Нийтлэгдсэн" value={String(stats.published)} detail="Хэрэглэгчдэд харагдана" />
        <OwnerStat label="Захиалга" value="0" detail="Захиалгын мэдээлэл алга" />
        <OwnerStat label="Орлого" value="0" detail="Төлбөрийн мэдээлэл алга" />
      </div>
      <OwnerTravelTable tours={tours} onStatus={updateStatus} onDelete={deleteTour} />
    </div>
  )
}

function MissingTourState() {
  return (
    <OwnerEmptyState
      title="Аялал олдсонгүй"
      body="Энэ аялал одоогийн owner эрхээр харагдах боломжгүй байна."
      action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/travel/tours">Аяллын жагсаалт руу буцах</Link>}
    />
  )
}
