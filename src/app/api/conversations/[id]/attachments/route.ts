import { createAttachmentReadUrl } from "../../../../../lib/server/chat-store"
import { commerceError, fail, ok } from "../../../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../../../lib/server/session"
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? ""); if (!session) return fail("UNAUTHORIZED", "Нэвтэрнэ үү.", 401); try { const path = new URL(request.url).searchParams.get("path") ?? ""; return ok(await createAttachmentReadUrl(session.email, (await params).id, path)) } catch (error) { return commerceError(error) } }
