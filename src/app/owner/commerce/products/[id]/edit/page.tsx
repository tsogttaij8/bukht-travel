import { notFound } from "next/navigation"
import CommerceProductForm from "../../../../../../components/owner/commerce/CommerceProductForm"
import OwnerWorkspaceShell from "../../../../../../components/owner/OwnerWorkspaceShell"
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
