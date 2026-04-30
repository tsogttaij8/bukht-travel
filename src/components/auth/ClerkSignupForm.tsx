"use client"

import { useSignUp } from "@clerk/nextjs/legacy"
import { useState } from "react"
import FloatingField from "./FloatingField"
import PasswordMeter from "./PasswordMeter"
import { clerkMessage, isStrongPassword, normalizeEmail } from "./clerk-auth-utils"

export default function ClerkSignupForm(props: { onRegistered: (email: string) => void }) {
  const { isLoaded, signUp } = useSignUp()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"form" | "verify">("form")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || busy) return
    setError("")
    setNotice("")

    if (!email.includes("@")) return setError("Зөв мэйл хаяг оруулна уу.")
    if (!isStrongPassword(password)) return setError("Нууц үг бүх шаардлагыг хангах ёстой.")
    if (password !== confirm) return setError("Давтан оруулсан нууц үг таарахгүй байна.")
    setBusy(true)

    try {
      const [firstName, ...rest] = name.trim().split(" ").filter(Boolean)
      await signUp.create({ emailAddress: normalizeEmail(email), password, firstName: firstName || undefined, lastName: rest.join(" ") || undefined, legalAccepted: true })
      await sendCode()
      setStep("verify")
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function sendCode() {
    await signUp?.prepareEmailAddressVerification({ strategy: "email_code" })
    setNotice("Баталгаажуулах код мэйл рүү илгээгдлээ.")
  }

  async function resendCode() {
    if (!isLoaded || busy) return
    setError("")
    setBusy(true)
    try {
      await sendCode()
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function verifyAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || busy) return
    setError("")
    setBusy(true)

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() })
      if (result.status === "complete") {
        props.onRegistered(normalizeEmail(email))
        return
      }
      setError(`Бүртгэл дуусаагүй байна. Missing: ${result.missingFields.join(", ") || "none"}.`)
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (step === "verify") return (
    <form onSubmit={verifyAccount} className="grid gap-4">
      <FloatingField label="Мэйлээр ирсэн код" value={code} onChange={setCode} inputMode="numeric" autoComplete="one-time-code" required />
      {notice ? <p className="m-0 text-sm font-semibold text-[#1d6b42]">{notice}</p> : null}
      {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
      <button className="btn btn-primary" disabled={busy || !isLoaded}>{busy ? "Шалгаж байна..." : "Баталгаажуулах"}</button>
      <button type="button" className="text-sm font-bold text-[#7d4d34] underline" onClick={resendCode} disabled={busy || !isLoaded}>Код дахин илгээх</button>
      <button type="button" className="btn btn-secondary" onClick={() => setStep("form")}>Буцах</button>
    </form>
  )

  return (
    <form onSubmit={createAccount} className="grid gap-4">
      <FloatingField label="Нэр" value={name} onChange={setName} autoComplete="name" required />
      <FloatingField label="Мэйл хаяг" value={email} onChange={setEmail} type="email" autoComplete="email" required />
      <FloatingField label="Нууц үг" value={password} onChange={setPassword} type="password" autoComplete="new-password" required />
      <FloatingField label="Нууц үг давтах" value={confirm} onChange={setConfirm} type="password" autoComplete="new-password" required />
      <PasswordMeter password={password} />
      <div id="clerk-captcha" />
      {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
      <button className="btn btn-primary" disabled={busy || !isLoaded}>{busy ? "Илгээж байна..." : "Бүртгүүлэх"}</button>
    </form>
  )
}
