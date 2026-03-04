"use client"

import { useRouter } from "next/navigation"

export default function Hero(){

const router = useRouter()

return(

<section className="container">

<h1 style={{fontSize:"48px"}}>

Хятад Монголыг холбосон
найдвартай платформ

</h1>

<p>

Аялал • Бараа захиалга • Карго

</p>

<div style={{marginTop:"20px"}}>

<button
className="btn"
onClick={()=>router.push("/shop")}
>

Бараа захиалах

</button>

</div>

</section>

)

}