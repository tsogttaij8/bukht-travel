import { notFound } from "next/navigation"
import Footer from "../../../components/Footer"
import Navbar from "../../../components/Navbar"
import { pageSection, sectionSubtitle, sectionTitle, shell } from "../../../components/ui/tw"

type InfoPage = {
  title: string
  description: string
  points: string[]
}

const infoPages: Record<string, InfoPage> = {
  "bidnii-tuhai": {
    title: "Бидний тухай",
    description: "BUKHT нь Монгол хэрэглэгчдэд аялал, худалдаа, карго үйлчилгээний мэдээлэл болон захиалгыг нэг дор ойлгомжтой авахад туслах платформ.",
    points: [
      "Аяллын чиглэл, хөтөлбөр, үйлчилгээний мэдээллийг нэг дор харуулна.",
      "Хэрэглэгч хүсэлтээ илгээж, багтай холбогдох боломжтой.",
      "Цаашид owner талаас мэдээллээ шинэчилдэг бүтэцтэй болно.",
    ],
  },
  "web-uilchilgee": {
    title: "Веб үйлчилгээ",
    description: "Веб үйлчилгээний хэсэгт BUKHT платформоор дамжуулан авах боломжтой онлайн захиалга, хүсэлт, мэдээллийн урсгалыг тайлбарлана.",
    points: [
      "Аялал, карго, бизнес аяллын мэдээллийг вэб дээрээс харах.",
      "Account хэсгээр дамжуулан хүсэлт илгээх.",
      "Үйлчилгээний мэдээлэл owner талаас шинэчлэгдэх боломжтой.",
    ],
  },
  "uilchilgeenii-nuhtsul": {
    title: "Үйлчилгээний нөхцөл",
    description: "Энэ хэсэгт захиалга, төлбөр, цуцлалт, хэрэглэгчийн мэдээлэлтэй холбоотой үндсэн нөхцөлүүдийг тайлбарлана.",
    points: [
      "Захиалгын нөхцөл аяллын төрөл болон хугацаанаас хамаарч өөрчлөгдөж болно.",
      "Хэрэглэгч үнэн зөв холбоо барих мэдээлэл оруулах шаардлагатай.",
      "Дэлгэрэнгүй нөхцөлийг owner талаас баталгаажуулж шинэчилнэ.",
    ],
  },
  setgegdluud: {
    title: "Сэтгэгдлүүд",
    description: "Хэрэглэгчдийн аялал болон үйлчилгээ авсан туршлагын сэтгэгдлийг энд харуулна.",
    points: [
      "Бодит хэрэглэгчийн сэтгэгдэл, үнэлгээг байршуулна.",
      "Аяллын төрлөөр ялгаж харуулах боломжтой.",
      "Одоогийн сэтгэгдлийн мэдээллийг owner талаас нэмнэ.",
    ],
  },
  "aylal-herhen-zahialah": {
    title: "Аялал хэрхэн захиалах вэ",
    description: "Аялал захиалахдаа хэрэглэгч аяллын чиглэлээ сонгож, мэдээллээ бөглөөд BUKHT багтай баталгаажуулна.",
    points: [
      "Сонирхсон аяллын хөтөлбөр, үнэ, огноог шалгана.",
      "Account эсвэл аяллын хуудаснаас хүсэлт илгээнэ.",
      "Баг холбогдож огноо, төлбөр, нэмэлт хэрэгцээг баталгаажуулна.",
    ],
  },
  "business-aylal": {
    title: "Business аялал гэж юу вэ",
    description: "Business аялал нь бараа хайх, нийлүүлэгчтэй уулзах, зах болон үйлдвэрийн маршрутаар явах зорилготой аяллын төрөл.",
    points: [
      "Зах, showroom, үйлдвэр, нийлүүлэгчийн уулзалтыг төлөвлөнө.",
      "Худалдан авалт болон логистикийн дараагийн алхмыг ойлгомжтой болгоно.",
      "Бизнесийн хэрэгцээнд тааруулж маршрут болон хугацааг тохируулна.",
    ],
  },
  "baiguullagiin-huudas": {
    title: "Байгууллагын хуудас",
    description: "Байгууллагын хуудас нь баг, компани, reseller, group аяллын хэрэгцээнд зориулсан мэдээлэл авах хэсэг.",
    points: [
      "Байгууллагын аялал, сургалт, бизнес уулзалтын хэрэгцээг тодорхойлно.",
      "Оролцогчдын тоо, хугацаа, чиглэлээр санал гаргуулна.",
      "Дэлгэрэнгүй мэдээллийг owner талаас шинэчилж удирдана.",
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(infoPages).map((slug) => ({ slug }))
}

type InfoPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: InfoPageProps) {
  const { slug } = await params
  if (slug === "setgegdluud") {
    return {
      title: "Сэтгэгдлүүд | BUKHT",
      description: "Одоогоор сэтгэгдэл алга.",
    }
  }

  const page = infoPages[slug]
  return {
    title: page ? `${page.title} | BUKHT` : "BUKHT",
    description: page?.description ?? "BUKHT мэдээллийн хуудас",
  }
}

export default async function InfoPage({ params }: InfoPageProps) {
  const { slug } = await params
  const page = infoPages[slug]
  if (!page) notFound()
  const displayPage = slug === "setgegdluud"
    ? { title: "Сэтгэгдлүүд", description: "", points: ["Одоогоор сэтгэгдэл алга."] }
    : page

  return (
    <>
      <Navbar />
      <main className={pageSection}>
        <section className={`${shell} grid gap-6`}>
          <div className="max-w-[780px]">
            <h1 className={`${sectionTitle} m-0`}>{displayPage.title}</h1>
            {displayPage.description ? <p className={`${sectionSubtitle} mt-5 mb-0`}>{displayPage.description}</p> : null}
          </div>
          <div className="grid gap-3">
            {displayPage.points.map((point) => (
              <article key={point} className="rounded-[8px] border border-[rgba(226,209,183,0.82)] bg-[rgba(255,251,246,0.9)] p-5">
                <p className="m-0 text-[1rem] leading-7 text-[#4f473e]">{point}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
