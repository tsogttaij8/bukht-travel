"use client"

import Image from "next/image"
import { ArrowLeft, LoaderCircle, MessageCircle, PackageOpen, RefreshCw, X } from "lucide-react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { ApiResult, Conversation, ConversationInbox, ConversationSummary } from "../../lib/commerce-types"
import { CommerceChatPanel } from "./ChatButton"

type InboxFilter = "all" | "selling" | "buying"
type CommerceInboxContextValue = {
  unreadCount: number | null
  loading: boolean
  openInbox: (filter?: InboxFilter) => void
  refresh: () => Promise<void>
}

const CommerceInboxContext = createContext<CommerceInboxContextValue | null>(null)

export function CommerceInboxProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ConversationInbox | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<InboxFilter>("all")
  const [active, setActive] = useState<Conversation | null>(null)
  const [openingId, setOpeningId] = useState("")
  const requestId = useRef(0)
  const opener = useRef<HTMLElement | null>(null)

  const refresh = useCallback(async () => {
    const id = ++requestId.current
    setRefreshing(true)
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" })
      if (response.status === 401) {
        if (id === requestId.current) { setData(null); setError("") }
        return
      }
      const body = await response.json() as ApiResult<ConversationInbox>
      if (!response.ok || !body.success) throw new Error(body.success ? "Чат ачаалсангүй." : body.error.message)
      if (id === requestId.current) { setData(body.data); setError("") }
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Чат ачаалсангүй.")
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false) }
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const reconcile = () => { if (document.visibilityState === "visible") void refresh() }
    window.addEventListener("focus", reconcile)
    document.addEventListener("visibilitychange", reconcile)
    return () => { window.removeEventListener("focus", reconcile); document.removeEventListener("visibilitychange", reconcile) }
  }, [refresh])

  const openInbox = useCallback((nextFilter: InboxFilter = "all") => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setFilter(nextFilter)
    setOpen(true)
    setActive(null)
    void refresh()
  }, [refresh])

  const closeInbox = useCallback(() => {
    setOpen(false)
    setActive(null)
    void refresh()
    window.requestAnimationFrame(() => opener.current?.focus())
  }, [refresh])

  async function selectConversation(summary: ConversationSummary) {
    if (openingId) return
    setOpeningId(summary.id)
    setError("")
    try {
      const response = await fetch(`/api/conversations/${summary.id}/messages`, { cache: "no-store" })
      const body = await response.json() as ApiResult<Conversation>
      if (!response.ok || !body.success) throw new Error(body.success ? "Чат нээгдсэнгүй." : body.error.message)
      setActive(body.data)
      if (summary.unreadCount > 0) {
        const readResponse = await fetch(`/api/conversations/${summary.id}/messages`, { method: "PATCH" })
        const readBody = await readResponse.json() as ApiResult<Conversation>
        if (readResponse.ok && readBody.success) setActive(readBody.data)
        await refresh()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Чат нээгдсэнгүй.")
    } finally {
      setOpeningId("")
    }
  }

  const value = useMemo<CommerceInboxContextValue>(() => ({
    unreadCount: loading && !data ? null : data?.unreadConversationCount ?? 0,
    loading,
    openInbox,
    refresh,
  }), [data, loading, openInbox, refresh])

  return <CommerceInboxContext.Provider value={value}>
    {children}
    {open ? <CommerceInboxDrawer data={data} loading={loading} refreshing={refreshing} error={error} filter={filter} active={active} openingId={openingId} close={closeInbox} setFilter={setFilter} select={selectConversation} retry={() => void refresh()} back={() => { setActive(null); void refresh() }} /> : null}
  </CommerceInboxContext.Provider>
}

export function useCommerceInbox(): CommerceInboxContextValue {
  const context = useContext(CommerceInboxContext)
  if (!context) throw new Error("useCommerceInbox must be used inside CommerceInboxProvider")
  return context
}

export function CommerceInboxButton({ className = "", iconOnly = false, filter = "all", onOpen }: { className?: string; iconOnly?: boolean; filter?: InboxFilter; onOpen?: () => void }) {
  const { unreadCount, openInbox } = useCommerceInbox()
  const label = unreadCount ? `Миний чат, ${unreadCount} уншаагүй харилцан яриа` : "Миний чат"
  return <button type="button" className={`commerce-inbox-button ${className}`} onClick={() => { onOpen?.(); openInbox(filter) }} aria-label={label}>
    <MessageCircle aria-hidden="true" />{iconOnly ? null : <span>Чат</span>}
    {unreadCount === null ? <i className="commerce-inbox-badge-skeleton" aria-hidden="true" /> : unreadCount > 0 ? <b className="commerce-inbox-badge">{unreadCount > 9 ? "9+" : unreadCount}</b> : null}
  </button>
}

