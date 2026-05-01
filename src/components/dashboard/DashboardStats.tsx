import type { DashboardData } from "./types"

type DashboardStatsProps = {
  isOwner: boolean
  canManageProducts: boolean
  canManageTravelPackages: boolean
  canManageShipments: boolean
  totalStaff: number
  data: DashboardData
}

export default function DashboardStats(props: DashboardStatsProps) {
  const { isOwner, canManageProducts, canManageTravelPackages, canManageShipments, totalStaff, data } = props

  return (
    <section className="card-grid">
      {isOwner ? <Stat title="Хэрэглэгч" value={`${data.users.length} бүртгэлтэй хэрэглэгч`} /> : null}
      {isOwner ? <Stat title="Staff" value={`${totalStaff} ажилтны эрхтэй`} /> : null}
      {canManageTravelPackages ? <Stat title="Аялал" value={`${data.travelPackages.length} нийт аялал`} /> : null}
      {canManageShipments ? <Stat title="Shipment" value={`${data.shipments.length} ачилтын бүртгэл`} /> : null}
      {canManageProducts ? <Stat title="Бараа" value={`${data.products.length} нийт бүтээгдэхүүн`} /> : null}
    </section>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <article className="office-metric developer-stat-card" style={{ gridColumn: "span 4" }}>
      <h3>{title}</h3>
      <p>{value}</p>
    </article>
  )
}
