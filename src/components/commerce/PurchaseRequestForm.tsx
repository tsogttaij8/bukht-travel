"use client"

import { useState } from "react"

export default function PurchaseRequestForm({ productId }: { productId: string }) {
  const [buyerName, setBuyerName] = useState("")
  const [buyerContact, setBuyerContact] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "sent">("idle")
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setStatus("saving")
    setError("")

    const response = await fetch("/api/commerce/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, buyerName, buyerContact, message }),
    })
    const body = await response.json() as { message?: string }

    if (!response.ok) {
      setError(body.message ?? "Хүсэлт илгээхэд алдаа гарлаа.")
      setStatus("idle")
      return
    }

    setStatus("sent")
    setBuyerName("")
    setBuyerContact("")
    setMessage("")
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-[#e3d4bd] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-[#241a12]">Хүсэлт илгээх</h2>
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
      {status === "sent" ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Илгээгдлээ.</div> : null}

      <label className="grid gap-1 text-sm font-bold text-[#4f473e]">
        Нэр
        <input className="rounded-lg border border-[#d9c8b3] px-3 py-2" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} required />
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#4f473e]">
        Утас / холбоо барих
        <input className="rounded-lg border border-[#d9c8b3] px-3 py-2" value={buyerContact} onChange={(event) => setBuyerContact(event.target.value)} required />
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#4f473e]">
        Зурвас
        <textarea className="min-h-24 rounded-lg border border-[#d9c8b3] px-3 py-2" value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <button type="submit" disabled={status === "saving"} className="rounded-lg bg-[#7d4d34] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
        {status === "saving" ? "Илгээж байна..." : "Илгээх"}
      </button>
    </form>
  )
}
