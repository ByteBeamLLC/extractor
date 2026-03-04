/**
 * Gmail polling logic. Called by the Vercel Cron handler.
 * For each active Gmail integration, fetches new emails matching the from_filter,
 * downloads attachments, and runs them through the extraction pipeline.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type { GmailInboxConfig } from "@/lib/extractor/types"
import type { SchemaField } from "@/lib/schema"
import {
  refreshAccessToken,
  listMessages,
  getMessage,
  getAttachment,
  extractAttachments,
  GmailAuthError,
} from "./oauth"
import { runExtraction } from "@/lib/extraction/runExtraction"
import { deliverToIntegrations } from "@/lib/extractor/integrations/orchestrator"

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/tiff",
])

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB

export interface PollResult {
  integrationId: string
  parserId: string
  emailsFound: number
  attachmentsProcessed: number
  errors: string[]
}

export async function pollGmailIntegration(
  integration: { id: string; parser_id: string; user_id: string; config: Record<string, any> },
  supabase: SupabaseClient
): Promise<PollResult> {
  const config = integration.config as GmailInboxConfig
  const result: PollResult = {
    integrationId: integration.id,
    parserId: integration.parser_id,
    emailsFound: 0,
    attachmentsProcessed: 0,
    errors: [],
  }

  if (!config.from_filter) {
    result.errors.push("No from_filter configured")
    return result
  }

  // Refresh token if expiring within 5 minutes
  let accessToken = config.access_token
  const tokenExpiry = new Date(config.token_expiry).getTime()
  if (Date.now() > tokenExpiry - 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(config.refresh_token)
      accessToken = refreshed.access_token
      // Update tokens in DB
      await supabase
        .from("parser_integrations" as any)
        .update({
          config: {
            ...config,
            access_token: refreshed.access_token,
            token_expiry: new Date(refreshed.expiry_date).toISOString(),
          },
        } as any)
        .eq("id", integration.id)
    } catch (err) {
      if (err instanceof GmailAuthError || (err instanceof Error && err.message.includes("refresh"))) {
        // Token revoked — deactivate integration
        await supabase
          .from("parser_integrations" as any)
          .update({
            is_active: false,
            last_error: "Gmail access revoked. Please reconnect your account.",
          } as any)
          .eq("id", integration.id)
        result.errors.push("Token revoked")
        return result
      }
      throw err
    }
  }

  // Load parser for schema fields
  const { data: parser } = await supabase
    .from("parsers" as any)
    .select("*")
    .eq("id", integration.parser_id)
    .single()

  if (!parser) {
    result.errors.push("Parser not found")
    return result
  }

  const p = parser as any
  const schemaTree: SchemaField[] = p.fields ?? []
  if (schemaTree.length === 0) {
    result.errors.push("Parser has no fields")
    return result
  }

  // Fetch messages matching the from filter
  try {
    const query = `from:${config.from_filter} has:attachment`
    const messages = await listMessages(accessToken, query, 20)
    result.emailsFound = messages.length

    if (messages.length === 0) {
      await updateLastPolled(supabase, integration.id, config)
      return result
    }

    // Check which messages are already processed
    const messageIds = messages.map((m) => m.id)
    const { data: processed } = await supabase
      .from("gmail_processed_messages" as any)
      .select("gmail_message_id")
      .eq("integration_id", integration.id)
      .in("gmail_message_id", messageIds)

    const processedIds = new Set((processed ?? []).map((r: any) => r.gmail_message_id))
    const newMessages = messages.filter((m) => !processedIds.has(m.id))

    // Process each new message
    for (const msg of newMessages) {
      try {
        const fullMessage = await getMessage(accessToken, msg.id)
        const attachments = extractAttachments(fullMessage.payload)

        for (const att of attachments) {
          // Skip unsupported types
          if (!SUPPORTED_MIME_TYPES.has(att.mimeType.toLowerCase())) {
            continue
          }

          // Skip large attachments
          if (att.size > MAX_ATTACHMENT_SIZE) {
            result.errors.push(`Skipped ${att.filename}: exceeds 10MB`)
            continue
          }

          // Download attachment
          const base64Data = await getAttachment(accessToken, msg.id, att.attachmentId)

          // Check credits
          const { data: sub } = await supabase
            .from("extractor_subscriptions" as any)
            .select("*")
            .eq("user_id", integration.user_id)
            .maybeSingle()

          const s = sub as any
          if (s) {
            if (new Date(s.credits_reset_at) < new Date()) {
              await supabase
                .from("extractor_subscriptions" as any)
                .update({
                  credits_used: 0,
                  credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                } as any)
                .eq("id", s.id)
              s.credits_used = 0
            }

            if (s.credits_used >= s.credits_free) {
              result.errors.push("Credit limit reached")
              // Mark message as processed anyway to avoid retry loop
              await markMessageProcessed(supabase, integration.id, integration.user_id, msg.id)
              continue
            }
          }

          // Create processing log
          const { data: processedDoc } = await supabase
            .from("parser_processed_documents" as any)
            .insert({
              parser_id: integration.parser_id,
              user_id: integration.user_id,
              source_type: "gmail",
              file_name: att.filename,
              mime_type: att.mimeType,
              file_size: att.size,
              status: "processing",
            } as any)
            .select("id")
            .single()

          const docId = (processedDoc as any)?.id

          // Run extraction
          const extractionResult = await runExtraction({
            fileData: base64Data,
            fileName: att.filename,
            mimeType: att.mimeType,
            schemaTree,
            extractionPromptOverride: p.extraction_prompt_override,
          })

          // Deduct credit
          if (s) {
            await supabase
              .from("extractor_subscriptions" as any)
              .update({ credits_used: (s.credits_used ?? 0) + 1 } as any)
              .eq("id", s.id)
            s.credits_used = (s.credits_used ?? 0) + 1
          }

          // Update processing log
          if (docId) {
            await supabase
              .from("parser_processed_documents" as any)
              .update({
                status: extractionResult.handledWithFallback && extractionResult.error ? "error" : "completed",
                results: extractionResult.results,
                processed_at: new Date().toISOString(),
                credits_used: 1,
                error_message: extractionResult.error ?? null,
              } as any)
              .eq("id", docId)
          }

          // Update parser document count
          await supabase
            .from("parsers" as any)
            .update({
              document_count: (p.document_count ?? 0) + 1,
              last_processed_at: new Date().toISOString(),
            } as any)
            .eq("id", p.id)

          // Deliver to output integrations
          if (docId) {
            await deliverToIntegrations(
              p.id,
              p.name,
              docId,
              extractionResult.results,
              { file_name: att.filename, mime_type: att.mimeType, source_type: "gmail", page_count: 1 },
              supabase
            ).catch((err) => console.error("[gmail-poll] Integration delivery failed:", err))
          }

          result.attachmentsProcessed++
        }

        // Mark message as processed
        await markMessageProcessed(supabase, integration.id, integration.user_id, msg.id)
      } catch (err) {
        if (err instanceof GmailAuthError) throw err // Re-throw auth errors to deactivate
        result.errors.push(`Message ${msg.id}: ${err instanceof Error ? err.message : String(err)}`)
      }

      // Small delay between messages to respect rate limits
      if (newMessages.length > 10) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Update last polled
    await updateLastPolled(supabase, integration.id, config)
  } catch (err) {
    if (err instanceof GmailAuthError) {
      await supabase
        .from("parser_integrations" as any)
        .update({
          is_active: false,
          last_error: "Gmail access revoked. Please reconnect your account.",
        } as any)
        .eq("id", integration.id)
      result.errors.push("Token revoked")
    } else {
      throw err
    }
  }

  return result
}

async function markMessageProcessed(
  supabase: SupabaseClient,
  integrationId: string,
  userId: string,
  messageId: string
) {
  await supabase
    .from("gmail_processed_messages" as any)
    .upsert(
      {
        integration_id: integrationId,
        user_id: userId,
        gmail_message_id: messageId,
      } as any,
      { onConflict: "integration_id,gmail_message_id" }
    )
}

async function updateLastPolled(
  supabase: SupabaseClient,
  integrationId: string,
  config: GmailInboxConfig
) {
  await supabase
    .from("parser_integrations" as any)
    .update({
      config: { ...config, last_polled_at: new Date().toISOString() },
      last_triggered_at: new Date().toISOString(),
      last_error: null,
    } as any)
    .eq("id", integrationId)
}
