import type { StoredUser, UserRole } from "../../lib/server/user-store"
import { staffRoleOptions } from "./constants"
import type { StaffAccessDraft } from "./types"

type StaffAccessPanelProps = {
  users: StoredUser[]
  form: { name: string; email: string; roles: UserRole[]; status: "active" | "disabled" }
  busy: boolean
  error: string
  activeStaff: number
  setForm: (updater: (form: StaffAccessPanelProps["form"]) => StaffAccessPanelProps["form"]) => void
  getDraft: (user: StoredUser) => StaffAccessDraft
  updateDraft: (user: StoredUser, patch: Partial<StaffAccessDraft>) => void
  toggleFormRole: (role: UserRole) => void
  toggleUserRole: (user: StoredUser, role: UserRole) => void
  createStaffUser: () => void
  saveUserAccess: (user: StoredUser) => void
}

export default function StaffAccessPanel(props: StaffAccessPanelProps) {
  return (
    <section className="card developer-panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h3 style={{ marginBottom: 6 }}>Staff access</h3>
          <p style={{ margin: 0, color: "#6b5b4c" }}>Owner эндээс ажилтан нэмнэ, олон role онооно, role хасна.</p>
        </div>
        <strong style={{ color: "#6a513e" }}>{props.activeStaff} active staff</strong>
      </div>
      <StaffForm {...props} />
      <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
        {props.users.map((user) => <StaffRow key={user.id} user={user} {...props} />)}
      </div>
    </section>
  )
}

function StaffForm(props: StaffAccessPanelProps) {
  return (
    <>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <input value={props.form.name} onChange={(event) => props.setForm((state) => ({ ...state, name: event.target.value }))} placeholder="Ажилтны нэр" className="admin-input" />
        <input value={props.form.email} onChange={(event) => props.setForm((state) => ({ ...state, email: event.target.value }))} placeholder="Имэйл" className="admin-input" />
        <select value={props.form.status} onChange={(event) => props.setForm((state) => ({ ...state, status: event.target.value as "active" | "disabled" }))} className="admin-input">
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <RoleGrid roles={props.form.roles} onToggle={props.toggleFormRole} />
      {props.error ? <p style={{ margin: "12px 0 0", color: "#b42318", fontWeight: 700 }}>{props.error}</p> : null}
      <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={props.createStaffUser} disabled={props.busy}>
        {props.busy ? "Хадгалж байна..." : "Ажилтан нэмэх / шинэчлэх"}
      </button>
    </>
  )
}

function StaffRow(props: StaffAccessPanelProps & { user: StoredUser }) {
  const draft = props.getDraft(props.user)

  return (
    <article className="developer-item-card" style={{ border: "1px solid #e5ddcf", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <input value={draft.name} onChange={(event) => props.updateDraft(props.user, { name: event.target.value })} className="admin-input" />
        <input value={props.user.email} className="admin-input" disabled />
        <select value={draft.status} onChange={(event) => props.updateDraft(props.user, { status: event.target.value as "active" | "disabled" })} className="admin-input">
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      <RoleGrid roles={draft.roles} onToggle={(role) => props.toggleUserRole(props.user, role)} compact />
      {draft.error ? <p style={{ margin: "10px 0 0", color: "#b42318", fontWeight: 700 }}>{draft.error}</p> : null}
      <button className="btn btn-secondary" type="button" style={{ marginTop: 12 }} onClick={() => props.saveUserAccess(props.user)} disabled={draft.busy}>
        {draft.busy ? "Хадгалж байна..." : "Эрх хадгалах"}
      </button>
    </article>
  )
}

function RoleGrid(props: { roles: UserRole[]; onToggle: (role: UserRole) => void; compact?: boolean }) {
  return (
    <div style={{ display: "grid", gap: props.compact ? 8 : 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginTop: 12 }}>
      {staffRoleOptions.map((role) => (
        <label key={role.value} style={{ border: props.compact ? undefined : "1px solid #e5ddcf", borderRadius: 10, padding: props.compact ? 0 : 12, display: props.compact ? "flex" : "grid", gap: 6, cursor: "pointer", fontWeight: 700 }}>
          <span><input type="checkbox" checked={props.roles.includes(role.value)} onChange={() => props.onToggle(role.value)} /> {role.label}</span>
          {!props.compact ? <span style={{ color: "#6b5b4c", fontSize: "0.9rem", fontWeight: 400 }}>{role.description}</span> : null}
        </label>
      ))}
    </div>
  )
}

