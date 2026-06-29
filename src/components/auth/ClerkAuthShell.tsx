"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import type { SessionUser } from "../../lib/auth"
import { roleHomePath } from "../../lib/role-path"
import { glassCard, pageSection, shell } from "../ui/tw"
import AuthModeSwitch from "./AuthModeSwitch"
import ClerkLoginForm from "./ClerkLoginForm"
import ClerkSignupForm from "./ClerkSignupForm"
import { AuthMode, loginTarget } from "./clerk-auth-utils"

export default function ClerkAuthShell() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "signup" : "login"
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loginEmail, setLoginEmail] = useState("")
  const [syncError] = useState("")
  const nextPath = searchParams.get("next")

  const goLanding = useCallback((user?: SessionUser) => {
    const target =
      nextPath && nextPath.startsWith("/")
        ? loginTarget(nextPath)
        : roleHomePath(user?.roles)

    window.location.replace(target)
  }, [nextPath])

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
