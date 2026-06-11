import Link from "next/link"
import { notFound } from "next/navigation"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import PurchaseRequestForm from "../../../components/commerce/PurchaseRequestForm"
import { getCommerceProduct } from "../../../lib/server/commerce-store"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CommerceDetailPage({ params }: PageProps) {
  const { id } = await params
  const product = await getCommerceProduct(id)
  if (!product || product.status === "hidden") notFound()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f9f4ed] px-4 py-10 text-[#2f241b]">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_380px] gap-6 max-lg:grid-cols-1">
          <section className="grid gap-5">
            <Link href="/commerce" className="text-sm font-black text-[#7d4d34]">Буцах</Link>
            <ProductImage product={product} />
            <div className="rounded-2xl border border-[#e3d4bd] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-black text-[#241a12] max-sm:text-3xl">{product.name}</h1>
                  <p className="mt-2 text-2xl font-black text-[#7d4d34]">{formatMoney(product.price, product.currency)}</p>
                </div>
                <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-sm font-black text-[#7d4d34]">{product.status}</span>
              </div>
              <p className="mt-5 text-base leading-7 text-[#4f473e]">{product.description || "Тайлбаргүй"}</p>
              <dl className="mt-6 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <Info label="Ангилал" value={product.category} />
                <Info label="Төлөв" value={product.condition} />
                <Info label="Авсан газар" value={[product.country, product.city].filter(Boolean).join(" / ")} />
                <Info label="Зарагч" value={product.sellerName} />
                <Info label="Холбоо барих" value={product.sellerContact || "Нууцалсан"} />
              </dl>
            </div>
          </section>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {product.status === "available" ? <PurchaseRequestForm productId={product.id} /> : <div className="rounded-2xl border border-[#e3d4bd] bg-white p-5 text-sm font-black text-[#6e6154] shadow-sm">Хүсэлт авах боломжгүй.</div>}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

function ProductImage({ product }: { product: { imageUrl: string; name: string } }) {
  if (!product.imageUrl) return <div className="aspect-[16/9] rounded-2xl border border-[#e3d4bd] bg-[#eadcca]" />
  return <div aria-label={product.name} className="aspect-[16/9] w-full rounded-2xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${product.imageUrl})` }} />
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#fff8ef] p-3"><dt className="text-xs font-black uppercase text-[#7a6a5c]">{label}</dt><dd className="mt-1 font-bold text-[#241a12]">{value || "-"}</dd></div>
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}
