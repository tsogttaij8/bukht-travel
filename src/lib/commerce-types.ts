export type ApiError = { code: string; message: string }
export type ApiResult<T> = { success: true; data: T; error: null } | { success: false; data: null; error: ApiError }

export type CartItem = {
  id: string; productId: string; name: string; imageUrl: string; sellerName: string
  unitPrice: number; formattedPrice: string; currency: string; quantity: number; subtotal: number; available: boolean
}
export type Cart = { id: string | null; items: CartItem[]; totalQuantity: number; total: number; currency: string }
export type MessageAttachment = { path: string; originalFilename: string; mimeType: string; size: number; width: number | null; height: number | null; signedUrl?: string }
export type ConversationMessage = { id: string; senderEmail: string; body: string; readAt: string | null; createdAt: string; clientNonce: string | null; attachment: MessageAttachment | null }
export type Conversation = { id: string; productId: string; productName: string; productImageUrl: string; productPrice: string; sellerName: string; currentUserEmail: string; messages: ConversationMessage[] }
