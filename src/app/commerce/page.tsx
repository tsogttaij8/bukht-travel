import Link from "next/link"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { listCommerceProducts } from "../../lib/server/commerce-store"

export const dynamic = "force-dynamic"

export default async function CommercePage() {
  const products = await listCommerceProducts({ publicOnly: true })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f9f4ed] px-4 py-10 text-[#2f241b]">
        <div className="mx-auto grid max-w-6xl gap-8">
          <section>
            <h1 className="text-4xl font-black text-[#241a12] max-sm:text-3xl">Худалдаа</h1>
          </section>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-[#e3d4bd] bg-white p-10 text-center text-lg font-black text-[#6e6154] shadow-sm">Одоогоор бараа алга</div>
          ) : (
            <section className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {products.map((product) => (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-[#e3d4bd] bg-white shadow-sm transition hover:shadow-md">
                  <ProductImage product={product} />
                  <div className="grid gap-3 p-5">
                    <div>
                      <h2 className="text-xl font-black text-[#241a12]">{product.name}</h2>
                      <p className="mt-1 text-sm font-bold text-[#7d4d34]">{formatMoney(product.price, product.currency)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-black text-[#6e6154]">
                      {product.category ? <span className="rounded-full bg-[#fff4e5] px-2.5 py-1">{product.category}</span> : null}
                      <span className="rounded-full bg-[#fff4e5] px-2.5 py-1">{[product.country, product.city].filter(Boolean).join(" / ") || "Байршилгүй"}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-[#5f4b3d]">{product.description || "Тайлбаргүй"}</p>
                    <p className="text-xs font-bold text-[#7a6a5c]">Зарагч: {product.sellerName || "-"}</p>
                    <Link href={`/commerce/${product.id}`} className="mt-1 rounded-lg bg-[#7d4d34] px-4 py-3 text-center text-sm font-black text-white">Дэлгэрэнгүй</Link>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function ProductImage({ product }: { product: { imageUrl: string; name: string } }) {
  if (!product.imageUrl) return <div className="aspect-[4/3] bg-[#eadcca]" />
  return <div aria-label={product.name} className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${product.imageUrl})` }} />
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}
