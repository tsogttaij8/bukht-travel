import OwnerWorkspaceShell from "@/src/app/owner/_components/OwnerWorkspaceShell"
import ShopMarketplace from "@/src/components/ShopMarketplace"
import { requireRole } from "@/src/lib/server/role-guard"
import { listProducts, type StoredProduct } from "@/src/lib/server/product-store"

export const dynamic = "force-dynamic"

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export default async function OwnerCommercePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>
}) {
  const session = await requireRole("owner")
  const scope = (await searchParams).scope === "mine" ? "mine" : "all"
  let products: StoredProduct[] = []
  let loadError = ""

  try {
    products = await listProducts()
    if (scope === "mine") {
      const ownerEmail = normalizeEmail(session.email)
      products = products.filter((product) => normalizeEmail(product.sellerEmail) === ownerEmail)
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Барааны мэдээлэл уншихад алдаа гарлаа."
    console.error("Failed to load Owner Commerce products", error)
  }

  return (
    <OwnerWorkspaceShell
      title="Худалдаа"
      description="Өөрийн бараа, зар болон худалдааны харилцан яриаг нэг дор удирдана."
      user={{ name: session.name, email: session.email }}
    >
      <div className="-m-6 max-sm:-m-4">
        <ShopMarketplace
          initialProducts={products}
          loadError={loadError}
          session={{ name: session.name, email: session.email }}
          basePath="/owner/commerce"
          initialScope={scope}
          showScopeControl
        />
      </div>
    </OwnerWorkspaceShell>
  )
}
