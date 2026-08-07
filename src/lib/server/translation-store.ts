import { getDb } from "./db"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

const supportedTargetLanguages = ["mn", "zh-CN"] as const

export type SupportedTargetLanguage = (typeof supportedTargetLanguages)[number]

export type StoredTranslation = {
  messageId: string
  targetLanguage: SupportedTargetLanguage
  translatedText: string
  createdAt: string
}

export type MessageForTranslation = {
  id: string
  conversationId: string
  body: string | null
}

type TranslationRow = {
  message_id: string
  target_language: SupportedTargetLanguage
  translated_text: string
  created_at: string
}

type MessageForTranslationRow = {
  id: string
  conversation_id: string
  body: string | null
}

const translationSelect = "message_id,target_language,translated_text,created_at"

function mapTranslation(row: TranslationRow): StoredTranslation {
  return {
    messageId: row.message_id,
    targetLanguage: row.target_language,
    translatedText: row.translated_text,
    createdAt: row.created_at,
  }
}

function mapMessageForTranslation(row: MessageForTranslationRow): MessageForTranslation {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    body: row.body,
  }
}

export function isSupportedTargetLanguage(value: unknown): value is SupportedTargetLanguage {
  return typeof value === "string" && supportedTargetLanguages.some((language) => language === value)
}

export async function findTranslation(
  messageId: string,
  targetLanguage: SupportedTargetLanguage
): Promise<StoredTranslation | null> {
  if (isSupabaseEnabled()) {
    const { data, error } = await getSupabaseAdmin()
      .from("message_translations")
      .select(translationSelect)
      .eq("message_id", messageId)
      .eq("target_language", targetLanguage)
      .maybeSingle()

    if (error) throw error
    return data ? mapTranslation(data as TranslationRow) : null
  }

  const db = await getDb()
  const result = await db.query<TranslationRow>(
    `SELECT ${translationSelect}
     FROM message_translations
     WHERE message_id = $1 AND target_language = $2
     LIMIT 1`,
    [messageId, targetLanguage]
  )
  return result.rows[0] ? mapTranslation(result.rows[0]) : null
}

export async function saveTranslation(
  messageId: string,
  targetLanguage: SupportedTargetLanguage,
  translatedText: string
): Promise<StoredTranslation> {
  if (isSupabaseEnabled()) {
    const { data, error } = await getSupabaseAdmin()
      .from("message_translations")
      .upsert(
        {
          message_id: messageId,
          target_language: targetLanguage,
          translated_text: translatedText,
        },
        { onConflict: "message_id,target_language" }
      )
      .select(translationSelect)
      .single()

    if (error) throw error
    return mapTranslation(data as TranslationRow)
  }

  const db = await getDb()
  const result = await db.query<TranslationRow>(
    `INSERT INTO message_translations(message_id, target_language, translated_text, created_at)
     VALUES($1, $2, $3, $4)
     ON CONFLICT(message_id, target_language)
     DO UPDATE SET translated_text = EXCLUDED.translated_text
     RETURNING ${translationSelect}`,
    [messageId, targetLanguage, translatedText, new Date().toISOString()]
  )
  return mapTranslation(result.rows[0])
}

export async function getMessageForTranslation(
  conversationId: string,
  messageId: string
): Promise<MessageForTranslation | null> {
  if (isSupabaseEnabled()) {
    const { data, error } = await getSupabaseAdmin()
      .from("messages")
      .select("id,conversation_id,body")
      .eq("conversation_id", conversationId)
      .eq("id", messageId)
      .maybeSingle()

    if (error) throw error
    return data ? mapMessageForTranslation(data as MessageForTranslationRow) : null
  }

  const db = await getDb()
  const result = await db.query<MessageForTranslationRow>(
    `SELECT id, conversation_id, body
     FROM messages
     WHERE conversation_id = $1 AND id = $2
     LIMIT 1`,
    [conversationId, messageId]
  )
  return result.rows[0] ? mapMessageForTranslation(result.rows[0]) : null
}
