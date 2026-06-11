"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { StoredCommerceProduct } from "../../../lib/server/commerce-store"

type FormState = {
  name: string
  price: string
  currency: string
  description: string
  category: string
  condition: string
  country: string
  city: string
  imageUrl: string
  sellerName: string
  sellerContact: string
  status: string
}

export default function CommerceProductForm({ product }: { product?: StoredCommerceProduct }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    price: product ? String(product.price) : "",
    currency: product?.currency ?? "MNT",
    description: product?.description ?? "",
    category: product?.category ?? "",
    condition: product?.condition ?? "",
    country: product?.country ?? "",
    city: product?.city ?? "",
    imageUrl: product?.imageUrl ?? "",
    sellerName: product?.sellerName ?? "",
    sellerContact: product?.sellerContact ?? "",
    status: product?.status ?? "available",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function uploadImage(file: File | undefined): void {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Зөвхөн зураг оруулна уу.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => update("imageUrl", typeof reader.result === "string" ? reader.result : "")
    reader.onerror = () => setError("Зураг уншихад алдаа гарлаа.")
    reader.readAsDataURL(file)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSaving(true)
    setError("")
    const response = await fetch(product ? `/api/commerce/products/${product.id}` : "/api/commerce/products", {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = await response.json() as { message?: string }
    if (!response.ok) {
      setError(body.message ?? "Failed to save product.")
      setSaving(false)
      return
    }
    router.push("/owner/commerce")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-5 shadow-sm">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
      <div className="grid grid-cols-[280px_1fr] gap-5 max-lg:grid-cols-1">
        <div className="grid content-start gap-3">
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-[#d9c8b3] bg-[#eadcca] bg-cover bg-center" style={{ backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : undefined }} />
          <label className="grid cursor-pointer rounded-md border border-[#d9c8b3] bg-white px-4 py-3 text-center text-sm font-black text-[#4f473e] hover:bg-[#fff4e5]">
            Зураг сонгох
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} />
          </label>
          <Field label="Зураг URL" value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl} onChange={(value) => update("imageUrl", value)} />
        </div>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <Field label="Нэр" value={form.name} onChange={(value) => update("name", value)} required />
        <Field label="Үнэ" type="number" value={form.price} onChange={(value) => update("price", value)} required />
        <Field label="Валют" value={form.currency} onChange={(value) => update("currency", value)} />
        <Field label="Ангилал" value={form.category} onChange={(value) => update("category", value)} />
        <Field label="Төлөв" value={form.condition} onChange={(value) => update("condition", value)} />
        <Field label="Улс" value={form.country} onChange={(value) => update("country", value)} />
        <Field label="Хот" value={form.city} onChange={(value) => update("city", value)} />
        <Field label="Зарагч" value={form.sellerName} onChange={(value) => update("sellerName", value)} />
        <Field label="Холбоо барих" value={form.sellerContact} onChange={(value) => update("sellerContact", value)} />
        <label className="grid gap-1 text-sm font-bold text-[#4f473e]">
          Статус
          <select className="rounded-lg border border-[#d9c8b3] bg-white px-3 py-2" value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value="available">Идэвхтэй</option>
            <option value="sold">Зарагдсан</option>
            <option value="hidden">Нууцалсан</option>
          </select>
        </label>
        </div>
      </div>
      <label className="grid gap-1 text-sm font-bold text-[#4f473e]">
        Тайлбар
        <textarea className="min-h-32 rounded-lg border border-[#d9c8b3] bg-white px-3 py-2" value={form.description} onChange={(event) => update("description", event.target.value)} />
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
          {saving ? "Хадгалж байна..." : product ? "Шинэчлэх" : "Нэмэх"}
        </button>
        <button type="button" onClick={() => router.push("/owner/commerce")} className="rounded-md border border-[#d9c8b3] px-4 py-2 text-sm font-black text-[#4f473e]">
          Буцах
        </button>
      </div>
    </form>
  )
}

function Field(props: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-[#4f473e]">
      {props.label}
      <input className="rounded-lg border border-[#d9c8b3] bg-white px-3 py-2" type={props.type ?? "text"} value={props.value} onChange={(event) => props.onChange(event.target.value)} required={props.required} />
    </label>
  )
}
