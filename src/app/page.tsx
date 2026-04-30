import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Services from "../components/Services"
import WhyUs from "../components/WhyUs"
import Features from "../components/Features"
import Footer from "../components/Footer"
import { roleHomePath } from "../lib/role-path"
import { sessionCanAccessAdmin, sessionConfig, verifySessionToken } from "../lib/server/session"

export default async function Home(){
const cookieStore = await cookies()
const token = cookieStore.get(sessionConfig.name)?.value
const session = token ? verifySessionToken(token) : null

if (session && sessionCanAccessAdmin(session)) {
redirect(roleHomePath(session.roles))
}

return(

<>

<Navbar/>

<Hero/>

<Services/>

<WhyUs/>

<Features/>

<Footer/>

</>

)

}
