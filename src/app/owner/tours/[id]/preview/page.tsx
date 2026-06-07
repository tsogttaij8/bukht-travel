import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LegacyOwnerTourPreviewPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/owner/travel/tours/${encodeURIComponent(id)}/preview`)
}
