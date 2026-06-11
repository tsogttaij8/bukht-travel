"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useSignIn } from "@clerk/nextjs/legacy"
import { useEffect, useState } from "react"
import { logoutUser, syncClerkSession, type SessionUser } from "../../lib/auth"
import { clerkMessage, isAlreadySignedInError, isStrongPassword, normalizeEmail } from "./clerk-auth-utils"
import FloatingField from "./FloatingField"
import PasswordMeter from "./PasswordMeter"

type LoginStep = "login" | "resetEmail" | "resetVerify"

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForToken(getToken: () => Promise<string | null>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const token = await getToken()
    if (token) return token
    await wait(300)
  }

  throw new Error("SESSION_NOT_READY")
}

export default function ClerkLoginForm(props: { initialEmail?: string; onDone: (user?: SessionUser) => void }) {
  const { signOut } = useClerk()
  const { getToken, isSignedIn } = useAuth()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState(props.initialEmail ?? "")
  const [password, setPassword] = useState("")
  const [step, setStep] = useState<LoginStep>("login")
  const [resetEmail, setResetEmail] = useState(props.initialEmail ?? "")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (props.initialEmail) {
      setEmail(props.initialEmail)
      setResetEmail(props.initialEmail)
    }
  }, [props.initialEmail])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || busy) return
    setError("")
    setNotice("")
    setBusy(true)

    try {
      await logoutUser()
      if (isSignedIn) await signOut()

      const result = await signIn.create({ identifier: normalizeEmail(email), password })
      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Нэвтрэлт дууссангүй. Нууц үг болон мэйлээ шалгана уу.")
        return
      }

      await setActive({ session: result.createdSessionId })
      const synced = await syncActiveSession()
      if (!synced.ok) throw new Error(synced.message === "SESSION_NOT_READY" ? "SESSION_NOT_READY" : "SYNC_FAILED")
      props.onDone(synced.user)
    } catch (caught) {
      if (isAlreadySignedInError(caught)) {
        setError("Өмнөх нэвтрэлт бүрэн гараагүй байна. Дахин оролдоно уу.")
      } else {
        setError(loginErrorMessage(caught))
      }
    } finally {
      setBusy(false)
    }
  }

  async function syncActiveSession() {
    const token = await waitForToken(() => getToken({ skipCache: true }))
    return syncClerkSession(token)
  }

  function loginErrorMessage(error: unknown): string {
    const code = (error as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code
    if (code === "form_identifier_not_found" || code === "form_password_incorrect") return "Мэйл эсвэл нууц үг буруу байна."
    if (error instanceof Error && (error.message === "SESSION_NOT_READY" || error.message === "SYNC_FAILED")) {
      return "Нэвтрэлт баталгаажсан ч session/database sync амжилтгүй боллоо. Дахин оролдоно уу."
    }
    return clerkMessage(error)
  }

  async function startReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || busy) return
    setError("")
    setNotice("")

    const targetEmail = normalizeEmail(resetEmail)
    if (!targetEmail.includes("@")) return setError("Зөв мэйл хаяг оруулна уу.")

    setBusy(true)

    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: targetEmail })
      setNotice("Нууц үг сэргээх код мэйл рүү илгээгдлээ.")
      setStep("resetVerify")
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function resendResetCode() {
    if (!isLoaded || busy) return
    setError("")
    setNotice("")
    setBusy(true)

    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: normalizeEmail(resetEmail) })
      setNotice("Код дахин илгээгдлээ.")
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  async function finishReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || busy) return
    setError("")

    if (!isStrongPassword(newPassword)) return setError("Нууц үг бүх шаардлагыг хангах ёстой.")
    if (newPassword !== confirmPassword) return setError("Давтан оруулсан нууц үг таарахгүй байна.")

    setBusy(true)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      })

      if (result.status !== "complete") {
        setError("Нууц үг шинэчлэлт дуусаагүй байна. Кодоо шалгаад дахин оролдоно уу.")
        return
      }

      const targetEmail = normalizeEmail(resetEmail)
      setEmail(targetEmail)
      setPassword("")
      setResetEmail(targetEmail)
      setResetCode("")
      setNewPassword("")
      setConfirmPassword("")
      setNotice("Нууц үг шинэчлэгдлээ. Шинэ нууц үгээрээ нэвтэрнэ үү.")
      setStep("login")
    } catch (caught) {
      setError(clerkMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  if (step === "resetEmail") {
    return (
      <form onSubmit={startReset} className="grid gap-4">
        <FloatingField label="Мэйл хаяг" value={resetEmail} onChange={setResetEmail} type="email" autoComplete="email" required />
        {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
        <button className="btn btn-primary" disabled={busy || !isLoaded}>{busy ? "Илгээж байна..." : "Код авах"}</button>
        <button type="button" className="btn btn-secondary" onClick={() => {
          setError("")
          setNotice("")
          setStep("login")
        }}>
          Нэвтрэх рүү буцах
        </button>
      </form>
    )
  }

  if (step === "resetVerify") {
    return (
      <form onSubmit={finishReset} className="grid gap-4">
        <FloatingField label="Мэйлээр ирсэн код" value={resetCode} onChange={setResetCode} inputMode="numeric" autoComplete="one-time-code" required />
        <FloatingField label="Шинэ нууц үг" value={newPassword} onChange={setNewPassword} type="password" autoComplete="new-password" required />
        <FloatingField label="Шинэ нууц үг давтах" value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" required />
        <PasswordMeter password={newPassword} />
        {notice ? <p className="m-0 text-sm font-semibold text-[#1d6b42]">{notice}</p> : null}
        {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
        <button className="btn btn-primary" disabled={busy || !isLoaded}>{busy ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}</button>
        <button type="button" className="text-sm font-bold text-[#7d4d34] underline" onClick={resendResetCode} disabled={busy || !isLoaded}>
          Код дахин илгээх
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => {
          setError("")
          setNotice("")
          setStep("resetEmail")
        }}>
          Мэйл солих
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <FloatingField label="Мэйл хаяг" value={email} onChange={setEmail} type="email" autoComplete="email" required />
      <FloatingField label="Нууц үг" value={password} onChange={setPassword} type="password" autoComplete="current-password" required />
      {notice ? <p className="m-0 text-sm font-semibold text-[#1d6b42]">{notice}</p> : null}
      {error ? <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{error}</p> : null}
      <button className="btn btn-primary" disabled={busy || !isLoaded}>{busy ? "Нэвтрэлт баталгаажиж байна..." : "Нэвтрэх"}</button>
      <button type="button" className="text-sm font-bold text-[#7d4d34] underline" onClick={() => {
        setError("")
        setNotice("")
        setResetEmail(email)
        setStep("resetEmail")
      }}>
        Нууц үгээ мартсан уу?
      </button>
    </form>
  )
}
