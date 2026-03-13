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

<header style={{position:"sticky",top:0,zIndex:30,background:"rgba(247,243,237,0.95)",backdropFilter:"blur(8px)",borderBottom:"1px solid #e8dece"}}>
  <nav className="container navbar-shell">
    <Link href="/" style={{display:"flex",alignItems:"center",gap:10}}>
      <div
        style={{
          position:"relative",
          width:86,
          height:46,
          overflow:"hidden",
          borderRadius:8
        }}
      >
        <Image
          src="/bukht-logo-full.png"
          alt="BUKHT logo"
          fill
          priority
          sizes="86px"
          style={{objectFit:"cover",objectPosition:"center 28%",mixBlendMode:"multiply"}}
        />
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

    <div className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
      <Link href="/">Нүүр</Link>
      <Link href="/travel">Аялал</Link>
      <Link href="/shop">Худалдаа</Link>
      <Link href="/esim">eSIM</Link>
      <Link href="/cargo">Карго</Link>

      {user ? (
        <>
          <span style={{color:"#5a4d40"}}>{user.name} ({user.role})</span>
          {user.role === "developer" ? <Link href="/developer">Developer</Link> : null}
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
