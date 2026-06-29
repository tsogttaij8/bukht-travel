"use client"

import { useAuth, useClerk } from "@clerk/nextjs"
import { useSignIn } from "@clerk/nextjs/legacy"
import { useEffect, useState } from "react"
import { logoutUser, type SessionUser } from "../../lib/auth"
import { clerkMessage, isAlreadySignedInError, isStrongPassword, normalizeEmail } from "./clerk-auth-utils"
import { loginErrorMessage, syncActiveClerkSession } from "./clerk-login-helpers"
import { ResetEmailForm, ResetVerifyForm } from "./ClerkLoginResetForms"
import FloatingField from "./FloatingField"

type LoginStep = "login" | "resetEmail" | "resetVerify"

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function ClerkLoginForm(props: {
  initialEmail?: string
  onDone: (user?: SessionUser) => void
}) {
  const { signOut } = useClerk()
  const { getToken } = useAuth()
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
    if (!isLoaded || !signIn || busy) return

    setError("")
    setNotice("")
    setBusy(true)

    try {
      const activeSignIn = signIn

      await logoutUser()

      async function createClerkSession(): Promise<string> {
        const result = await activeSignIn.create({
          identifier: normalizeEmail(email),
          password,
        })

        if (result.status !== "complete" || !result.createdSessionId) {
          throw new Error("LOGIN_NOT_COMPLETE")
        }

        return result.createdSessionId
      }

      let sessionId: string

      try {
        sessionId = await createClerkSession()
      } catch (caught) {
        if (!isAlreadySignedInError(caught)) throw caught

        await signOut()
        await wait(500)
        await logoutUser()

        sessionId = await createClerkSession()
      }

      await setActive({ session: sessionId })

      const synced = await syncActiveClerkSession(() =>
        getToken({ skipCache: true })
      )

      if (!synced.ok) {
        throw new Error(
          synced.message === "SESSION_NOT_READY"
            ? "SESSION_NOT_READY"
            : "SYNC_FAILED"
        )
      }

      props.onDone(synced.user)
    } catch (caught) {
      if (caught instanceof Error && caught.message === "LOGIN_NOT_COMPLETE") {
        setError("Нэвтрэлт дууссангүй. Нууц үг болон мэйлээ шалгана уу.")
      } else {
        setError(loginErrorMessage(caught))
      }
    } finally {
      setBusy(false)
    }
  }

  async function startReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isLoaded || !signIn || busy) return
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
    if (!isLoaded || !signIn || busy) return
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
    if (!isLoaded || !signIn || busy) return
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
      <ResetEmailForm
        resetEmail={resetEmail}
        busy={busy}
        isLoaded={isLoaded}
        error={error}
        onResetEmail={setResetEmail}
        onSubmit={startReset}
        onBack={() => {
          setError("")
          setNotice("")
          setStep("login")
        }}
      />
    )
  }

  if (step === "resetVerify") {
    return (
      <ResetVerifyForm
        resetCode={resetCode}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        busy={busy}
        isLoaded={isLoaded}
        notice={notice}
        error={error}
        onResetCode={setResetCode}
        onNewPassword={setNewPassword}
        onConfirmPassword={setConfirmPassword}
        onSubmit={finishReset}
        onResend={resendResetCode}
        onChangeEmail={() => {
          setError("")
          setNotice("")
          setStep("resetEmail")
        }}
      />
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
