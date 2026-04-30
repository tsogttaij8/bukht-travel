type StaffRoleConsoleProps = {
  title: string
  summary: string
  panels: string[]
}

export default function StaffRoleConsole({ title, summary, panels }: StaffRoleConsoleProps) {
  return (
    <div className="developer-dashboard" style={{ display: "grid", gap: 20 }}>
      <section className="card developer-panel">
        <h3 style={{ marginBottom: 8 }}>{title}</h3>
        <p style={{ margin: 0, color: "#6b5b4c" }}>{summary}</p>
      </section>

      <section className="card-grid">
        {panels.map((panel) => (
          <article key={panel} className="card developer-stat-card" style={{ gridColumn: "span 4" }}>
            <h3>{panel}</h3>
            <p>Зөвхөн энэ role-д хамаарах ажлын хэсэг.</p>
          </article>
        ))}
      </section>
    </div>
  )
}
