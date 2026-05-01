"use client"

import { useState } from "react"
import type { StoredEsimPackage } from "../../lib/server/esim-package-store"
import type { EsimPackageForm } from "./types"

const emptyEsimPackageForm: EsimPackageForm = {
  name: "",
  dataAmount: "",
  validity: "",
  price: "",
  note: "",
  badge: "",
}

export function useEsimPackages(setEsimPackages: (updater: (packages: StoredEsimPackage[]) => StoredEsimPackage[]) => void) {
  const [form, setForm] = useState<EsimPackageForm>(emptyEsimPackageForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function createEsimPackage(): Promise<void> {
    setBusy(true)
    setError("")
    const response = await fetch("/api/admin/esim-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = (await response.json()) as { esimPackage?: StoredEsimPackage; message?: string }
    setBusy(false)
    if (!response.ok || !body.esimPackage) return setError(body.message ?? "eSIM нэмэхэд алдаа гарлаа")
    setEsimPackages((current) => [body.esimPackage!, ...current])
    setForm(emptyEsimPackageForm)
  }

  return { form, setForm, busy, error, createEsimPackage }
}
