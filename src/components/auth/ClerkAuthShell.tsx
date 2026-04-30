"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { syncClerkSession } from "../../lib/auth"
import { glassCard, pageSection, shell } from "../ui/tw"
import AuthModeSwitch from "./AuthModeSwitch"
import ClerkLoginForm from "./ClerkLoginForm"
import ClerkSignupForm from "./ClerkSignupForm"
import { AuthMode, loginTarget } from "./clerk-auth-utils"

export default function ClerkAuthShell() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "signup" : "login"
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loginEmail, setLoginEmail] = useState("")
  const [syncError, setSyncError] = useState("")
  const nextPath = searchParams.get("next")

  const goLanding = useCallback(() => {
    router.push(loginTarget(nextPath))
    router.refresh()
  }, [nextPath, router])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    let active = true
    syncClerkSession().then((result) => {
      if (!active) return
      if (result.ok) goLanding()
      else setSyncError(result.message)
    })

    return () => {
      active = false
    }
  }, [goLanding, isLoaded, isSignedIn])

  return (
    <main className={pageSection}>
      <div className={`${shell} max-w-[560px]`}>
        <section className={glassCard}>
          <AuthModeSwitch mode={mode} onChange={setMode} />
          {syncError ? <p className="m-0 mb-4 rounded-[10px] bg-[#fff0ed] p-3 font-semibold text-[#9a3412]">{syncError}</p> : null}
          {mode === "login" ? (
            <ClerkLoginForm initialEmail={loginEmail} onDone={goLanding} />
          ) : (
            <ClerkSignupForm onRegistered={(email) => {
              setLoginEmail(email)
              setMode("login")
            }} />
          )}
        </section>
      </div>
    </main>
  )
}
