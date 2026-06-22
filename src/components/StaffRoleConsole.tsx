type StaffRoleConsoleProps = {
  title: string
  summary: string
  panels: string[]
}

export default function StaffRoleConsole({ title, summary, panels }: StaffRoleConsoleProps) {
  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_18px_45px_rgba(120,88,58,0.1)]">
        <h3 className="mb-2 text-lg font-black text-[#241a12]">{title}</h3>
        <p className="m-0 text-sm font-medium leading-6 text-[#6b5b4c]">{summary}</p>
      </section>

      <section className="grid grid-cols-12 gap-4">
        {panels.map((panel) => (
          <article key={panel} className="col-span-4 rounded-3xl border border-[rgba(226,209,183,0.82)] bg-[rgba(255,253,249,0.94)] p-5 shadow-[0_18px_45px_rgba(120,88,58,0.1)] max-lg:col-span-6 max-sm:col-span-12">
            <h3 className="mb-2 text-lg font-black text-[#241a12]">{panel}</h3>
            <p className="m-0 text-sm font-medium leading-6 text-[#6b5b4c]">Зөвхөн энэ role-д хамаарах ажлын хэсэг.</p>
          </article>
        ))}
      </section>
    </div>
  )
}
