import Link from "next/link"

export default function Navbar(){

return(

<nav style={{
display:"flex",
justifyContent:"space-between",
padding:"20px 40px",
background:"#8B5A2B",
color:"white"
}}>

<h2>BUKHT</h2>

<div style={{display:"flex",gap:"20px"}}>

<Link href="/">Home</Link>
<Link href="/travel">Travel</Link>
<Link href="/shop">Shop</Link>
<Link href="/cargo">Cargo</Link>

</div>

</nav>

)

}