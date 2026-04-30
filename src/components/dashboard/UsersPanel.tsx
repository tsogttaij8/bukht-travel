import type { StoredUser } from "../../lib/server/user-store"

export default function UsersPanel({ users }: { users: StoredUser[] }) {
  return (
    <section className="card developer-panel">
      <h3 style={{ marginBottom: 16 }}>Хэрэглэгчдийн жагсаалт</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {users.map((user) => (
          <div key={user.id} className="developer-list-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingBottom: 10, borderBottom: "1px solid #eee3d3" }}>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <span style={{ color: "#6b5b4c" }}>{user.roles.join(", ")}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

