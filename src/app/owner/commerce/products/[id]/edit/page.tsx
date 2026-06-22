import { notFound } from "next/navigation"
import CommerceProductForm from "@/src/app/owner/shop/_components/CommerceProductForm"
import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import { getCommerceProduct } from "../../../../../../lib/server/commerce-store"
import { requireRole } from "../../../../../../lib/server/role-guard"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditCommerceProductPage({ params }: PageProps) {
  const session = await requireRole("owner")
  const { id } = await params
  const product = await getCommerceProduct(id)
  if (!product) notFound()

  return (
    <OwnerWorkspaceShell title="Бараа засах" description="" user={{ name: session.name, email: session.email }}>
      <CommerceProductForm product={product} />
    </OwnerWorkspaceShell>
  )
}
