"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Edit, Eye, Plus, Trash2 } from "lucide-react"
import OwnerDataTable from "../OwnerDataTable"
import OwnerEmptyState from "../OwnerEmptyState"
import OwnerStat from "../OwnerStat"
import OwnerTourEditor, { formFromTour, type OwnerTourForm } from "./OwnerTourEditor"
import type { StoredTravelPackage, TravelPackageStatus } from "../../../lib/server/travel-package-store"

type Mode = "dashboard" | "tours" | "new" | "edit"

type OwnerTravelManagerProps = {
  mode: Mode
  tourId?: string
}

export default function OwnerTravelManager({ mode, tourId }: OwnerTravelManagerProps) {
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

  async function loadTours(): Promise<void> {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/owner/tours", { cache: "no-store" })
      const body = (await response.json()) as { tours?: StoredTravelPackage[]; message?: string }
      if (!response.ok) throw new Error(body.message ?? "Аяллын жагсаалт ачаалахад алдаа гарлаа.")
      setTours(body.tours ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Аяллын жагсаалт ачаалахад алдаа гарлаа.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTours()
  }, [])

  async function saveTour(form: OwnerTourForm, status: TravelPackageStatus): Promise<StoredTravelPackage | null> {
    setSaving(true)
    setError("")
    try {
      const payload = { ...formToPayload(form), status }
      const response = await fetch(form.id ? `/api/owner/tours/${encodeURIComponent(form.id)}` : "/api/owner/tours", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
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

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">Аяллын мэдээлэл ачаалж байна...</div>
  }

  if (mode === "new") {
    return <OwnerTourEditor saving={saving} error={error} onSave={saveTour} />
  }

  if (mode === "edit") {
    if (!selectedTour) {
      return <OwnerEmptyState title="Аялал олдсонгүй" body="Энэ аялал одоогийн owner эрхээр харагдах боломжгүй байна." action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/travel/tours">Аяллын жагсаалт руу буцах</Link>} />
    }
    return <OwnerTourEditor initialForm={formFromTour(selectedTour)} saving={saving} error={error} onSave={saveTour} />
  }

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
      <ToursTable tours={tours} onStatus={updateStatus} onDelete={deleteTour} />
    </div>
  )
}

function ToursTable(props: {
  tours: StoredTravelPackage[]
  onStatus: (tour: StoredTravelPackage, status: TravelPackageStatus) => void
  onDelete: (tour: StoredTravelPackage) => void
}) {
  if (props.tours.length === 0) {
    return (
      <OwnerEmptyState
        title="Аялал хараахан алга"
        body="Эхний аяллаа ноорог байдлаар үүсгээд, бэлэн болсон үед нь нийтэлнэ."
        action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/travel/tours/new"><Plus size={16} className="mr-2 inline" />Шинэ аялал</Link>}
      />
    )
  }

  return (
    <OwnerDataTable
      rows={props.tours}
      getRowKey={(tour) => tour.id}
      columns={[
        { key: "title", label: "Нэр", render: (tour) => <div><strong className="block text-slate-950">{tour.title}</strong><span className="text-xs text-slate-500">{tour.shortDescription || "Богино танилцуулга оруулаагүй"}</span></div> },
        { key: "destination", label: "Очих газар", render: (tour) => tour.destination || "-" },
        { key: "price", label: "Үнэ", render: (tour) => formatMoney(tour.price) },
        { key: "status", label: "Төлөв", render: (tour) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tour.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{tour.status === "published" ? "Нийтлэгдсэн" : "Ноорог"}</span> },
        { key: "created", label: "Үүссэн", render: (tour) => formatDate(tour.createdAt) },
        { key: "updated", label: "Шинэчилсэн", render: (tour) => formatDate(tour.updatedAt) },
        { key: "actions", label: "Үйлдэл", render: (tour) => (
          <div className="flex flex-wrap gap-2">
            <Link href={`/owner/travel/tours/${tour.id}`} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Засах"><Edit size={15} /></Link>
            <Link href={`/owner/travel/tours/${tour.id}/preview`} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Харах"><Eye size={15} /></Link>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50" onClick={() => props.onStatus(tour, tour.status === "published" ? "draft" : "published")}>
              {tour.status === "published" ? "Нуух" : "Нийтлэх"}
            </button>
            <button type="button" className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50" onClick={() => props.onDelete(tour)} title="Устгах"><Trash2 size={15} /></button>
          </div>
        ) },
      ]}
    />
  )
}

function formToPayload(form: OwnerTourForm) {
  return {
    title: form.title,
    shortDescription: form.shortDescription,
    fullDescription: form.fullDescription,
    destination: form.destination,
    startLocation: form.startLocation,
    endLocation: form.endLocation,
    mapCoordinates: form.mapCoordinates,
    duration: form.duration,
    transportationTypes: toList(form.transportationTypesText),
    itinerary: parseItinerary(form.itineraryText),
    included: toList(form.includedText),
    excluded: toList(form.excludedText),
    price: toNumber(form.price),
    maxParticipants: toNumber(form.maxParticipants),
    galleryImages: toList(form.galleryImagesText),
    paymentSettings: form.paymentSettings,
    cancellationPolicy: form.cancellationPolicy,
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

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} MNT`
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("mn-MN") : "-"
}
