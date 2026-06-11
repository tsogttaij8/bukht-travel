import { cookies } from "next/headers"
import DeveloperDashboard from "../../components/DeveloperDashboard"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import ShopCatalog from "../../components/ShopCatalog"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

export const dynamic = "force-dynamic"

export default async function ShopPage(){
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null
  const isOwner = session?.roles.includes("owner") ?? false

  return(
    <>
      <Navbar/>
      <main className="section shop-page">
        <div className="container shop-page-shell">
          <section className="shop-section-block shop-section-shell">
            <div className="shop-section-head">
              <div>
                <h2 className="section-title" style={{ marginBottom: 10 }}>Онцлох бараанууд</h2>
              </div>
            </div>
            <ShopCatalog signedIn={Boolean(session)} />
          </section>
          {session && isOwner ? (
            <section style={{ marginTop: 28 }}>
              <DeveloperDashboard currentRoles={["owner"]} currentUser={{ name: session.name, email: session.email }} enabledTabs={["commerce"]} />
            </section>
          ) : null}
        </div>
      </main>
      <Footer/>
    </>
  )
}
