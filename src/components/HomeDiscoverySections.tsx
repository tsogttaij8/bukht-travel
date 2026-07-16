"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import { primaryButton, secondaryButton, sectionKicker, sectionSubtitle, sectionTitle, shell } from "./ui/tw"

const carouselMs = 6000

export default function HomeDiscoverySections({
  travelPackages,
  products,
}: {
  travelPackages: StoredTravelPackage[]
  products: StoredProduct[]
}) {
  const featuredTravel = useMemo(() => travelPackages.slice(0, 5), [travelPackages])
  const featuredProducts = useMemo(() => products.slice(0, 5), [products])
  const [travelIndex, setTravelIndex] = useState(0)
  const [productIndex, setProductIndex] = useState(0)

  useEffect(() => {
    if (featuredTravel.length <= 1) return
    const timer = window.setInterval(() => setTravelIndex((current) => (current + 1) % featuredTravel.length), carouselMs)
    return () => window.clearInterval(timer)
  }, [featuredTravel.length])

  useEffect(() => {
    if (featuredProducts.length <= 1) return
    const timer = window.setInterval(() => setProductIndex((current) => (current + 1) % featuredProducts.length), carouselMs + 700)
    return () => window.clearInterval(timer)
  }, [featuredProducts.length])

  return (
    <>
      <TravelCarousel items={featuredTravel} activeIndex={travelIndex} onSelect={setTravelIndex} />
      <ProductCarousel items={featuredProducts} activeIndex={productIndex} onSelect={setProductIndex} />
      <EsimSection />
      <CargoSection />
    </>
  )
}

function TravelCarousel({ items, activeIndex, onSelect }: { items: StoredTravelPackage[]; activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <section className="bg-[#f6f1eb] py-18 max-md:py-14 max-sm:py-10">
      <div className={shell}>
        <SectionHeader kicker="Travel" title="Аялал" href="/travel" />
        {items.length ? (
          <CarouselFrame activeIndex={activeIndex} itemCount={items.length} onSelect={onSelect}>
            {items.map((item) => (
              <TravelCard key={item.id} item={item} />
            ))}
          </CarouselFrame>
        ) : (
          <EmptyLine text="Одоогоор нийтлэгдсэн аялал алга." />
        )}
        <p className="mt-6 max-w-[680px] text-sm font-semibold leading-6 text-[#7a6a5c]">
          Аялал захиалаад, хэрэгтэй eSIM болон cargo үйлчилгээгээ нэг дор төлөвлөөрэй.
        </p>
      </div>
    </section>
  )
}

