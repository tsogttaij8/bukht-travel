"use client"

import Image from "next/image"
import Link from "@/src/components/ui/TrackedLink"
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, MapPin, MessageCircle, PackageOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"

function imagesOf(product: StoredProduct) {
  return product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B"
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
}

export default function ProductDetailView({ product, relatedProducts, contactPath }: { product: StoredProduct; relatedProducts: StoredProduct[]; contactPath: string }) {
  const router = useRouter()
  const images = useMemo(() => imagesOf(product), [product])
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState<"details" | "description">("details")
  const touchStart = useRef<number | null>(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }) }, [product.id])

  function back() {
    if (window.history.length > 1) router.back()
    else router.push("/shop")
  }

  function move(direction: number) {
    if (images.length < 2) return
    setActiveImage((current) => (current + direction + images.length) % images.length)
  }

  const specifications = [
    { label: "Ангилал", value: product.category },
    { label: "Олноор авах нөхцөл", value: product.moq },
    { label: "Гарал / хот", value: product.origin },
    { label: "Хүргэлтийн хугацаа", value: product.leadTime },
  ].filter((item) => item.value.trim())

  return <div className="product-detail-shell">
    <button className="product-back" type="button" onClick={back}><ArrowLeft />Өмнөх</button>

    <section className="product-detail-top">
      <div className="product-gallery" onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1) }} tabIndex={0} aria-label="Бүтээгдэхүүний зургийн цомог">
        <div className="product-gallery__main" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null }} onTouchEnd={(event) => { if (touchStart.current === null) return; const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1); touchStart.current = null }}>
          {images[activeImage] ? <Image key={images[activeImage]} src={images[activeImage]} alt={product.name} fill priority unoptimized sizes="(max-width: 900px) 100vw, 52vw" /> : <div className="product-gallery__fallback"><PackageOpen />{initials(product.name)}</div>}
          {images.length > 1 ? <><button className="product-gallery__arrow is-left" type="button" onClick={() => move(-1)} aria-label="Өмнөх зураг"><ChevronLeft /></button><button className="product-gallery__arrow is-right" type="button" onClick={() => move(1)} aria-label="Дараах зураг"><ChevronRight /></button></> : null}
        </div>
        {images.length > 1 ? <div className="product-gallery__thumbs" aria-label="Зургийн жагсаалт">{images.map((image, index) => <button key={`${image}-${index}`} type="button" className={index === activeImage ? "is-active" : ""} onClick={() => setActiveImage(index)} aria-label={`${index + 1}-р зураг`} aria-current={index === activeImage ? "true" : undefined}><Image src={image} alt="" width={104} height={88} unoptimized loading="lazy" /></button>)}</div> : null}
      </div>

      <article className="product-summary">
        {product.category ? <span className="product-summary__badge">{product.category}</span> : null}
        <h1>{product.name}</h1>
        {product.origin ? <p className="product-summary__location"><MapPin />{product.origin}</p> : null}
        <strong className="product-summary__price">{product.price}</strong>
        <Link className="product-summary__contact" href={contactPath}><MessageCircle />Чатлах</Link>
        <dl className="product-summary__stats">
          <div><CalendarDays /><dt>Нийтэлсэн</dt><dd>{formatDate(product.createdAt)}</dd></div>
        </dl>
      </article>
    </section>

    <section className="product-details-panel">
      <div className="product-tabs" role="tablist"><button role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "is-active" : ""} onClick={() => setActiveTab("details")}>Дэлгэрэнгүй</button><button role="tab" aria-selected={activeTab === "description"} className={activeTab === "description" ? "is-active" : ""} onClick={() => setActiveTab("description")}>Тодорхойлолт</button></div>
      {activeTab === "details" ? specifications.length ? <dl className="product-specifications">{specifications.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl> : <EmptyContent text="Энэ бүтээгдэхүүний дэлгэрэнгүй мэдээлэл оруулаагүй байна." /> : product.summary ? <div className="product-description">{product.summary.split(/\r?\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : <EmptyContent text="Энэ бүтээгдэхүүний тодорхойлолт оруулаагүй байна." />}
    </section>

    {relatedProducts.length ? <section className="related-products"><h2>Төстэй бараанууд</h2><div className="related-products__track">{relatedProducts.map((item) => <RelatedProductCard key={item.id} product={item} />)}</div></section> : null}
  </div>
}

function EmptyContent({ text }: { text: string }) { return <div className="product-detail-empty"><PackageOpen /><p>{text}</p></div> }

function RelatedProductCard({ product }: { product: StoredProduct }) {
  const image = imagesOf(product)[0]
  return <Link className="related-product-card" href={`/shop/products/${product.id}`}><div className="related-product-card__image">{image ? <Image src={image} alt={product.name} width={320} height={220} unoptimized loading="lazy" /> : <span><PackageOpen />{initials(product.name)}</span>}</div><h3>{product.name}</h3><strong>{product.price}</strong>{product.origin ? <p><MapPin />{product.origin}</p> : null}</Link>
}
