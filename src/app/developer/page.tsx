import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DeveloperDashboard from "../../components/DeveloperDashboard"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { listProducts, type StoredProduct } from "../../lib/server/product-store"
import { listShipmentsWithEvents } from "../../lib/server/shipment-store"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"
import { readUsers } from "../../lib/server/user-store"

export default async function DeveloperPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value

  if (!token) {
    redirect("/login")
  }

  const session = verifySessionToken(token)

  if (!session || session.role !== "developer") {
    redirect("/login")
  }

  const shipments = await listShipmentsWithEvents()
  let products: StoredProduct[] = []
  let productLoadError = ""

  try {
    products = await listProducts()
  } catch (error) {
    productLoadError = error instanceof Error ? error.message : "Барааны мэдээлэл уншихад алдаа гарлаа."
    console.error("Failed to load developer products", error)
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <h1 className="section-title">Developer Dashboard</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Та хөгжүүлэгчийн эрхээр амжилттай нэвтэрлээ.
          </p>
          {productLoadError ? (
            <p className="section-subtitle" style={{ marginBottom: 24, color: "#b42318" }}>
              {productLoadError}
            </p>
          ) : null}

          <DeveloperDashboard
            users={await readUsers()}
            products={products}
            shipments={shipments.map((tracking) => ({
              ...tracking.shipment,
              events: tracking.events,
            }))}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
