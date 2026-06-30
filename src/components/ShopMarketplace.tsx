"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"
import { inputClass, primaryButton, secondaryButton, sectionKicker, sectionSubtitle, sectionTitle, shell } from "./ui/tw"

type ShopSession = {
  name: string
  email: string
} | null

type ProductForm = {
  name: string
  category: string
  price: string
  summary: string
  imageUrl: string
}

const emptyForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  summary: "",
  imageUrl: "",
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return `${date.getUTCMonth() + 1}-р сарын ${date.getUTCDate()}`
}

export default function ShopMarketplace({
  initialProducts,
  session,
  loadError,
}: {
  initialProducts: StoredProduct[]
  session: ShopSession
  loadError: string
}) {
  const [products, setProducts] = useState(initialProducts)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const loginPath = `/login?next=${encodeURIComponent("/shop")}`
  const sellerCount = useMemo(() => new Set(products.map((product) => product.sellerEmail || product.sellerName)).size, [products])

  async function readImage(file: File | undefined): Promise<void> {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Зөвхөн зураг оруулна уу.")
      return
    }
    if (file.size > 900_000) {
      setError("Зургийн хэмжээ 900KB-аас бага байх хэрэгтэй.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, imageUrl: String(reader.result ?? "") }))
      setError("")
    }
    reader.onerror = () => setError("Зураг уншихад алдаа гарлаа.")
    reader.readAsDataURL(file)
  }

  async function submitPost(): Promise<void> {
    if (!session) {
      window.location.href = loginPath
      return
    }

    const name = form.name.trim()
    const category = form.category.trim()
    const price = form.price.trim()
    const summary = form.summary.trim()
    if (!name || !category || !price || !summary) {
      setError("Барааны нэр, ангилал, үнэ, тайлбарыг бөглөнө үү.")
      return
    }

    setBusy(true)
    setError("")
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, price, summary, imageUrl: form.imageUrl }),
    })
    const body = (await response.json()) as { product?: StoredProduct; message?: string }
    setBusy(false)
    if (!response.ok || !body.product) {
      setError(body.message ?? "Пост нийтлэхэд алдаа гарлаа.")
      return
    }

    setProducts((current) => [body.product!, ...current])
    setForm(emptyForm)
  }

  return (
    <div className={`${shell} py-10`}>
      <section className="mb-8 grid grid-cols-[minmax(0,1fr)_320px] items-end gap-6 rounded-[28px] border border-[rgba(226,209,183,0.82)] bg-[linear-gradient(135deg,rgba(255,253,249,0.94),rgba(255,244,226,0.72))] p-6 shadow-[0_24px_52px_rgba(120,88,58,0.12)] max-lg:grid-cols-1">
        <div>
          <span className={sectionKicker}>Marketplace</span>
          <h1 className={`${sectionTitle} mb-3.5 mt-4`}>Хэрэглэгчдийн барааны feed</h1>
          <p className={sectionSubtitle}>
            Нэвтэрсэн хэрэглэгч бүр өөрийн зураг, үнэ, тайлбартай бараагаа пост хийж зарна. Owner болон admin тал зөвхөн нийт барааг хянаж харна.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1" aria-label="Marketplace stats">
          <Stat value={String(products.length)} label="пост" />
          <Stat value={String(sellerCount)} label="зарж буй хэрэглэгч" />
          <Stat value={session ? "Online" : "Login"} label={session ? session.name : "пост хийх"} />
        </div>
      </section>

      <section className="grid grid-cols-[360px_minmax(0,1fr)] gap-6 max-lg:grid-cols-1">
        <aside className="grid content-start gap-4 rounded-[24px] border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_18px_45px_rgba(120,88,58,0.1)]">
          <div className="flex items-center gap-3">
            <Avatar label={session ? initials(session.name) : "+"} />
            <div>
              <h2 className="m-0 text-lg font-black text-[#241a12]">{session ? "Бараа нийтлэх" : "Нэвтэрч пост хийнэ"}</h2>
              <p className="m-0 mt-1 text-sm font-medium leading-6 text-[#7a6a5c]">{session ? session.email : "Хэрэглэгч бүр өөрийн нэрээр пост оруулна."}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Барааны нэр" />
            <input className={inputClass} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Ангилал" />
            <input className={inputClass} value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="Үнэ / үнийн дүн" />
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Тайлбар, нөхцөл, холбоо барих мэдээлэл" />
          </div>

          <label className="grid min-h-36 cursor-pointer place-items-center overflow-hidden rounded-[20px] border border-dashed border-[#d9c6aa] bg-[#fff8ef] text-center text-sm font-black text-[#7c5637] transition hover:bg-[#fff1de]">
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => void readImage(event.target.files?.[0])} />
            {form.imageUrl ? <span className="h-full min-h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${form.imageUrl})` }} /> : <span>Зураг оруулах</span>}
          </label>

          {error ? <p className="m-0 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <button className={primaryButton} type="button" onClick={submitPost} disabled={busy}>
            {busy ? "Нийтэлж байна..." : session ? "Пост нийтлэх" : "Нэвтэрч пост хийх"}
          </button>
        </aside>

        <section className="grid content-start gap-4" aria-label="Product posts">
          {loadError ? <p className="m-0 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{loadError}</p> : null}
          {products.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#d9c6aa] bg-[#fffdf8] p-8 text-center font-bold text-[#7a6a5c]">Одоогоор барааны пост алга.</div> : null}
          {products.map((item) => {
            const accountPath = `/account?service=product_sourcing&title=${encodeURIComponent(item.name)}`
            const requestPath = session ? accountPath : `/login?next=${encodeURIComponent(accountPath)}`

            return (
              <article key={item.id} className="grid gap-4 rounded-[24px] border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_18px_45px_rgba(120,88,58,0.1)]">
                <header className="flex items-center gap-3">
                  <Avatar label={initials(item.sellerName || item.name)} />
                  <div>
                    <strong className="block text-sm font-black text-[#241a12]">{item.sellerName}</strong>
                    <span className="text-xs font-bold text-[#7a6a5c]">{item.category} · {formatDate(item.createdAt)}</span>
                  </div>
                </header>
                <h3 className="m-0 text-xl font-black text-[#241a12]">{item.name}</h3>
                <p className="m-0 text-sm font-medium leading-6 text-[#6b5b4c]">{item.summary}</p>
                {item.imageUrl ? (
                  <div className="min-h-72 rounded-[20px] bg-cover bg-center" role="img" aria-label={item.name} style={{ backgroundImage: `url(${item.imageUrl})` }} />
                ) : (
                  <div className="grid min-h-72 place-items-center rounded-[20px] bg-[#eadcca]"><span className="text-4xl font-black text-[#7c5637]">{initials(item.name)}</span></div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-[#eadcca] pt-4">
                  <strong className="text-lg font-black text-[#7c5637]">{item.price}</strong>
                  <Link href={requestPath} className={secondaryButton}>Сонирхох</Link>
                </div>
              </article>
            )
          })}
        </section>
      </section>
    </div>
  )
}

function Avatar({ label }: { label: string }) {
  return <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#7d4d34] text-sm font-black text-white">{label}</div>
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-[18px] bg-white/75 p-4 shadow-[inset_0_0_0_1px_rgba(225,207,183,0.8)]"><strong className="block text-xl font-black text-[#241a12]">{value}</strong><span className="mt-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#7a6a5c]">{label}</span></div>
}
