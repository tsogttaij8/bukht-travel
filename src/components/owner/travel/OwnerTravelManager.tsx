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
      if (!response.ok) throw new Error(body.message ?? "Failed to load tours.")
      setTours(body.tours ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load tours.")
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
      if (!response.ok || !body.tour) throw new Error(body.message ?? "Failed to save tour.")
      setTours((current) => form.id ? current.map((tour) => tour.id === body.tour!.id ? body.tour! : tour) : [body.tour!, ...current])
      return body.tour
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save tour.")
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
      setError(body.message ?? "Failed to update status.")
      return
    }
    setTours((current) => current.map((item) => item.id === body.tour!.id ? body.tour! : item))
  }

  async function deleteTour(tour: StoredTravelPackage): Promise<void> {
    if (!window.confirm(`Delete "${tour.title}"?`)) return
    setError("")
    const response = await fetch(`/api/owner/tours/${encodeURIComponent(tour.id)}`, { method: "DELETE" })
    if (!response.ok) {
      const body = (await response.json()) as { message?: string }
      setError(body.message ?? "Failed to delete tour.")
      return
    }
    setTours((current) => current.filter((item) => item.id !== tour.id))
  }

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-bold text-slate-600 shadow-sm">Loading tours from /api/owner/tours...</div>
  }

  if (mode === "new") {
    return <OwnerTourEditor saving={saving} error={error} onSave={saveTour} />
  }

  if (mode === "edit") {
    if (!selectedTour) {
      return <OwnerEmptyState title="Tour not found" body="This tour is not available for the current owner session." action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/travel/tours">Back to tours</Link>} />
    }
    return <OwnerTourEditor initialForm={formFromTour(selectedTour)} saving={saving} error={error} onSave={saveTour} />
  }

  return (
    <div className="grid gap-5">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <OwnerStat label="Total tours" value={String(stats.total)} detail="Real owner tours" />
        <OwnerStat label="Draft tours" value={String(stats.draft)} detail="Owner-only" />
        <OwnerStat label="Published tours" value={String(stats.published)} detail="Publicly visible" />
        <OwnerStat label="Bookings" value="0" detail="No booking data yet" />
        <OwnerStat label="Revenue" value="0" detail="No payment data yet" />
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
        title="No tours yet"
        body="Create a draft tour to start building Travel inventory. No mock tours are shown here."
        action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/travel/tours/new"><Plus size={16} className="mr-2 inline" />New tour</Link>}
      />
    )
  }

  return (
    <OwnerDataTable
      rows={props.tours}
      getRowKey={(tour) => tour.id}
      columns={[
        { key: "title", label: "Title", render: (tour) => <div><strong className="block text-slate-950">{tour.title}</strong><span className="text-xs text-slate-500">{tour.shortDescription || "No short description"}</span></div> },
        { key: "destination", label: "Destination", render: (tour) => tour.destination || "-" },
        { key: "price", label: "Price", render: (tour) => formatMoney(tour.price) },
        { key: "status", label: "Status", render: (tour) => <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tour.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{tour.status}</span> },
        { key: "created", label: "Created", render: (tour) => formatDate(tour.createdAt) },
        { key: "updated", label: "Updated", render: (tour) => formatDate(tour.updatedAt) },
        { key: "actions", label: "Actions", render: (tour) => (
          <div className="flex flex-wrap gap-2">
            <Link href={`/owner/travel/tours/${tour.id}`} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Edit"><Edit size={15} /></Link>
            <Link href={`/owner/travel/tours/${tour.id}/preview`} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Preview"><Eye size={15} /></Link>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50" onClick={() => props.onStatus(tour, tour.status === "published" ? "draft" : "published")}>
              {tour.status === "published" ? "Unpublish" : "Publish"}
            </button>
            <button type="button" className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50" onClick={() => props.onDelete(tour)} title="Delete"><Trash2 size={15} /></button>
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
    return { day: day || `Day ${index + 1}`, date: "", title: title ?? "", details: details ?? "" }
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
