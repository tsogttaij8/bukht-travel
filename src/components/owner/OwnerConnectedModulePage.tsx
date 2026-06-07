"use client"

import { useEffect, useState } from "react"
import OwnerEmptyState from "./OwnerEmptyState"

type OwnerConnectedModulePageProps = {
  title: string
  moduleName: string
  endpoint: string
  dataKey: string
  totalLabel: string
  body?: string
}

export default function OwnerConnectedModulePage({ title, moduleName, endpoint, dataKey, totalLabel, body }: OwnerConnectedModulePageProps) {
  const [total, setTotal] = useState("Not connected yet")
  const [status, setStatus] = useState("Loading...")

  useEffect(() => {
    let active = true

    async function load(): Promise<void> {
      try {
        const response = await fetch(endpoint, { cache: "no-store" })
        if (!response.ok) {
          if (active) setStatus("Not connected yet")
          return
        }
        const body = await response.json() as Record<string, unknown>
        const records = body[dataKey]
        if (active) {
          setTotal(Array.isArray(records) ? String(records.length) : "Not connected yet")
          setStatus(Array.isArray(records) ? "Connected" : "Not connected yet")
        }
      } catch {
        if (active) setStatus("Not connected yet")
      }
    }

    load()
    return () => {
      active = false
    }
  }, [dataKey, endpoint])

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">{totalLabel}</span>
          <strong className="mt-2 block text-xl font-black text-[#241a12]">{total}</strong>
        </div>
        <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">Active items</span>
          <strong className="mt-2 block text-xl font-black text-[#241a12]">No active status field</strong>
        </div>
        <div className="rounded-lg border border-[#e3d4bd] bg-[#fffdf8] p-4 shadow-sm">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#9f5d36]">Connection</span>
          <strong className="mt-2 block text-xl font-black text-[#241a12]">{status}</strong>
        </div>
      </div>
      <OwnerEmptyState
        title={title}
        body={body ?? `${moduleName} owner management area is reserved. No fake records, revenue, payments, or active counts are shown.`}
      />
    </div>
  )
}
