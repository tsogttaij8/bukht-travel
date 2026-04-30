import type { ShipmentStatus } from "../../lib/server/shipment-store"
import type { UserRole } from "../../lib/server/user-store"

export const shipmentStatuses: ShipmentStatus[] = ["registered", "received", "in_transit", "arrived", "delivered"]

export const staffRoleOptions: Array<{ value: UserRole; label: string; description: string }> = [
  { value: "owner", label: "Owner", description: "Бүх эрх, staff эрх удирдана" },
  { value: "cargo_staff", label: "Cargo", description: "Карго бүртгэл, shipment" },
  { value: "travel_staff", label: "Travel", description: "Аяллын хүсэлт, захиалга" },
  { value: "esim_staff", label: "eSIM", description: "eSIM захиалга, activation" },
  { value: "finance_staff", label: "Finance", description: "Төлбөр, тайлан" },
  { value: "support_staff", label: "Support", description: "Хэрэглэгчийн хүсэлт, лавлагаа" },
  { value: "customer", label: "Customer", description: "Энгийн хэрэглэгч" },
]

export function labelForStatus(status: ShipmentStatus): string {
  switch (status) {
    case "registered":
      return "Бүртгэсэн"
    case "received":
      return "Агуулахад авсан"
    case "in_transit":
      return "Замд явж байна"
    case "arrived":
      return "Ирсэн"
    case "delivered":
      return "Хүргэгдсэн"
  }
}

