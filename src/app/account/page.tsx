import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AccountDashboard from "../../components/AccountDashboard"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

type AccountPageProps = {
  searchParams?: Promise<{ service?: string; title?: string }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = (await searchParams) ?? {}
  const nextPath = `/account${params.service || params.title ? `?${new URLSearchParams(
    Object.entries(params).filter(([, value]) => typeof value === "string" && value.length > 0) as Array<[string, string]>
  ).toString()}` : ""}`
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value

  if (!token) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  const session = verifySessionToken(token)

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <h1 className="section-title">Миний account</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Имэйлээр бүртгүүлсэн account-аараа бараа авах, cargo, eSIM, аяллын хүсэлтээ нэг дор удирдана.
          </p>
          <AccountDashboard initialServiceType={params.service} initialTitle={params.title} />
        </div>
      </main>
      <Footer />
    </>
  )
}
