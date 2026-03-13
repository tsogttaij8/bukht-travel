"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import { sendLoginCode, verifyLoginCode, type LoginFlowMode } from "../../lib/auth"

export default function LoginPage(){
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [verifyEmail, setVerifyEmail] = useState("")
  const [code, setCode] = useState("")
  const [mode, setMode] = useState<LoginFlowMode>("login")
  const [step, setStep] = useState<"request" | "verify">("request")
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function onRequestCode(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError("")
    setDevCode(null)

    if (!email.trim()) {
      setError("Имэйл оруулна уу")
      return
    }

    if (mode === "register" && !registerName.trim()) {
      setError("Бүртгүүлэхийн тулд нэр оруулна уу")
      return
    }

    const result = await sendLoginCode(email, mode === "register" ? registerName : undefined, mode)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setVerifyEmail(email.trim().toLowerCase())
    setStep("verify")
    if (result.devCode) setDevCode(result.devCode)
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

    router.push("/")
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container" style={{maxWidth:560}}>
          <section className="card">
            <h1 className="section-title" style={{marginBottom:10}}>Нэвтрэх</h1>
            <p className="section-subtitle" style={{marginBottom:20}}>
              Доор эхлээд бүртгүүлэх эсвэл нэвтрэхээ сонгоод, имэйл кодоор баталгаажуулна.
            </p>

            {step === "request" ? (
              <>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <button
                    className={`btn ${mode === "register" ? "btn-primary" : "btn-secondary"}`}
                    type="button"
                    onClick={() => {
                      setMode("register")
                      setError("")
                    }}
                  >
                    Эхлээд бүртгүүлэх
                  </button>
                  <button
                    className={`btn ${mode === "login" ? "btn-primary" : "btn-secondary"}`}
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setError("")
                    }}
                  >
                    Бүртгэлтэй нэвтрэх
                  </button>
                </div>

                <form onSubmit={onRequestCode} style={{display:"grid",gap:12}}>
                  {mode === "register" ? (
                    <input
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Нэр"
                      style={{padding:"12px 14px",border:"1px solid #d7cfbf",borderRadius:10,fontSize:15}}
                    />
                  ) : null}

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Имэйл"
                    style={{padding:"12px 14px",border:"1px solid #d7cfbf",borderRadius:10,fontSize:15}}
                  />

                  {error ? <p style={{margin:0,color:"#b42318",fontWeight:600}}>{error}</p> : null}
                  {devCode ? (
                    <p style={{margin:0,color:"#5e5448"}}>
                      DEV код: <strong>{devCode}</strong>
                    </p>
                  ) : null}

                  <button className="btn btn-primary" type="submit">Код илгээх</button>
                </form>
              </>
            ) : (
              <form onSubmit={onVerifyCode} style={{display:"grid",gap:12}}>
                <input
                  type="email"
                  value={verifyEmail}
                  readOnly
                  style={{padding:"12px 14px",border:"1px solid #d7cfbf",borderRadius:10,fontSize:15,background:"#f8f4ed"}}
                />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 оронтой код"
                  style={{padding:"12px 14px",border:"1px solid #d7cfbf",borderRadius:10,fontSize:15}}
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
                  Кодоор нэвтрэх
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setStep("request")
                    setCode("")
                    setError("")
                    setDevCode(null)
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
