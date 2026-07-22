"use client"

import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import { ImagePlus, LoaderCircle, MessageCircle, RefreshCw, Send, Trash2, WifiOff, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ApiResult, Conversation, ConversationMessage } from "../../lib/commerce-types"
import { CHAT_EVENT, conversationTopic } from "../../lib/chat-realtime"
import { createBrowserSupabase } from "../../lib/supabase-browser"
import { CHAT_ATTACHMENT_ACCEPT, CHAT_VIDEO_MAX_DURATION_SECONDS, attachmentKind, attachmentMaxBytes, isAllowedAttachment } from "../../lib/chat-attachments"

type ConnectionState = "connecting" | "connected" | "disconnected"
type AttachmentFile = File & { mediaWidth?: number; mediaHeight?: number; durationSeconds?: number }
type PendingImage = { file: AttachmentFile; previewUrl: string }
type FailedSend = { body: string; image: AttachmentFile | null; nonce: string }
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const maxBytes = 10 * 1024 * 1024

function readVideoMetadata(url: string): Promise<{ width: number; height: number; durationSeconds: number }> { return new Promise((resolve, reject) => { const video = document.createElement("video"); video.preload = "metadata"; video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight, durationSeconds: video.duration }); video.onerror = () => reject(new Error("Видео файлыг уншиж чадсангүй.")); video.src = url }) }

async function api<T>(response: Response): Promise<ApiResult<T>> { return response.json() as Promise<ApiResult<T>> }
function mergeMessages(current: ConversationMessage[], incoming: ConversationMessage[]) {
  const byKey = new Map<string, ConversationMessage>()
  for (const message of [...current, ...incoming]) byKey.set(message.id || message.clientNonce || crypto.randomUUID(), message)
  return Array.from(byKey.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

export function ChatButton({ productId }: { productId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("")
  const opening = useRef(false)
  const open = useCallback(async () => {
    if (opening.current) return; opening.current = true; setLoading(true); setError("")
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) })
      if (response.status === 401) { const next = `${window.location.pathname}?chatProduct=${encodeURIComponent(productId)}`; window.location.href = `/login?next=${encodeURIComponent(next)}`; return }
      const body = await api<Conversation>(response); if (body.success) setConversation(body.data); else setError(body.error.message)
    } catch { setError("Чат нээхэд алдаа гарлаа.") } finally { opening.current = false; setLoading(false) }
  }, [productId])
  useEffect(() => { if (new URLSearchParams(window.location.search).get("chatProduct") === productId) void open() }, [productId, open])
  return <><button className="product-summary__chat" type="button" onClick={() => void open()} disabled={loading}>{loading ? <LoaderCircle className="is-spinning" /> : <MessageCircle />}Чатлах</button>{error ? <span className="commerce-inline-error">{error}</span> : null}{conversation ? <ChatPanel initial={conversation} close={() => setConversation(null)} /> : null}</>
}