function CommerceInboxDrawer(props: { data: ConversationInbox | null; loading: boolean; refreshing: boolean; error: string; filter: InboxFilter; active: Conversation | null; openingId: string; close: () => void; setFilter: (filter: InboxFilter) => void; select: (summary: ConversationSummary) => void; retry: () => void; back: () => void }) {
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (props.active) props.back()
      else props.close()
    }
    window.addEventListener("keydown", escape)
    return () => window.removeEventListener("keydown", escape)
  }, [props])
  if (props.active) return <><div className="commerce-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) props.close() }} /><button className="commerce-inbox-back" onClick={props.back} aria-label="Чатын жагсаалт руу буцах"><ArrowLeft /></button><CommerceChatPanel initial={props.active} close={props.close} /></>
  const conversations = props.data?.conversations.filter((item) => props.filter === "all" || item.direction === props.filter) ?? []
  return <div className="commerce-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) props.close() }}>
    <aside className="commerce-inbox-drawer" role="dialog" aria-modal="true" aria-labelledby="commerce-inbox-title">
      <header><div><h2 id="commerce-inbox-title">Миний чат</h2>{props.refreshing ? <small>Шинэчилж байна...</small> : null}</div><button onClick={props.close} aria-label="Чат хаах"><X /></button></header>
      <nav>{([["all","Бүгд"],["selling","Зарж буй"],["buying","Худалдаж авч буй"]] as const).map(([value,label]) => <button key={value} className={props.filter === value ? "is-active" : ""} onClick={() => props.setFilter(value)}>{label}</button>)}</nav>
      <div className="commerce-inbox-list">
        {props.loading && !props.data ? <InboxSkeleton /> : props.error && !props.data ? <InboxError message={props.error} retry={props.retry} /> : conversations.length ? conversations.map((item) => <ConversationRow key={item.id} item={item} busy={props.openingId === item.id} onClick={() => props.select(item)} />) : <div className="commerce-inbox-empty"><PackageOpen /><strong>{props.filter === "selling" ? "Зарж буй барааны чат алга" : props.filter === "buying" ? "Худалдан авч буй чат алга" : "Одоогоор чат алга"}</strong></div>}
        {props.error && props.data ? <div className="commerce-inbox-inline-error">{props.error}<button onClick={props.retry}><RefreshCw />Дахин оролдох</button></div> : null}
      </div>
    </aside>
  </div>
}

function ConversationRow({ item, busy, onClick }: { item: ConversationSummary; busy: boolean; onClick: () => void }) {
  const latest = item.latestMessage
  const preview = latest?.attachment?.kind === "video" ? "🎥 Видео" : latest?.attachment ? "📷 Зураг" : latest?.body || "Шинэ харилцан яриа"
  return <button className={`commerce-conversation-row ${item.unreadCount ? "is-unread" : ""}`} onClick={onClick} disabled={busy}>
    <span className="commerce-conversation-image">{item.productImageUrl ? <Image src={item.productImageUrl} alt="" width={58} height={58} unoptimized /> : <PackageOpen />}</span>
    <span className="commerce-conversation-copy"><strong>{item.productName}</strong><small>{item.otherParticipantName} · {item.direction === "selling" ? "Зарж буй" : "Худалдаж авч буй"}</small><span>{preview}</span></span>
    <span className="commerce-conversation-meta"><time>{formatInboxTime(item.updatedAt)}</time>{busy ? <LoaderCircle className="is-spinning" /> : item.unreadCount ? <b>{item.unreadCount > 99 ? "99+" : item.unreadCount}</b> : null}</span>
  </button>
}

function formatInboxTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return `${String(date.getUTCHours()).padStart(2,"0")}:${String(date.getUTCMinutes()).padStart(2,"0")}`
}
function InboxSkeleton() { return <>{Array.from({ length: 5 }, (_, index) => <div className="commerce-inbox-skeleton" key={index}><i /><span /><b /></div>)}</> }
function InboxError({ message, retry }: { message: string; retry: () => void }) { return <div className="commerce-inbox-empty"><MessageCircle /><strong>{message}</strong><button onClick={retry}><RefreshCw />Дахин оролдох</button></div> }
