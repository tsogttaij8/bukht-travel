import { randomUUID } from "node:crypto"
import type { Conversation, ConversationMessage, MessageAttachment } from "../commerce-types"
import { getDb } from "./db"
import { getProduct } from "./product-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"
import { findUserByEmail } from "./user-store"

type ConversationRow = { id: string; product_id: string; buyer_email: string; seller_email: string }
type MessageRow = {
  id: string; sender_email: string; body: string | null; read_at: string | null; created_at: string; client_nonce: string | null
  attachment_path: string | null; original_filename: string | null; mime_type: string | null; attachment_size: number | null; width: number | null; height: number | null
}
export type MessageInput = { body?: string; attachmentPath?: string; originalFilename?: string; mimeType?: string; size?: number; width?: number; height?: number; clientNonce: string }
const messageSelect = "id,sender_email,body,read_at,created_at,client_nonce,attachment_path,original_filename,mime_type,attachment_size,width,height"

function mapMessage(row: MessageRow): ConversationMessage {
  const attachment: MessageAttachment | null = row.attachment_path ? { path: row.attachment_path, originalFilename: row.original_filename ?? "image", mimeType: row.mime_type ?? "application/octet-stream", size: row.attachment_size ?? 0, width: row.width, height: row.height } : null
  return { id: row.id, senderEmail: row.sender_email, body: row.body ?? "", readAt: row.read_at, createdAt: row.created_at, clientNonce: row.client_nonce, attachment }
}

export async function assertConversationMember(email: string, id: string): Promise<ConversationRow> {
  email = email.toLowerCase()
  if (isSupabaseEnabled()) {
    const { data, error } = await getSupabaseAdmin().from("conversations").select("id,product_id,buyer_email,seller_email").eq("id", id).maybeSingle()
    if (error) throw error
    if (!data || (data.buyer_email !== email && data.seller_email !== email)) throw new Error("NOT_FOUND")
    return data as ConversationRow
  }
  const db = await getDb()
  const result = await db.query<ConversationRow>("SELECT id,product_id,buyer_email,seller_email FROM conversations WHERE id=$1 AND (buyer_email=$2 OR seller_email=$2)", [id, email])
  if (!result.rows[0]) throw new Error("NOT_FOUND")
  return result.rows[0]
}

export async function openConversation(email: string, productId: string): Promise<Conversation> {
  email = email.toLowerCase(); const product = await getProduct(productId)
  if (!product) throw new Error("PRODUCT_UNAVAILABLE")
  const seller = product.sellerEmail.toLowerCase()
  if (!seller || seller === email) throw new Error("OWN_PRODUCT")
  let row: ConversationRow | undefined
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const existing = await supabase.from("conversations").select("id,product_id,buyer_email,seller_email").eq("product_id", productId).eq("buyer_email", email).eq("seller_email", seller).maybeSingle()
    if (existing.error) throw existing.error
    row = existing.data as ConversationRow | undefined
    if (!row) {
      const now = new Date().toISOString(); const created = { id: randomUUID(), product_id: productId, buyer_email: email, seller_email: seller, created_at: now, updated_at: now }
      const result = await supabase.from("conversations").insert(created).select("id,product_id,buyer_email,seller_email").single()
      if (result.error) throw result.error
      row = result.data as ConversationRow
    }
  } else {
    const db = await getDb(); const existing = await db.query<ConversationRow>("SELECT id,product_id,buyer_email,seller_email FROM conversations WHERE product_id=$1 AND buyer_email=$2 AND seller_email=$3", [productId, email, seller]); row = existing.rows[0]
    if (!row) { const now = new Date().toISOString(), id = randomUUID(); await db.query("INSERT INTO conversations(id,product_id,buyer_email,seller_email,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$5)", [id, productId, email, seller, now]); row = { id, product_id: productId, buyer_email: email, seller_email: seller } }
  }
  return readConversation(email, row.id)
}

export async function readConversation(email: string, id: string, after?: string): Promise<Conversation> {
  const row = await assertConversationMember(email, id); let messages: MessageRow[] = []
  if (isSupabaseEnabled()) {
    let query = getSupabaseAdmin().from("messages").select(messageSelect).eq("conversation_id", id).order("created_at").order("id")
    if (after) query = query.gte("created_at", after)
    const result = await query
    if (result.error) throw result.error
    messages = (result.data ?? []) as MessageRow[]
  } else {
    const db = await getDb(); const result = after
      ? await db.query<MessageRow>(`SELECT ${messageSelect} FROM messages WHERE conversation_id=$1 AND created_at>=$2 ORDER BY created_at,id`, [id, after])
      : await db.query<MessageRow>(`SELECT ${messageSelect} FROM messages WHERE conversation_id=$1 ORDER BY created_at,id`, [id])
    messages = result.rows
  }
  const product = await getProduct(row.product_id)
  return { id: row.id, productId: row.product_id, productName: product?.name ?? "Устсан бараа", productImageUrl: product?.imageUrl ?? "", productPrice: product?.price ?? "", sellerName: product?.sellerName ?? "", currentUserEmail: email.toLowerCase(), messages: messages.map(mapMessage) }
}

