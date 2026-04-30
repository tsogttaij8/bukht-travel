"use client"

import { Suspense } from "react"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import ClerkAuthShell from "../../components/auth/ClerkAuthShell"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Navbar />
      <ClerkAuthShell />
      <Footer />
    </Suspense>
  )
}
