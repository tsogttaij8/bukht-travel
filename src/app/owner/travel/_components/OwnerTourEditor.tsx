"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { StoredTravelPackage, TravelPackageStatus } from "@/src/lib/server/travel-package-store"
import OwnerDateRangeField from "./OwnerDateRangeField"
import { CurrencyPriceField, Field, NumericField, TextArea } from "./OwnerTourFields"
import { emptyOwnerTourForm, formFromTour, type OwnerTourForm } from "./OwnerTourForm"

export { formFromTour }
export type { OwnerTourForm }

type OwnerTourEditorProps = {
  initialForm?: OwnerTourForm
  saving: boolean
  error: string
  onSave: (form: OwnerTourForm, status: TravelPackageStatus) => Promise<StoredTravelPackage | null>
}

export default function OwnerTourEditor({ initialForm = emptyOwnerTourForm, saving, error, onSave }: OwnerTourEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<OwnerTourForm>(() => withItineraryTemplate(initialForm))

  function update(field: keyof OwnerTourForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateDateRange(startDate: string, endDate: string, duration: string) {
    setForm((current) => withItineraryTemplate({ ...current, startDate, endDate, duration }))
  }

  async function save(status: TravelPackageStatus) {
    const tour = await onSave(form, status)
    if (tour) router.push("/owner/travel/tours")
  }

  return (
    <section className="grid gap-6">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

      <FormSection title="1. Үндсэн мэдээлэл">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Field label="Аяллын нэр" value={form.title} onChange={(value) => update("title", value)} />
          <Field label="Очих хот" value={form.destination} placeholder="Гуанжоу, Хятад" onChange={(value) => update("destination", value)} />
          <OwnerDateRangeField label="Огноо" startDate={form.startDate} endDate={form.endDate} onChange={updateDateRange} />
          <Field label="Хоног" value={form.duration} placeholder="7" readOnly />
        </div>
        <TextArea label="Богино танилцуулга" value={form.shortDescription} rows={4} onChange={(value) => update("shortDescription", value)} />
      </FormSection>

      <FormSection title="2. Үнэ ба багтаамж">
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <CurrencyPriceField label="Үнэ" value={form.price} currency={form.priceCurrency} onChange={(value) => update("price", value)} onCurrencyChange={(value) => update("priceCurrency", value)} />
          <NumericField label="Оролцогчийн тоо" value={form.maxParticipants} placeholder="12" onChange={(value) => update("maxParticipants", value)} />
        </div>
        <TextArea label="Үүнд багтсан зүйлс" value={form.includedText} rows={5} placeholder="Нэг мөрөнд нэг зүйл" onChange={(value) => update("includedText", value)} />
        <TextArea label="Үүнд багтаагүй зүйлс" value={form.excludedText} rows={5} placeholder="Нэг мөрөнд нэг зүйл" onChange={(value) => update("excludedText", value)} />
      </FormSection>

      <FormSection title="3. Хөтөлбөр">
        <TextArea label="Өдөр өдрийн төлөвлөгөө" value={form.itineraryText} rows={8} placeholder="1-р өдөр: Улаанбаатар → Гуанжоу" onChange={(value) => update("itineraryText", value)} />
        <TextArea label="Зураг URL" value={form.galleryImagesText} rows={5} placeholder="Нэг мөрөнд нэг зургийн URL" onChange={(value) => update("galleryImagesText", value)} />
      </FormSection>

      <div className="flex justify-end gap-2 max-sm:flex-col">
        <Link href="/owner/travel/tours" className="rounded-md border border-slate-200 px-4 py-2 text-center text-sm font-black text-slate-700">Болих</Link>
        <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50" disabled={saving} onClick={() => save("draft")}>Ноорог хадгалах</button>
        <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving} onClick={() => save("published")}>Нийтлэх</button>
      </div>
    </section>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h3 className="m-0 text-base font-black text-slate-950">{title}</h3>
      {children}
    </section>
  )
}

function makeItinerary(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return ""
  return Array.from({ length: days }, (_, index) => `${index + 1}-р өдөр | `).join("\n")
}

function withItineraryTemplate(form: OwnerTourForm): OwnerTourForm {
  if (!form.duration || !canReplaceItinerary(form.itineraryText)) return form
  return { ...form, itineraryText: makeItinerary(Number(form.duration)) }
}

function canReplaceItinerary(value: string): boolean {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  return lines.length === 0 || lines.every((line) => /^\d+-р өдөр \|\s*$/.test(line))
}
