import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AccountCart from "../../../components/AccountCart"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import { sessionConfig, verifySessionToken } from "../../../lib/server/session"

export const dynamic = "force-dynamic"

export default async function AccountCartPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value

  if (!token) {
    redirect(`/login?next=${encodeURIComponent("/account/cart")}`)
  }

  const session = verifySessionToken(token)

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/account/cart")}`)
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <h1 className="section-title">Миний сагс</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Захиалсан аялал болон барааны хүсэлтүүдээ нэг дор харна.
          </p>
          <AccountCart />
        </div>
      </main>
      <Footer />
    </>
  )
}
