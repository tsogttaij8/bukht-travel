"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import { sendLoginCode, verifyLoginCode, type LoginFlowMode } from "../../lib/auth"

export default function LoginPage(){
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
  const [mode, setMode] = useState<LoginFlowMode>(initialMode)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [verifyEmail, setVerifyEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"request" | "verify">("request")
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [infoMessage, setInfoMessage] = useState("")
  const nextPath = searchParams.get("next")

  function resolveNextPath(role?: "user" | "developer"): string {
    if (nextPath && nextPath.startsWith("/")) {
      return nextPath
    }

    return role === "developer" ? "/developer" : "/account"
  }

  async function onRequestCode(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError("")
    setDevCode(null)
    setInfoMessage("")

    const trimmedName = name.trim()
    if (!email.trim()) {
      setError("Имэйл оруулна уу")
      return
    }

    if (mode === "register" && !trimmedName) {
      setError("Нэрээ оруулна уу")
      return
    }

    const result = await sendLoginCode(email, trimmedName || undefined, mode)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setVerifyEmail(email.trim().toLowerCase())
    setStep("verify")
    if (result.devCode) setDevCode(result.devCode)
    if (result.message) {
      setInfoMessage(result.message)
    } else if (mode === "register") {
      setInfoMessage("Бүртгэл үүсгэх кодыг таны имэйл рүү илгээлээ. Inbox болон spam хавтсаа шалгана уу.")
    } else if (result.deliveryMode === "email") {
      setInfoMessage("Кодыг таны имэйл рүү илгээлээ. Inbox болон spam хавтсаа шалгана уу.")
    }
  }

  async function onVerifyCode(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError("")

    if (!code.trim()) {
      setError("Имэйл рүү очсон кодоо оруулна уу")
      return
    }

    const result = await verifyLoginCode(verifyEmail, code)

    if (!result.ok) {
      setError(result.message)
      return
    }

    router.push(resolveNextPath(result.user?.role))
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container" style={{maxWidth:560}}>
          <section className="card">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              <button
                type="button"
                className={mode === "login" ? "btn btn-primary" : "btn btn-secondary"}
                onClick={() => {
                  setMode("login")
                  setStep("request")
                  setError("")
                  setInfoMessage("")
                  setCode("")
                }}
              >
                Нэвтрэх
              </button>
              <button
                type="button"
                className={mode === "register" ? "btn btn-primary" : "btn btn-secondary"}
                onClick={() => {
                  setMode("register")
                  setStep("request")
                  setError("")
                  setInfoMessage("")
                  setCode("")
                }}
              >
                Бүртгүүлэх
              </button>
            </div>
            <h1 className="section-title" style={{marginBottom:10}}>
              {mode === "register" ? "Имэйлээр бүртгүүлэх" : "Имэйлээр нэвтрэх"}
            </h1>
            <p className="section-subtitle" style={{marginBottom:20}}>
              {mode === "register"
                ? "Нэр болон имэйлээ оруулаад код авна. Кодоо баталгаажуулмагц шинэ account үүсэж автоматаар нэвтэрнэ."
                : "Имэйл хаягаа оруулаад код авна. Хөгжүүлэгчийн имэйл бол developer эрхээр танигдана."}
            </p>
            <p className="section-subtitle" style={{marginBottom:20}}>
              Код ирэхгүй байвал spam хавтсаа шалгана уу. Имэйл илгээх тохиргоо хийгдээгүй үед түр dev код харагдана.
            </p>
            {infoMessage ? <p style={{margin:"0 0 20px",color:"#1d6b42",fontWeight:600}}>{infoMessage}</p> : null}

            {step === "request" ? (
              <>
                <form onSubmit={onRequestCode} style={{display:"grid",gap:12}}>
                  {mode === "register" ? (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Нэр"
                      className="admin-input"
                    />
                  ) : null}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Имэйл хаяг"
                    className="admin-input"
                  />

                  {error ? <p style={{margin:0,color:"#b42318",fontWeight:600}}>{error}</p> : null}
                  {devCode ? (
                    <p style={{margin:0,color:"#5e5448"}}>
                      DEV код: <strong>{devCode}</strong>
                    </p>
                  ) : null}

                  <button className="btn btn-primary" type="submit">
                    {mode === "register" ? "Бүртгэлийн код авах" : "Нэвтрэх код авах"}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={onVerifyCode} style={{display:"grid",gap:12}}>
                <input
                  type="email"
                  value={verifyEmail}
                  readOnly
                  className="admin-input"
                  style={{background:"#f8f4ed"}}
                />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 оронтой код"
                  className="admin-input"
                />

                {error ? <p style={{margin:0,color:"#b42318",fontWeight:600}}>{error}</p> : null}
                {devCode ? (
                  <p style={{margin:0,color:"#5e5448"}}>
                    DEV код: <strong>{devCode}</strong>
                  </p>
                ) : null}

                <button
                  className="btn btn-primary"
                  type="submit"
                >
                  {mode === "register" ? "Бүртгэлээ баталгаажуулах" : "Кодоор нэвтрэх"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setStep("request")
                    setCode("")
                    setError("")
                    setDevCode(null)
                    setInfoMessage("")
                  }}
                >
                  Буцах
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
