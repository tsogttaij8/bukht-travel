"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"

type CartSummary = {
  trips: Array<{
    title: string
    details: string
    status: string
    budget: string
    travelDate: string
    createdAt: string
  }>
  products: Array<{
    title: string
    details: string
    status: string
    price: number
    currency: string
    imageUrl: string
    createdAt: string
  }>
}

const statusLabels: Record<string, string> = {
  new: "Шинэ",
  contacted: "Холбогдсон",
  quoted: "Үнийн саналтай",
  confirmed: "Баталгаажсан",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
  pending: "Хүлээгдэж байна",
  accepted: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
}

export default function AccountCart() {
  const [cart, setCart] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load(): Promise<void> {
      const response = await fetch("/api/account/cart", { cache: "no-store" })
      if (!active) return

      if (!response.ok) {
        setError("Сагсны мэдээлэл ачаалахад алдаа гарлаа.")
        setLoading(false)
        return
      }

      setCart((await response.json()) as CartSummary)
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <section className="account-profile-panel"><p className="account-muted">Миний сагс ачаалж байна...</p></section>
  if (error) return <section className="account-profile-panel"><p className="account-error">{error}</p></section>

  return (
    <div className="account-profile-shell">
      <CartSection title="Захиалсан аялал" emptyText="Одоогоор захиалсан аялал алга.">
        {cart?.trips.map((trip, index) => (
          <CartItem key={`${trip.createdAt}-${index}`} title={trip.title} status={trip.status} meta={[trip.travelDate, trip.budget].filter(Boolean).join(" · ")} details={trip.details} />
        ))}
      </CartSection>

      <CartSection title="Захиалсан бараа" emptyText="Одоогоор захиалсан бараа алга.">
        {cart?.products.map((product, index) => (
          <CartItem key={`${product.createdAt}-${index}`} title={product.title} status={product.status} meta={product.price > 0 ? formatMoney(product.price, product.currency) : ""} details={product.details} imageUrl={product.imageUrl} />
        ))}
      </CartSection>
    </div>
  )
}

function CartSection({ title, emptyText, children }: { title: string; emptyText: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items

  return (
    <section className="account-profile-panel">
      <div className="account-section-heading">
        <h2>{title}</h2>
      </div>
      {isEmpty ? <p className="account-empty">{emptyText}</p> : <div className="account-list">{items}</div>}
    </section>
  )
}

function CartItem(props: { title: string; status: string; meta: string; details: string; imageUrl?: string }) {
  return (
    <article className="account-list-item">
      {props.imageUrl ? <div className="account-list-image" style={{ backgroundImage: `url(${props.imageUrl})` }} aria-hidden="true" /> : null}
      <div>
        <div className="account-list-title-row">
          <h3>{props.title || "Гарчиггүй"}</h3>
          <span>{statusLabels[props.status] ?? props.status}</span>
        </div>
        {props.meta ? <p className="account-list-meta">{props.meta}</p> : null}
        {props.details ? <p className="account-list-details">{props.details}</p> : null}
      </div>
    </article>
  )
}

function formatMoney(value: number, currency: string): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)} ${currency}`
}
