"use client"

import { useClerk } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { LogOut, MessageSquare, Plane, Settings, Smartphone, Truck, UserRound, Users } from "lucide-react"
import { logoutUser } from "@/src/lib/auth"
import { useDismissibleLayer } from "@/src/components/ui/useDismissibleLayer"

const navItems = [
  { label: "Travel", href: "/owner/travel", icon: Plane },
  { label: "Cargo", href: "/owner/cargo", icon: Truck },
  { label: "eSIM", href: "/owner/esim", icon: Smartphone },
  { label: "Users", href: "/owner/users", icon: Users },
  { label: "Messages", href: "/owner/messages", icon: MessageSquare },
  { label: "Settings", href: "/owner/settings", icon: Settings },
]

export default function OwnerSidebar({ user }: { user?: { name: string; email: string } }) {
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [accountHovered, setAccountHovered] = useState(false)
  const [accountPinned, setAccountPinned] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const accountOpen = accountHovered || accountPinned
  const closeAccount = useCallback(() => {
    setAccountHovered(false)
    setAccountPinned(false)
  }, [])

  useDismissibleLayer(accountRef, accountOpen, closeAccount)

  async function logout(): Promise<void> {
    setLogoutBusy(true)
    await logoutUser()
    await signOut({ redirectUrl: "/" })
  }

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[260px] shrink-0 flex-col border-r border-[#e3d4bd] bg-[#fff8ef] px-4 py-5 text-[#2f241b] max-lg:h-auto max-lg:w-full max-lg:border-r-0 max-lg:border-b">
      <Link href="/owner" className="mb-5 border-b border-[#eadcca] px-2 pb-5">
        <div className="flex items-center gap-2">
          <div className="relative h-14 w-14 shrink-0">
            <Image src="/icon.jpeg" alt="BUKHT logo" fill priority sizes="56px" className="object-contain mix-blend-multiply" />
          </div>
          <div className="grid gap-0 leading-[0.98]">
            <strong className="font-[var(--font-heading)] text-[0.96rem] tracking-[0.08em] text-[#241a12]">BUKHT</strong>
            <span className="text-[0.8rem] font-semibold text-[#6e6154]">Trade, travel, cargo</span>
          </div>
        </div>
      </Link>

      <nav className="grid gap-1 max-lg:grid-cols-4 max-sm:grid-cols-2" aria-label="Owner workspace navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${active ? "bg-[#7d4d34] text-white shadow-sm" : "text-[#5f4b3d] hover:bg-[#fff0dd] hover:text-[#7d4d34]"}`}
              onClick={closeAccount}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {user ? (
        <div
          ref={accountRef}
          className="relative mt-auto pt-4 max-lg:mt-4"
          onMouseEnter={() => setAccountHovered(true)}
          onMouseLeave={() => setAccountHovered(false)}
        >
          {accountOpen ? (
            <div className="absolute bottom-full left-0 z-30 w-full rounded-t-lg border border-[#e3d4bd] bg-[#fffdf8] p-2 text-sm font-bold shadow-[0_18px_40px_rgba(55,39,25,0.14)]">
              <Link href="/owner/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-[#4f473e] hover:bg-[#fff0dd]" onClick={() => setAccountPinned(false)}>
                <UserRound size={15} />
                Account
              </Link>
              <Link href="/owner/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-[#4f473e] hover:bg-[#fff0dd]" onClick={() => setAccountPinned(false)}>
                <Settings size={15} />
                Settings
              </Link>
              <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#9a3412] hover:bg-[#fff0dd] disabled:opacity-60" disabled={logoutBusy} onClick={logout}>
                <LogOut size={15} />
                {logoutBusy ? "Logging out..." : "Logout"}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            aria-expanded={accountOpen}
            className={`flex w-full items-center gap-3 border border-[#e3d4bd] bg-[#fffdf8] p-3 text-left shadow-sm hover:bg-[#fff0dd] ${accountOpen ? "rounded-b-lg rounded-t-none border-t-0" : "rounded-lg"}`}
            onClick={() => setAccountPinned((current) => !current)}
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#d8c5ad] bg-[#fff8ef]">
              <Image src="/icon.jpeg" alt="Account" fill sizes="36px" className="object-contain mix-blend-multiply" />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-[#241a12]">{user.name}</strong>
              <span className="block truncate text-xs font-semibold text-[#7a6a5c]">{user.email}</span>
            </span>
          </button>
        </div>
      ) : null}
    </aside>
  )
}
