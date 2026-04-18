"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentUser, logoutUser, type SessionUser } from "../lib/auth"
import { primaryButton, shell } from "./ui/tw"

const navLinkClass =
  "rounded-full px-2.5 py-2 font-semibold text-[#3f342b] transition hover:text-[#9b8a78]"

export default function Navbar() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    getCurrentUser().then((currentUser) => {
      if (active) setUser(currentUser)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(225,207,183,0.82)] bg-[linear-gradient(180deg,rgba(250,246,240,0.94),rgba(250,246,240,0.74))] backdrop-blur-[16px]">
      <nav className={`${shell} flex items-center justify-between gap-4 py-4 max-sm:flex-wrap max-sm:py-3`}>
        <Link href="/" className="flex items-center">
          <div className="flex items-center gap-1">
            <div className="relative h-16 w-16 shrink-0">
              <Image
                src="/bukht-logo-full.png"
                alt="BUKHT logo"
                fill
                priority
                sizes="64px"
                style={{ objectFit: "contain", objectPosition: "center", mixBlendMode: "multiply" }}
              />
            </div>
            <div className="-ml-0.5 grid gap-0 leading-[0.98]">
              <strong className="font-[var(--font-heading)] text-[0.96rem] tracking-[0.08em]">BUKHT</strong>
              <span className="text-[0.8rem] text-[#6e6154]">Trade, travel, cargo</span>
            </div>
          </div>
        </Link>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Цэс нээх"
          onClick={() => setMenuOpen((current) => !current)}
          className="hidden rounded-[10px] border border-[rgba(190,179,164,0.7)] bg-[rgba(255,251,245,0.72)] px-3 py-2 font-bold text-[#1d1d1d] backdrop-blur-[14px] max-sm:inline-flex max-sm:items-center max-sm:justify-center max-sm:ml-auto"
        >
          {menuOpen ? "Хаах" : "Цэс"}
        </button>

        <div
          className={`flex items-center gap-[18px] text-[0.95rem] max-sm:w-full max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:px-0 ${
            menuOpen ? "max-sm:flex" : "max-sm:hidden"
          }`}
        >
          <Link href="/travel" className={navLinkClass}>Аялал</Link>
          <Link href="/shop" className={navLinkClass}>Худалдаа</Link>
          <Link href="/esim" className={navLinkClass}>eSIM</Link>
          <Link href="/cargo" className={navLinkClass}>Карго</Link>
          {user ? (
            <>
              <span className="rounded-full bg-[linear-gradient(180deg,rgba(244,225,196,0.92),rgba(255,244,226,0.82))] px-3 py-2 text-[0.84rem] font-bold text-[#6a513e]">
                {user.name} ({user.role})
              </span>
              <Link href="/account" className={navLinkClass}>Миний хуудас</Link>
              {user.role === "developer" ? <Link href="/developer" className={navLinkClass}>Хөгжүүлэгч</Link> : null}
              <button
                className={`${primaryButton} px-3 py-1.5 text-[0.85rem]`}
                onClick={async () => {
                  await logoutUser()
                  setUser(null)
                  setMenuOpen(false)
                }}
              >
                Гарах
              </button>
            </>
          ) : (
            <Link href="/login" className={navLinkClass}>Нэвтрэх</Link>
          )}
        </div>
      </nav>
    </header>
  )
}