function ChatPanel({ initial, close }: { initial: Conversation; close: () => void }) {
  const { getToken, isSignedIn } = useAuth()
  const supabase = useMemo(() => createBrowserSupabase(() => getToken()), [getToken])
  const [conversation, setConversation] = useState(initial), [text, setText] = useState(""), [sending, setSending] = useState(false), [error, setError] = useState("")
  const [connection, setConnection] = useState<ConnectionState>("connecting"), [image, setImage] = useState<PendingImage | null>(null), [failed, setFailed] = useState<FailedSend | null>(null)
  const end = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null), composing = useRef(false), cursor = useRef(initial.messages.at(-1)?.createdAt ?? "")
  useEffect(() => { fileInput.current?.setAttribute("accept", CHAT_ATTACHMENT_ACCEPT) }, [])
  const merge = useCallback((incoming: ConversationMessage[]) => setConversation((current) => ({ ...current, messages: mergeMessages(current.messages, incoming) })), [])
  const reconcile = useCallback(async () => {
    const query = cursor.current ? `?after=${encodeURIComponent(cursor.current)}` : ""
    const response = await fetch(`/api/conversations/${initial.id}/messages${query}`, { cache: "no-store" }); const body = await api<Conversation>(response)
    if (!body.success) throw new Error(body.error.message)
    merge(body.data.messages); const latest = body.data.messages.at(-1)?.createdAt; if (latest && latest > cursor.current) cursor.current = latest
  }, [initial.id, merge])

  useEffect(() => { end.current?.scrollIntoView() }, [conversation.messages.length])
  useEffect(() => () => { if (image) URL.revokeObjectURL(image.previewUrl) }, [image])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close() }; document.addEventListener("keydown", escape)
    return () => document.removeEventListener("keydown", escape)
  }, [close])
  useEffect(() => {
    if (!supabase || !isSignedIn) { setConnection("disconnected"); return }
    let active = true
    const channel = supabase.channel(conversationTopic(initial.id), { config: { private: true, broadcast: { self: false } } })
      .on("broadcast", { event: CHAT_EVENT }, () => { if (active) void reconcile().catch(() => setConnection("disconnected")) })
    void getToken().then(async (token) => {
      if (!active || !token) { setConnection("disconnected"); return }
      await supabase.realtime.setAuth(token)
      channel.subscribe((status) => {
        if (!active) return
        if (status === "SUBSCRIBED") { setConnection("connected"); void reconcile().catch(() => setConnection("disconnected")) }
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnection("disconnected")
        else setConnection("connecting")
      })
    }).catch(() => setConnection("disconnected"))
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [getToken, initial.id, isSignedIn, reconcile, supabase])

  async function chooseFile(file: AttachmentFile | undefined) {
    setError("")
    if (!file) return
    if (attachmentKind(file.type) === "video") {
      if (!isAllowedAttachment(file.type) || file.size > attachmentMaxBytes(file.type)) { setError("Видео 50 MB-аас бага байна."); return }
      const previewUrl = URL.createObjectURL(file)
      try { const metadata = await readVideoMetadata(previewUrl); if (metadata.durationSeconds > CHAT_VIDEO_MAX_DURATION_SECONDS) throw new Error("Видео 60 секундээс урт байж болохгүй."); file.mediaWidth = metadata.width; file.mediaHeight = metadata.height; file.durationSeconds = metadata.durationSeconds; setImage((current) => { if (current) URL.revokeObjectURL(current.previewUrl); return { file, previewUrl } }) } catch (cause) { URL.revokeObjectURL(previewUrl); setError(cause instanceof Error ? cause.message : "Видео буруу байна.") }
      return
    }
    if (!allowedTypes.has(file.type) || file.size > maxBytes) { setError("JPEG, PNG, WebP эсвэл GIF зураг 10 MB-аас бага байна."); return }
    setImage((current) => { if (current) URL.revokeObjectURL(current.previewUrl); return { file, previewUrl: URL.createObjectURL(file) } })
  }
  function clearImage() { setImage((current) => { if (current) URL.revokeObjectURL(current.previewUrl); return null }); if (fileInput.current) fileInput.current.value = "" }

  async function uploadAttachment(file: File) {
    if (!supabase) throw new Error("Browser Supabase тохиргоо дутуу байна.")
    const intentResponse = await fetch(`/api/conversations/${conversation.id}/upload-intent`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, mimeType: file.type, size: file.size }) })
    const intent = await api<{ path: string; token: string; bucket: string }>(intentResponse); if (!intent.success) throw new Error(intent.error.message)
    const result = await supabase.storage.from(intent.data.bucket).uploadToSignedUrl(intent.data.path, intent.data.token, file, { contentType: file.type, upsert: false })
    if (result.error) throw result.error
    return intent.data.path
  }
  async function cleanup(path: string) { await fetch(`/api/conversations/${conversation.id}/upload-intent`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }).catch(() => undefined) }
  async function send(draft?: FailedSend) {
    const bodyText = draft?.body ?? text.trim(), attachmentFile = draft?.image ?? image?.file ?? null, nonce = draft?.nonce ?? crypto.randomUUID()
    if ((!bodyText && !attachmentFile) || sending) return
    setSending(true); setError(""); let attachmentPath = ""
    try {
      if (attachmentFile) attachmentPath = await uploadAttachment(attachmentFile)
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: bodyText || undefined, attachmentPath: attachmentPath || undefined, originalFilename: attachmentFile?.name, mimeType: attachmentFile?.type, size: attachmentFile?.size, width: attachmentFile?.mediaWidth, height: attachmentFile?.mediaHeight, durationSeconds: attachmentFile?.durationSeconds, clientNonce: nonce }) })
      const result = await api<ConversationMessage>(response); if (!result.success) throw new Error(result.error.message)
      merge([result.data]); cursor.current = result.data.createdAt > cursor.current ? result.data.createdAt : cursor.current; setText(""); clearImage(); setFailed(null)
    } catch (cause) { if (attachmentPath) await cleanup(attachmentPath); setError(cause instanceof Error ? cause.message : "Зурвас илгээсэнгүй."); setFailed({ body: bodyText, image: attachmentFile, nonce }) } finally { setSending(false) }
  }

  return <section className="commerce-chat" role="dialog" aria-modal="true" aria-label="Барааны чат">
    <header><div><strong>{conversation.productName}</strong><span>{conversation.productPrice} · {conversation.sellerName}</span></div>{connection !== "connected" ? <span className="commerce-connection"><WifiOff />{connection === "connecting" ? "Холбогдож байна" : "Холболт тасарсан"}</span> : null}<button onClick={close} aria-label="Чат хаах"><X /></button></header>
    <div className="commerce-messages">{conversation.messages.length ? conversation.messages.map((message) => <MessageBubble key={message.id} conversationId={conversation.id} message={message} mine={message.senderEmail === conversation.currentUserEmail} />) : <p className="commerce-chat-empty">Барааны талаар асуух зүйлээ бичнэ үү.</p>}<div ref={end} /></div>
    {image ? <div className="commerce-image-preview"><Image src={image.previewUrl} alt="Илгээх зураг" width={48} height={48} unoptimized /><span>{image.file.name}</span><button onClick={clearImage} aria-label="Зураг арилгах"><Trash2 /></button></div> : null}
    {error ? <p className="commerce-chat-error">{error}{failed ? <button onClick={() => void send(failed)} disabled={sending}><RefreshCw />Дахин илгээх</button> : null}</p> : null}
    <form onSubmit={(event) => { event.preventDefault(); void send() }}><input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseFile(event.target.files?.[0])} /><button type="button" className="commerce-attach" onClick={() => fileInput.current?.click()} disabled={sending} aria-label="Зураг хавсаргах"><ImagePlus /></button><textarea value={text} onChange={(event) => setText(event.target.value)} onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !composing.current) { event.preventDefault(); void send() } }} maxLength={2000} placeholder="Зурвас бичих..." rows={1} /><button disabled={(!text.trim() && !image) || sending} aria-label="Илгээх">{sending ? <LoaderCircle className="is-spinning" /> : <Send />}</button></form>
  </section>
}

