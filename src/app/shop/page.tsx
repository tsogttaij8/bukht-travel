import { cookies } from "next/headers"
import Footer from "../../components/Footer"
import Navbar from "../../components/Navbar"
import ShopMarketplace from "../../components/ShopMarketplace"
import { listProducts, type StoredProduct } from "../../lib/server/product-store"
import { sessionConfig, verifySessionToken } from "../../lib/server/session"

export const dynamic = "force-dynamic"

export default async function ShopPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null

  let products: StoredProduct[] = []
  let loadError = ""

  try {
    products = await listProducts()
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Барааны мэдээлэл уншихад алдаа гарлаа."
    console.error("Failed to load shop products", error)
  }

  return (
    <>
      <Navbar />
      <main className="section shop-page">
        <ShopMarketplace
          initialProducts={products}
          loadError={loadError}
          session={session ? { name: session.name, email: session.email } : null}
        />
      </main>
      <Footer />
    </>
  )
}
