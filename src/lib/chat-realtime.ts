export const CHAT_EVENT = "message_changed"
export function conversationTopic(conversationId: string): string {
  return `conversation:${conversationId}`
}
