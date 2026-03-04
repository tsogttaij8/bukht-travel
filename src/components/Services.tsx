"use client"

import { useRouter } from "next/navigation"

export default function Services(){

const router = useRouter()

return(

<section className="container">

<h2>Үйлчилгээ</h2>

<div className="grid">

<div
className="card"
onClick={()=>router.push("/travel")}
>

<h3>Travel</h3>

<p>

Хятад руу аяллын зөвлөгөө
маршрут

</p>

</div>

<div
className="card"
onClick={()=>router.push("/shop")}
>

<h3>Commerce</h3>

<p>

Хятад бараа захиалга

</p>

</div>

<div
className="card"
onClick={()=>router.push("/cargo")}
>

<h3>Cargo</h3>

<p>

Карго tracking

</p>

</div>

</div>

</section>

)

}