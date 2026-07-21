"use client"

import Link from "@/src/components/ui/TrackedLink"
import Image from "next/image"
import { ChevronDown, ChevronLeft, ChevronRight, Grid2X2, ImagePlus, List, MapPin, PackageOpen, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"
import { AddToCartButton } from "./commerce/CartProvider"

type ShopSession = { name: string; email: string } | null
type ViewMode = "grid" | "list"
type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number }
type ApiResponse = { products: StoredProduct[]; categories: string[]; pagination: Pagination; message?: string }
type ProductForm = { name: string; category: string; price: string; moq: string; origin: string; leadTime: string; summary: string; imageUrls: string[] }

const emptyForm: ProductForm = { name: "", category: "", price: "", moq: "", origin: "", leadTime: "", summary: "", imageUrls: [] }
const emptyPagination: Pagination = { page: 1, pageSize: 12, totalItems: 0, totalPages: 1 }

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B"
}

function avatarHue(name: string) {
  return Array.from(name).reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 360
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("mn-MN", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

function getImages(product: StoredProduct) {
  return product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
}

function pageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page > 0 && page <= total))
  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: (number | "ellipsis")[] = []
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push("ellipsis")
    result.push(page)
  })
  return result
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Зураг боловсруулах боломжгүй байна.")), "image/webp", .78))
}

