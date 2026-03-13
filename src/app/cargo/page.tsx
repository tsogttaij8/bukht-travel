import Navbar from "../../components/Navbar"
import CargoTracker from "../../components/CargoTrecker"
import Footer from "../../components/Footer"

export default function CargoPage(){

return(

<>

<Navbar/>

<div className="container">

<section className="section">
<h1 className="section-title">Карго / Тээвэр</h1>
<p className="section-subtitle" style={{marginBottom:24}}>
Хятадаас таталт, нэгтгэл, ачилт, хүргэлтийн процессыг ил тод tracking-р хянана.
</p>

<CargoTracker/>
</section>

</div>

<Footer/>

</>

)

}
