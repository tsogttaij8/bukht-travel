import { randomUUID } from "node:crypto"
import { getSupabaseAdmin, isSupabaseEnabled } from "../../../../../lib/server/supabase"
import { assertConversationMember } from "../../../../../lib/server/chat-store"
import { findUserByEmail } from "../../../../../lib/server/user-store"
import { commerceError, fail, ok } from "../../../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../../../lib/server/session"

const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }
const maxBytes = 10 * 1024 * 1024
function bucket() { return process.env.SUPABASE_CHAT_BUCKET ?? "" }
function session(request: Request) { return readSessionFromCookieHeader(request.headers.get("cookie") ?? "") }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = session(request); if (!auth) return fail("UNAUTHORIZED", "Нэвтэрнэ үү.", 401)
  try {
    if (!isSupabaseEnabled() || !bucket()) return fail("CHAT_STORAGE_NOT_CONFIGURED", "Chat storage тохиргоо дутуу байна.", 503)
    const { id } = await params; await assertConversationMember(auth.email, id)
    const body = await request.json() as { filename?: string; mimeType?: string; size?: number }
    const extension = allowed[body.mimeType ?? ""]
    if (!extension || !Number.isInteger(body.size) || (body.size ?? 0) < 1 || (body.size ?? 0) > maxBytes || !body.filename?.trim()) return fail("INVALID_ATTACHMENT", "JPEG, PNG, WebP эсвэл GIF зураг 10 MB-аас бага байна.", 400)
    const user = await findUserByEmail(auth.email); if (!user) return fail("USER_NOT_FOUND", "Хэрэглэгч олдсонгүй.", 404)
    const owner = (user.clerkUserId || user.id).replace(/[^a-zA-Z0-9_-]/g, "")
    const path = `conversations/${id}/${owner}/${randomUUID()}.${extension}`
    const { data, error } = await getSupabaseAdmin().storage.from(bucket()).createSignedUploadUrl(path)
    if (error) throw error
    return ok({ path, token: data.token, signedUrl: data.signedUrl, bucket: bucket() }, 201)
  } catch (error) { return commerceError(error) }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = session(request); if (!auth) return fail("UNAUTHORIZED", "Нэвтэрнэ үү.", 401)
  try { const { id } = await params; await assertConversationMember(auth.email, id); const body = await request.json() as { path?: string }; if (!body.path?.startsWith(`conversations/${id}/`)) return fail("INVALID_ATTACHMENT", "Attachment path буруу байна.", 400); const supabase = getSupabaseAdmin(); const referenced = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("attachment_path", body.path); if (referenced.error) throw referenced.error; if ((referenced.count ?? 0) > 0) return ok({ removed: false, referenced: true }); const { error } = await supabase.storage.from(bucket()).remove([body.path]); if (error) throw error; return ok({ removed: true }) } catch (error) { return commerceError(error) }
}
