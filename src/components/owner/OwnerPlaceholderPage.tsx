import OwnerEmptyState from "./OwnerEmptyState"

type OwnerPlaceholderPageProps = {
  title: string
  moduleName: string
  body?: string
}

export default function OwnerPlaceholderPage({ title, moduleName, body }: OwnerPlaceholderPageProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">Total items</span>
          <strong className="mt-2 block text-xl font-black text-[#241a12]">Not connected yet</strong>
        </div>
        <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">Active items</span>
          <strong className="mt-2 block text-xl font-black text-[#241a12]">Not connected yet</strong>
        </div>
      </div>
      <OwnerEmptyState
        title={title}
        body={body ?? `${moduleName} owner management area is reserved. No fake records, revenue, payments, or active counts are shown.`}
      />
    </div>
  )
}
