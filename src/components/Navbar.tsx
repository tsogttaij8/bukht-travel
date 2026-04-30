"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { getCurrentUser, logoutUser, type SessionUser } from "../lib/auth"
import { shell } from "./ui/tw"

const navLinkClass =
  "rounded-full px-2.5 py-2 font-semibold text-[#3f342b] transition-colors duration-200 ease-out hover:text-[#cdbda9]"

export default function Navbar() {
  const { signOut } = useClerk()
  const { user: clerkUser } = useUser()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [headerHidden, setHeaderHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    let active = true
    getCurrentUser().then((currentUser) => {
      if (active) setUser(currentUser)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      window.requestAnimationFrame(() => {
        const diff = window.scrollY - lastScrollY.current
        if (window.scrollY <= 8) setHeaderHidden(false)
        else if (Math.abs(diff) > 6) setHeaderHidden(diff > 0)
        lastScrollY.current = window.scrollY
        ticking.current = false
      })
    }
    lastScrollY.current = window.scrollY
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  async function logout() {
    await logoutUser()
    await signOut()
    setUser(null)
    setAccountOpen(false)
    setMenuOpen(false)
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? user?.email ?? ""
  const initial = (email || "U").charAt(0).toUpperCase()

  return (
    <header className={`sticky top-0 z-30 border-b border-[rgba(225,207,183,0.82)] bg-[linear-gradient(180deg,rgba(250,246,240,0.94),rgba(250,246,240,0.74))] backdrop-blur-[16px] transition-transform duration-300 ${headerHidden && !menuOpen ? "-translate-y-full" : "translate-y-0"}`}>
      <nav className={`${shell} flex items-center justify-between gap-4 py-4 max-sm:flex-wrap max-sm:py-3`}>
        <Logo />
        <button type="button" aria-expanded={menuOpen} aria-label="Цэс нээх" onClick={() => setMenuOpen((current) => !current)} className="hidden rounded-[10px] border border-[rgba(190,179,164,0.7)] bg-[rgba(255,251,245,0.72)] px-3 py-2 font-bold text-[#1d1d1d] max-sm:inline-flex max-sm:ml-auto">
          {menuOpen ? "Хаах" : "Цэс"}
        </button>
        <div className={`flex items-center gap-[18px] text-[0.95rem] max-sm:w-full max-sm:flex-col max-sm:items-start max-sm:gap-3 ${menuOpen ? "max-sm:flex" : "max-sm:hidden"}`}>
          <Link href="/travel" className={navLinkClass}>Аялал</Link>
          <Link href="/shop" className={navLinkClass}>Худалдаа</Link>
          <Link href="/esim" className={navLinkClass}>eSIM</Link>
          <Link href="/cargo" className={navLinkClass}>Карго</Link>
          {user ? <AccountMenu email={email} initial={initial} imageUrl={clerkUser?.imageUrl} open={accountOpen} onToggle={() => setAccountOpen((current) => !current)} onLogout={logout} /> : null}
        </div>
      </nav>
    </header>
  )
}

function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="flex items-center gap-1">
        <div className="relative h-16 w-16 shrink-0">
          <Image src="/bukht-logo-full.png" alt="BUKHT logo" fill priority sizes="64px" style={{ objectFit: "contain", objectPosition: "center", mixBlendMode: "multiply" }} />
        </div>
        <div className="-ml-0.5 grid gap-0 leading-[0.98]">
          <strong className="font-[var(--font-heading)] text-[0.96rem] tracking-[0.08em]">BUKHT</strong>
          <span className="text-[0.8rem] text-[#6e6154]">Trade, travel, cargo</span>
        </div>
      </div>
    </Link>
  )
}

function AccountMenu(props: { email: string; initial: string; imageUrl?: string; open: boolean; onToggle: () => void; onLogout: () => void }) {
  return (
    <div className="relative">
      <button type="button" onClick={props.onToggle} className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-[#d8c5ad] bg-[#7d4d34] text-sm font-extrabold text-white shadow-sm" title={props.email}>
        {props.imageUrl ? <span aria-label="Account" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${props.imageUrl})` }} /> : props.initial}
      </button>
      {props.open ? (
        <div className="absolute right-0 top-13 z-40 grid min-w-[220px] gap-1 rounded-[12px] border border-[#eadcca] bg-white p-2 text-sm font-bold shadow-[0_18px_40px_rgba(55,39,25,0.16)]">
          <span className="truncate px-3 py-2 text-xs text-[#7a6a5c]">{props.email}</span>
          <Link href="/account?tab=orders" className="rounded-[8px] px-3 py-2 text-[#2f2a25] hover:bg-[#fff5e8]">Миний захиалга</Link>
          <Link href="/account" className="rounded-[8px] px-3 py-2 text-[#2f2a25] hover:bg-[#fff5e8]">Миний булан</Link>
          <Link href="/shop?cart=1" className="rounded-[8px] px-3 py-2 text-[#2f2a25] hover:bg-[#fff5e8]">Миний сагс</Link>
          <button type="button" onClick={props.onLogout} className="rounded-[8px] px-3 py-2 text-left text-[#9a3412] hover:bg-[#fff0ed]">Гарах</button>
        </div>
      ) : null}
    </div>
  )
}
