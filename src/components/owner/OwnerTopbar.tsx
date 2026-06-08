type OwnerTopbarProps = {
  title: string
  eyebrow?: string
  description?: string
  user?: { name: string; email: string }
  action?: React.ReactNode
}

export default function OwnerTopbar({ title, eyebrow = "BUKHT owner", description, action }: OwnerTopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[#e3d4bd] bg-[#fffdf8] px-6 py-4 max-md:flex-col max-md:items-stretch">
      <div>
        <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-[#9f5d36]">{eyebrow}</p>
        <h1 className="m-0 mt-1 text-2xl font-black tracking-tight text-[#241a12]">{title}</h1>
        {description ? <p className="m-0 mt-1 max-w-3xl text-sm font-medium text-[#6e6154]">{description}</p> : null}
      </div>
      <div className="flex items-center justify-end gap-3">
        {action}
      </div>
    </header>
  )
}
