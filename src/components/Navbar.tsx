"use client"

import Image from "next/image"
import Link from "@/src/components/ui/TrackedLink"
import { Moon, Sun } from "lucide-react"
import { useState } from "react"

type Theme = "light" | "dark"

export default function Navbar() {
  const [theme, setTheme] = useState<Theme | null>(null)

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    const next: Theme = current === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    localStorage.setItem("bukht-theme", next)
    setTheme(next)
  }

  return (
    <header className="home-header">
      <div className="home-shell home-header__inner">
        <Link href="/" className="home-brand" aria-label="BUKHT нүүр хуудас">
          <Image src="/bukht-logo-full.png" alt="" width={64} height={64} priority />
          <span className="home-brand__copy">
            <strong>BUKHT</strong>
            <small>Trade, travel, cargo</small>
          </span>
        </Link>
        <div className="home-header__actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Цайвар горимд шилжих" : "Бараан горимд шилжих"}>
            <Moon aria-hidden="true" /><Sun aria-hidden="true" />
            <span className={theme === "dark" ? "is-dark" : ""} />
          </button>
          <Link href="/login" className="home-button home-button--outline">Нэвтрэх</Link>
          <Link href="/register" className="home-button home-button--accent">Бүртгүүлэх</Link>
        </div>
      </div>
    </header>
  )
}
