"use client"

import { useMemo, useState } from "react"
import type { StoredUser, UserRole } from "../../lib/server/user-store"
import type { StaffAccessDraft } from "./types"

export function useStaffAccess(users: StoredUser[], setUsers: (updater: (users: StoredUser[]) => StoredUser[]) => void) {
  const [form, setForm] = useState({
    email: "",
    roles: ["cargo_staff"] as UserRole[],
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [drafts, setDrafts] = useState<Record<string, StaffAccessDraft>>({})
  const totalStaff = useMemo(() => users.filter((user) => user.roles.some((role) => role !== "customer")).length, [users])
  const activeStaff = useMemo(
    () => users.filter((user) => user.status === "active" && user.roles.some((role) => role !== "customer")).length,
    [users]
  )

  function normalize(roles: UserRole[]): UserRole[] {
    return roles.length > 0 ? roles : ["customer"]
  }

  function toggleFormRole(role: UserRole): void {
    setForm((state) => ({
      ...state,
      roles: normalize(state.roles.includes(role) ? state.roles.filter((item) => item !== role) : [...state.roles, role]),
    }))
  }

  function getDraft(user: StoredUser): StaffAccessDraft {
    return drafts[user.id] ?? { name: user.name, roles: user.roles, status: user.status, busy: false, error: "" }
  }

  function updateDraft(user: StoredUser, patch: Partial<StaffAccessDraft>): void {
    setDrafts((state) => ({ ...state, [user.id]: { ...getDraft(user), ...patch } }))
  }

  function toggleUserRole(user: StoredUser, role: UserRole): void {
    const draft = getDraft(user)
    const roles = draft.roles.includes(role) ? draft.roles.filter((item) => item !== role) : [...draft.roles, role]
    updateDraft(user, { roles: normalize(roles) })
  }

  async function createStaffUser(): Promise<void> {
    setBusy(true)
    setError("")
    setNotice("")
    const response = await fetch("/api/admin/role-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const body = (await response.json()) as { inviteUrl?: string; message?: string }
    setBusy(false)
    if (!response.ok) return setError(body.message ?? "Invite илгээхэд алдаа гарлаа")
    setNotice(body.inviteUrl ? `Invite үүслээ: ${body.inviteUrl}` : "Invite имэйлээр илгээгдлээ.")
    setForm({ email: "", roles: ["cargo_staff"] })
  }

  async function saveUserAccess(user: StoredUser): Promise<void> {
    const draft = getDraft(user)
    updateDraft(user, { busy: true, error: "" })
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, name: draft.name, roles: draft.roles, status: draft.status }),
    })
    const body = (await response.json()) as { user?: StoredUser; message?: string }
    if (!response.ok || !body.user) return updateDraft(user, { busy: false, error: body.message ?? "Эрх хадгалахад алдаа гарлаа" })
    setUsers((current) => current.map((item) => (item.id === body.user!.id ? body.user! : item)))
    setDrafts((state) => {
      const next = { ...state }
      delete next[user.id]
      return next
    })
  }

  return { form, setForm, busy, error, notice, totalStaff, activeStaff, getDraft, updateDraft, toggleFormRole, toggleUserRole, createStaffUser, saveUserAccess }
}
