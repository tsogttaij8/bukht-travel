export const CHAT_ATTACHMENT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"] as const
export type ChatAttachmentMime = typeof CHAT_ATTACHMENT_MIME_TYPES[number]
export type ChatAttachmentKind = "image" | "video"
export const CHAT_ATTACHMENT_ACCEPT = CHAT_ATTACHMENT_MIME_TYPES.join(",")
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const CHAT_VIDEO_MAX_BYTES = 50 * 1024 * 1024
export const CHAT_VIDEO_MAX_DURATION_SECONDS = 60
export const CHAT_ATTACHMENT_EXTENSIONS: Record<ChatAttachmentMime, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"], "image/gif": ["gif"],
  "video/mp4": ["mp4"], "video/webm": ["webm"], "video/quicktime": ["mov"],
}
export function attachmentKind(mime: string): ChatAttachmentKind | null { return mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : null }
export function attachmentMaxBytes(mime: string) { return attachmentKind(mime) === "video" ? CHAT_VIDEO_MAX_BYTES : CHAT_IMAGE_MAX_BYTES }
export function isAllowedAttachment(mime: string): mime is ChatAttachmentMime { return CHAT_ATTACHMENT_MIME_TYPES.includes(mime as ChatAttachmentMime) }
export function filenameExtension(name: string) { return name.split(".").pop()?.toLowerCase() ?? "" }
export function isAllowedFilename(name: string, mime: ChatAttachmentMime) { return CHAT_ATTACHMENT_EXTENSIONS[mime].includes(filenameExtension(name)) }
