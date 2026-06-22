"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, Plane, Smartphone, Truck } from "lucide-react"
import OwnerModuleCard from "./OwnerModuleCard"
import type { StoredTravelPackage } from "@/src/lib/server/travel-package-store"
import type { StoredCommerceProduct } from "@/src/lib/server/commerce-store"
import type { StoredEsimPackage } from "@/src/lib/server/esim-package-store"
import type { StoredShipment } from "@/src/lib/server/shipment-store"

type ModuleState = {
  total: string
  active: string
  status: string
}

type OwnerDashboardData = {
  travel: ModuleState
  commerce: ModuleState
  cargo: ModuleState
  esim: ModuleState
}

const disconnected: ModuleState = { total: "Not connected yet", active: "Not connected yet", status: "Unavailable" }

export default function OwnerDashboard() {
  const [data, setData] = useState<OwnerDashboardData>({
    travel: disconnected,
    commerce: disconnected,
    cargo: disconnected,
    esim: disconnected,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function load(): Promise<void> {
      setLoading(true)
      setError("")
      try {
        const [travel, commerce, cargo, esim] = await Promise.all([
          fetchJson<{ tours?: StoredTravelPackage[] }>("/api/owner/tours"),
          fetchJson<{ products?: StoredCommerceProduct[] }>("/api/commerce/products?scope=admin"),
          fetchJson<{ shipments?: StoredShipment[] }>("/api/admin/shipments"),
          fetchJson<{ esimPackages?: StoredEsimPackage[] }>("/api/admin/esim-packages"),
        ])

        if (!active) return

        const tours = travel.ok ? travel.body.tours ?? [] : null
        const products = commerce.ok ? commerce.body.products ?? [] : null
        const shipments = cargo.ok ? cargo.body.shipments ?? [] : null
        const esimPackages = esim.ok ? esim.body.esimPackages ?? [] : null

        setData({
          travel: tours ? {
            total: String(tours.length),
            active: String(tours.filter((tour) => tour.status === "published").length),
            status: "Connected",
          } : disconnected,
          commerce: products ? {
            total: String(products.length),
            active: String(products.filter((product) => product.status === "available").length),
            status: "Connected",
          } : disconnected,
          cargo: shipments ? {
            total: String(shipments.length),
            active: "No active status field",
            status: "Connected",
          } : disconnected,
          esim: esimPackages ? {
            total: String(esimPackages.length),
            active: "No active status field",
            status: "Connected",
          } : disconnected,
        })
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Failed to load owner dashboard.")
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const platformTotal = useMemo(() => {
    return [data.travel.total, data.commerce.total, data.cargo.total, data.esim.total].reduce((sum, value) => sum + (Number(value) || 0), 0)
  }, [data])

  if (loading) {
    return <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-6 text-sm font-bold text-[#6e6154] shadow-sm">Loading platform modules...</div>
  }

  return (
    <div className="grid gap-5">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

      <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 text-sm font-semibold text-[#6e6154] shadow-sm">
        Platform overview uses real connected API records only. Connected total records: <strong className="text-[#241a12]">{platformTotal}</strong>
      </div>

      <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
        <OwnerModuleCard
          title="Travel"
          description="Manage owner tours, drafts, published packages, and customer previews."
          href="/owner/travel"
          icon={Plane}
          totalLabel="Total tours"
          totalValue={data.travel.total}
          activeLabel="Published"
          activeValue={data.travel.active}
          status={data.travel.status}
          actions={[{ label: "New tour", href: "/owner/travel/tours/new" }, { label: "Tours", href: "/owner/travel/tours" }]}
        />
        <OwnerModuleCard
          title="Commerce"
          description="Reserved owner area for BUKHT product sourcing and shop operations."
          href="/owner/commerce"
          icon={Package}
          totalLabel="Total items"
          totalValue={data.commerce.total}
          activeLabel="Active"
          activeValue={data.commerce.active}
          status={data.commerce.status}
        />
        <OwnerModuleCard
          title="Cargo"
          description="Reserved owner area for shipment operations and tracking workflows."
          href="/owner/cargo"
          icon={Truck}
          totalLabel="Total shipments"
          totalValue={data.cargo.total}
          activeLabel="Active"
          activeValue={data.cargo.active}
          status={data.cargo.status}
        />
        <OwnerModuleCard
          title="eSIM"
          description="Reserved owner area for destination eSIM package management."
          href="/owner/esim"
          icon={Smartphone}
          totalLabel="Total packages"
          totalValue={data.esim.total}
          activeLabel="Active"
          activeValue={data.esim.active}
          status={data.esim.status}
        />
      </div>
    </div>
  )
}

async function fetchJson<T>(url: string): Promise<{ ok: true; body: T } | { ok: false }> {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) return { ok: false }
  return { ok: true, body: await response.json() as T }
}