function MessageBubble({ conversationId, message, mine }: { conversationId: string; message: ConversationMessage; mine: boolean }) {
  return <div className={mine ? "is-mine" : ""}>{message.attachment ? message.attachment.kind === "video" ? <AttachmentVideo conversationId={conversationId} path={message.attachment.path} /> : <AttachmentImage conversationId={conversationId} path={message.attachment.path} alt={message.attachment.originalFilename} /> : null}{message.body ? <p>{message.body}</p> : null}<time>{new Intl.DateTimeFormat("mn-MN", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time></div>
}
function AttachmentVideo({ conversationId, path }: { conversationId: string; path: string }) {
  const [url, setUrl] = useState(""), [failed, setFailed] = useState(false)
  const load = useCallback(async () => { const response = await fetch(`/api/conversations/${conversationId}/attachments?path=${encodeURIComponent(path)}`, { cache: "no-store" }); const body = await api<{ signedUrl: string }>(response); if (body.success) { setUrl(body.data.signedUrl); setFailed(false) } else setFailed(true) }, [conversationId, path])
  // The async callback updates state only after the signed-read response resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  if (failed) return <button className="commerce-image-retry" onClick={() => void load()}><RefreshCw />Видео дахин ачаалах</button>
  if (!url) return <span className="commerce-image-loading"><LoaderCircle className="is-spinning" /></span>
  return <video className="commerce-message-video" style={{ display: "block", width: "min(260px, 70vw)", maxHeight: 300, borderRadius: 12, background: "#111" }} src={url} controls playsInline preload="metadata" onError={() => void load()} />
}
function AttachmentImage({ conversationId, path, alt }: { conversationId: string; path: string; alt: string }) {
  const [url, setUrl] = useState(""), [open, setOpen] = useState(false), [failed, setFailed] = useState(false)
  const load = useCallback(async () => { const response = await fetch(`/api/conversations/${conversationId}/attachments?path=${encodeURIComponent(path)}`, { cache: "no-store" }); const body = await api<{ signedUrl: string }>(response); setFailed(false); if (body.success) setUrl(body.data.signedUrl); else setFailed(true) }, [conversationId, path])
  // The async fetch callback updates state only after the signed-read response resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  if (failed) return <button className="commerce-image-retry" onClick={() => void load()}><RefreshCw />Зураг дахин ачаалах</button>
  if (!url) return <span className="commerce-image-loading"><LoaderCircle className="is-spinning" /></span>
  return <><button className="commerce-message-image" onClick={() => setOpen(true)}><Image src={url} alt={alt} width={600} height={600} unoptimized onError={() => void load()} /></button>{open ? <div className="commerce-lightbox" onClick={() => setOpen(false)} role="dialog" aria-modal="true"><button aria-label="Хаах"><X /></button><Image src={url} alt={alt} width={1400} height={1000} unoptimized /></div> : null}</>
}
