import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export interface FieldPreviewItem {
  label: string
  value: string
}

export interface ExtractionReadyEmailProps {
  /** Optional first name for greeting; falls back to "there". */
  userName?: string
  /** Original uploaded filename — drives recall of what they uploaded. */
  fileName: string
  /** Display name of the parser the document was extracted with. */
  parserName: string
  /** Final destination URL — already carries `?nid=&utm_source=email&...`. */
  documentUrl: string
  /** Drives template variant: warm + preview vs terse one-liner. */
  isFirstValue: boolean
  /** Drives preview shape. */
  extractionType: "fields" | "full_content"
  /** Up to 6 label/value pairs for the inline preview (fields mode only). */
  fieldPreview?: FieldPreviewItem[]
  /** First ~300 chars of extracted text for the inline preview (full_content mode only). */
  fullPreview?: string
  /** Total extracted item count, used in headline/preheader. */
  fieldCount?: number
  /** Link to settings/notifications so users can opt out. */
  unsubscribeUrl: string
}

const PRIMARY = "#2782ff"
const FOREGROUND = "#1f2937"
const MUTED = "#6b7280"
const SUBTLE = "#9ca3af"
const BORDER = "#e5e7eb"
const PREVIEW_BG = "#f8f9fa"

// ─── styles ───
const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  color: FOREGROUND,
  padding: "0",
  margin: "0",
}

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
}

const wordmark: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: PRIMARY,
  letterSpacing: "-0.01em",
  margin: "0 0 32px 0",
}

const heading: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  lineHeight: "1.25",
  color: FOREGROUND,
  margin: "0 0 12px 0",
  letterSpacing: "-0.01em",
}

const subheading: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: MUTED,
  margin: "0 0 28px 0",
}

const previewSection: React.CSSProperties = {
  backgroundColor: PREVIEW_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: "10px",
  padding: "20px 22px",
  margin: "0 0 28px 0",
}

const previewLabel: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: SUBTLE,
  margin: "0 0 12px 0",
}

const fieldRow: React.CSSProperties = {
  display: "block",
  borderBottom: `1px solid ${BORDER}`,
  padding: "10px 0",
}

const fieldRowLast: React.CSSProperties = {
  display: "block",
  padding: "10px 0",
}

const fieldLabel: React.CSSProperties = {
  fontSize: "13px",
  color: MUTED,
  margin: "0 0 2px 0",
}

const fieldValue: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 500,
  color: FOREGROUND,
  margin: "0",
  wordBreak: "break-word",
}

const fullPreviewBox: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: "13px",
  lineHeight: "1.55",
  color: FOREGROUND,
  whiteSpace: "pre-wrap",
  margin: "0",
}

const ctaWrapper: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 32px 0",
}

const ctaButton: React.CSSProperties = {
  backgroundColor: PRIMARY,
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "13px 28px",
  borderRadius: "8px",
  display: "inline-block",
}

const sublineNote: React.CSSProperties = {
  fontSize: "13px",
  color: MUTED,
  textAlign: "center" as const,
  margin: "0 0 32px 0",
  lineHeight: "1.5",
}

