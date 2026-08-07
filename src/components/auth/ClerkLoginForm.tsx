"use client"

import { useAuth, useClerk, useSignIn } from "@clerk/nextjs"
import { useEffect, useRef, useState } from "react"
import { logoutUser, syncClerkSession, type SessionUser } from "../../lib/auth"
import { normalizeEmail } from "./clerk-auth-utils"
import FloatingField from "./FloatingField"

type LoginStep = "email" | "verify"

const RESEND_COOLDOWN_SECONDS = 30

export default function ClerkLoginForm(props: {
  initialEmail?: string
  onDone: (user?: SessionUser) => void
}) {
  const { getToken, isSignedIn } = useAuth()
  const { signOut } = useClerk()
  const { signIn, fetchStatus } = useSignIn()
  const [email, setEmail] = useState(props.initialEmail ?? "")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<LoginStep>("email")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const requestInFlight = useRef(false)

  useEffect(() => {
    if (props.initialEmail) setEmail(props.initialEmail)
  }, [props.initialEmail])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || requestInFlight.current || fetchStatus === "fetching") return

    const targetEmail = normalizeEmail(email)
    if (!isValidEmail(targetEmail)) {
      setError("Зөв имэйл хаяг оруулна уу.")
      return
    }

    requestInFlight.current = true
    setBusy(true)
    setError("")
    setNotice("")

    try {
      await logoutUser()
      if (isSignedIn) await signOut()
      await signIn.reset()

      const { error: sendError } = await signIn.emailCode.sendCode({ emailAddress: targetEmail })
      if (sendError) {
        setError(emailDeliveryError(sendError))
        return
      }

      setEmail(targetEmail)
      setCode("")
      setStep("verify")
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setNotice("")
    } catch {
      setError("Код илгээж чадсангүй. Түр хүлээгээд дахин оролдоно уу.")
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  async function resendCode() {
    if (busy || requestInFlight.current || cooldown > 0 || fetchStatus === "fetching") return

    requestInFlight.current = true
    setBusy(true)
    setError("")
    setNotice("")

    try {
      const { error: sendError } = await signIn.emailCode.sendCode()
      if (sendError) {
        setError(emailDeliveryError(sendError))
        return
      }

      setCooldown(RESEND_COOLDOWN_SECONDS)
      setNotice("Баталгаажуулах кодыг дахин илгээлээ.")
    } catch {
      setError("Код дахин илгээж чадсангүй. Түр хүлээгээд оролдоно уу.")
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || requestInFlight.current || fetchStatus === "fetching") return

    const submittedCode = code.trim()
    if (!/^\d{6}$/.test(submittedCode)) {
      setError("6 оронтой баталгаажуулах код оруулна уу.")
      return
    }

    requestInFlight.current = true
    setBusy(true)
    setError("")

    try {
      const { error: verificationError } = await signIn.emailCode.verifyCode({ code: submittedCode })
      if (verificationError) {
        setError(emailCodeError(verificationError))
        return
      }

      if (signIn.status !== "complete" || !signIn.createdSessionId) {
        setError("Нэвтрэлт дуусаагүй байна. Дахин оролдоно уу.")
        return
      }

      const { error: finalizeError } = await signIn.finalize()
      if (finalizeError) {
        setError("Нэвтрэх session идэвхжүүлж чадсангүй. Дахин оролдоно уу.")
        return
      }

      const token = await getToken({ skipCache: true })
      if (!token) {
        setError("Нэвтрэх session бэлэн болсонгүй. Дахин оролдоно уу.")
        return
      }

      const synced = await syncClerkSession(token)
      if (!synced.ok) {
        setError("Нэвтрэлт баталгаажсан ч системтэй холбож чадсангүй. Дахин оролдоно уу.")
        return
      }

      props.onDone(synced.user)
    } catch {
      setError("Нэвтрэх үед алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.")
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  async function changeEmail() {
    if (busy || fetchStatus === "fetching") return
    setError("")
    setNotice("")
    setCode("")
    setCooldown(0)
    await signIn.reset()
    setStep("email")
  }

  const disabled = busy || fetchStatus === "fetching"

  if (step === "verify") {
    return (
      <form onSubmit={verifyCode} className="grid gap-4">
        <p className="m-0 text-sm font-semibold text-[#1d6b42]">Таны имэйл рүү баталгаажуулах код илгээлээ.</p>
        <FloatingField
          label="Код"
          value={code}
          onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
        {notice ? <p className="m-0 text-sm font-semibold text-[#1d6b42]">{notice}</p> : null}
        {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
        <button className="btn btn-primary" disabled={disabled || code.length !== 6}>
          {disabled ? "Шалгаж байна..." : "Нэвтрэх"}
        </button>
        <button
          type="button"
          className="text-sm font-bold text-[#7d4d34] underline"
          onClick={() => void resendCode()}
          disabled={disabled || cooldown > 0}
        >
          {cooldown > 0 ? `Код дахин авах (${cooldown})` : "Код дахин авах"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => void changeEmail()} disabled={disabled}>
          Имэйлээ өөрчлөх
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={requestCode} className="grid gap-4">
      <FloatingField label="Имэйл" value={email} onChange={setEmail} type="email" autoComplete="email" required />
      {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
      <button className="btn btn-primary" disabled={disabled}>
        {disabled ? "Илгээж байна..." : "Код авах"}
      </button>
    </form>
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function clerkErrorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) return ""
  return typeof error.code === "string" ? error.code : ""
}

function emailDeliveryError(error: unknown): string {
  const code = clerkErrorCode(error)
  if (code === "form_identifier_not_found") {
    return "Энэ имэйлээр нэвтрэх боломжгүй байна. Бүртгэл үүсгэх эсвэл имэйлээ шалгана уу."
  }
  if (code === "too_many_requests" || code.includes("rate_limit")) {
    return "Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу."
  }
  return "Код илгээж чадсангүй. Имэйлээ шалгаад дахин оролдоно уу."
}

function emailCodeError(error: unknown): string {
  const code = clerkErrorCode(error)
  if (code.includes("expired")) return "Кодын хугацаа дууссан байна. Шинэ код авна уу."
  if (code === "too_many_requests" || code.includes("rate_limit") || code.includes("attempt")) {
    return "Хэт олон удаа оролдлоо. Түр хүлээгээд шинэ код авна уу."
  }
  return "Код буруу эсвэл хүчингүй байна. Дахин шалгана уу."
}
