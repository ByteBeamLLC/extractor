import { NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/send"
import {
  ExtractionReadyEmail,
  getExtractionReadyText,
  type ExtractionReadyEmailProps,
} from "@/emails/ExtractionReady"

export const runtime = "nodejs"

/**
 * POST /api/notifications/email/test
 *
 * Sends a sample first-value extraction-ready email to the current user.
 * Lets the user verify Resend config + template rendering + delivery
 * without uploading a real document and waiting for the t+5min cron.
 */
export async function POST() {
  const auth = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://parsli.co"

  const props: ExtractionReadyEmailProps = {
    fileName: "invoice-march.pdf",
    parserName: "Test parser",
    documentUrl: `${baseUrl}/settings?tab=notifications`,
    isFirstValue: true,
    extractionType: "fields",
    fieldPreview: [
      { label: "Vendor", value: "Acme Corp" },
      { label: "Invoice number", value: "INV-2026-0042" },
      { label: "Issue date", value: "2026-03-15" },
      { label: "Due date", value: "2026-04-14" },
      { label: "Total", value: "$2,450.00" },
      { label: "Tax", value: "$225.00" },
    ],
    fieldCount: 6,
    unsubscribeUrl: `${baseUrl}/settings?tab=notifications`,
    logoUrl: `${baseUrl}/parsli-icon.png`,
  }

  const result = await sendEmail({
    to: user.email,
    subject: "[TEST] invoice-march.pdf is ready — 6 fields extracted",
    react: ExtractionReadyEmail(props),
    text: getExtractionReadyText(props),
    tags: [
      { name: "campaign", value: "extraction_ready_test" },
      { name: "is_first_value", value: "true" },
    ],
  })

  return NextResponse.json({ ok: result.success, result })
}
