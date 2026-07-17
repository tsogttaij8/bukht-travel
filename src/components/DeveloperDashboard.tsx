"use client"

import { useState } from "react"
import type { UserRole } from "../lib/server/user-store"
import type { StoredEsimPackage } from "../lib/server/esim-package-store"
import type { StoredTravelPackage } from "../lib/server/travel-package-store"
import type { StoredUser } from "../lib/server/user-store"
import DashboardStats from "./dashboard/DashboardStats"
import { EsimPackageCreatePanel, EsimPackageListPanel } from "./dashboard/EsimPackagesPanel"
import { ShipmentCreatePanel, ShipmentListPanel } from "./dashboard/ShipmentsPanel"
import StaffAccessPanel from "./dashboard/StaffAccessPanel"
import { TravelPackageCreatePanel, TravelPackageListPanel } from "./dashboard/TravelPackagesPanel"
import UsersPanel from "./dashboard/UsersPanel"
import { useDashboardData } from "./dashboard/useDashboardData"
import { useDelayedPending } from "./ui/useDelayedPending"
import { useEsimPackages } from "./dashboard/useEsimPackages"
import { useShipments } from "./dashboard/useShipments"
import { useStaffAccess } from "./dashboard/useStaffAccess"
import { useTravelPackages } from "./dashboard/useTravelPackages"
import type { DashboardShipment } from "./dashboard/types"

type DeveloperDashboardProps = {
  currentRoles: UserRole[]
  currentUser?: { name: string; email: string }
  enabledTabs?: DashboardTab[]
}

type DashboardTab = "access" | "travel" | "esim" | "cargo"

export default function DeveloperDashboard({ currentRoles, currentUser, enabledTabs }: DeveloperDashboardProps) {
  const tabEnabled = (tab: DashboardTab) => !enabledTabs || enabledTabs.includes(tab)
  const travelOnlyScope = Boolean(enabledTabs && enabledTabs.length === 1 && enabledTabs.includes("travel"))
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (currentRoles.includes("owner") && tabEnabled("access")) return "access"
    if (currentRoles.includes("travel_staff") && tabEnabled("travel")) return "travel"
    if (currentRoles.includes("esim_staff") && tabEnabled("esim")) return "esim"
    if (tabEnabled("travel")) return "travel"
    if (tabEnabled("esim")) return "esim"
    if (tabEnabled("cargo")) return "cargo"
    return "cargo"
  })
  const isOwner = currentRoles.includes("owner")
  const canManageAccess = tabEnabled("access") && isOwner
  const canManageProducts = false
  const canManageTravelPackages = tabEnabled("travel") && (isOwner || currentRoles.includes("travel_staff"))
  const canManageEsimPackages = tabEnabled("esim") && (isOwner || currentRoles.includes("esim_staff"))
  const canManageShipments = tabEnabled("cargo") && (isOwner || currentRoles.includes("cargo_staff") || currentRoles.includes("support_staff"))
  const { data, setData, loading, loadError } = useDashboardData({ isOwner: canManageAccess, canManageProducts, canManageEsimPackages, canManageTravelPackages: canManageTravelPackages && !travelOnlyScope, canManageShipments })
  const showLoading = useDelayedPending(loading)
  const setUsers = (updater: (users: StoredUser[]) => StoredUser[]) => setData((state) => ({ ...state, users: updater(state.users) }))
  const setEsimPackages = (updater: (packages: StoredEsimPackage[]) => StoredEsimPackage[]) => setData((state) => ({ ...state, esimPackages: updater(state.esimPackages) }))
  const setTravelPackages = (updater: (packages: StoredTravelPackage[]) => StoredTravelPackage[]) => setData((state) => ({ ...state, travelPackages: updater(state.travelPackages) }))
  const setShipments = (updater: (shipments: DashboardShipment[]) => DashboardShipment[]) => setData((state) => ({ ...state, shipments: updater(state.shipments) }))
  const staff = useStaffAccess(data.users, setUsers)
  const esimPackages = useEsimPackages(setEsimPackages)
  const travelPackages = useTravelPackages(setTravelPackages)
  const shipments = useShipments(setShipments)

  if (loading) {
    return showLoading ? <section className="office-panel"><p style={{ margin: 0 }}>Dashboard ачаалж байна...</p></section> : null
  }

  const tabs: Array<{ value: DashboardTab; label: string; visible: boolean }> = [
    { value: "access", label: "Эрх", visible: canManageAccess },
    { value: "travel", label: "Аялал", visible: canManageTravelPackages },
    { value: "esim", label: "eSIM", visible: canManageEsimPackages },
    { value: "cargo", label: "Карго", visible: canManageShipments },
  ]
  const visibleTabs = tabs.filter((tab) => tab.visible && tabEnabled(tab.value))
  const isTravelOnlyWorkspace = visibleTabs.length === 1 && visibleTabs[0]?.value === "travel"

  return (
    <div className="developer-dashboard">
      {!isTravelOnlyWorkspace ? <div className="office-header">
        <div>
          <p>Signed in as</p>
          <h2>{currentUser?.name ?? "Owner"}</h2>
          <span>{currentUser?.email ?? ""} · {currentRoles.join(", ")}</span>
        </div>
      </div> : null}
      {!isTravelOnlyWorkspace ? <nav className="office-tabs" aria-label="Owner sections">
        {visibleTabs.map((tab) => (
          <button key={tab.value} type="button" className={activeTab === tab.value ? "active" : ""} onClick={() => setActiveTab(tab.value)}>
            {tab.label}
          </button>
        ))}
      </nav> : null}

      {loadError ? <section className="office-panel"><p style={{ margin: 0, color: "#b42318", fontWeight: 700 }}>{loadError}</p></section> : null}
      {activeTab === "access" && canManageAccess ? (
        <>
          <StaffAccessPanel users={data.users} {...staff} />
          <DashboardStats isOwner={canManageAccess} canManageProducts={canManageProducts} canManageTravelPackages={canManageTravelPackages} canManageShipments={canManageShipments} totalStaff={staff.totalStaff} data={data} />
          <UsersPanel users={data.users} />
        </>
      ) : null}
      {activeTab === "travel" && canManageTravelPackages ? (
        <>
          <TravelPackageCreatePanel travelPackages={data.travelPackages} {...travelPackages} />
          <TravelPackageListPanel travelPackages={data.travelPackages} />
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
