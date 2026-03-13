import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DeveloperDashboard from "../../components/DeveloperDashboard"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import { getShipmentTracking, listShipments } from "../../lib/server/shipment-store"
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

  const shipments = await listShipments()

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <h1 className="section-title">Developer Dashboard</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Сайн байна уу, {session.name}. Та хөгжүүлэгчийн эрхээр амжилттай нэвтэрлээ.
          </p>

          <DeveloperDashboard
            users={await readUsers()}
            shipments={await Promise.all(
              shipments.map(async (shipment) => {
                const tracking = await getShipmentTracking(shipment.trackingCode)
                return {
                  ...shipment,
                  events: tracking?.events ?? [],
                }
              })
            )}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