export default function ShopMarketplace({ initialProducts, session, loadError }: { initialProducts: StoredProduct[]; session: ShopSession; loadError: string }) {
  const initialParams = useMemo(() => typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search), [])
  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination>({ ...emptyPagination, totalItems: initialProducts.length })
  const [search, setSearch] = useState(initialParams.get("search") ?? "")
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [category, setCategory] = useState(initialParams.get("category") ?? "")
  const [sort, setSort] = useState(initialParams.get("sort") ?? "newest")
  const [page, setPage] = useState(Math.max(1, Number(initialParams.get("page")) || 1))
  const [view, setView] = useState<ViewMode>(() => typeof window !== "undefined" && localStorage.getItem("bukht-marketplace-view") === "list" ? "list" : "grid")
  const [loading, setLoading] = useState(!initialProducts.length)
  const [error, setError] = useState(loadError)
  const [retryKey, setRetryKey] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<StoredProduct | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => { setLoading(true); setDebouncedSearch(search); setPage(1) }, 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), pageSize: "12", sort })
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (category) params.set("category", category)
    window.history.replaceState(null, "", `/shop?${params.toString()}`)
    fetch(`/api/shop/products?${params.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as ApiResponse
        if (!response.ok) throw new Error(body.message)
        setProducts(body.products)
        setCategories(body.categories)
        setPagination(body.pagination)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return
        setError("Marketplace мэдээллийг ачаалж чадсангүй. Дахин оролдоно уу.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [debouncedSearch, category, sort, page, retryKey])

  const openComposer = useCallback((product?: StoredProduct) => {
    if (!session) { window.location.href = `/login?next=${encodeURIComponent("/shop")}`; return }
    setEditing(product ?? null)
    setComposerOpen(true)
  }, [session])

  function changePage(nextPage: number) {
    setLoading(true)
    setPage(nextPage)
    window.setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
  }

  function clearFilters() { setSearch(""); setCategory(""); setSort("newest"); setPage(1) }

  return (
    <div className="marketplace-page">
      <div className="marketplace-shell">
        <section className="marketplace-hero" aria-label="Marketplace хайлт">
          <Image className="marketplace-hero__image" src="/marketplace-hero-commerce.png" alt="" fill priority sizes="(max-width: 860px) 100vw, 1440px" />
          <div className="marketplace-hero__controls">
            <SearchField value={search} onChange={setSearch} onClear={() => setSearch("")} label="Бараа хайх" />
            <button className="marketplace-primary" type="button" onClick={() => openComposer()}><Plus /> Пост оруулах</button>
          </div>
        </section>

        <div className="marketplace-toolbar" ref={contentRef}>
          <div className="marketplace-toolbar__search"><SearchField value={search} onChange={setSearch} onClear={() => setSearch("")} label="Бараа хайх" /></div>
          <SelectControl icon={<Grid2X2 />} label="Ангилал" value={category} onChange={(value) => { setLoading(true); setCategory(value); setPage(1) }}>
            <option value="">Бүх ангилал</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectControl>
          <SelectControl label="Үнэ" value={sort.startsWith("price") ? sort : ""} onChange={(value) => { setLoading(true); setSort(value || "newest"); setPage(1) }}>
            <option value="">Үнэ</option><option value="price-asc">Үнэ: багаас их</option><option value="price-desc">Үнэ: ихээс бага</option>
          </SelectControl>
          <SelectControl label="Эрэмбэ" value={sort === "newest" ? "newest" : ""} onChange={() => { setLoading(true); setSort("newest"); setPage(1) }}>
            <option value="newest">Хамгийн шинэ</option>
          </SelectControl>
          <div className="marketplace-view" aria-label="Харагдац">
            <button className={view === "grid" ? "is-active" : ""} onClick={() => { setView("grid"); localStorage.setItem("bukht-marketplace-view", "grid") }} aria-label="Grid харагдац"><Grid2X2 /></button>
            <button className={view === "list" ? "is-active" : ""} onClick={() => { setView("list"); localStorage.setItem("bukht-marketplace-view", "list") }} aria-label="Жагсаалт харагдац"><List /></button>
          </div>
        </div>

        {loading ? <MarketplaceSkeleton view={view} /> : error ? <StatePanel icon={<PackageOpen />} title="Мэдээлэл ачаалсангүй" text={error}><button onClick={() => { setLoading(true); setRetryKey((key) => key + 1) }}>Дахин оролдох</button></StatePanel> : products.length === 0 ? <StatePanel icon={<Search />} title="Илэрц олдсонгүй" text="Таны хайлт, шүүлтүүрт тохирох бараа одоогоор алга."><button onClick={clearFilters}>Шүүлтүүр цэвэрлэх</button><button className="is-accent" onClick={() => openComposer()}>Пост оруулах</button></StatePanel> : (
          <div className={`marketplace-grid marketplace-grid--${view}`}>
            {products.map((product) => <MarketplaceCard key={product.id} product={product} canEdit={session?.email.toLowerCase() === product.sellerEmail.toLowerCase()} onEdit={() => openComposer(product)} onDeleted={() => setRetryKey((key) => key + 1)} />)}
          </div>
        )}

        {!loading && !error && products.length > 0 ? <MarketplacePagination pagination={pagination} onChange={changePage} /> : null}
      </div>

      <button className="marketplace-fab" type="button" onClick={() => openComposer()} aria-label="Шинэ пост оруулах"><Plus /><span>Пост оруулах</span></button>
      {composerOpen ? <ProductComposer session={session!} product={editing} categories={categories} onClose={() => setComposerOpen(false)} onSaved={() => { setComposerOpen(false); setPage(1); setRetryKey((key) => key + 1) }} /> : null}
    </div>
  )
}

function SearchField({ value, onChange, onClear, label }: { value: string; onChange: (value: string) => void; onClear: () => void; label: string }) {
  return <label className="marketplace-search"><span className="sr-only">{label}</span><Search aria-hidden="true" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Бараа хайх..." />{value ? <button type="button" onClick={onClear} aria-label="Хайлт цэвэрлэх"><X /></button> : null}</label>
}

function SelectControl({ label, value, onChange, children, icon }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return <label className="marketplace-select"><span className="sr-only">{label}</span>{icon}<select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><ChevronDown /></label>
}

function MarketplaceCard({ product, canEdit, onEdit, onDeleted }: { product: StoredProduct; canEdit: boolean; onEdit: () => void; onDeleted: () => void }) {
  const image = getImages(product)[0]
  async function remove() {
    if (!window.confirm("Энэ постыг устгах уу?")) return
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
    if (response.ok) onDeleted()
  }
  return <article className="marketplace-card">
    <header className="marketplace-card__seller"><span className="marketplace-avatar" style={{ "--avatar-hue": avatarHue(product.sellerName) } as React.CSSProperties}>{initials(product.sellerName)}</span><div><strong>{product.sellerName}</strong><time dateTime={product.createdAt}>{formatDate(product.createdAt)}</time></div>{canEdit ? <div className="marketplace-card__owner"><button onClick={onEdit} aria-label="Пост засах"><Pencil /></button><button onClick={() => void remove()} aria-label="Пост устгах"><Trash2 /></button></div> : null}</header>
    <Link className="marketplace-card__image" href={`/shop/products/${product.id}`} aria-label={`${product.name} дэлгэрэнгүй`}>{image ? <Image src={image} alt={product.name} width={600} height={440} unoptimized /> : <span><PackageOpen />{initials(product.name)}</span>}</Link>
    <div className="marketplace-card__body"><div className="marketplace-card__category">{product.category}</div><h2>{product.name}</h2><strong className="marketplace-card__price">{product.price}</strong>{product.origin ? <p className="marketplace-card__location"><MapPin />{product.origin}</p> : null}<div className="marketplace-card__bottom">{product.moq ? <span>{product.moq}</span> : <span /> }<div><Link href={`/shop/products/${product.id}`}>Дэлгэрэнгүй</Link><AddToCartButton productId={product.id} compact className="marketplace-card__cart" /></div></div></div>
  </article>
}

function MarketplacePagination({ pagination, onChange }: { pagination: Pagination; onChange: (page: number) => void }) {
  return <nav className="marketplace-pagination" aria-label="Marketplace хуудас"><button disabled={pagination.page <= 1} onClick={() => onChange(pagination.page - 1)} aria-label="Өмнөх хуудас"><ChevronLeft /></button>{pageItems(pagination.page, pagination.totalPages).map((item, index) => item === "ellipsis" ? <span key={`e-${index}`}>…</span> : <button key={item} className={item === pagination.page ? "is-active" : ""} aria-current={item === pagination.page ? "page" : undefined} onClick={() => onChange(item)}>{item}</button>)}<button disabled={pagination.page >= pagination.totalPages} onClick={() => onChange(pagination.page + 1)} aria-label="Дараах хуудас"><ChevronRight /></button></nav>
}

function MarketplaceSkeleton({ view }: { view: ViewMode }) {
  return <div className={`marketplace-grid marketplace-grid--${view}`} aria-label="Бараа ачаалж байна">{Array.from({ length: 8 }, (_, index) => <div className="marketplace-card marketplace-skeleton" key={index}><div /><div /><div /><div /></div>)}</div>
}

function StatePanel({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return <section className="marketplace-state">{icon}<h2>{title}</h2><p>{text}</p><div>{children}</div></section>
}

function ProductComposer({ session, product, categories, onClose, onSaved }: { session: NonNullable<ShopSession>; product: StoredProduct | null; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProductForm>(product ? { name: product.name, category: product.category, price: product.price, moq: product.moq, origin: product.origin, leadTime: product.leadTime, summary: product.summary, imageUrls: getImages(product) } : emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function upload(files: FileList | null) {
    const file = files?.[0]; if (!file) return
    setBusy(true); setError("")
    try { const blob = await compressImage(file); const data = new FormData(); data.append("image", blob, "product.webp"); const response = await fetch("/api/products/images", { method: "POST", body: data }); const body = await response.json() as { imageUrl?: string; message?: string }; if (!response.ok || !body.imageUrl) throw new Error(body.message); setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, body.imageUrl!].slice(0, 6) })) } catch (cause) { setError(cause instanceof Error ? cause.message : "Зураг оруулахад алдаа гарлаа.") } finally { setBusy(false) }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("")
    const response = await fetch(product ? `/api/products/${product.id}` : "/api/products", { method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const body = await response.json() as { product?: StoredProduct; message?: string }; setBusy(false)
    if (!response.ok || !body.product) { setError(body.message ?? "Пост хадгалахад алдаа гарлаа."); return }
    onSaved()
  }
  const field = (key: keyof Omit<ProductForm, "imageUrls">, label: string, required = false) => <label><span>{label}</span><input required={required} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>
  return <div className="marketplace-modal" role="dialog" aria-modal="true" aria-labelledby="composer-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="marketplace-composer" onSubmit={(event) => void save(event)}><header><div><small>{session.name}</small><h2 id="composer-title">{product ? "Пост засах" : "Шинэ пост оруулах"}</h2></div><button type="button" onClick={onClose} aria-label="Хаах"><X /></button></header><div className="marketplace-form-grid">{field("name", "Барааны нэр", true)}<label><span>Ангилал</span><input required list="marketplace-categories" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}/><datalist id="marketplace-categories">{categories.map((item) => <option key={item}>{item}</option>)}</datalist></label>{field("price", "1 ширхэг үнэ", true)}{field("moq", "Олноор авах үнэ / MOQ", true)}{field("origin", "Гарал / хот")}{field("leadTime", "Хүргэлтийн хугацаа")}</div><label><span>Тайлбар</span><textarea required value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} /></label><div className="marketplace-images">{form.imageUrls.map((image, index) => <div key={`${image}-${index}`}><Image src={image} alt="" width={90} height={90} unoptimized/><button type="button" onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Зураг устгах"><X /></button></div>)}{form.imageUrls.length < 6 ? <label><ImagePlus /><span>Зураг нэмэх</span><input type="file" accept="image/*" onChange={(event) => void upload(event.target.files)} /></label> : null}</div>{error ? <p className="marketplace-form-error">{error}</p> : null}<footer><button type="button" onClick={onClose}>Болих</button><button className="is-accent" disabled={busy}>{busy ? "Хадгалж байна..." : product ? "Өөрчлөлт хадгалах" : "Пост нийтлэх"}</button></footer></form></div>
}
