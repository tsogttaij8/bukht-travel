import { NextResponse } from "next/server"
import { listProducts } from "../../../../lib/server/product-store"
import { readSessionFromCookieHeader, sessionHasAnyRole } from "../../../../lib/server/session"

function ensureAdminViewer(request: Request): NextResponse | null {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")

  if (!session || !sessionHasAnyRole(session, ["owner", "cargo_staff"])) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = ensureAdminViewer(request)
  if (denied) return denied

  try {
    return NextResponse.json({ products: await listProducts() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Барааны жагсаалт уншихад алдаа гарлаа."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = ensureAdminViewer(request)
  if (denied) return denied

  return NextResponse.json({ message: "Admin талаас бараа нэмэхгүй. Хэрэглэгч shop дээрээс пост нийтэлнэ." }, { status: 405 })
}
