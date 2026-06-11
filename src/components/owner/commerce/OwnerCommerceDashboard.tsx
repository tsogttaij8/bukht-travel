"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Plus } from "lucide-react"
import type { StoredCommerceProduct, StoredCommercePurchaseRequest } from "../../../lib/server/commerce-store"
import OwnerEmptyState from "../OwnerEmptyState"
import OwnerStat from "../OwnerStat"

export default function OwnerCommerceDashboard({ products, requests }: { products: StoredCommerceProduct[]; requests: StoredCommercePurchaseRequest[] }) {
  const router = useRouter()

  async function setStatus(product: StoredCommerceProduct, status: string): Promise<void> {
    await fetch(`/api/commerce/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  const stats = {
    total: products.length,
    available: products.filter((product) => product.status === "available").length,
    sold: products.filter((product) => product.status === "sold").length,
    hidden: products.filter((product) => product.status === "hidden").length,
    requests: requests.filter((request) => products.some((product) => product.id === request.productId)).length,
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <OwnerStat label="Нийт" value={String(stats.total)} detail="Бараа" />
        <OwnerStat label="Идэвхтэй" value={String(stats.available)} detail="Нийтэд харагдана" />
        <OwnerStat label="Зарагдсан" value={String(stats.sold)} detail="Хаагдсан" />
        <OwnerStat label="Нууцалсан" value={String(stats.hidden)} detail="Нийтэд харагдахгүй" />
        <OwnerStat label="Хүсэлт" value={String(stats.requests)} detail="Худалдан авагч" />
      </div>

      {products.length === 0 ? (
        <OwnerEmptyState title="Бараа бүртгэгдээгүй байна" body="" action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/commerce/products/new"><Plus size={16} className="mr-2 inline" />Бараа нэмэх</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e3d4bd] bg-[#fffdf8] shadow-sm">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fff4e5] text-xs uppercase text-[#6e6154]">
              <tr>
                {["Зураг", "Нэр", "Үнэ", "Ангилал", "Байршил", "Статус", "Огноо", ""].map((heading) => <th key={heading || "actions"} className="px-4 py-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-[#eadcca]">
                  <td className="px-4 py-3"><ProductImage product={product} /></td>
                  <td className="px-4 py-3"><strong className="block text-[#241a12]">{product.name}</strong><span className="text-xs text-[#7a6a5c]">{product.sellerName}</span></td>
                  <td className="px-4 py-3 font-bold">{formatMoney(product.price, product.currency)}</td>
                  <td className="px-4 py-3">{product.category || "-"}</td>
                  <td className="px-4 py-3">{[product.country, product.city].filter(Boolean).join(" / ") || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                  <td className="px-4 py-3">{formatDate(product.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/commerce/${product.id}`} className="rounded-md border border-[#d9c8b3] p-2" title="Харах"><Eye size={15} /></Link>
                      <Link href={`/owner/commerce/products/${product.id}/edit`} className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black">Засах</Link>
                      <button className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black" onClick={() => setStatus(product, "sold")}>Зарагдсан</button>
                      <button className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black" onClick={() => setStatus(product, "hidden")}>Нуух</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductImage({ product }: { product: StoredCommerceProduct }) {
  if (!product.imageUrl) return <div className="h-14 w-16 rounded-lg bg-[#eadcca]" />
  return <div aria-label={product.name} className="h-14 w-16 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${product.imageUrl})` }} />
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "available" ? "bg-emerald-100 text-emerald-700" : status === "sold" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-700"
  const label = status === "available" ? "Идэвхтэй" : status === "sold" ? "Зарагдсан" : "Нууцалсан"
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>{label}</span>
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("mn-MN") : "-"
}
