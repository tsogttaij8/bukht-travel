import { cookies } from "next/headers"
import Footer from "../../../../components/Footer"
import Navbar from "../../../../components/Navbar"
import ProductDetailView from "../../../../components/ProductDetailView"
import { getProduct, listProducts } from "../../../../lib/server/product-store"
import { sessionConfig, verifySessionToken } from "../../../../lib/server/session"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get(sessionConfig.name)?.value
  const session = token ? verifySessionToken(token) : null
  let relatedProducts: Awaited<ReturnType<typeof listProducts>> = []
  try {
    const products = await listProducts()
    relatedProducts = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 5)
  } catch (error) {
    console.error("Failed to load related marketplace products", error)
  }

  const accountPath = `/account?service=product_sourcing&title=${encodeURIComponent(product.name)}&returnTo=${encodeURIComponent(`/shop/products/${product.id}`)}`
  const contactPath = session ? accountPath : `/login?next=${encodeURIComponent(accountPath)}`

  return <><Navbar showSearch /><main className="product-detail-main"><ProductDetailView key={product.id} product={product} relatedProducts={relatedProducts} contactPath={contactPath} /></main><Footer /></>
}
