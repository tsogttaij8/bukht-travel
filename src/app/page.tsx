import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import HomeDiscoverySections from "../components/HomeDiscoverySections"
import Footer from "../components/Footer"
import { roleHomePath } from "../lib/role-path"
import { listProducts, type StoredProduct } from "../lib/server/product-store"
import { sessionCanAccessAdmin, sessionConfig, verifySessionToken } from "../lib/server/session"
import { listTravelPackages, type StoredTravelPackage } from "../lib/server/travel-package-store"

export const dynamic = "force-dynamic"

export default async function Home(){
const cookieStore = await cookies()
const token = cookieStore.get(sessionConfig.name)?.value
const session = token ? verifySessionToken(token) : null
let travelPackages: StoredTravelPackage[] = []
let products: StoredProduct[] = []

try {
travelPackages = (await listTravelPackages()).filter((item) => item.status === "published")
} catch {
travelPackages = []
}

try {
products = await listProducts()
} catch {
products = []
}

if (session && sessionCanAccessAdmin(session)) {
redirect(roleHomePath(session.roles))
}

return(

<>

<Navbar/>

<Hero isLoggedIn={Boolean(session)}/>

<HomeDiscoverySections travelPackages={travelPackages} products={products}/>

<Footer/>

</>

)

}
