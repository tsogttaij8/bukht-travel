"use client"

import OwnerTravelManager from "@/src/app/owner/travel/_components/OwnerTravelManager"
import type { StoredTravelPackage } from "../../lib/server/travel-package-store"

type TravelPackagesPanelProps = {
  travelPackages?: StoredTravelPackage[]
}

export function TravelPackageCreatePanel(props: TravelPackagesPanelProps) {
  void props
  return <OwnerTravelManager mode="dashboard" />
}

export function TravelPackageListPanel(props: TravelPackagesPanelProps) {
  void props
  return null
}
