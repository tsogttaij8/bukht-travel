"use client"

import { ArrowLeft, PackageX } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProductNotFound() {
  const router = useRouter()
  return <main className="product-detail-main"><section className="product-detail-not-found"><PackageX /><h1>Бүтээгдэхүүн олдсонгүй</h1><p>Энэ бүтээгдэхүүн устсан эсвэл одоогоор боломжгүй байна.</p><button onClick={() => window.history.length > 1 ? router.back() : router.push("/shop")}><ArrowLeft />Өмнөх</button></section></main>
}
