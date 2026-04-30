"use client"

import { useState } from "react"
import type { StoredProduct } from "../../lib/server/product-store"
import type { ProductForm } from "./types"

const emptyProductForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  moq: "",
  origin: "Guangzhou",
  leadTime: "7-10 хоног",
  badge: "New",
  summary: "",
}

export function useProducts(setProducts: (updater: (products: StoredProduct[]) => StoredProduct[]) => void) {
  const [form, setForm] = useState<ProductForm>(emptyProductForm)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function createProduct(): Promise<void> {
    setBusy(true)
    setError("")
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = (await response.json()) as { product?: StoredProduct; message?: string }
    setBusy(false)
    if (!response.ok || !body.product) return setError(body.message ?? "Бараа нэмэхэд алдаа гарлаа")
    setProducts((current) => [body.product!, ...current])
    setForm(emptyProductForm)
  }

  return { form, setForm, error, busy, createProduct }
}

