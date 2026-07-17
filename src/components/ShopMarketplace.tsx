"use client"

import Link from "@/src/components/ui/TrackedLink"
import { useCallback, useRef, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"
import { inputClass, primaryButton, secondaryButton, shell } from "./ui/tw"
import { useDismissibleLayer } from "./ui/useDismissibleLayer"

type ShopSession = {
  name: string
  email: string
} | null

type ProductForm = {
  name: string
  category: string
  price: string
  moq: string
  origin: string
  leadTime: string
  summary: string
  imageUrls: string[]
}

const maxImages = 6
const maxImageEdge = 1600
const targetImageBytes = 700_000
const startingImageQuality = 0.8
const minimumImageQuality = 0.55

const emptyForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  moq: "",
  origin: "",
  leadTime: "",
  summary: "",
  imageUrls: [],
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
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getUTCMonth() + 1}-р сарын ${date.getUTCDate()}`
}

function getProductImages(product: StoredProduct): string[] {
  return product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
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

async function uploadProductImage(file: File): Promise<string> {
  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append("image", compressed, `${file.name.replace(/\.[^.]+$/, "") || "product"}.webp`)

  const response = await fetch("/api/products/images", {
    method: "POST",
    body: formData,
  })
  const body = (await response.json()) as { imageUrl?: string; message?: string }
  if (!response.ok || !body.imageUrl) throw new Error(body.message ?? "Зураг upload хийхэд алдаа гарлаа.")
  return body.imageUrl
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
  const [imageBusy, setImageBusy] = useState(false)
  const [previewImage, setPreviewImage] = useState("")
  const [editingProductId, setEditingProductId] = useState("")
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [openMenuProductId, setOpenMenuProductId] = useState("")
  const [error, setError] = useState("")
  const productMenuRef = useRef<HTMLDivElement>(null)
  const closeProductMenu = useCallback(() => setOpenMenuProductId(""), [])

  useDismissibleLayer(productMenuRef, Boolean(openMenuProductId), closeProductMenu)

  const loginPath = `/login?next=${encodeURIComponent("/shop")}`
  const sessionEmail = session?.email.toLowerCase() ?? ""
  const uploadTileCount = Math.max(1, Math.min(maxImages, form.imageUrls.length + (form.imageUrls.length < maxImages ? 1 : 0)))

  async function readImages(files: FileList | null): Promise<void> {
    const remainingSlots = maxImages - form.imageUrls.length
    if (remainingSlots <= 0) {
      setError("6 хүртэл зураг оруулах боломжтой.")
      return
    }

    const selected = Array.from(files ?? []).slice(0, remainingSlots)
    if (!selected.length) return
    if (!session) {
      setError("Зураг оруулахын өмнө нэвтэрнэ үү.")
      return
    }
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      setError("Зөвхөн зураг оруулна уу.")
      return
    }

    setImageBusy(true)
    setError("")
    try {
      const images = await Promise.all(selected.map(uploadProductImage))
      setForm((current) => ({ ...current, imageUrls: Array.from(new Set([...current.imageUrls, ...images])).slice(0, maxImages) }))
    } catch (error) {
      setError(error instanceof Error ? error.message : "Зураг боловсруулахад алдаа гарлаа.")
    } finally {
      setImageBusy(false)
    }
  }

  async function submitPost(): Promise<void> {
    if (!session) {
      window.location.href = loginPath
      return
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: form.price.trim(),
      moq: form.moq.trim(),
      origin: form.origin.trim(),
      leadTime: form.leadTime.trim(),
      summary: form.summary.trim(),
      imageUrls: form.imageUrls,
    }

    if (!payload.name || !payload.category || !payload.price || !payload.moq || !payload.summary) {
      setError("Барааны нэр, ангилал, 1 ширхэг үнэ, олноор авах нөхцөл, тайлбарыг бөглөнө үү.")
      return
    }

    setBusy(true)
    setError("")
    const response = await fetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {
      method: editingProductId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body = (await response.json()) as { product?: StoredProduct; message?: string }
    setBusy(false)
    if (!response.ok || !body.product) {
      setError(body.message ?? "Пост нийтлэхэд алдаа гарлаа.")
      return
    }

    setProducts((current) => editingProductId ? current.map((product) => product.id === body.product!.id ? body.product! : product) : [body.product!, ...current])
    setForm(emptyForm)
    setEditingProductId("")
    setIsComposerOpen(false)
    setOpenMenuProductId("")
  }

  function startEditingProduct(product: StoredProduct): void {
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      moq: product.moq,
      origin: product.origin,
      leadTime: product.leadTime,
      summary: product.summary,
      imageUrls: getProductImages(product),
    })
    setEditingProductId(product.id)
    setIsComposerOpen(true)
    setOpenMenuProductId("")
    setError("")
  }

  function cancelEditing(): void {
    setForm(emptyForm)
    setEditingProductId("")
    setIsComposerOpen(false)
    setOpenMenuProductId("")
    setError("")
  }

  async function deleteOwnProduct(product: StoredProduct): Promise<void> {
    setOpenMenuProductId("")
    if (!window.confirm("Энэ постыг устгах уу?")) return

    setBusy(true)
    setError("")
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
    const body = (await response.json()) as { message?: string }
    setBusy(false)

    if (!response.ok) {
      setError(body.message ?? "Пост устгахад алдаа гарлаа.")
      return
    }

    setProducts((current) => current.filter((item) => item.id !== product.id))
    if (editingProductId === product.id) cancelEditing()
  }

  return (
    <div className={`${shell} py-10`}>
      <div className="mb-5 flex justify-end">
        <button
          className={primaryButton}
          type="button"
          onClick={() => {
            if (editingProductId) {
              cancelEditing()
              return
            }
            setIsComposerOpen((current) => !current)
            setError("")
          }}
        >
          {isComposerOpen ? "Хаах" : "Хэрэглэгч пост оруулах"}
        </button>
      </div>
      <section className={`grid gap-6 ${isComposerOpen ? "grid-cols-[360px_minmax(0,1fr)] max-lg:grid-cols-1" : "grid-cols-1"}`}>
        {isComposerOpen ? (
        <aside className="grid content-start gap-4 rounded-[24px] border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_18px_45px_rgba(120,88,58,0.1)]">
          <div className="flex items-center gap-3">
            <Avatar label={session ? initials(session.name) : "+"} />
            <div>
              <h2 className="m-0 text-lg font-black text-[#241a12]">{editingProductId ? "Пост засах" : "Хэрэглэгч пост оруулах"}</h2>
              <p className="m-0 mt-1 text-sm font-medium leading-6 text-[#7a6a5c]">{session ? session.email : "Пост нийтлэхийн тулд нэвтэрнэ үү."}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Барааны нэр" />
            <input className={inputClass} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Ангилал" />
            <input className={inputClass} value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="1 ширхэг үнэ" />
            <input className={inputClass} value={form.moq} onChange={(event) => setForm((current) => ({ ...current, moq: event.target.value }))} placeholder="Олноор авах үнэ / MOQ" />
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <input className={inputClass} value={form.origin} onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))} placeholder="Гарал / хот" />
              <input className={inputClass} value={form.leadTime} onChange={(event) => setForm((current) => ({ ...current, leadTime: event.target.value }))} placeholder="Хүргэлт / хугацаа" />
            </div>
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Тайлбар, нөхцөл, холбоо барих мэдээлэл" />
          </div>

          <label className="grid h-36 cursor-pointer place-items-center overflow-hidden rounded-[20px] border border-dashed border-[#d9c6aa] bg-[#fff8ef] text-center text-sm font-black text-[#7c5637] transition hover:bg-[#fff1de]">
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                void readImages(event.target.files)
                event.currentTarget.value = ""
              }}
            />
            {form.imageUrls.length ? (
              <span className="grid h-full w-full auto-rows-fr gap-1" style={{ gridTemplateColumns: `repeat(${uploadTileCount}, minmax(0, 1fr))` }}>
                {form.imageUrls.slice(0, maxImages).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className="min-h-0 cursor-zoom-in border-0 bg-cover bg-center p-0"
                    style={{ backgroundImage: `url(${image})` }}
                    aria-label="Зураг томоор харах"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setPreviewImage(image)
                    }}
                  />
                ))}
                {form.imageUrls.length < maxImages ? (
                  <span className="grid min-h-0 place-items-center border border-dashed border-[#d9c6aa] bg-white/75 text-3xl leading-none text-[#7c5637]">+</span>
                ) : null}
              </span>
            ) : imageBusy ? (
              <span>Зураг шахаж upload хийж байна...</span>
            ) : (
              <span>Зураг оруулах</span>
            )}
          </label>

          {error ? <p className="m-0 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <button className={primaryButton} type="button" onClick={submitPost} disabled={busy || imageBusy}>
            {imageBusy ? "Зураг upload хийж байна..." : busy ? "Хадгалж байна..." : editingProductId ? "Өөрчлөлт хадгалах" : session ? "Пост нийтлэх" : "Нэвтэрч пост хийх"}
          </button>
          {editingProductId ? (
            <button className={secondaryButton} type="button" onClick={cancelEditing} disabled={busy || imageBusy}>
              Болих
            </button>
          ) : null}
        </aside>
        ) : null}

        {previewImage ? (
          <div
            className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setPreviewImage("")}
          >
            <button
              type="button"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/35 text-xl font-black leading-none text-white"
              aria-label="Хаах"
              onClick={(event) => {
                event.stopPropagation()
                setPreviewImage("")
              }}
            >
              ×
            </button>
            <div
              className="h-[88vh] w-[92vw] rounded-[18px] bg-contain bg-center bg-no-repeat shadow-2xl"
              role="img"
              aria-label="Сонгосон зураг"
              style={{ backgroundImage: `url(${previewImage})` }}
            />
          </div>
        ) : null}

        <section className="grid content-start gap-4" aria-label="Product posts">
          {loadError ? <p className="m-0 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{loadError}</p> : null}
          {products.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#d9c6aa] bg-[#fffdf8] p-8 text-center font-bold text-[#7a6a5c]">Одоогоор барааны пост алга.</div> : null}
          {products.map((item) => {
            const images = getProductImages(item)
            const canManagePost = sessionEmail.length > 0 && item.sellerEmail.toLowerCase() === sessionEmail
            return (
              <article key={item.id} className="relative grid gap-4 rounded-[24px] border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_18px_45px_rgba(120,88,58,0.1)]">
                {canManagePost ? (
                  <div ref={openMenuProductId === item.id ? productMenuRef : undefined} className="absolute right-4 top-4 z-10">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full border border-[#eadcca] bg-white text-xl font-black leading-none text-[#7c5637] shadow-sm"
                      aria-label="Постын үйлдэл"
                      onClick={() => setOpenMenuProductId((current) => current === item.id ? "" : item.id)}
                    >
                      ⋯
                    </button>
                    {openMenuProductId === item.id ? (
                      <div className="absolute right-0 top-11 grid min-w-32 overflow-hidden rounded-[14px] border border-[#eadcca] bg-white text-left shadow-xl">
                        <button className="px-4 py-2 text-left text-sm font-black text-[#241a12] hover:bg-[#fff8ef]" type="button" onClick={() => startEditingProduct(item)}>
                          Засах
                        </button>
                        <button className="px-4 py-2 text-left text-sm font-black text-red-700 hover:bg-red-50" type="button" onClick={() => void deleteOwnProduct(item)}>
                          Устгах
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <header className="flex items-center gap-3 pr-12">
                  <Avatar label={initials(item.sellerName || item.name)} />
                  <div>
                    <strong className="block text-sm font-black text-[#241a12]">{item.sellerName}</strong>
                    <span className="text-xs font-bold text-[#7a6a5c]">{item.category} · {formatDate(item.createdAt)}</span>
                  </div>
                </header>
                <h3 className="m-0 text-xl font-black text-[#241a12]">{item.name}</h3>
                <p className="m-0 text-sm font-medium leading-6 text-[#6b5b4c]">{item.summary}</p>
                {images[0] ? (
                  <div className="min-h-72 rounded-[20px] bg-cover bg-center" role="img" aria-label={item.name} style={{ backgroundImage: `url(${images[0]})` }} />
                ) : (
                  <div className="grid min-h-72 place-items-center rounded-[20px] bg-[#eadcca]"><span className="text-4xl font-black text-[#7c5637]">{initials(item.name)}</span></div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-[#eadcca] pt-4 max-sm:flex-col max-sm:items-stretch">
                  <div>
                    <strong className="block text-lg font-black text-[#7c5637]">{item.price}</strong>
                    <span className="text-sm font-bold text-[#6b5b4c]">{item.moq}</span>
                  </div>
                  <Link href={`/shop/products/${item.id}`} className={secondaryButton}>Сонирхох</Link>
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
