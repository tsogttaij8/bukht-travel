import Footer from "../../../../components/Footer"
import Navbar from "../../../../components/Navbar"
import ProductDetailView from "../../../../components/ProductDetailView"
import { getProduct, listProducts } from "../../../../lib/server/product-store"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  let relatedProducts: Awaited<ReturnType<typeof listProducts>> = []
  try {
    const products = await listProducts()
    relatedProducts = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 5)
  } catch (error) {
    console.error("Failed to load related marketplace products", error)
  }

  return <><Navbar showSearch /><main className="product-detail-main"><ProductDetailView key={product.id} product={product} relatedProducts={relatedProducts} /></main><Footer /></>
}
