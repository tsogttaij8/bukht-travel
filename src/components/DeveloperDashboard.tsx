"use client"

import type { UserRole } from "../lib/server/user-store"
import type { StoredProduct } from "../lib/server/product-store"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import type { StoredUser } from "../lib/server/user-store"
import DashboardStats from "./dashboard/DashboardStats"
import { ProductCreatePanel, ProductListPanel } from "./dashboard/ProductsPanel"
import { ShipmentCreatePanel, ShipmentListPanel } from "./dashboard/ShipmentsPanel"
import StaffAccessPanel from "./dashboard/StaffAccessPanel"
import { TravelPackageCreatePanel, TravelPackageListPanel } from "./dashboard/TravelPackagesPanel"
import UsersPanel from "./dashboard/UsersPanel"
import { useDashboardData } from "./dashboard/useDashboardData"
import { useProducts } from "./dashboard/useProducts"
import { useShipments } from "./dashboard/useShipments"
import { useStaffAccess } from "./dashboard/useStaffAccess"
import { useTravelPackages } from "./dashboard/useTravelPackages"
import type { DashboardShipment } from "./dashboard/types"

type DeveloperDashboardProps = {
  currentRoles: UserRole[]
}

export default function DeveloperDashboard({ currentRoles }: DeveloperDashboardProps) {
  const isOwner = currentRoles.includes("owner")
  const canManageProducts = isOwner || currentRoles.includes("cargo_staff")
  const canManageTravelPackages = isOwner || currentRoles.includes("travel_staff")
  const canManageShipments = isOwner || currentRoles.includes("cargo_staff") || currentRoles.includes("support_staff")
  const { data, setData, loading, loadError } = useDashboardData({ isOwner, canManageProducts, canManageTravelPackages, canManageShipments })
  const setUsers = (updater: (users: StoredUser[]) => StoredUser[]) => setData((state) => ({ ...state, users: updater(state.users) }))
  const setProducts = (updater: (products: StoredProduct[]) => StoredProduct[]) => setData((state) => ({ ...state, products: updater(state.products) }))
  const setTravelPackages = (updater: (packages: StoredTravelPackage[]) => StoredTravelPackage[]) => setData((state) => ({ ...state, travelPackages: updater(state.travelPackages) }))
  const setShipments = (updater: (shipments: DashboardShipment[]) => DashboardShipment[]) => setData((state) => ({ ...state, shipments: updater(state.shipments) }))
  const staff = useStaffAccess(data.users, setUsers)
  const products = useProducts(setProducts)
  const travelPackages = useTravelPackages(setTravelPackages)
  const shipments = useShipments(setShipments)

  if (loading) {
    return <section className="card"><p style={{ margin: 0 }}>Dashboard ачаалж байна...</p></section>
  }

  return (
    <div className="developer-dashboard" style={{ display: "grid", gap: 20 }}>
      {loadError ? <section className="card"><p style={{ margin: 0, color: "#b42318", fontWeight: 700 }}>{loadError}</p></section> : null}
      {isOwner ? <StaffAccessPanel users={data.users} {...staff} /> : null}
      <DashboardStats isOwner={isOwner} canManageProducts={canManageProducts} canManageTravelPackages={canManageTravelPackages} canManageShipments={canManageShipments} totalStaff={staff.totalStaff} data={data} />
      {canManageTravelPackages ? <TravelPackageCreatePanel travelPackages={data.travelPackages} {...travelPackages} /> : null}
      {canManageProducts ? <ProductCreatePanel products={data.products} {...products} /> : null}
      {canManageShipments ? <ShipmentCreatePanel shipments={data.shipments} {...shipments} /> : null}
      {isOwner ? <UsersPanel users={data.users} /> : null}
      {canManageTravelPackages ? <TravelPackageListPanel travelPackages={data.travelPackages} /> : null}
      {canManageProducts ? <ProductListPanel products={data.products} /> : null}
      {canManageShipments ? <ShipmentListPanel shipments={data.shipments} {...shipments} /> : null}
    </div>
  )
}
