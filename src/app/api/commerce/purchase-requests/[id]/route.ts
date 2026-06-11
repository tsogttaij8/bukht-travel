import { NextResponse } from "next/server"
import { updateCommercePurchaseRequest, type CommercePurchaseRequestStatus } from "../../../../../lib/server/commerce-store"
import { readSessionFromCookieHeader, sessionHasAnyRole } from "../../../../../lib/server/session"

export const dynamic = "force-dynamic"

type Context = {
  params: Promise<{ id: string }>
}

function ensureStaff(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  return session && sessionHasAnyRole(session, ["owner", "cargo_staff", "support_staff"])
    ? null
    : NextResponse.json({ message: "Forbidden" }, { status: 403 })
}

export async function PATCH(request: Request, context: Context): Promise<NextResponse> {
  const denied = ensureStaff(request)
  if (denied) return denied

  const { id } = await context.params
  const body = await request.json() as { status?: CommercePurchaseRequestStatus }
  if (!body.status || !["pending", "accepted", "rejected"].includes(body.status)) {
    return NextResponse.json({ message: "Valid status is required." }, { status: 400 })
  }

  try {
    const purchaseRequest = await updateCommercePurchaseRequest(id, body.status)
    return purchaseRequest ? NextResponse.json({ request: purchaseRequest }, { status: 200 }) : NextResponse.json({ message: "Purchase request not found." }, { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update purchase request."
    return NextResponse.json({ message }, { status: 500 })
  }
}
