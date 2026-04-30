"use client"

import { useSignIn } from "@clerk/nextjs/legacy"
import { useEffect, useState } from "react"
import { syncClerkSession } from "../../lib/auth"
import { clerkMessage, normalizeEmail } from "./clerk-auth-utils"
import FloatingField from "./FloatingField"

export default function ClerkLoginForm(props: { initialEmail?: string; onDone: () => void }) {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState(props.initialEmail ?? "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (props.initialEmail) setEmail(props.initialEmail)
  }, [props.initialEmail])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || busy) return
    setError("")
    setBusy(true)

    try {
      const result = await signIn.create({ identifier: normalizeEmail(email), password })
      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Нэвтрэлт дууссангүй. Нууц үг болон мэйлээ шалгана уу.")
        return
      }
      await setActive({ session: result.createdSessionId })
      const synced = await syncClerkSession()
      if (!synced.ok) return setError(synced.message)
      props.onDone()
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <FloatingField label="Мэйл хаяг" value={email} onChange={setEmail} type="email" autoComplete="email" required />
      <FloatingField label="Нууц үг" value={password} onChange={setPassword} type="password" autoComplete="current-password" required />
      {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
      <button className="btn btn-primary" disabled={busy || !isLoaded}>{busy ? "Түр хүлээнэ үү..." : "Нэвтрэх"}</button>
    </form>
  )
}
