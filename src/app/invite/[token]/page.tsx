import Footer from "../../../components/Footer"
import InviteAcceptPanel from "../../../components/InviteAcceptPanel"
import Navbar from "../../../components/Navbar"

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <InviteAcceptPanel token={token} />
        </div>
      </main>
      <Footer />
    </>
  )
}
