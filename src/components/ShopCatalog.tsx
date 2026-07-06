"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { StoredProduct } from "../lib/server/product-store"

export default function ShopCatalog({ signedIn }: { signedIn: boolean }) {
  const [products, setProducts] = useState<StoredProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState("Бүгд")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadProducts(): Promise<void> {
      setLoading(true)
      setError("")
      try {
        const response = await fetch("/api/shop/products", { cache: "no-store" })
        const body = await response.json() as { products?: StoredProduct[]; message?: string }
        if (!response.ok) throw new Error(body.message ?? "Бараа уншихад алдаа гарлаа.")
        if (active) setProducts(body.products ?? [])
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Бараа уншихад алдаа гарлаа.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProducts()
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const values = products.map((product) => product.category.trim()).filter(Boolean)
    return ["Бүгд", ...Array.from(new Set(values))]
  }, [products])

  const filteredProducts = selectedCategory === "Бүгд"
    ? products
    : products.filter((product) => product.category === selectedCategory)

  if (loading) {
    return <div className="shop-empty-result">Уншиж байна...</div>
  }

  if (error) {
    return <div className="shop-empty-result">{error}</div>
  }

  return (
    <>
      <div className="shop-chip-row" aria-label="Ангилал">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`shop-chip ${selectedCategory === item ? "shop-chip-active" : ""}`}
            onClick={() => setSelectedCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="shop-empty-result">Бараа алга.</div>
      ) : (
        <div className="shop-product-grid">
          {filteredProducts.map((item) => (
            <article key={item.id} className="shop-product-card">
              <div className="shop-product-cover">
                <span>{initials(item.name)}</span>
              </div>
              <div className="shop-product-topline">
                <span className="shop-product-category">{item.category}</span>
                <span className="shop-product-badge">{item.badge}</span>
              </div>
              <h3>{item.name}</h3>
              <div className="shop-product-meta">
                <strong>{item.price}</strong>
                <span>{item.origin}</span>
                <span>{item.leadTime}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Link
                  href={requestPath(item.name, signedIn)}
                  className="btn btn-primary"
                  style={{ padding: "10px 14px", fontSize: "0.92rem" }}
                >
                  {signedIn ? "Хүсэлт өгөх" : "Сонгох"}
                </Link>
                <Link
                  href="/cargo"
                  className="btn btn-secondary"
                  style={{ padding: "10px 14px", fontSize: "0.92rem" }}
                >
                  Карго
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function requestPath(name: string, signedIn: boolean): string {
  const returnTo = typeof window === "undefined" ? "/shop" : `${window.location.pathname}${window.location.search}`
  const accountPath = `/account?service=product_sourcing&title=${encodeURIComponent(name)}&returnTo=${encodeURIComponent(returnTo)}`
  return signedIn ? accountPath : `/login?next=${encodeURIComponent(accountPath)}`
}
