"use client"

import Link from "@/src/components/ui/TrackedLink"
import { useTrackedRouter } from "@/src/components/ui/useTrackedRouter"
import { useState } from "react"
import { ArrowDown, ArrowUp, ImagePlus, Loader2, X } from "lucide-react"
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

const maxImages = 10
const maxImageEdge = 1600
const targetImageBytes = 700_000
const startingImageQuality = 0.8
const minimumImageQuality = 0.55

export default function OwnerTourEditor({ initialForm = emptyOwnerTourForm, saving, error, onSave }: OwnerTourEditorProps) {
  const router = useTrackedRouter()
  const [form, setForm] = useState<OwnerTourForm>(() => withItineraryTemplate(initialForm))
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState("")
  const galleryImages = toImageList(form.galleryImagesText)
  const isBusy = saving || imageBusy

  function update(field: keyof OwnerTourForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateGallery(images: string[]) {
    setForm((current) => ({ ...current, galleryImagesText: images.join("\n") }))
  }

  function updateDateRange(startDate: string, endDate: string, duration: string) {
    setForm((current) => withItineraryTemplate({ ...current, startDate, endDate, duration }))
  }

  async function readImages(files: FileList | null): Promise<void> {
    const remainingSlots = maxImages - galleryImages.length
    if (remainingSlots <= 0) {
      setImageError(`Нийт ${maxImages} хүртэл зураг оруулах боломжтой.`)
      return
    }

    const selected = Array.from(files ?? []).slice(0, remainingSlots)
    if (!selected.length) return
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setImageError("Зөвхөн зураг сонгоно уу.")
      return
    }

    setImageBusy(true)
    setImageError("")
    try {
      const images = await Promise.all(selected.map(uploadTourImage))
      updateGallery(Array.from(new Set([...galleryImages, ...images])).slice(0, maxImages))
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Зураг upload хийхэд алдаа гарлаа.")
    } finally {
      setImageBusy(false)
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= galleryImages.length) return
    const next = [...galleryImages]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    updateGallery(next)
  }

  function removeImage(index: number) {
    updateGallery(galleryImages.filter((_, itemIndex) => itemIndex !== index))
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
        <div className="grid gap-3">
          <label className="grid cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-black text-slate-700 transition hover:border-slate-500 hover:bg-white">
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              disabled={isBusy || galleryImages.length >= maxImages}
              onChange={(event) => {
                void readImages(event.target.files)
                event.currentTarget.value = ""
              }}
            />
            <span className="grid place-items-center gap-2">
              {imageBusy ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={26} />}
              <span>{imageBusy ? "Зураг upload хийж байна..." : galleryImages.length ? "Нэмэлт зураг сонгох" : "Зургаа сонгож оруулах"}</span>
            </span>
          </label>

          {imageError ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{imageError}</div> : null}

          {galleryImages.length ? (
            <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-sm:grid-cols-2">
              {galleryImages.map((image, index) => (
                <div key={`${image}-${index}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="aspect-[4/3] bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1 p-2">
                    <span className="min-w-0 truncate text-xs font-black text-slate-600">{index === 0 ? "Нүүр зураг" : `${index + 1}-р зураг`}</span>
                    <IconButton label="Урагш зөөх" disabled={index === 0 || isBusy} onClick={() => moveImage(index, -1)}>
                      <ArrowUp size={15} />
                    </IconButton>
                    <IconButton label="Хойш зөөх" disabled={index === galleryImages.length - 1 || isBusy} onClick={() => moveImage(index, 1)}>
                      <ArrowDown size={15} />
                    </IconButton>
                    <IconButton label="Устгах" disabled={isBusy} danger onClick={() => removeImage(index)}>
                      <X size={15} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 max-sm:flex-col">
        <Link href="/owner/travel/tours" className="rounded-md border border-slate-200 px-4 py-2 text-center text-sm font-black text-slate-700">Болих</Link>
        <button type="button" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50" disabled={isBusy} onClick={() => save("draft")}>Ноорог хадгалах</button>
        <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={isBusy} onClick={() => save("published")}>Нийтлэх</button>
      </div>
    </section>
  )
}

function IconButton(props: { label: string; disabled?: boolean; danger?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`grid h-8 w-8 place-items-center rounded-md border text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${props.danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-slate-200"}`}
      title={props.label}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
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

function toImageList(value: string): string[] {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
}

function getCanvasDimensions(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Зураг шахахад алдаа гарлаа."))
    }, type, quality)
  })
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = "async"
    image.src = url
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function compressImage(file: File): Promise<Blob> {
  const image = await loadImage(file)
  let dimensions = getCanvasDimensions(image.naturalWidth, image.naturalHeight, maxImageEdge)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Зураг боловсруулах боломжгүй байна.")

  let bestBlob: Blob | null = null
  const type = "image/webp"

  for (let resizePass = 0; resizePass < 4; resizePass += 1) {
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height)

    for (let quality = startingImageQuality; quality >= minimumImageQuality; quality = Math.round((quality - 0.05) * 100) / 100) {
      const blob = await canvasToBlob(canvas, type, quality)
      bestBlob = !bestBlob || blob.size < bestBlob.size ? blob : bestBlob
      if (blob.size <= targetImageBytes) return blob
    }

    const nextEdge = Math.max(900, Math.round(Math.max(dimensions.width, dimensions.height) * 0.85))
    dimensions = getCanvasDimensions(image.naturalWidth, image.naturalHeight, nextEdge)
  }

  return bestBlob ?? (await canvasToBlob(canvas, type, minimumImageQuality))
}

async function uploadTourImage(file: File): Promise<string> {
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append("image", compressed, `${file.name.replace(/\.[^.]+$/, "") || "tour"}.webp`)

  const response = await fetch("/api/products/images", {
    method: "POST",
    body: formData,
  })
  const body = (await response.json()) as { imageUrl?: string; message?: string }
  if (!response.ok || !body.imageUrl) throw new Error(body.message ?? "Зураг upload хийхэд алдаа гарлаа.")
  return body.imageUrl
}
