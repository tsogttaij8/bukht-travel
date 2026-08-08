"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "@/src/components/ui/TrackedLink"
import bukhtHeaderLogo from "../../public/bukht-header-logo.png"
import { Moon, Search, Sun } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { getCurrentUser, logoutUser, type SessionUser } from "../lib/auth"
import { useDismissibleLayer } from "./ui/useDismissibleLayer"
import { CommerceInboxButton } from "./commerce/CommerceInboxProvider"

type Theme = "light" | "dark"
type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error"

export default function Navbar({ showSearch = false }: { showSearch?: boolean }) {
  const { signOut } = useClerk()
  const { user: clerkUser } = useUser()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading")
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const closeAccountMenu = useCallback(() => setAccountOpen(false), [])

  useDismissibleLayer(accountMenuRef, accountOpen, closeAccountMenu)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((currentUser) => {
        if (!active) return
        setUser(currentUser)
        setSessionStatus(currentUser ? "authenticated" : "unauthenticated")
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        setSessionStatus("error")
      })
    return () => {
      active = false
    }
  }, [])

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    const next: Theme = current === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    localStorage.setItem("bukht-theme", next)
    setTheme(next)
  }

  async function logout() {
    setUser(null)
    setAccountOpen(false)
    try {
      await logoutUser()
      await signOut()
    } finally {
      window.location.replace("/login")
    }
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? user?.email ?? ""
  const initial = (email || "U").charAt(0).toUpperCase()

  return (
    <header className="home-header">
      <div className="home-shell home-header__inner">
        <Link href="/" className="home-brand" aria-label="BUKHT нүүр хуудас">
          <span className="home-brand__logo">
            <Image src={bukhtHeaderLogo} alt="" fill priority sizes="(max-width: 520px) 48px, 64px" />
          </span>
          <span className="home-brand__copy">
            <strong>BUKHT</strong>
            <small>Trade, travel, cargo</small>
          </span>
        </Link>
        {showSearch ? (
          <form className="detail-header-search" action="/shop" role="search">
            <label className="sr-only" htmlFor="detail-product-search">Бараа хайх</label>
            <input id="detail-product-search" name="search" placeholder="Бараа хайх..." />
            <button type="submit" aria-label="Хайх"><Search aria-hidden="true" /></button>
          </form>
        ) : null}
        <div className="home-header__actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Цайвар горимд шилжих" : "Бараан горимд шилжих"}>
            <Moon aria-hidden="true" /><Sun aria-hidden="true" />
            <span className={theme === "dark" ? "is-dark" : ""} />
          </button>
          {sessionStatus === "loading" || sessionStatus === "error" ? (
            <span
              className="home-account__skeleton"
              role="status"
              aria-label={sessionStatus === "error" ? "Хэрэглэгчийн мэдээлэл шинэчлэгдсэнгүй" : "Хэрэглэгчийн мэдээлэл ачаалж байна"}
            />
          ) : sessionStatus === "authenticated" && user ? (
            <div ref={accountMenuRef} className="home-account">
              <button
                type="button"
                className="home-account__trigger"
                title={email}
                aria-label="Хэрэглэгчийн цэс"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((current) => !current)}
              >
                {clerkUser?.imageUrl ? (
                  <span className="home-account__image" style={{ backgroundImage: `url(${clerkUser.imageUrl})` }} />
                ) : initial}
              </button>
              {accountOpen ? (
                <div className="home-account__menu">
                  <span className="home-account__email">{email}</span>
                  <Link href="/account" onClick={closeAccountMenu}>Хувийн мэдээлэл</Link>
                  <CommerceInboxButton className="home-account__chat" onOpen={closeAccountMenu} />
                  <Link href="/account/cart" onClick={closeAccountMenu}>Миний сагс</Link>
                  <button type="button" onClick={logout}>Гарах</button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/login" className="home-button home-button--outline">Нэвтрэх</Link>
              <Link href="/register" className="home-button home-button--accent">Бүртгүүлэх</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
