import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import FeaturedTravelPackages from "../components/FeaturedTravelPackages"
import Services from "../components/Services"
import WhyUs from "../components/WhyUs"
import Features from "../components/Features"
import Footer from "../components/Footer"
import { roleHomePath } from "../lib/role-path"
import { sessionCanAccessAdmin, sessionConfig, verifySessionToken } from "../lib/server/session"
import { listTravelPackages, type StoredTravelPackage } from "../lib/server/travel-package-store"

export default async function Home(){
const cookieStore = await cookies()
const token = cookieStore.get(sessionConfig.name)?.value
const session = token ? verifySessionToken(token) : null
let travelPackages: StoredTravelPackage[] = []

try {
travelPackages = await listTravelPackages()
} catch {
travelPackages = []
}

if (session && sessionCanAccessAdmin(session)) {
redirect(roleHomePath(session.roles))
}

return(

<>

<Navbar/>

<Hero isLoggedIn={Boolean(session)}/>

<FeaturedTravelPackages travelPackages={travelPackages}/>

<Services/>

<WhyUs/>

<Features/>

<Footer/>

</>

)

}
