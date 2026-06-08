"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bus, Calendar, Car, ChevronLeft, ChevronRight, Eye, ImageIcon, MapPin, Plane, TrainFront } from "lucide-react"
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
  { value: "basic", label: "Үндсэн мэдээлэл" },
  { value: "experience", label: "Аяллын тайлбар" },
  { value: "location", label: "Байршил" },
  { value: "transport", label: "Тээвэр" },
  { value: "itinerary", label: "Хөтөлбөр" },
  { value: "pricing", label: "Үнэ ба багтаамж" },
  { value: "gallery", label: "Зураг" },
  { value: "payment", label: "Төлбөр ба цуцлалт" },
  { value: "review", label: "Хянаж нийтлэх" },
]

const transportOptions = [
  { label: "Машин", icon: Car, aliases: ["Car"] },
  { label: "Автобус", icon: Bus, aliases: ["Bus"] },
  { label: "Онгоц", icon: Plane, aliases: ["Airplane"] },
  { label: "Галт тэрэг", icon: TrainFront, aliases: ["Train"] },
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

  function toggleTransport(option: (typeof transportOptions)[number]) {
    const values = [option.label, ...option.aliases]
    const active = selectedTransport.some((item) => values.includes(item))
    const next = active ? selectedTransport.filter((item) => !values.includes(item)) : [...selectedTransport, option.label]
    update("transportationTypesText", next.join(", "))
  }

  async function save(status: TravelPackageStatus) {
    const tour = await onSave(form, status)
    if (tour) router.push("/owner/travel/tours")
  }

  return (
    <section className="grid grid-cols-[250px_minmax(0,1fr)] gap-6 max-lg:grid-cols-1">
      <aside className="grid content-start gap-1 border-r border-slate-200 pr-4 max-lg:grid-cols-3 max-lg:border-r-0 max-lg:border-b max-lg:pb-4 max-lg:pr-0 max-sm:grid-cols-1">
        {steps.map((item, index) => (
          <button key={item.value} type="button" className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-black ${step === item.value ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`} onClick={() => setStep(item.value)}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step === item.value ? "bg-white text-slate-950" : "bg-slate-200 text-slate-700"}`}>{index + 1}</span>
            {item.label}
          </button>
        ))}
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div>
            <p className="m-0 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Алхам {stepIndex + 1} / {steps.length}</p>
            <h2 className="m-0 mt-1 text-xl font-black text-slate-950">{steps[stepIndex]?.label}</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 disabled:opacity-40" disabled={stepIndex === 0} onClick={() => setStep(steps[stepIndex - 1].value)}>Өмнөх</button>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 disabled:opacity-40" disabled={stepIndex === steps.length - 1} onClick={() => setStep(steps[stepIndex + 1].value)}>Дараах</button>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}

        {step === "basic" ? (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Аяллын нэр" value={form.title} onChange={(value) => update("title", value)} />
            <DateRangeField label="Үргэлжлэх хугацаа" value={form.duration} onChange={(value) => update("duration", value)} />
            <Field label="Оролцогчийн дээд тоо" value={form.maxParticipants} onChange={(value) => update("maxParticipants", value)} />
            <TextArea label="Богино танилцуулга" value={form.shortDescription} onChange={(value) => update("shortDescription", value)} />
          </div>
        ) : null}

        {step === "experience" ? (
          <div className="grid gap-4">
            <TextArea label="Дэлгэрэнгүй тайлбар" value={form.fullDescription} rows={7} onChange={(value) => update("fullDescription", value)} />
            <TextArea label="Үүнд багтсан зүйлс" value={form.includedText} onChange={(value) => update("includedText", value)} />
            <TextArea label="Үүнд багтаагүй зүйлс" value={form.excludedText} onChange={(value) => update("excludedText", value)} />
          </div>
        ) : null}

        {step === "location" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4 max-lg:grid-cols-1">
            <div className="grid gap-4">
              <Field label="Очих газар" value={form.destination} onChange={(value) => update("destination", value)} />
              <Field label="Эхлэх байршил" value={form.startLocation} onChange={(value) => update("startLocation", value)} />
              <Field label="Дуусах байршил" value={form.endLocation} onChange={(value) => update("endLocation", value)} />
              <Field label="GPS координат" value={form.mapCoordinates} placeholder="47.9189, 106.9176" onChange={(value) => update("mapCoordinates", value)} />
            </div>
            <div className="grid min-h-[240px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <div>
                <MapPin className="mx-auto mb-3 text-slate-500" />
                <strong className="text-slate-950">Газрын зураг сонгох хэсэг</strong>
                <p className="mt-2 text-sm font-medium text-slate-500">Координатыг owner аяллын API-аар хадгална.</p>
              </div>
            </div>
          </div>
        ) : null}

        {step === "transport" ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
              {transportOptions.map((item) => {
                const Icon = item.icon
                const active = selectedTransport.includes(item.label) || item.aliases.some((alias) => selectedTransport.includes(alias))
                return (
                  <button key={item.label} type="button" className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-black ${active ? "border-slate-950 bg-slate-100 text-slate-950" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`} onClick={() => toggleTransport(item)}>
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
            </div>
            <Field label="Сонгосон тээврийн төрөл" value={form.transportationTypesText} onChange={(value) => update("transportationTypesText", value)} />
          </div>
        ) : null}

        {step === "itinerary" ? <TextArea label="Өдөр өдрийн хөтөлбөр" value={form.itineraryText} rows={10} placeholder="1-р өдөр | Хөдлөх | Дэлгэрэнгүй тайлбар" onChange={(value) => update("itineraryText", value)} /> : null}

        {step === "pricing" ? (
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Field label="Насанд хүрэгчдийн үнэ" value={form.price} onChange={(value) => update("price", value)} />
            <Field label="Бүлгийн үнэ" value={form.price} onChange={(value) => update("price", value)} />
            <Field label="Оролцогчийн багтаамж" value={form.maxParticipants} onChange={(value) => update("maxParticipants", value)} />
            <Field label="Хөнгөлөлтийн тохиргоо" value="Тохируулаагүй" readOnly />
          </div>
        ) : null}

        {step === "gallery" ? (
          <div className="grid gap-4">
            <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <div>
                <ImageIcon className="mx-auto mb-3 text-slate-500" />
                <strong className="text-slate-950">Зураг оруулах хэсэг</strong>
                <p className="mt-2 text-sm font-medium text-slate-500">Нэг мөрөнд нэг зургийн URL оруулна. Эхний зураг нүүр зураг болно.</p>
              </div>
            </div>
            <TextArea label="Зургийн жагсаалт" value={form.galleryImagesText} rows={6} onChange={(value) => update("galleryImagesText", value)} />
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="grid gap-4">
            <TextArea label="Төлбөрийн нөхцөл ба заавар" value={form.paymentSettings} onChange={(value) => update("paymentSettings", value)} />
            <TextArea label="Цуцлалт, буцаалтын журам" value={form.cancellationPolicy} onChange={(value) => update("cancellationPolicy", value)} />
          </div>
        ) : null}

        {step === "review" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="m-0 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Хянаад нийтлэх</p>
            <h2 className="m-0 mt-2 text-xl font-black text-slate-950">{form.title || "Нэр оруулаагүй аялал"}</h2>
            <p className="m-0 mt-2 text-sm font-semibold text-slate-600">{form.destination || "Очих газар оруулаагүй"} | {formatMoney(toNumber(form.price))}</p>
            {form.id ? <Link className="mt-4 inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700" href={`/owner/travel/tours/${form.id}/preview`}><Eye size={15} className="mr-2" />Хэрэглэгчээр харах</Link> : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2 max-sm:flex-col">
          <Link href="/owner/travel/tours" className="rounded-md border border-slate-200 px-4 py-2 text-center text-sm font-black text-slate-700">Болих</Link>
          <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50" disabled={saving} onClick={() => save("draft")}>Ноорог хадгалах</button>
          <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving} onClick={() => save("published")}>Нийтлэх</button>
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

function DateRangeField(props: { label: string; value: string; onChange: (value: string) => void }) {
  const today = startOfDay(new Date())
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const days = getCalendarDays(viewDate)
  const selectedText = startDate ? endDate ? formatDurationRange(startDate, endDate) : `${formatMongolianDate(startDate)} - дуусах өдрөө сонгоно уу` : "Эхлэх болон дуусах өдрөө сонгоно уу"

  function moveMonth(direction: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
  }

  function selectDate(day: Date) {
    const selected = startOfDay(day)
    if (!startDate || endDate) {
      setStartDate(selected)
      setEndDate(null)
      return
    }

    if (selected < startDate) {
      setStartDate(selected)
      setEndDate(null)
      return
    }

    setEndDate(selected)
    props.onChange(formatDurationRange(startDate, selected))
    setOpen(false)
  }

  function clearSelection() {
    setStartDate(null)
    setEndDate(null)
    props.onChange("")
  }

  return (
    <label className="relative grid gap-2 text-sm font-black text-slate-700">
      {props.label}
      <button type="button" className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-900 outline-none transition hover:border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200" onClick={() => setOpen((current) => !current)}>
        <span className={props.value ? "text-slate-900" : "text-slate-400"}>{props.value || "Календараас огноо сонгох"}</span>
        <Calendar size={18} className="shrink-0 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[320px] rounded-lg border border-slate-200 bg-white p-4 shadow-xl max-sm:min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => moveMonth(-1)} aria-label="Өмнөх сар">
              <ChevronLeft size={17} />
            </button>
            <strong className="text-sm font-black text-slate-950">{formatMonthTitle(viewDate)}</strong>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => moveMonth(1)} aria-label="Дараах сар">
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-500">
            {weekdays.map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) => day ? (
              <button key={day.toISOString()} type="button" className={`h-9 rounded-md text-sm font-black transition ${getDateButtonClass(day, startDate, endDate)}`} onClick={() => selectDate(day)}>
                {day.getDate()}
              </button>
            ) : <span key={`blank-${index}`} />)}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 max-sm:flex-col max-sm:items-stretch">
            <p className="m-0 text-xs font-bold text-slate-500">{selectedText}</p>
            <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50" onClick={clearSelection}>Цэвэрлэх</button>
          </div>
        </div>
      ) : null}
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

const weekdays = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"]

function getCalendarDays(viewDate: Date): Array<Date | null> {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const totalDays = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  const days: Array<Date | null> = Array.from({ length: leadingBlanks }, () => null)

  for (let day = 1; day <= totalDays; day += 1) {
    days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
  }

  return days
}

function getDateButtonClass(day: Date, startDate: Date | null, endDate: Date | null): string {
  if (isSameDay(day, startDate) || isSameDay(day, endDate)) return "bg-slate-950 text-white"
  if (startDate && endDate && day > startDate && day < endDate) return "bg-slate-100 text-slate-950"
  return "text-slate-700 hover:bg-slate-50"
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDay(left: Date, right: Date | null): boolean {
  return Boolean(right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate())
}

function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()} оны ${date.getMonth() + 1} сар`
}

function formatMongolianDate(date: Date): string {
  return `${date.getFullYear()} оны ${date.getMonth() + 1} сарын ${date.getDate()}`
}

function formatDurationRange(startDate: Date, endDate: Date): string {
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
  if (isSameDay(startDate, endDate)) return `${formatMongolianDate(startDate)} | нийт 1 өдөр`
  return `${formatMongolianDate(startDate)} - ${formatMongolianDate(endDate)} | нийт ${days} өдөр`
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