export async function sendMessage(email: string, id: string, input: MessageInput): Promise<ConversationMessage> {
  email = email.toLowerCase(); const body = input.body?.trim() ?? ""; const nonce = input.clientNonce?.trim() ?? ""
  if (!nonce || nonce.length > 100) throw new Error("INVALID_NONCE")
  if ((!body && !input.attachmentPath) || body.length > 2000) throw new Error("INVALID_MESSAGE")
  await assertConversationMember(email, id)
  if (input.attachmentPath) { const user = await findUserByEmail(email); if (!user) throw new Error("NOT_FOUND"); validateAttachmentInput(id, user.clerkUserId || user.id, input) }
  const now = new Date().toISOString(); const row = { id: randomUUID(), conversation_id: id, sender_email: email, body: body || null, attachment_path: input.attachmentPath ?? null, original_filename: input.originalFilename?.slice(0, 255) ?? null, mime_type: input.mimeType ?? null, attachment_size: input.size ?? null, width: input.width ?? null, height: input.height ?? null, client_nonce: nonce, read_at: null, created_at: now }
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin(); const existing = await supabase.from("messages").select(messageSelect).eq("sender_email", email).eq("client_nonce", nonce).maybeSingle()
    if (existing.error) throw existing.error
    if (existing.data) return mapMessage(existing.data as MessageRow)
    if (input.attachmentPath) await assertStorageObject(input.attachmentPath)
    const result = await supabase.from("messages").insert(row).select(messageSelect).single()
    if (result.error) { if (result.error.code === "23505") return findByNonce(email, nonce); throw result.error }
    await supabase.from("conversations").update({ updated_at: now, last_message_at: now }).eq("id", id)
    return mapMessage(result.data as MessageRow)
  }
  const db = await getDb(); const existing = await db.query<MessageRow>(`SELECT ${messageSelect} FROM messages WHERE sender_email=$1 AND client_nonce=$2`, [email, nonce]); if (existing.rows[0]) return mapMessage(existing.rows[0])
  await db.query(`INSERT INTO messages(id,conversation_id,sender_email,body,attachment_path,original_filename,mime_type,attachment_size,width,height,client_nonce,read_at,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL,$12)`, [row.id, id, email, row.body, row.attachment_path, row.original_filename, row.mime_type, row.attachment_size, row.width, row.height, nonce, now])
  await db.query("UPDATE conversations SET updated_at=$1,last_message_at=$1 WHERE id=$2", [now, id])
  return mapMessage(row as MessageRow)
}

async function findByNonce(email: string, nonce: string) { const result = await getSupabaseAdmin().from("messages").select(messageSelect).eq("sender_email", email).eq("client_nonce", nonce).single(); if (result.error) throw result.error; return mapMessage(result.data as MessageRow) }
function validateAttachmentInput(id: string, owner: string, input: MessageInput) { const safeOwner = owner.replace(/[^a-zA-Z0-9_-]/g, ""); if (!input.attachmentPath?.startsWith(`conversations/${id}/${safeOwner}/`) || !input.originalFilename?.trim() || !input.mimeType || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(input.mimeType) || !Number.isInteger(input.size) || (input.size ?? 0) < 1 || (input.size ?? 0) > 10 * 1024 * 1024) throw new Error("INVALID_ATTACHMENT") }
function chatBucket() { const bucket = process.env.SUPABASE_CHAT_BUCKET; if (!bucket) throw new Error("CHAT_STORAGE_NOT_CONFIGURED"); return bucket }
async function assertStorageObject(path: string) { const parts = path.split("/"); const name = parts.pop()!; const folder = parts.join("/"); const { data, error } = await getSupabaseAdmin().storage.from(chatBucket()).list(folder, { search: name, limit: 2 }); if (error || !data?.some((item) => item.name === name)) throw new Error("ATTACHMENT_NOT_UPLOADED") }
export async function createAttachmentReadUrl(email: string, id: string, path: string) { await assertConversationMember(email, id); if (!path.startsWith(`conversations/${id}/`)) throw new Error("INVALID_ATTACHMENT"); const { data, error } = await getSupabaseAdmin().storage.from(chatBucket()).createSignedUrl(path, 300); if (error) throw error; return { signedUrl: data.signedUrl, expiresIn: 300 } }
