import Link from "next/link"
import { Edit, Eye, Plus, Trash2 } from "lucide-react"
import OwnerDataTable from "../../_components/OwnerDataTable"
import OwnerEmptyState from "../../_components/OwnerEmptyState"
import type { StoredTravelPackage, TravelPackageStatus } from "@/src/lib/server/travel-package-store"

type OwnerTravelTableProps = {
  tours: StoredTravelPackage[]
  onStatus: (tour: StoredTravelPackage, status: TravelPackageStatus) => void
  onDelete: (tour: StoredTravelPackage) => void
}

export default function OwnerTravelTable(props: OwnerTravelTableProps) {
  if (props.tours.length === 0) {
    return (
      <OwnerEmptyState
        title="Аялал хараахан алга"
        body="Эхний аяллаа ноорог байдлаар үүсгээд, бэлэн болсон үед нь нийтэлнэ."
        action={<Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/owner/travel/tours/new"><Plus size={16} className="mr-2 inline" />Шинэ аялал</Link>}
      />
    )
  }

  return (
    <OwnerDataTable
      rows={props.tours}
      getRowKey={(tour) => tour.id}
      columns={[
        { key: "title", label: "Нэр", render: (tour) => <div><strong className="block text-slate-950">{tour.title}</strong><span className="text-xs text-slate-500">{tour.shortDescription || "Богино танилцуулга оруулаагүй"}</span></div> },
        { key: "destination", label: "Очих газар", render: (tour) => tour.destination || "-" },
        { key: "price", label: "Үнэ", render: (tour) => formatMoney(tour.price, tour.priceCurrency) },
        { key: "status", label: "Төлөв", render: (tour) => <StatusBadge status={tour.status} /> },
        { key: "created", label: "Үүссэн", render: (tour) => formatDate(tour.createdAt) },
        { key: "updated", label: "Шинэчилсэн", render: (tour) => formatDate(tour.updatedAt) },
        { key: "actions", label: "Үйлдэл", render: (tour) => <TableActions tour={tour} onStatus={props.onStatus} onDelete={props.onDelete} /> },
      ]}
    />
  )
}

function TableActions(props: Pick<OwnerTravelTableProps, "onStatus" | "onDelete"> & { tour: StoredTravelPackage }) {
  const { tour } = props
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/owner/travel/tours/${tour.id}`} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Засах"><Edit size={15} /></Link>
      <Link href={`/owner/travel/tours/${tour.id}/preview`} className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Харах"><Eye size={15} /></Link>
      <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50" onClick={() => props.onStatus(tour, tour.status === "published" ? "draft" : "published")}>
        {tour.status === "published" ? "Нуух" : "Нийтлэх"}
      </button>
      <button type="button" className="rounded-md border border-red-200 p-2 text-red-700 hover:bg-red-50" onClick={() => props.onDelete(tour)} title="Устгах"><Trash2 size={15} /></button>
    </div>
  )
}

function StatusBadge({ status }: { status: TravelPackageStatus }) {
  const tone = status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>{status === "published" ? "Нийтлэгдсэн" : "Ноорог"}</span>
}

function formatMoney(value: number, currency: StoredTravelPackage["priceCurrency"]): string {
  return `${new Intl.NumberFormat("mn-MN").format(value)}${currency === "CNY" ? "\u00a5" : "\u20ae"}`
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("mn-MN") : "-"
}
