"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentUser, logoutUser, type SessionUser } from "../lib/auth"

export default function Navbar(){
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

return(

<header className="site-header">
  <nav className="container navbar-shell">
    <Link href="/" className="navbar-brand">
      <div className="navbar-logo-wrap">
        <Image
          src="/bukht-logo-full.png"
          alt="BUKHT logo"
          fill
          priority
          sizes="86px"
          style={{objectFit:"cover",objectPosition:"center 28%",mixBlendMode:"multiply"}}
        />
      </div>
      <div className="navbar-brand-copy">
        <strong>BUKHT</strong>
        <span>Trade, travel, cargo</span>
      </div>
    </Link>

    <button
      type="button"
      className="navbar-toggle"
      aria-expanded={menuOpen}
      aria-label="Цэс нээх"
      onClick={() => setMenuOpen((current) => !current)}
    >
      {menuOpen ? "Хаах" : "Цэс"}
    </button>

    <div className={`navbar-links navbar-links-shell ${menuOpen ? "is-open" : ""}`}>
      <Link href="/">Нүүр</Link>
      <Link href="/travel">Аялал</Link>
      <Link href="/shop">Худалдаа</Link>
      <Link href="/esim">eSIM</Link>
      <Link href="/cargo">Карго</Link>

      {user ? (
        <>
          <span className="navbar-user-pill">{user.name} ({user.role})</span>
          <Link href="/account">Миний хуудас</Link>
          {user.role === "developer" ? <Link href="/developer">Хөгжүүлэгч</Link> : null}
          <button
            className="btn btn-secondary"
            style={{padding:"6px 12px",fontSize:"0.85rem"}}
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
        <>
          <Link href="/login">Нэвтрэх</Link>
        </>
      )}
    </div>
  </nav>
</header>

)

}