function ProductCarousel({ items, activeIndex, onSelect }: { items: StoredProduct[]; activeIndex: number; onSelect: (index: number) => void }) {
  return (
    <section className="bg-[#fffaf4] py-18 max-md:py-14 max-sm:py-10">
      <div className={shell}>
        <SectionHeader kicker="Marketplace" title="Худалдаа" href="/shop" />
        {items.length ? (
          <CarouselFrame activeIndex={activeIndex} itemCount={items.length} onSelect={onSelect}>
            {items.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </CarouselFrame>
        ) : (
          <EmptyLine text="Одоогоор барааны пост алга." />
        )}
        <p className="mt-6 max-w-[680px] text-sm font-semibold leading-6 text-[#7a6a5c]">
          Бараа авах гэж байна уу? Сонгосон бараагаа Монгол руу татуулах cargo урсгалаа хамт бодоорой.
        </p>
      </div>
    </section>
  )
}

function SectionHeader({ kicker, title, href }: { kicker: string; title: string; href: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-5 max-sm:items-start">
      <div>
        <span className={sectionKicker}>{kicker}</span>
        <h2 className={`${sectionTitle} mt-4`}>{title}</h2>
      </div>
      <Link href={href} className={`${secondaryButton} shrink-0`}>
        Бүгдийг нь үзэх
      </Link>
    </div>
  )
}

function CarouselFrame({ activeIndex, itemCount, onSelect, children }: { activeIndex: number; itemCount: number; onSelect: (index: number) => void; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden">
      <div className="flex transition-transform duration-700 ease-out max-md:overflow-x-auto max-md:scroll-smooth max-md:pb-3" style={{ transform: `translateX(-${activeIndex * 34}%)` }}>
        {children}
      </div>
      {itemCount > 1 ? (
        <div className="mt-5 flex items-center gap-2">
          {Array.from({ length: itemCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`${index + 1}-р item харах`}
              className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-8 bg-[#7d4d34]" : "w-2.5 bg-[#d9c6aa]"}`}
              onClick={() => onSelect(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function TravelCard({ item }: { item: StoredTravelPackage }) {
  const image = item.heroImage || item.galleryImages[0] || "/travel-guangzhou-city-highlights.jpeg"
  return (
    <Link href={`/travel/${item.id}`} className="mr-5 grid min-h-[390px] w-[calc((100%-40px)/3)] min-w-[320px] overflow-hidden rounded-[18px] border border-[rgba(226,209,183,0.82)] bg-white text-left shadow-[0_18px_42px_rgba(120,88,58,0.1)] transition hover:-translate-y-0.5 max-md:min-w-[78vw]">
      <span className="min-h-48 bg-[#eadcca] bg-cover bg-center" style={{ backgroundImage: cssImage(image) }} />
      <span className="grid gap-3 p-5">
        <span className="text-xs font-black uppercase text-[#7c5637]">{item.location || item.destination}</span>
        <strong className="font-[var(--font-heading)] text-xl leading-tight text-[#241a12]">{item.title}</strong>
        <span className="line-clamp-2 text-sm font-medium leading-6 text-[#6b5b4c]">{item.shortDescription || item.summary}</span>
        <span className="mt-1 flex flex-wrap gap-2 text-xs font-black text-[#7a6a5c]">
          <span>{item.duration}</span>
          <span>·</span>
          <span>{formatMoney(item.price || item.adultPrice, item.priceCurrency)}</span>
        </span>
      </span>
    </Link>
  )
}

function ProductCard({ item }: { item: StoredProduct }) {
  const image = item.imageUrls[0] || item.imageUrl
  return (
    <Link href={`/shop/products/${item.id}`} className="mr-5 grid min-h-[360px] w-[calc((100%-40px)/3)] min-w-[300px] overflow-hidden rounded-[18px] border border-[rgba(226,209,183,0.82)] bg-white text-left shadow-[0_18px_42px_rgba(120,88,58,0.09)] transition hover:-translate-y-0.5 max-md:min-w-[76vw]">
      {image ? (
        <span className="min-h-44 bg-[#eadcca] bg-cover bg-center" style={{ backgroundImage: cssImage(image) }} />
      ) : (
        <span className="grid min-h-44 place-items-center bg-[#eadcca] text-4xl font-black text-[#7c5637]">{initials(item.name)}</span>
      )}
      <span className="grid gap-3 p-5">
        <span className="text-xs font-black uppercase text-[#7c5637]">{item.category}</span>
        <strong className="font-[var(--font-heading)] text-xl leading-tight text-[#241a12]">{item.name}</strong>
        <span className="line-clamp-2 text-sm font-medium leading-6 text-[#6b5b4c]">{item.summary}</span>
        <span className="mt-1 flex flex-wrap gap-2 text-xs font-black text-[#7a6a5c]">
          <span>{item.price}</span>
          <span>·</span>
          <span>{item.moq}</span>
        </span>
      </span>
    </Link>
  )
}

function EsimSection() {
  return (
    <section className="bg-[#f6f1eb] py-16 max-md:py-12">
      <div className={`${shell} grid grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] items-center gap-10 max-lg:grid-cols-1`}>
        <div>
          <span className={sectionKicker}>eSIM</span>
          <h2 className={`${sectionTitle} mt-4 max-w-[680px]`}>Аялалдаа гарахаас өмнө eSIM-ээ бэлдээрэй</h2>
          <p className={`${sectionSubtitle} mt-5 max-w-[620px]`}>
            Хятад болон гадаад аялалд интернэтээ урьдчилж аваад, очсон даруйдаа холбоотой байгаарай.
          </p>
          <Link href="/esim" className={`${primaryButton} mt-7`}>
            eSIM авах
          </Link>
        </div>
        <div className="min-h-[340px] rounded-[8px] bg-[linear-gradient(90deg,rgba(18,11,6,0.12),rgba(18,11,6,0.02)),url('/travel-shenzhen-bay-waterfront-skyline.jpeg')] bg-cover bg-center shadow-[0_18px_42px_rgba(120,88,58,0.12)]" />
      </div>
    </section>
  )
}

function CargoSection() {
  return (
    <section className="bg-[#fffaf4] py-16 max-md:py-12">
      <div className={`${shell} grid grid-cols-[minmax(320px,1.05fr)_minmax(0,0.95fr)] items-center gap-10 max-lg:grid-cols-1`}>
        <div className="min-h-[340px] rounded-[8px] bg-[linear-gradient(90deg,rgba(18,11,6,0.08),rgba(18,11,6,0.02)),url('/travel-yiwu-international-trade-center.jpeg')] bg-cover bg-center shadow-[0_18px_42px_rgba(120,88,58,0.1)] max-lg:order-2" />
        <div>
          <span className={sectionKicker}>Cargo</span>
          <h2 className={`${sectionTitle} mt-4 max-w-[680px]`}>Хятадаас сонгосон бараагаа Монгол руу cargo-гоор татуулна</h2>
          <p className={`${sectionSubtitle} mt-5 max-w-[620px]`}>
            Business аялал, худалдаа, cargo-г нэг ecosystem дотор холбож, сонголтоос хүргэлт хүртэл ойлгомжтой явуулна.
          </p>
          <Link href="/cargo" className={`${primaryButton} mt-7`}>
            Cargo үйлчилгээ харах
          </Link>
        </div>
      </div>
    </section>
  )
}

function EmptyLine({ text }: { text: string }) {
  return <p className="m-0 border-l-4 border-[#d9c6aa] pl-4 text-sm font-bold text-[#7a6a5c]">{text}</p>
}

function formatMoney(value: number, currency: "MNT" | "CNY"): string {
  if (!value) return "Үнэ тохиролцоно"
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "").join("")
}

function cssImage(value: string): string {
  return `url("${value.replace(/"/g, '\\"')}")`
}
