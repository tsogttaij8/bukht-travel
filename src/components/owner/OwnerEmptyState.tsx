type OwnerEmptyStateProps = {
  title: string
  body: string
  action?: React.ReactNode
}

export default function OwnerEmptyState({ title, body, action }: OwnerEmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-[#d9c6aa] bg-[#fffdf8] p-8 text-center shadow-sm">
      <h2 className="m-0 text-lg font-black text-[#241a12]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-[#7a6a5c]">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  )
}
