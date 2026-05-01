"use client"

import { useState } from "react"
import Link from "next/link"

export default function InviteAcceptPanel({ token }: { token: string }) {
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function accept(): Promise<void> {
    setBusy(true)
    setMessage("")
    const response = await fetch("/api/role-invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    const body = (await response.json()) as { message?: string }
    setBusy(false)
    if (!response.ok) return setMessage(body.message ?? "Invite accept хийхэд алдаа гарлаа")
    setAccepted(true)
    setMessage("Invite accepted. Таны role идэвхжлээ.")
  }

  return (
    <section className="office-panel" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
      <span className="section-kicker">BUKHT invite</span>
      <h1 className="section-title" style={{ marginTop: 16 }}>Role invite</h1>
      <p className="section-subtitle" style={{ margin: "0 auto 18px" }}>
        Invite accept хийсний дараа таны account шинэ role-оороо нэвтэрч эхэлнэ.
      </p>
      {message ? <p style={{ color: accepted ? "#1d6b42" : "#b42318", fontWeight: 800 }}>{message}</p> : null}
      {accepted ? (
        <Link href="/owner" className="btn btn-primary">Workspace руу орох</Link>
      ) : (
        <button type="button" className="btn btn-primary" onClick={accept} disabled={busy}>
          {busy ? "Accept хийж байна..." : "Invite accept хийх"}
        </button>
      )}
    </section>
  )
}
