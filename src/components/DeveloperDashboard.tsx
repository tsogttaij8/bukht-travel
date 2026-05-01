"use client"

import { useState } from "react"
import type { UserRole } from "../lib/server/user-store"
import type { StoredEsimPackage } from "../lib/server/esim-package-store"
import type { StoredProduct } from "../lib/server/product-store"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import type { StoredUser } from "../lib/server/user-store"
import DashboardStats from "./dashboard/DashboardStats"
import { EsimPackageCreatePanel, EsimPackageListPanel } from "./dashboard/EsimPackagesPanel"
import { ProductCreatePanel, ProductListPanel } from "./dashboard/ProductsPanel"
import { ShipmentCreatePanel, ShipmentListPanel } from "./dashboard/ShipmentsPanel"
import StaffAccessPanel from "./dashboard/StaffAccessPanel"
import { TravelPackageCreatePanel, TravelPackageListPanel } from "./dashboard/TravelPackagesPanel"
import UsersPanel from "./dashboard/UsersPanel"
import { useDashboardData } from "./dashboard/useDashboardData"
import { useProducts } from "./dashboard/useProducts"
import { useEsimPackages } from "./dashboard/useEsimPackages"
import { useShipments } from "./dashboard/useShipments"
import { useStaffAccess } from "./dashboard/useStaffAccess"
import { useTravelPackages } from "./dashboard/useTravelPackages"
import type { DashboardShipment } from "./dashboard/types"

type DeveloperDashboardProps = {
  currentRoles: UserRole[]
  currentUser?: { name: string; email: string }
}

type DashboardTab = "access" | "travel" | "commerce" | "esim" | "cargo"

export default function DeveloperDashboard({ currentRoles, currentUser }: DeveloperDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (currentRoles.includes("owner")) return "access"
    if (currentRoles.includes("travel_staff")) return "travel"
    if (currentRoles.includes("cargo_staff")) return "commerce"
    if (currentRoles.includes("esim_staff")) return "esim"
    return "cargo"
  })
  const isOwner = currentRoles.includes("owner")
  const canManageProducts = isOwner || currentRoles.includes("cargo_staff")
  const canManageTravelPackages = isOwner || currentRoles.includes("travel_staff")
  const canManageEsimPackages = isOwner || currentRoles.includes("esim_staff")
  const canManageShipments = isOwner || currentRoles.includes("cargo_staff") || currentRoles.includes("support_staff")
  const { data, setData, loading, loadError } = useDashboardData({ isOwner, canManageProducts, canManageEsimPackages, canManageTravelPackages, canManageShipments })
  const setUsers = (updater: (users: StoredUser[]) => StoredUser[]) => setData((state) => ({ ...state, users: updater(state.users) }))
  const setProducts = (updater: (products: StoredProduct[]) => StoredProduct[]) => setData((state) => ({ ...state, products: updater(state.products) }))
  const setEsimPackages = (updater: (packages: StoredEsimPackage[]) => StoredEsimPackage[]) => setData((state) => ({ ...state, esimPackages: updater(state.esimPackages) }))
  const setTravelPackages = (updater: (packages: StoredTravelPackage[]) => StoredTravelPackage[]) => setData((state) => ({ ...state, travelPackages: updater(state.travelPackages) }))
  const setShipments = (updater: (shipments: DashboardShipment[]) => DashboardShipment[]) => setData((state) => ({ ...state, shipments: updater(state.shipments) }))
  const staff = useStaffAccess(data.users, setUsers)
  const products = useProducts(setProducts)
  const esimPackages = useEsimPackages(setEsimPackages)
  const travelPackages = useTravelPackages(setTravelPackages)
  const shipments = useShipments(setShipments)

  if (loading) {
    return <section className="office-panel"><p style={{ margin: 0 }}>Dashboard ачаалж байна...</p></section>
  }

  const tabs: Array<{ value: DashboardTab; label: string; visible: boolean }> = [
    { value: "access", label: "Эрх", visible: isOwner },
    { value: "travel", label: "Аялал", visible: canManageTravelPackages },
    { value: "commerce", label: "Худалдаа", visible: canManageProducts },
    { value: "esim", label: "eSIM", visible: canManageEsimPackages },
    { value: "cargo", label: "Карго", visible: canManageShipments },
  ]

  return (
    <div className="developer-dashboard">
      <div className="office-header">
        <div>
          <p>Signed in as</p>
          <h2>{currentUser?.name ?? "Owner"}</h2>
          <span>{currentUser?.email ?? ""} · {currentRoles.join(", ")}</span>
        </div>
      </div>
      <nav className="office-tabs" aria-label="Owner sections">
        {tabs.filter((tab) => tab.visible).map((tab) => (
          <button key={tab.value} type="button" className={activeTab === tab.value ? "active" : ""} onClick={() => setActiveTab(tab.value)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {loadError ? <section className="office-panel"><p style={{ margin: 0, color: "#b42318", fontWeight: 700 }}>{loadError}</p></section> : null}
      {activeTab === "access" && isOwner ? (
        <>
          <StaffAccessPanel users={data.users} {...staff} />
          <DashboardStats isOwner={isOwner} canManageProducts={canManageProducts} canManageTravelPackages={canManageTravelPackages} canManageShipments={canManageShipments} totalStaff={staff.totalStaff} data={data} />
          <UsersPanel users={data.users} />
        </>
      ) : null}
      {activeTab === "travel" && canManageTravelPackages ? (
        <>
          <TravelPackageCreatePanel travelPackages={data.travelPackages} {...travelPackages} />
          <TravelPackageListPanel travelPackages={data.travelPackages} />
        </>
      ) : null}
      {activeTab === "commerce" && canManageProducts ? (
        <>
          <ProductCreatePanel products={data.products} {...products} />
          <ProductListPanel products={data.products} />
        </>
      ) : null}
      {activeTab === "esim" && canManageEsimPackages ? (
        <>
          <EsimPackageCreatePanel esimPackages={data.esimPackages} {...esimPackages} />
          <EsimPackageListPanel esimPackages={data.esimPackages} />
        </>
      ) : null}
      {activeTab === "cargo" && canManageShipments ? (
        <>
          <ShipmentCreatePanel shipments={data.shipments} {...shipments} />
          <ShipmentListPanel shipments={data.shipments} {...shipments} />
        </>
      ) : null}
    </div>
  )
}
