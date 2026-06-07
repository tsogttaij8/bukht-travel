"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bike, Bus, Car, Eye, Footprints, ImageIcon, MapPin, Mountain, Plane, TrainFront } from "lucide-react"
import type { StoredTravelPackage, TravelPackageStatus } from "../../../lib/server/travel-package-store"

export type OwnerTourForm = {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  destination: string
  startLocation: string
  endLocation: string
  mapCoordinates: string
  duration: string
  transportationTypesText: string
  itineraryText: string
  includedText: string
  excludedText: string
  price: string
  maxParticipants: string
  galleryImagesText: string
  paymentSettings: string
  cancellationPolicy: string
}

type Step = "basic" | "experience" | "location" | "transport" | "itinerary" | "pricing" | "gallery" | "payment" | "review"

const emptyForm: OwnerTourForm = {
  id: "",
  title: "",
  shortDescription: "",
  fullDescription: "",
  destination: "",
  startLocation: "",
  endLocation: "",
  mapCoordinates: "",
  duration: "",
  transportationTypesText: "",
  itineraryText: "",
  includedText: "",
  excludedText: "",
  price: "",
  maxParticipants: "",
  galleryImagesText: "",
  paymentSettings: "",
  cancellationPolicy: "",
}

const steps: Array<{ value: Step; label: string }> = [
  { value: "basic", label: "Basic" },
  { value: "experience", label: "Experience" },
  { value: "location", label: "Location" },
  { value: "transport", label: "Transport" },
  { value: "itinerary", label: "Itinerary" },
  { value: "pricing", label: "Pricing" },
  { value: "gallery", label: "Gallery" },
  { value: "payment", label: "Payment" },
  { value: "review", label: "Review" },
]

const transportOptions = [
  { label: "Car", icon: Car },
  { label: "Bus", icon: Bus },
  { label: "Airplane", icon: Plane },
  { label: "Train", icon: TrainFront },
  { label: "Motorcycle", icon: Bike },
  { label: "Walking", icon: Footprints },
  { label: "Horse riding", icon: Mountain },
]

type OwnerTourEditorProps = {
  initialForm?: OwnerTourForm
  saving: boolean
  error: string
  onSave: (form: OwnerTourForm, status: TravelPackageStatus) => Promise<StoredTravelPackage | null>
}

