type OwnerStatProps = {
  label: string
  value: string
  detail?: string
}

export default function OwnerStat({ label, value, detail }: OwnerStatProps) {
  return (
    <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">{label}</span>
      <strong className="mt-2 block text-2xl font-black text-[#241a12]">{value}</strong>
      {detail ? <p className="m-0 mt-1 text-sm font-medium text-[#7a6a5c]">{detail}</p> : null}
    </div>
  )
}
