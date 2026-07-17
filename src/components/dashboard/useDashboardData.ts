"use client"

import { useEffect, useState } from "react"
import type { StoredProduct } from "../../lib/server/product-store"
import type { StoredEsimPackage } from "../../lib/server/esim-package-store"
import type { StoredShipment } from "../../lib/server/shipment-store"
import type { StoredTravelPackage } from "../../lib/server/travel-package-store"
import type { StoredUser } from "../../lib/server/user-store"
import type { DashboardData } from "./types"

async function readJson<T extends { message?: string }>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text()
  if (!text) return { message: fallbackMessage } as T

  try {
    return JSON.parse(text) as T
  } catch {
    return { message: fallbackMessage } as T
  }
}

export function useDashboardData(options: {
  isOwner: boolean
  canManageProducts: boolean
  canManageTravelPackages: boolean
  canManageShipments: boolean
  canManageEsimPackages?: boolean
}) {
  const [data, setData] = useState<DashboardData>({ users: [], products: [], esimPackages: [], travelPackages: [], shipments: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let active = true

    async function loadDashboard(): Promise<void> {
      setLoading(true)
      setLoadError("")

      try {
        const next: DashboardData = { users: [], products: [], esimPackages: [], travelPackages: [], shipments: [] }
        const errors: string[] = []

        if (options.isOwner) {
          const response = await fetch("/api/admin/users", { cache: "no-store" })
          const body = await readJson<{ users?: StoredUser[]; message?: string }>(response, "Failed to load users.")
          if (response.ok) {
            next.users = body.users ?? []
          } else {
            errors.push(body.message ?? "Failed to load users.")
          }
        }

        if (options.canManageProducts) {
          const response = await fetch("/api/admin/products", { cache: "no-store" })
          const body = await readJson<{ products?: StoredProduct[]; message?: string }>(response, "Failed to load products.")
          if (response.ok) {
            next.products = body.products ?? []
          } else {
            errors.push(body.message ?? "Failed to load products.")
          }
        }

        if (options.canManageEsimPackages) {
          const response = await fetch("/api/admin/esim-packages", { cache: "no-store" })
          const body = await readJson<{ esimPackages?: StoredEsimPackage[]; message?: string }>(response, "Failed to load eSIM packages.")
          if (response.ok) {
            next.esimPackages = body.esimPackages ?? []
          } else {
            errors.push(body.message ?? "Failed to load eSIM packages.")
          }
        }

        if (options.canManageTravelPackages) {
          const response = await fetch("/api/admin/travel-packages", { cache: "no-store" })
          const body = await readJson<{ travelPackages?: StoredTravelPackage[]; message?: string }>(response, "Failed to load travel packages.")
          if (response.ok) {
            next.travelPackages = body.travelPackages ?? []
          } else {
            errors.push(body.message ?? "Failed to load travel packages.")
          }
        }

        if (options.canManageShipments) {
          const response = await fetch("/api/admin/shipments", { cache: "no-store" })
          const body = await readJson<{ shipments?: StoredShipment[]; message?: string }>(response, "Failed to load shipments.")
          if (response.ok) {
            next.shipments = (body.shipments ?? []).map((shipment) => ({
              ...shipment,
              events: [],
              eventsLoaded: false,
            }))
          } else {
            errors.push(body.message ?? "Failed to load shipments.")
          }
        }

        if (!active) return

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
  }, [options.canManageEsimPackages, options.canManageProducts, options.canManageShipments, options.canManageTravelPackages, options.isOwner])

  return { data, setData, loading, loadError }
}
