"use client"

import { useEffect, useState } from "react"
import type { StoredProduct } from "../../lib/server/product-store"
import type { StoredShipment } from "../../lib/server/shipment-store"
import type { StoredUser } from "../../lib/server/user-store"
import type { DashboardData } from "./types"

export function useDashboardData(options: {
  isOwner: boolean
  canManageProducts: boolean
  canManageShipments: boolean
}) {
  const [data, setData] = useState<DashboardData>({ users: [], products: [], shipments: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let active = true

    async function loadDashboard(): Promise<void> {
      setLoading(true)
      setLoadError("")

      try {
        const [usersResult, productsResult, shipmentsResult] = await Promise.allSettled([
          options.isOwner ? fetch("/api/admin/users", { cache: "no-store" }) : Promise.resolve(null),
          options.canManageProducts ? fetch("/api/admin/products", { cache: "no-store" }) : Promise.resolve(null),
          options.canManageShipments ? fetch("/api/admin/shipments", { cache: "no-store" }) : Promise.resolve(null),
        ])

        if (!active) return

        const next: DashboardData = { users: [], products: [], shipments: [] }
        const errors: string[] = []

        if (options.isOwner && usersResult.status === "fulfilled" && usersResult.value) {
          const body = (await usersResult.value.json()) as { users?: StoredUser[]; message?: string }
          if (usersResult.value.ok) {
            next.users = body.users ?? []
          } else {
            errors.push(body.message ?? "Failed to load users.")
          }
        }

        if (options.canManageProducts && productsResult.status === "fulfilled" && productsResult.value) {
          const body = (await productsResult.value.json()) as { products?: StoredProduct[]; message?: string }
          if (productsResult.value.ok) {
            next.products = body.products ?? []
          } else {
            errors.push(body.message ?? "Failed to load products.")
          }
        }

        if (options.canManageShipments && shipmentsResult.status === "fulfilled" && shipmentsResult.value) {
          const body = (await shipmentsResult.value.json()) as { shipments?: StoredShipment[]; message?: string }
          if (shipmentsResult.value.ok) {
            next.shipments = (body.shipments ?? []).map((shipment) => ({
              ...shipment,
              events: [],
              eventsLoaded: false,
            }))
          } else {
            errors.push(body.message ?? "Failed to load shipments.")
          }
        }

        setData(next)
        if (errors.length > 0) setLoadError(errors[0] ?? "Failed to load dashboard.")
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Failed to load dashboard.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [options.canManageProducts, options.canManageShipments, options.isOwner])

  return { data, setData, loading, loadError }
}