export default function OwnerTourEditor({ initialForm = emptyForm, saving, error, onSave }: OwnerTourEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<OwnerTourForm>(initialForm)
  const [step, setStep] = useState<Step>("basic")
  const stepIndex = steps.findIndex((item) => item.value === step)
  const selectedTransport = toList(form.transportationTypesText)

  function update(field: keyof OwnerTourForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleTransport(label: string) {
    const next = selectedTransport.includes(label) ? selectedTransport.filter((item) => item !== label) : [...selectedTransport, label]
    update("transportationTypesText", next.join(", "))
  }

  async function save(status: TravelPackageStatus) {
    const tour = await onSave(form, status)
    if (tour) router.push("/owner/travel/tours")
  }

  return (
    <section className="grid grid-cols-[250px_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm max-lg:grid-cols-1">
      <aside className="grid content-start gap-1 border-r border-slate-200 bg-slate-50 p-4 max-lg:grid-cols-3 max-lg:border-r-0 max-lg:border-b max-sm:grid-cols-1">
        {steps.map((item, index) => (
          <button key={item.value} type="button" className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-black ${step === item.value ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`} onClick={() => setStep(item.value)}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step === item.value ? "bg-white text-slate-950" : "bg-slate-200 text-slate-700"}`}>{index + 1}</span>
            {item.label}
          </button>
        ))}
      </aside>

      <div className="p-5">
        <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div>
            <p className="m-0 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Step {stepIndex + 1} of {steps.length}</p>
            <h2 className="m-0 mt-1 text-xl font-black text-slate-950">{steps[stepIndex]?.label}</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 disabled:opacity-40" disabled={stepIndex === 0} onClick={() => setStep(steps[stepIndex - 1].value)}>Previous</button>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 disabled:opacity-40" disabled={stepIndex === steps.length - 1} onClick={() => setStep(steps[stepIndex + 1].value)}>Next</button>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

        {step === "basic" ? (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Tour title" value={form.title} onChange={(value) => update("title", value)} />
            <Field label="Duration" value={form.duration} onChange={(value) => update("duration", value)} />
            <Field label="Max participants" value={form.maxParticipants} onChange={(value) => update("maxParticipants", value)} />
            <TextArea label="Short summary" value={form.shortDescription} onChange={(value) => update("shortDescription", value)} />
          </div>
        ) : null}

        {step === "experience" ? (
          <div className="grid gap-4">
            <TextArea label="Full description" value={form.fullDescription} rows={7} onChange={(value) => update("fullDescription", value)} />
            <TextArea label="What's included" value={form.includedText} onChange={(value) => update("includedText", value)} />
            <TextArea label="What's not included" value={form.excludedText} onChange={(value) => update("excludedText", value)} />
          </div>
        ) : null}

        {step === "location" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
            <div className="grid gap-4">
              <Field label="Destination" value={form.destination} onChange={(value) => update("destination", value)} />
              <Field label="Start location" value={form.startLocation} onChange={(value) => update("startLocation", value)} />
              <Field label="End location" value={form.endLocation} onChange={(value) => update("endLocation", value)} />
              <Field label="GPS coordinates" value={form.mapCoordinates} placeholder="47.9189, 106.9176" onChange={(value) => update("mapCoordinates", value)} />
            </div>
            <div className="grid min-h-[240px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <div>
                <MapPin className="mx-auto mb-3 text-slate-500" />
                <strong className="text-slate-950">Map picker placeholder</strong>
                <p className="mt-2 text-sm font-medium text-slate-500">Coordinates are saved through the real owner tour API.</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === "transport" ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
              {transportOptions.map((item) => {
                const Icon = item.icon
                const active = selectedTransport.includes(item.label)
                return (
                  <button key={item.label} type="button" className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-black ${active ? "border-slate-950 bg-slate-100 text-slate-950" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} onClick={() => toggleTransport(item.label)}>
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
            </div>
            <Field label="Selected transportation" value={form.transportationTypesText} onChange={(value) => update("transportationTypesText", value)} />
          </div>
        ) : null}

        {step === "itinerary" ? <TextArea label="Day-by-day schedule" value={form.itineraryText} rows={10} placeholder="Day 1 | Depart | Details" onChange={(value) => update("itineraryText", value)} /> : null}

        {step === "pricing" ? (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Adult price" value={form.price} onChange={(value) => update("price", value)} />
            <Field label="Group price" value={form.price} onChange={(value) => update("price", value)} />
            <Field label="Capacity limit" value={form.maxParticipants} onChange={(value) => update("maxParticipants", value)} />
            <Field label="Discount support" value="Not configured" readOnly />
          </div>
        ) : null}

        {step === "gallery" ? (
          <div className="grid gap-4">
            <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <div>
                <ImageIcon className="mx-auto mb-3 text-slate-500" />
                <strong className="text-slate-950">Photo upload placeholder</strong>
                <p className="mt-2 text-sm font-medium text-slate-500">Paste one image URL per line. The first image is used as the cover image.</p>
              </div>
            </div>
            <TextArea label="Gallery images" value={form.galleryImagesText} rows={6} onChange={(value) => update("galleryImagesText", value)} />
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="grid gap-4">
            <TextArea label="Payment methods and instructions" value={form.paymentSettings} onChange={(value) => update("paymentSettings", value)} />
            <TextArea label="Cancellation / refund policy" value={form.cancellationPolicy} onChange={(value) => update("cancellationPolicy", value)} />
          </div>
        ) : null}

        {step === "review" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="m-0 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Review and publish</p>
            <h2 className="m-0 mt-2 text-xl font-black text-slate-950">{form.title || "Untitled tour"}</h2>
            <p className="m-0 mt-2 text-sm font-semibold text-slate-600">{form.destination || "No destination"} | {formatMoney(toNumber(form.price))}</p>
            {form.id ? <Link className="mt-4 inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700" href={`/owner/travel/tours/${form.id}/preview`}><Eye size={15} className="mr-2" />Preview as customer</Link> : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2 max-sm:flex-col">
          <Link href="/owner/travel/tours" className="rounded-md border border-slate-200 px-4 py-2 text-center text-sm font-black text-slate-700">Cancel</Link>
          <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50" disabled={saving} onClick={() => save("draft")}>Save draft</button>
          <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving} onClick={() => save("published")}>Publish</button>
        </div>
      </div>
    </section>
  )
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
    duration: tour.duration,
    transportationTypesText: tour.transportationTypes.join(", "),
    itineraryText: tour.itinerary.map((day) => [day.day, day.title, day.details].filter(Boolean).join(" | ")).join("\n"),
    includedText: tour.included.join("\n"),
    excludedText: tour.excluded.join("\n"),
    price: String(tour.price || tour.adultPrice || ""),
    maxParticipants: String(tour.maxParticipants || ""),
    galleryImagesText: tour.galleryImages.join("\n"),
    paymentSettings: tour.paymentSettings,
    cancellationPolicy: tour.cancellationPolicy,
  }
}

function Field(props: { label: string; value: string; placeholder?: string; readOnly?: boolean; onChange?: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <input className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" value={props.value} readOnly={props.readOnly} placeholder={props.placeholder ?? props.label} onChange={(event) => props.onChange?.(event.target.value)} />
    </label>
  )
}

function TextArea(props: { label: string; value: string; placeholder?: string; rows?: number; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <textarea className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" rows={props.rows ?? 4} value={props.value} placeholder={props.placeholder ?? props.label} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  )
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
