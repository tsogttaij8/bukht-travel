"use client"

import { useCallback, useEffect, useState } from "react"
import OwnerDataTable from "./OwnerDataTable"
import OwnerEmptyState from "./OwnerEmptyState"
import type { StoredUser, UserRole } from "@/src/lib/server/user-store"
import { useDelayedPending } from "@/src/components/ui/useDelayedPending"

type RoleOption =
  | { key: "travel"; label: "Travel Owner"; role: UserRole; supported: true }
  | { key: "cargo"; label: "Cargo Owner"; role: UserRole; supported: true }
  | { key: "esim"; label: "eSIM Owner"; role: UserRole; supported: true }

const roleOptions: RoleOption[] = [
  { key: "travel", label: "Travel Owner", role: "travel_staff", supported: true },
  { key: "cargo", label: "Cargo Owner", role: "cargo_staff", supported: true },
  { key: "esim", label: "eSIM Owner", role: "esim_staff", supported: true },
]

export default function OwnerUsersManager() {
  const [users, setUsers] = useState<StoredUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyUserId, setBusyUserId] = useState("")
  const showLoading = useDelayedPending(loading)

  const loadUsers = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" })
      const body = (await response.json()) as { users?: StoredUser[]; message?: string }
      if (!response.ok) throw new Error(body.message ?? "Failed to load users.")
      setUsers(body.users ?? [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load users.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function toggleRole(user: StoredUser, role: UserRole): Promise<void> {
    setBusyUserId(user.id)
    setError("")
    const nextRoles = user.roles.includes(role)
      ? user.roles.filter((item) => item !== role)
      : [...user.roles, role]

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          roles: nextRoles,
          status: user.status,
        }),
      })
      const body = (await response.json()) as { user?: StoredUser; message?: string }
      if (!response.ok || !body.user) throw new Error(body.message ?? "Failed to update user roles.")
      setUsers((current) => current.map((item) => item.id === body.user!.id ? body.user! : item))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update user roles.")
    } finally {
      setBusyUserId("")
    }
  }

  if (loading) {
    return showLoading ? <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-6 text-sm font-bold text-[#6e6154] shadow-sm">Loading real users from /api/admin/users...</div> : null
  }

  if (users.length === 0) {
    return <OwnerEmptyState title="No users found" body="No users were returned by /api/admin/users." />
  }

  return (
    <div className="grid gap-4">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
      <OwnerDataTable
        rows={users}
        getRowKey={(user) => user.id}
        columns={[
          { key: "name", label: "Name", render: (user) => <strong className="text-[#241a12]">{user.name}</strong> },
          { key: "email", label: "Email", render: (user) => user.email },
          { key: "joined", label: "Joined", render: (user) => formatDate(user.createdAt) },
          { key: "roles", label: "Current roles", render: (user) => <RoleBadges roles={user.roles} /> },
          { key: "modules", label: "Module owner roles", render: (user) => (
            <div className="grid gap-2">
              {roleOptions.map((option) => (
                <RoleToggle
                  key={option.key}
                  option={option}
                  user={user}
                  busy={busyUserId === user.id}
                  onToggle={toggleRole}
                />
              ))}
            </div>
          ) },
        ]}
      />
    </div>
  )
}

function RoleToggle(props: {
  option: RoleOption
  user: StoredUser
  busy: boolean
  onToggle: (user: StoredUser, role: UserRole) => void
}) {
  const role = props.option.role
  const checked = props.user.roles.includes(role)
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-[#eadcca] bg-white px-3 py-2 text-xs font-bold text-[#4f473e]">
      <span>{props.option.label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={props.busy}
        onChange={() => props.onToggle(props.user, role)}
        className="h-4 w-4 accent-[#7d4d34]"
      />
    </label>
  )
}

function RoleBadges({ roles }: { roles: UserRole[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span key={role} className="rounded-full bg-[#fff0dd] px-2.5 py-1 text-xs font-black text-[#7d4d34]">{role}</span>
      ))}
    </div>
  )
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString("mn-MN") : "-"
}