const hr: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid ${BORDER}`,
  margin: "0 0 24px 0",
}

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: SUBTLE,
  lineHeight: "1.6",
  margin: "0",
}

const footerLink: React.CSSProperties = {
  color: SUBTLE,
  textDecoration: "underline",
}

// ─── component ───
export function ExtractionReadyEmail(props: ExtractionReadyEmailProps) {
  const {
    fileName,
    parserName,
    documentUrl,
    isFirstValue,
    extractionType,
    fieldPreview = [],
    fullPreview,
    fieldCount,
    unsubscribeUrl,
  } = props

  // Preview text (Gmail/Apple Mail snippet under the subject line).
  // Personalized + concrete: drives open rate.
  const previewText = isFirstValue
    ? extractionType === "fields"
      ? `${fieldCount ?? "Your"} fields extracted from ${fileName} — take a look.`
      : `We extracted the content of ${fileName} — take a look.`
    : `Your extraction of ${fileName} is ready.`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={wordmark}>Parsli</Text>

          {isFirstValue ? (
            <FirstValueBody
              fileName={fileName}
              parserName={parserName}
              documentUrl={documentUrl}
              extractionType={extractionType}
              fieldPreview={fieldPreview}
              fullPreview={fullPreview}
              fieldCount={fieldCount}
            />
          ) : (
            <SubsequentBody fileName={fileName} documentUrl={documentUrl} />
          )}

          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re receiving this because you uploaded a document to
            Parsli and notifications are enabled on your account.{" "}
            <Link href={unsubscribeUrl} style={footerLink}>
              Manage notifications
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// ─── First-value variant: warm copy + inline preview ───
function FirstValueBody({
  fileName,
  parserName,
  documentUrl,
  extractionType,
  fieldPreview,
  fullPreview,
  fieldCount,
}: {
  fileName: string
  parserName: string
  documentUrl: string
  extractionType: "fields" | "full_content"
  fieldPreview: FieldPreviewItem[]
  fullPreview?: string
  fieldCount?: number
}) {
  const headline = "Your first extraction is ready"

  // Subheadline summarizes the result concretely
  const summary =
    extractionType === "fields"
      ? `We pulled ${
          fieldCount && fieldCount > 0 ? `${fieldCount} fields` : "structured data"
        } out of `
      : `We extracted the full content of `

  return (
    <>
      <Heading style={heading}>{headline}</Heading>
      <Text style={subheading}>
        {summary}
        <strong style={{ color: FOREGROUND }}>{fileName}</strong>
        {parserName ? ` using your "${parserName}" parser` : ""}. Here&apos;s a
        peek:
      </Text>

      {extractionType === "fields" && fieldPreview.length > 0 && (
        <Section style={previewSection}>
          <Text style={previewLabel}>Extracted</Text>
          {fieldPreview.map((item, i) => {
            const isLast = i === fieldPreview.length - 1
            return (
              <div key={i} style={isLast ? fieldRowLast : fieldRow}>
                <Text style={fieldLabel}>{item.label}</Text>
                <Text style={fieldValue}>{item.value || "—"}</Text>
              </div>
            )
          })}
        </Section>
      )}

      {extractionType === "full_content" && fullPreview && (
        <Section style={previewSection}>
          <Text style={previewLabel}>Extracted content</Text>
          <Text style={fullPreviewBox}>{fullPreview}</Text>
        </Section>
      )}

      <Section style={ctaWrapper}>
        <Button href={documentUrl} style={ctaButton}>
          Open in Parsli
        </Button>
      </Section>

      <Text style={sublineNote}>
        That took us a few seconds.
        <br />
        Imagine running this on every document that hits your inbox.
      </Text>
    </>
  )
}

// ─── Subsequent variant: terse one-liner ───
function SubsequentBody({
  fileName,
  documentUrl,
}: {
  fileName: string
  documentUrl: string
}) {
  return (
    <>
      <Heading style={heading}>Your extraction is ready</Heading>
      <Text style={subheading}>
        We finished processing{" "}
        <strong style={{ color: FOREGROUND }}>{fileName}</strong>.
      </Text>

      <Section style={ctaWrapper}>
        <Button href={documentUrl} style={ctaButton}>
          Open in Parsli
        </Button>
      </Section>
    </>
  )
}

// ─── Plain-text fallback (deliverability) ───
export function getExtractionReadyText(props: ExtractionReadyEmailProps): string {
  const { fileName, documentUrl, isFirstValue, fieldCount, unsubscribeUrl } = props

  if (isFirstValue) {
    const summary =
      fieldCount && fieldCount > 0
        ? `We pulled ${fieldCount} fields out of ${fileName}.`
        : `We extracted the content of ${fileName}.`
    return [
      `Your first extraction is ready.`,
      ``,
      summary,
      ``,
      `Open in Parsli: ${documentUrl}`,
      ``,
      `—`,
      `You're receiving this because you uploaded a document to Parsli.`,
      `Manage notifications: ${unsubscribeUrl}`,
    ].join("\n")
  }

  return [
    `Your extraction of ${fileName} is ready.`,
    ``,
    `Open in Parsli: ${documentUrl}`,
    ``,
    `—`,
    `Manage notifications: ${unsubscribeUrl}`,
  ].join("\n")
}

export default ExtractionReadyEmail
