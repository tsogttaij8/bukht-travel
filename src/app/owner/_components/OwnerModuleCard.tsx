import Link from "@/src/components/ui/TrackedLink"
import type { LucideIcon } from "lucide-react"

type OwnerModuleCardProps = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  totalLabel: string
  totalValue: string
  activeLabel: string
  activeValue: string
  status?: string
  actions?: Array<{ label: string; href: string }>
}

export default function OwnerModuleCard(props: OwnerModuleCardProps) {
  const Icon = props.icon

  return (
    <article className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#fff0dd] text-[#7d4d34]">
            <Icon size={21} />
          </div>
          <div>
            <h2 className="m-0 text-lg font-black text-[#241a12]">{props.title}</h2>
            <p className="m-0 mt-1 text-sm font-medium leading-6 text-[#6e6154]">{props.description}</p>
          </div>
        </div>
        {props.status ? <span className="rounded-full bg-[#fff0dd] px-2.5 py-1 text-xs font-black text-[#7d4d34]">{props.status}</span> : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[#eadcca] bg-[#fff8ef] p-3">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#9f5d36]">{props.totalLabel}</span>
          <strong className="mt-1 block text-xl font-black text-[#241a12]">{props.totalValue}</strong>
        </div>
        <div className="rounded-md border border-[#eadcca] bg-[#fff8ef] p-3">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#9f5d36]">{props.activeLabel}</span>
          <strong className="mt-1 block text-xl font-black text-[#241a12]">{props.activeValue}</strong>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {props.actions?.map((action) => (
            <Link key={action.href} href={action.href} className="rounded-md border border-[#e3d4bd] px-3 py-2 text-sm font-bold text-[#5f4b3d] hover:bg-[#fff0dd]">
              {action.label}
            </Link>
          ))}
        </div>
        <Link href={props.href} className="rounded-md bg-[#7d4d34] px-4 py-2 text-sm font-black text-white hover:bg-[#6b3f2b]">
          Manage
        </Link>
      </div>
    </article>
  )
}
