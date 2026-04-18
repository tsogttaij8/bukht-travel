"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import LoginModeSwitch from "../../components/auth/LoginModeSwitch"
import RequestCodeForm from "../../components/auth/RequestCodeForm"
import VerifyCodeForm from "../../components/auth/VerifyCodeForm"
import { glassCard, pageSection, sectionSubtitle, sectionTitle, shell } from "../../components/ui/tw"
import { sendLoginCode, verifyLoginCode, type LoginFlowMode } from "../../lib/auth"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
  const nextPath = searchParams.get("next")
  const [mode, setMode] = useState<LoginFlowMode>(initialMode)
  const [step, setStep] = useState<"request" | "verify">("request")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [verifyEmail, setVerifyEmail] = useState("")
  const [code, setCode] = useState("")
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [infoMessage, setInfoMessage] = useState("")

  const resetState = (nextMode: LoginFlowMode) => {
    setMode(nextMode)
    setStep("request")
    setError("")
    setInfoMessage("")
    setCode("")
  }

  const resolveNextPath = (role?: "user" | "developer") =>
    nextPath && nextPath.startsWith("/") ? nextPath : role === "developer" ? "/developer" : "/account"

  async function onRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setDevCode(null)
    setInfoMessage("")

    const trimmedName = name.trim()
    if (!email.trim()) return setError("Имэйл оруулна уу")
    if (mode === "register" && !trimmedName) return setError("Нэрээ оруулна уу")

    const result = await sendLoginCode(email, trimmedName || undefined, mode)
    if (!result.ok) return setError(result.message)

    setVerifyEmail(email.trim().toLowerCase())
    setStep("verify")
    if (result.devCode) setDevCode(result.devCode)
    if (result.message) return setInfoMessage(result.message)
    setInfoMessage(
      mode === "register"
        ? "Бүртгэл үүсгэх кодыг таны имэйл рүү илгээлээ. Inbox болон spam хавтсаа шалгана уу."
        : result.deliveryMode === "email"
          ? "Кодыг таны имэйл рүү илгээлээ. Inbox болон spam хавтсаа шалгана уу."
          : ""
    )
  }

  async function onVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!code.trim()) return setError("Имэйл рүү очсон кодоо оруулна уу")

    const result = await verifyLoginCode(verifyEmail, code)
    if (!result.ok) return setError(result.message)
    router.push(resolveNextPath(result.user?.role))
  }

  return (
    <>
      <Navbar />
      <main className={pageSection}>
        <div className={`${shell} max-w-[560px]`}>
          <section className={glassCard}>
            <LoginModeSwitch mode={mode} onChange={resetState} />
            <h1 className={`${sectionTitle} mb-2.5`}>
              {mode === "register" ? "Имэйлээр бүртгүүлэх" : "Имэйлээр нэвтрэх"}
            </h1>
            <p className={`${sectionSubtitle} mb-5`}>
              {mode === "register"
                ? "Нэр болон имэйлээ оруулаад код авна. Кодоо баталгаажуулмагц шинэ account үүсэж автоматаар нэвтэрнэ."
                : "Имэйл хаягаа оруулаад код авна. Хөгжүүлэгчийн имэйл бол developer эрхээр танигдана."}
            </p>
            <p className={`${sectionSubtitle} mb-5`}>
              Код ирэхгүй байвал spam хавтсаа шалгана уу. Имэйл илгээх тохиргоо хийгдээгүй үед түр dev код харагдана.
            </p>
            {infoMessage ? <p className="mb-5 mt-0 font-semibold text-[#1d6b42]">{infoMessage}</p> : null}
            {step === "request" ? (
              <RequestCodeForm
                mode={mode}
                name={name}
                email={email}
                error={error}
                devCode={devCode}
                onNameChange={setName}
                onEmailChange={setEmail}
                onSubmit={onRequestCode}
              />
            ) : (
              <VerifyCodeForm
                mode={mode}
                code={code}
                devCode={devCode}
                error={error}
                verifyEmail={verifyEmail}
                onCodeChange={setCode}
                onSubmit={onVerifyCode}
                onBack={() => {
                  setStep("request")
                  setCode("")
                  setError("")
                  setDevCode(null)
                  setInfoMessage("")
                }}
              />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginPageContent /></Suspense>
}
