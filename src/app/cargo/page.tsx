"use client"

import { useState } from "react"

export default function CargoPage(){

const [code,setCode] = useState("")
const [result,setResult] = useState("")

function track(){

setResult("Таны илгээмж Бээжин агуулахад байна")

}

return(

<div className="container">

<h1>Cargo Tracking</h1>

<input

placeholder="Tracking code"

value={code}

onChange={(e)=>setCode(e.target.value)}

style={{
padding:"10px",
marginRight:"10px"
}}

/>

<button
className="btn"
onClick={track}
>

Шалгах

</button>

<p>{result}</p>

</div>

)

}