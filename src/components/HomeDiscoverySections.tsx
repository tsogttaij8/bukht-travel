import Image from "next/image"
import Link from "@/src/components/ui/TrackedLink"
import { Clock3, MapPin, ShoppingCart } from "lucide-react"
import type { StoredProduct } from "../lib/server/product-store"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import { toProductCard, toTravelCard, type ProductCardViewModel, type TravelCardViewModel } from "../lib/home-view-models"
import { serviceContent } from "../lib/home-content"

export default function HomeDiscoverySections({ travelPackages, products, travelError = false, productError = false }: { travelPackages: StoredTravelPackage[]; products: StoredProduct[]; travelError?: boolean; productError?: boolean }) {
  const travel = travelPackages.slice(0, 3).map(toTravelCard)
  const shop = products.slice(0, 5).map(toProductCard)
  return <main className="home-main">
    <HomeSection title="Аялал" href="/travel">{travelError ? <ErrorState /> : travel.length ? <div className="travel-grid">{travel.map((item) => <TravelCard key={item.id} item={item} />)}</div> : <EmptyState text="Одоогоор нийтлэгдсэн аялал алга." />}</HomeSection>
    <HomeSection title="Худалдаа" href="/shop">{productError ? <ErrorState /> : shop.length ? <div className="product-grid">{shop.map((item) => <ProductCard key={item.id} item={item} />)}</div> : <EmptyState text="Одоогоор худалдааны бараа алга." />}</HomeSection>
    <section className="home-shell home-section home-services" aria-label="Нэмэлт үйлчилгээ"><ServiceBanner kind="esim" /><ServiceBanner kind="cargo" /></section>
  </main>
}

function HomeSection({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const id = `section-${href.slice(1)}`
  return <section className="home-shell home-section" aria-labelledby={id}><div className="section-heading"><h2 id={id}>{title}</h2><Link href={href}>Бүгдийг харах <span aria-hidden="true">→</span></Link></div>{children}</section>
}

function TravelCard({ item }: { item: TravelCardViewModel }) {
  return <article className="travel-card"><Link href={item.href} className="travel-card__image">{item.imageUrl ? <Image unoptimized src={item.imageUrl} alt={item.title} fill sizes="(max-width: 520px) 88vw, (max-width: 1024px) 50vw, 33vw" /> : <ImageFallback label={item.title} />}{item.badge ? <span className="travel-card__badge">{item.badge}</span> : null}</Link><div className="travel-card__body"><h3><Link href={item.href}>{item.title}</Link></h3><div className="travel-card__meta">{item.durationLabel ? <span><Clock3 />{item.durationLabel}</span> : null}{item.locationLabel ? <span><MapPin />{item.locationLabel}</span> : null}</div><div className="travel-card__footer"><strong>{item.formattedPrice}</strong><Link href={item.href} className="home-button home-button--small">Дэлгэрэнгүй</Link></div></div></article>
}

function ProductCard({ item }: { item: ProductCardViewModel }) {
  return <article className="product-card"><Link href={item.href} className="product-card__image">{item.imageUrl ? <Image unoptimized src={item.imageUrl} alt={item.name} fill sizes="220px" /> : <ImageFallback label={item.name} />}</Link><div className="product-card__body"><h3><Link href={item.href}>{item.name}</Link></h3>{item.brand ? <p>{item.brand}</p> : null}{item.moq ? <p>{item.moq}</p> : null}{item.origin ? <p className="product-origin"><MapPin />{item.origin}</p> : null}<div className="product-card__footer"><strong>{item.formattedPrice}</strong><Link href={item.href} className="icon-button" aria-label={`${item.name} дэлгэрэнгүй`}><ShoppingCart /></Link></div></div></article>
}

function ServiceBanner({ kind }: { kind: keyof typeof serviceContent }) {
  const item = serviceContent[kind]
  return <article className={`service-banner service-banner--${kind}`}><div className="service-banner__copy"><h2>{item.title}</h2><p>{item.description}</p><Link href={item.href} className="home-button home-button--service">{item.cta}</Link></div><div className="service-banner__media"><Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" /></div></article>
}

function ImageFallback({ label }: { label: string }) { return <span className="image-fallback" role="img" aria-label={`${label} зураг байхгүй`}>{label.slice(0, 1).toUpperCase()}</span> }
function EmptyState({ text }: { text: string }) { return <div className="home-empty"><Image src="/bukht-app-icon.jpeg" alt="" width={48} height={48} /><p>{text}</p></div> }
function ErrorState() { return <div className="home-empty" role="alert"><p>Мэдээлэл ачаалж чадсангүй.</p><Link href="/" className="home-button home-button--small">Дахин оролдох</Link></div> }
