import Link from "next/link"
import { notFound } from "next/navigation"
import Footer from "../../../../components/Footer"
import Navbar from "../../../../components/Navbar"
import { secondaryButton, shell } from "../../../../components/ui/tw"
import { getProduct } from "../../../../lib/server/product-store"

export const dynamic = "force-dynamic"

type ProductDetailPageProps = {
  params: Promise<{ id: string }>
}

function getImages(product: Awaited<ReturnType<typeof getProduct>>): string[] {
  if (!product) return []
  return product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const images = getImages(product)
  const requestPath = `/account?service=product_sourcing&title=${encodeURIComponent(product.name)}`

  return (
    <>
      <Navbar />
      <main className="section">
        <div className={`${shell} grid gap-6 py-10`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/shop" className={secondaryButton}>Marketplace</Link>
            <Link href={requestPath} className="inline-flex items-center justify-center rounded-full bg-[#7d4d34] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(125,77,52,0.18)] transition hover:brightness-105">
              Хүсэлт илгээх
            </Link>
          </div>

          <section className="grid grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 max-lg:grid-cols-1">
            <div className="grid gap-3">
              {images.length ? (
                <>
                  <div className="min-h-[460px] rounded-[24px] bg-[#eadcca] bg-cover bg-center shadow-[0_18px_45px_rgba(120,88,58,0.1)] max-md:min-h-[320px]" style={{ backgroundImage: `url(${images[0]})` }} role="img" aria-label={product.name} />
                  {images.length > 1 ? (
                    <div className="grid grid-cols-5 gap-3 max-sm:grid-cols-3">
                      {images.slice(1, 6).map((image, index) => (
                        <div key={`${image}-${index}`} className="aspect-square rounded-[16px] bg-[#eadcca] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="grid min-h-[460px] place-items-center rounded-[24px] bg-[#eadcca] shadow-[0_18px_45px_rgba(120,88,58,0.1)] max-md:min-h-[320px]">
                  <span className="text-6xl font-black text-[#7c5637]">{initials(product.name)}</span>
                </div>
              )}
            </div>

            <article className="grid content-start gap-5 rounded-[24px] border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-6 shadow-[0_18px_45px_rgba(120,88,58,0.1)]">
              <div>
                <span className="inline-flex w-fit rounded-full bg-[#fff4e1] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#7c5637]">{product.category}</span>
                <h1 className="mb-0 mt-4 font-[var(--font-heading)] text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] text-[#241a12]">{product.name}</h1>
              </div>

              <p className="m-0 text-base font-medium leading-7 text-[#5d5449]">{product.summary}</p>

              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <Detail label="1 ширхэг үнэ" value={product.price} />
                <Detail label="Олноор авах" value={product.moq} />
                <Detail label="Гарал / хот" value={product.origin || "-"} />
                <Detail label="Хүргэлт / хугацаа" value={product.leadTime || "-"} />
              </div>

              <div className="rounded-[18px] border border-[#eadcca] bg-white/70 p-4">
                <span className="block text-xs font-black uppercase tracking-[0.08em] text-[#7a6a5c]">Нийтэлсэн хэрэглэгч</span>
                <strong className="mt-2 block text-lg font-black text-[#241a12]">{product.sellerName}</strong>
                {product.sellerEmail ? <span className="mt-1 block text-sm font-bold text-[#6b5b4c]">{product.sellerEmail}</span> : null}
              </div>
            </article>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#eadcca] bg-white/70 p-4">
      <span className="block text-xs font-black uppercase tracking-[0.08em] text-[#7a6a5c]">{label}</span>
      <strong className="mt-2 block text-base font-black text-[#241a12]">{value || "-"}</strong>
    </div>
  )
}
