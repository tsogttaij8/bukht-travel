"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { StoredCommerceProduct, StoredCommercePurchaseRequest } from "../../../lib/server/commerce-store"

export default function AdminCommerceDashboard({ products, requests }: { products: StoredCommerceProduct[]; requests: StoredCommercePurchaseRequest[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [country, setCountry] = useState("")
  const [selected, setSelected] = useState<StoredCommerceProduct | null>(products[0] ?? null)

  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)))
  const countries = Array.from(new Set(products.map((product) => product.country).filter(Boolean)))
  const filtered = useMemo(() => products.filter((product) => {
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false
    if (status && product.status !== status) return false
    if (category && product.category !== category) return false
    if (country && product.country !== country) return false
    return true
  }), [category, country, products, search, status])

  async function updateProduct(product: StoredCommerceProduct, nextStatus: string): Promise<void> {
    await fetch(`/api/commerce/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    router.refresh()
  }

  async function deleteProduct(product: StoredCommerceProduct): Promise<void> {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    await fetch(`/api/commerce/products/${product.id}`, { method: "DELETE" })
    router.refresh()
  }

  async function updateRequest(request: StoredCommercePurchaseRequest, nextStatus: string): Promise<void> {
    await fetch(`/api/commerce/purchase-requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    router.refresh()
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-5 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <Stat label="Total products" value={products.length} />
        <Stat label="Available products" value={products.filter((product) => product.status === "available").length} />
        <Stat label="Sold products" value={products.filter((product) => product.status === "sold").length} />
        <Stat label="Hidden products" value={products.filter((product) => product.status === "hidden").length} />
        <Stat label="Pending requests" value={requests.filter((request) => request.status === "pending").length} />
      </div>

      <div className="grid grid-cols-4 gap-3 rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm max-lg:grid-cols-2 max-sm:grid-cols-1">
        <input className="rounded-lg border border-[#d9c8b3] px-3 py-2" placeholder="Search by product name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={status} onChange={setStatus} label="All statuses" options={["available", "sold", "hidden"]} />
        <Select value={category} onChange={setCategory} label="All categories" options={categories} />
        <Select value={country} onChange={setCountry} label="All countries" options={countries} />
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-8 text-center font-black text-[#6e6154]">Бараа бүртгэгдээгүй байна</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e3d4bd] bg-[#fffdf8] shadow-sm">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fff4e5] text-xs uppercase text-[#6e6154]">
              <tr>{["Image", "Product", "Price", "Category", "Seller", "Country/city", "Status", "Created", "Actions"].map((heading) => <th className="px-4 py-3" key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-t border-[#eadcca]">
                  <td className="px-4 py-3"><ProductImage product={product} /></td>
                  <td className="px-4 py-3"><strong className="block text-[#241a12]">{product.name}</strong><span className="line-clamp-1 text-xs text-[#7a6a5c]">{product.description}</span></td>
                  <td className="px-4 py-3 font-bold">{formatMoney(product.price, product.currency)}</td>
                  <td className="px-4 py-3">{product.category || "-"}</td>
                  <td className="px-4 py-3">{product.sellerName || "-"}<span className="block text-xs text-[#7a6a5c]">{product.sellerContact || "No contact"}</span></td>
                  <td className="px-4 py-3">{[product.country, product.city].filter(Boolean).join(" / ") || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                  <td className="px-4 py-3">{formatDate(product.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black" onClick={() => setSelected(product)}>View</button>
                      <Link className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black" href={`/owner/commerce/products/${product.id}/edit`}>Edit</Link>
                      <button className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black" onClick={() => updateProduct(product, "sold")}>Sold</button>
                      <button className="rounded-md border border-[#d9c8b3] px-3 py-2 text-xs font-black" onClick={() => updateProduct(product, "hidden")}>Hide</button>
                      <button className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700" onClick={() => deleteProduct(product)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="grid gap-3 rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
        <h2 className="text-lg font-black text-[#241a12]">Purchase requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fff4e5] text-xs uppercase text-[#6e6154]">
              <tr>{["Buyer", "Contact", "Product", "Message", "Status", "Created", "Actions"].map((heading) => <th className="px-4 py-3" key={heading}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const product = products.find((item) => item.id === request.productId)
                return (
                  <tr key={request.id} className="border-t border-[#eadcca]">
                    <td className="px-4 py-3 font-bold">{request.buyerName}</td>
                    <td className="px-4 py-3">{request.buyerContact}</td>
                    <td className="px-4 py-3">{product?.name ?? "Deleted product"}</td>
                    <td className="px-4 py-3">{request.message || "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                    <td className="px-4 py-3">{formatDate(request.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700" onClick={() => updateRequest(request, "accepted")}>Accept</button>
                        <button className="rounded-md border border-red-200 px-3 py-2 text-xs font-black text-red-700" onClick={() => updateRequest(request, "rejected")}>Reject</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? <DetailPanel product={selected} requests={requests.filter((request) => request.productId === selected.id)} onClose={() => setSelected(null)} /> : null}
    </div>
  )
}

function DetailPanel({ product, requests, onClose }: { product: StoredCommerceProduct; requests: StoredCommercePurchaseRequest[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 p-4" onClick={onClose}>
      <aside className="ml-auto h-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <button className="mb-4 rounded-md border border-[#d9c8b3] px-3 py-2 text-sm font-black" onClick={onClose}>Close</button>
        <ProductImage product={product} large />
        <h2 className="mt-4 text-2xl font-black text-[#241a12]">{product.name}</h2>
        <p className="mt-2 text-sm text-[#6e6154]">{product.description}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {[
            ["Price", formatMoney(product.price, product.currency)],
            ["Category", product.category || "-"],
            ["Condition", product.condition || "-"],
            ["Location", [product.country, product.city].filter(Boolean).join(" / ") || "-"],
            ["Seller", product.sellerName || "-"],
            ["Contact", product.sellerContact || "Hidden"],
            ["Status", product.status],
            ["Requests", String(requests.length)],
          ].map(([label, value]) => <div key={label} className="rounded-lg bg-[#fff8ef] p-3"><dt className="font-black text-[#7a6a5c]">{label}</dt><dd className="mt-1 text-[#241a12]">{value}</dd></div>)}
        </dl>
      </aside>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm"><span className="text-xs font-black uppercase text-[#7a6a5c]">{label}</span><strong className="mt-2 block text-3xl text-[#241a12]">{value}</strong></div>
}

function Select(props: { value: string; onChange: (value: string) => void; label: string; options: string[] }) {
  return <select className="rounded-lg border border-[#d9c8b3] bg-white px-3 py-2" value={props.value} onChange={(event) => props.onChange(event.target.value)}><option value="">{props.label}</option>{props.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
}

function ProductImage({ product, large = false }: { product: StoredCommerceProduct; large?: boolean }) {
  const size = large ? "h-64 w-full" : "h-14 w-16"
  if (!product.imageUrl) return <div className={`${size} rounded-lg bg-[#eadcca]`} />
  return <div aria-label={product.name} className={`${size} rounded-lg bg-cover bg-center`} style={{ backgroundImage: `url(${product.imageUrl})` }} />
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "available" || status === "accepted" ? "bg-emerald-100 text-emerald-700" : status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>{status}</span>
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("mn-MN") : "-"
}
