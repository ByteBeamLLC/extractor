"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { APP_URL } from "@/lib/config"
import {
  FileText,
  Zap,
  Sheet,
  Webhook,
  Mail,
  Key,
  CreditCard,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Layers,
  TestTube,
  ArrowRight,
  Copy,
  Check,
  PlayCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Table of Contents                                                  */
/* ------------------------------------------------------------------ */

const TOC = [
  { id: "getting-started", label: "Getting Started", icon: PlayCircle },
  { id: "parsers", label: "Creating Parsers", icon: FileText },
  { id: "schema", label: "Defining Your Schema", icon: Layers },
  { id: "testing", label: "Testing Extraction", icon: TestTube },
  { id: "integrations", label: "Integrations", icon: Zap },
  { id: "api", label: "API Reference", icon: Key },
  { id: "credits", label: "Credits & Billing", icon: CreditCard },
  { id: "supported-files", label: "Supported File Types", icon: FileText },
  { id: "faq", label: "FAQ", icon: HelpCircle },
]

/* ------------------------------------------------------------------ */
/*  Reusable UI helpers                                               */
/* ------------------------------------------------------------------ */

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold mt-16 mb-6 scroll-mt-24 flex items-center gap-2">
      {children}
    </h2>
  )
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold mt-10 mb-4 scroll-mt-24">
      {children}
    </h3>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold mb-1">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group my-4 rounded-lg border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/80">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Callout({ type = "info", children }: { type?: "info" | "tip" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50",
    tip: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50",
  }
  const labels = { info: "Note", tip: "Tip", warning: "Important" }
  return (
    <div className={cn("border rounded-lg px-4 py-3 my-4 text-sm", styles[type])}>
      <span className="font-semibold">{labels[type]}: </span>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <Badge variant="outline">Documentation</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-3">Parsli Documentation</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Everything you need to extract structured data from your documents using AI.
          Whether you&apos;re a non-technical founder connecting to Google Sheets or a developer
          building API integrations, this guide has you covered.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sticky sidebar TOC */}
        <aside className="hidden lg:block w-56 flex-none">
          <nav className="sticky top-20 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              On this page
            </p>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-md hover:bg-accent/50"
              >
                <item.icon className="h-3.5 w-3.5 flex-none" />
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 max-w-3xl">

          {/* ====================================================== */}
          {/*  GETTING STARTED                                        */}
          {/* ====================================================== */}
          <SectionHeading id="getting-started">Getting Started</SectionHeading>
          <p className="text-muted-foreground mb-6">
            Parsli turns your PDFs, images, invoices, emails, and documents into
            clean, structured data — automatically. No coding required. Here&apos;s how to get
            up and running in under 5 minutes.
          </p>

          <Step number={1} title="Create your free account">
            Click <strong>&quot;Get Started Free&quot;</strong> on the{" "}
            <Link href="/" className="text-primary underline underline-offset-2">
              home page
            </Link>
            . You get <strong>50 free pages per month</strong> — no credit card required.
          </Step>

          <Step number={2} title="Create a parser">
            A <strong>parser</strong> is a reusable extraction template. Choose between
            two modes: <strong>Extract Fields</strong> (you define what data to extract) or{" "}
            <strong>Extract Everything</strong> (AI extracts all data automatically).
            Give it a name and an optional description.
          </Step>

          <div className="ml-12 mb-6 rounded-xl border bg-card overflow-hidden shadow-sm">
            <Image
              src="/images/app/create-parser.png"
              alt="Create Parser dialog with name and description fields"
              width={1000}
              height={600}
              className="w-full h-auto"
            />
          </div>

          <Step number={3} title="Define your schema">
            Tell the AI <em>what</em> data you want extracted. Add fields like
            &quot;Invoice Number&quot;, &quot;Total Amount&quot;, &quot;Vendor Name&quot;, etc.
            Choose field types (text, number, date, etc.) so the output is always clean.
          </Step>

          <Step number={4} title="Test with a sample document">
            Upload a sample PDF, image, or document in the <strong>Test</strong> tab.
            The AI extracts data according to your schema in seconds. Review the results and
            tweak your schema if needed.
          </Step>

          <Step number={5} title="Connect your integrations">
            Send extracted data wherever you need it — Google Sheets, Zapier, Make, webhooks,
            or your own app via API.
          </Step>

          <Callout type="tip">
            Start simple. You can always add more fields, integrations, and automation later.
          </Callout>

          {/* ====================================================== */}
          {/*  PARSERS                                                 */}
          {/* ====================================================== */}
          <SectionHeading id="parsers">Creating Parsers</SectionHeading>
          <p className="text-muted-foreground mb-4">
            A <strong>parser</strong> is the core building block. Think of it as a &quot;recipe&quot;
            that tells the AI what data to extract from a specific type of document.
          </p>

          <div className="border rounded-lg p-5 bg-card mb-6">
            <p className="font-semibold mb-3">Examples of parsers you might create:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 flex-none text-primary" /> <strong>Invoice Parser</strong> — extracts vendor, amounts, line items, due dates</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 flex-none text-primary" /> <strong>Receipt Parser</strong> — extracts store name, items, totals, payment method</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 flex-none text-primary" /> <strong>ID Document Parser</strong> — extracts name, ID number, date of birth, expiry</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 flex-none text-primary" /> <strong>Contract Parser</strong> — extracts parties, dates, key terms, obligations</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 flex-none text-primary" /> <strong>Email Attachment Parser</strong> — auto-extract from incoming emails via Gmail</li>
            </ul>
          </div>

          <SubHeading id="create-parser">How to create a parser</SubHeading>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>Go to the <Link href="/" className="text-primary underline underline-offset-2">Parsers</Link> page.</li>
            <li>Click <strong>&quot;New Parser&quot;</strong>.</li>
            <li>Choose your extraction mode (see below).</li>
            <li>Enter a name and optional description.</li>
            <li>Click <strong>&quot;Create&quot;</strong>.</li>
          </ol>

          <SubHeading id="extraction-types">Extraction types</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            When creating a parser, you choose how data should be extracted:
          </p>
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Mode</th>
                  <th className="text-left px-4 py-2 font-semibold">Best for</th>
                  <th className="text-left px-4 py-2 font-semibold">How it works</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Extract Fields</td>
                  <td className="px-4 py-2 text-muted-foreground">Structured, repeatable extraction</td>
                  <td className="px-4 py-2 text-muted-foreground">You define specific fields (e.g. &quot;Invoice Number&quot;, &quot;Total&quot;). The AI extracts exactly those fields every time.</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Extract Everything</td>
                  <td className="px-4 py-2 text-muted-foreground">Exploratory or varied documents</td>
                  <td className="px-4 py-2 text-muted-foreground">The AI extracts all data it finds and determines the structure automatically. Great for contracts, reports, or mixed document types.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout type="tip">
            Use <strong>Extract Fields</strong> when you process the same type of document repeatedly and need consistent output.
            Use <strong>Extract Everything</strong> when documents vary or you want a quick, comprehensive extraction without configuring fields.
          </Callout>

          <SubHeading id="parser-status">Parser status</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Each parser has a status that controls whether it processes documents:
          </p>
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-left px-4 py-2 font-semibold">Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2"><Badge variant="outline" className="text-green-600 border-green-300">Active</Badge></td>
                  <td className="px-4 py-2 text-muted-foreground">Accepts and processes new documents</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2"><Badge variant="outline" className="text-amber-600 border-amber-300">Paused</Badge></td>
                  <td className="px-4 py-2 text-muted-foreground">Rejects new extraction requests</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2"><Badge variant="outline" className="text-gray-500 border-gray-300">Archived</Badge></td>
                  <td className="px-4 py-2 text-muted-foreground">Hidden from the dashboard (soft delete)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading id="parser-limits">Limits</SubHeading>
          <p className="text-sm text-muted-foreground">
            Free accounts can create up to <strong>5 parsers</strong>. Paid plans include unlimited parsers.
          </p>

          {/* ====================================================== */}
          {/*  SCHEMA                                                  */}
          {/* ====================================================== */}
          <SectionHeading id="schema">Defining Your Schema</SectionHeading>
          <p className="text-muted-foreground mb-4">
            Your schema tells the AI exactly what data to pull from each document.
            Each <strong>field</strong> you add becomes a column in your output data.
          </p>

          <Callout type="info">
            This section applies to <strong>Extract Fields</strong> parsers. If you chose{" "}
            <strong>Extract Everything</strong>, the AI determines the structure automatically — you
            can optionally add custom extraction instructions to guide what it focuses on.
          </Callout>

          <SubHeading id="field-types">Field types</SubHeading>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Category</th>
                  <th className="text-left px-4 py-2 font-semibold">Types</th>
                  <th className="text-left px-4 py-2 font-semibold">Use case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Text</td>
                  <td className="px-4 py-2 text-muted-foreground">text, email, url, phone, address, rich text</td>
                  <td className="px-4 py-2 text-muted-foreground">Names, descriptions, contact info</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Numbers</td>
                  <td className="px-4 py-2 text-muted-foreground">number, decimal</td>
                  <td className="px-4 py-2 text-muted-foreground">Amounts, quantities, prices</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Date &amp; Boolean</td>
                  <td className="px-4 py-2 text-muted-foreground">date, boolean</td>
                  <td className="px-4 py-2 text-muted-foreground">Dates, yes/no flags</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Selection</td>
                  <td className="px-4 py-2 text-muted-foreground">single-select, multi-select</td>
                  <td className="px-4 py-2 text-muted-foreground">Categories, tags, dropdown values</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Compound</td>
                  <td className="px-4 py-2 text-muted-foreground">object, list, table</td>
                  <td className="px-4 py-2 text-muted-foreground">Nested data, line items, repeating rows</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubHeading id="adding-fields">Adding fields</SubHeading>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>Open your parser and go to the <strong>Schema</strong> tab.</li>
            <li>Click <strong>&quot;Add Field&quot;</strong>.</li>
            <li>Enter a <strong>field name</strong> (e.g. &quot;invoice_number&quot;).</li>
            <li>Select the <strong>field type</strong> (e.g. &quot;text&quot;).</li>
            <li>Optionally add a <strong>description</strong> to help the AI understand what to look for.</li>
            <li>Toggle <strong>Required</strong> if the field should always be present.</li>
            <li>Click <strong>Save</strong>.</li>
          </ol>

          <div className="my-6 rounded-xl border bg-card overflow-hidden shadow-sm">
            <Image
              src="/images/app/add-field-detail.png"
              alt="Add Field form showing field name, type selector, description, extraction instructions, and required toggle"
              width={1100}
              height={500}
              className="w-full h-auto"
            />
          </div>

          <Callout type="tip">
            Add <strong>extraction instructions</strong> for tricky fields. For example:
            &quot;Always normalize dates to YYYY-MM-DD format&quot; or &quot;Extract the total
            including tax, not the subtotal.&quot;
          </Callout>

          <SubHeading id="compound-fields">Compound fields (tables &amp; nested data)</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Use <strong>table</strong> fields for repeating rows (like invoice line items).
            Use <strong>object</strong> fields for grouped data (like a vendor with name + address).
            Use <strong>list</strong> fields for simple arrays of values.
          </p>
          <div className="border rounded-lg p-4 bg-muted/30 text-sm mb-4">
            <p className="font-semibold mb-2">Example: Invoice line items table</p>
            <p className="text-muted-foreground">
              Add a <strong>&quot;line_items&quot;</strong> field of type <strong>table</strong>,
              then define columns: &quot;description&quot; (text), &quot;quantity&quot; (number),
              &quot;unit_price&quot; (decimal), &quot;total&quot; (decimal).
            </p>
          </div>

          <div className="my-6 rounded-xl border bg-card overflow-hidden shadow-sm">
            <Image
              src="/images/app/schema-overview.png"
              alt="Schema tab showing defined fields — invoice number (number type) and Line Items (table type)"
              width={1500}
              height={580}
              className="w-full h-auto"
            />
          </div>

          <SubHeading id="custom-instructions">Custom extraction instructions</SubHeading>
          <p className="text-sm text-muted-foreground mb-4">
            At the bottom of the Schema tab, you&apos;ll find a <strong>Custom Extraction Instructions</strong> text
            area. Use this to give the AI parser-level guidance that applies to every extraction.
          </p>
          <div className="border rounded-lg p-4 bg-muted/30 text-sm mb-4">
            <p className="font-semibold mb-2">Example instructions:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>&quot;Always normalize dates to YYYY-MM-DD format&quot;</li>
              <li>&quot;Extract amounts in USD. If a different currency, note it in the field.&quot;</li>
              <li>&quot;For the category field, classify as: Hardware, Software, or Services&quot;</li>
              <li>&quot;If a PO number is not present, use the invoice number instead&quot;</li>
            </ul>
          </div>

          {/* ====================================================== */}
          {/*  TESTING                                                 */}
          {/* ====================================================== */}
          <SectionHeading id="testing">Testing Extraction</SectionHeading>
          <p className="text-muted-foreground mb-4">
            Before connecting integrations, test your parser to make sure it extracts the right data.
          </p>

          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>Open your parser and go to the <strong>Test</strong> tab.</li>
            <li>Drag-and-drop a sample document (or click to browse).</li>
            <li>Wait a few seconds while the AI processes your document.</li>
            <li>Review the extracted data in <strong>Table view</strong> or <strong>JSON view</strong>.</li>
            <li>If results aren&apos;t right, go back to Schema and adjust your fields or instructions.</li>
          </ol>

          <Callout type="info">
            Each test extraction uses <strong>1 credit</strong> (1 page) from your monthly allowance.
          </Callout>

          <SubHeading id="reading-results">Reading your results</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            The results view shows each field with its extracted value. Pay attention to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
            <li><strong>Table view</strong> — shows fields in a readable format with type badges</li>
            <li><strong>JSON view</strong> — raw output, useful for developers to verify structure</li>
            <li><strong>Missing values</strong> — shown as &quot;-&quot; when the AI couldn&apos;t find data</li>
            <li><strong>Confidence</strong> — the AI assigns confidence scores; low-confidence fields are flagged</li>
          </ul>

          {/* ====================================================== */}
          {/*  INTEGRATIONS                                            */}
          {/* ====================================================== */}
          <SectionHeading id="integrations">Integrations</SectionHeading>
          <p className="text-muted-foreground mb-6">
            Once your parser is working, connect it to the tools you already use.
            Open your parser&apos;s <strong>Integrations</strong> tab to add any of the following:
          </p>

          <div className="my-6 rounded-xl border bg-card overflow-hidden shadow-sm max-w-md mx-auto">
            <Image
              src="/images/app/add-integration.png"
              alt="Add Integration dialog showing Webhook, Google Sheets, Zapier, Make, Power Automate, and Gmail Inbox options"
              width={1000}
              height={1050}
              className="w-full h-auto"
            />
          </div>

          {/* Google Sheets */}
          <SubHeading id="google-sheets">
            <span className="flex items-center gap-2">
              <Sheet className="h-5 w-5 text-green-600" /> Google Sheets
            </span>
          </SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Pull extracted data directly into a Google Sheet — no code needed. Parsli generates
            a live data feed URL that Google Sheets can read automatically.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
            <li>In the Integrations tab, click <strong>&quot;Add Integration&quot;</strong> and select <strong>Google Sheets</strong>.</li>
            <li>Copy the generated <code className="bg-muted px-1.5 py-0.5 rounded text-xs">IMPORTDATA</code> formula.</li>
            <li>Paste it into any cell in your Google Sheet.</li>
            <li>Your sheet now automatically pulls the latest extracted data as CSV.</li>
          </ol>
          <CodeBlock
            language="spreadsheet"
            code={`=IMPORTDATA("https://parsli.co/api/parsers/{id}/feed?token={token}&format=csv")`}
          />
          <Callout type="tip">
            The data refreshes automatically whenever Google Sheets recalculates.
            No webhooks or manual refresh needed.
          </Callout>

          {/* Google Docs */}
          <SubHeading id="google-docs">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Google Docs
            </span>
          </SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Automatically save extraction results as formatted Google Docs in your Drive.
            Each processed document creates a new Google Doc with the extracted data organized
            into readable sections, tables, and key-value pairs.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
            <li>In the Integrations tab, click <strong>&quot;Add Integration&quot;</strong> and select <strong>Google Docs</strong>.</li>
            <li>Click <strong>&quot;Connect Google Drive&quot;</strong> and authorize access.</li>
            <li>Optionally specify a Google Drive folder ID to organize your docs.</li>
            <li>Every new extraction will automatically create a Google Doc in your Drive.</li>
          </ol>
          <Callout type="info">
            Parsli only requests access to files it creates (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">drive.file</code> scope).
            It cannot read, modify, or delete your other Google Drive files.
          </Callout>

          {/* Zapier */}
          <SubHeading id="zapier">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" /> Zapier
            </span>
          </SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Connect to 5,000+ apps through Zapier. Every time a document is processed,
            the extracted data is sent to your Zap.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>In Zapier, create a new Zap with the <strong>&quot;Webhooks by Zapier&quot;</strong> trigger.</li>
            <li>Choose <strong>&quot;Catch Hook&quot;</strong> and copy the webhook URL.</li>
            <li>In Parsli, add a <strong>Zapier</strong> integration and paste the webhook URL.</li>
            <li>Click <strong>&quot;Test&quot;</strong> to send a sample payload to Zapier.</li>
            <li>In Zapier, continue building your Zap with the extracted data fields.</li>
          </ol>

          {/* Make */}
          <SubHeading id="make">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" /> Make (formerly Integromat)
            </span>
          </SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Similar to Zapier — create a Make scenario with a <strong>&quot;Custom webhook&quot;</strong> module,
            copy the URL into Parsli, and your extracted data flows into your automation.
          </p>

          {/* Webhooks */}
          <SubHeading id="webhooks">
            <span className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-500" /> Custom Webhooks
            </span>
          </SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Send extracted data to any HTTP endpoint. Perfect for developers who want
            to push data to their own backend, database, or custom application.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
            <li>Add a <strong>Webhook</strong> integration.</li>
            <li>Enter your endpoint URL and HTTP method (POST or PUT).</li>
            <li>Optionally configure authentication (Bearer token or Basic auth).</li>
            <li>Click <strong>&quot;Test&quot;</strong> to verify delivery.</li>
          </ol>
          <p className="text-sm text-muted-foreground mb-2">
            Webhook payload format:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "event": "document.processed",
  "parser_id": "abc-123",
  "parser_name": "Invoice Parser",
  "document_id": "doc-456",
  "timestamp": "2026-03-06T12:00:00Z",
  "data": {
    "invoice_number": "INV-2026-001",
    "vendor_name": "Acme Corp",
    "total_amount": 1250.00,
    "due_date": "2026-04-01"
  },
  "metadata": {
    "file_name": "invoice.pdf",
    "mime_type": "application/pdf",
    "source_type": "upload",
    "page_count": 1
  }
}`}
          />

          {/* Gmail */}
          <SubHeading id="gmail">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-red-500" /> Gmail Inbox
            </span>
          </SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Automatically extract data from email attachments. Parsli connects to your
            Gmail account (read-only) and processes attachments from specific senders.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
            <li>Add a <strong>Gmail Inbox</strong> integration.</li>
            <li>Click <strong>&quot;Connect Gmail Account&quot;</strong> and authorize read-only access.</li>
            <li>Set a <strong>from filter</strong> — only emails from this address will be processed (e.g. <code className="bg-muted px-1.5 py-0.5 rounded text-xs">invoices@supplier.com</code>).</li>
            <li>Click <strong>&quot;Activate&quot;</strong>.</li>
          </ol>
          <p className="text-sm text-muted-foreground mb-3">
            Parsli checks your inbox every 5 minutes. When a matching email with
            an attachment arrives, it&apos;s automatically extracted and sent to your other
            integrations (webhooks, Google Sheets, etc.).
          </p>
          <Callout type="info">
            Parsli only requests <strong>read-only</strong> access to Gmail. It cannot
            send, delete, or modify your emails.
          </Callout>

          {/* ====================================================== */}
          {/*  API REFERENCE                                           */}
          {/* ====================================================== */}
          <SectionHeading id="api">API Reference</SectionHeading>
          <p className="text-muted-foreground mb-4">
            For developers who want to integrate extraction into their own applications.
            The API accepts documents and returns structured JSON.
          </p>

          <div className="my-6 rounded-xl border bg-card overflow-hidden shadow-sm">
            <Image
              src="/images/app/api-tab.png"
              alt="API tab showing API Keys section, Inbound Webhook URL, and Quick Start curl example"
              width={900}
              height={500}
              className="w-full h-auto"
            />
          </div>

          <SubHeading id="api-keys">Authentication</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            API requests require a <strong>Bearer token</strong>. Create API keys in
            your parser&apos;s <strong>API</strong> tab.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
            <li>Open your parser and go to the <strong>API</strong> tab.</li>
            <li>Click <strong>&quot;Create Key&quot;</strong> and give it a name.</li>
            <li>Copy the key immediately — <strong>it&apos;s shown only once</strong>.</li>
            <li>Store it securely (environment variable, secret manager, etc.).</li>
          </ol>
          <Callout type="warning">
            API keys are shown only once when created. If you lose a key, revoke it and create a new one.
          </Callout>

          <SubHeading id="extract-endpoint">Extract document</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Send a document for extraction using the REST API:
          </p>
          <CodeBlock
            language="bash"
            code={`curl -X POST https://parsli.co/api/v1/extract \\
  -H "Authorization: Bearer ext_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "file": {
      "name": "invoice.pdf",
      "type": "application/pdf",
      "data": "BASE64_ENCODED_FILE_CONTENT"
    }
  }'`}
          />

          <p className="text-sm text-muted-foreground mb-2">Response:</p>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "parser_id": "abc-123",
  "document_id": "doc-456",
  "results": {
    "invoice_number": "INV-2026-001",
    "vendor_name": "Acme Corp",
    "total_amount": 1250.00,
    "due_date": "2026-04-01",
    "line_items": [
      { "description": "Widget A", "quantity": 10, "unit_price": 100.00, "total": 1000.00 },
      { "description": "Widget B", "quantity": 5, "unit_price": 50.00, "total": 250.00 }
    ]
  }
}`}
          />

          <SubHeading id="inbound-webhook">Inbound webhook</SubHeading>
          <p className="text-sm text-muted-foreground mb-3">
            Each parser also has a unique <strong>inbound webhook URL</strong> for sending documents
            without API keys. Find it in the <strong>API</strong> tab. Send documents as multipart
            form data or JSON with base64 content.
          </p>
          <CodeBlock
            language="bash"
            code={`# Using multipart form data
curl -X POST https://parsli.co/api/inbound/webhook/YOUR_TOKEN \\
  -F "file=@invoice.pdf"`}
          />

          <SubHeading id="api-errors">Error codes</SubHeading>
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Code</th>
                  <th className="text-left px-4 py-2 font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono">200</td>
                  <td className="px-4 py-2 text-muted-foreground">Success — extracted data returned</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono">400</td>
                  <td className="px-4 py-2 text-muted-foreground">Bad request — missing or invalid file</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono">401</td>
                  <td className="px-4 py-2 text-muted-foreground">Unauthorized — invalid or missing API key</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono">402</td>
                  <td className="px-4 py-2 text-muted-foreground">Payment required — monthly credit limit reached</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono">404</td>
                  <td className="px-4 py-2 text-muted-foreground">Parser not found</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono">500</td>
                  <td className="px-4 py-2 text-muted-foreground">Server error — extraction failed</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====================================================== */}
          {/*  CREDITS & BILLING                                       */}
          {/* ====================================================== */}
          <SectionHeading id="credits">Credits &amp; Billing</SectionHeading>
          <p className="text-muted-foreground mb-4">
            Parsli uses a simple <strong>page-based credit system</strong>.
            Each document extraction uses 1 credit, regardless of file type or size.
          </p>

          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Plan</th>
                  <th className="text-left px-4 py-2 font-semibold">Pages / month</th>
                  <th className="text-left px-4 py-2 font-semibold">Price</th>
                  <th className="text-left px-4 py-2 font-semibold">Per page</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Free</td>
                  <td className="px-4 py-2 text-muted-foreground">30</td>
                  <td className="px-4 py-2 text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-muted-foreground">Free</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Starter</td>
                  <td className="px-4 py-2 text-muted-foreground">250</td>
                  <td className="px-4 py-2 text-muted-foreground">$20/mo</td>
                  <td className="px-4 py-2 text-muted-foreground">$0.080</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Growth</td>
                  <td className="px-4 py-2 text-muted-foreground">1,000</td>
                  <td className="px-4 py-2 text-muted-foreground">$49/mo</td>
                  <td className="px-4 py-2 text-muted-foreground">$0.049</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Pro</td>
                  <td className="px-4 py-2 text-muted-foreground">5,000</td>
                  <td className="px-4 py-2 text-muted-foreground">$199/mo</td>
                  <td className="px-4 py-2 text-muted-foreground">$0.040</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Business</td>
                  <td className="px-4 py-2 text-muted-foreground">25,000</td>
                  <td className="px-4 py-2 text-muted-foreground">$499/mo</td>
                  <td className="px-4 py-2 text-muted-foreground">$0.020</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            <strong>How credits work:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
            <li>Credits reset automatically every 30 days.</li>
            <li>1 document = 1 credit, regardless of file size or number of pages.</li>
            <li>Test extractions also use credits.</li>
            <li>If you run out of credits, extractions will pause until your next billing cycle.</li>
            <li>Your usage is visible on the dashboard and in <a href={`${APP_URL}/settings`} className="text-primary underline underline-offset-2">Settings</a>.</li>
          </ul>

          <Callout type="info">
            See the full pricing breakdown on the{" "}
            <Link href="/pricing" className="text-primary underline underline-offset-2">
              Pricing page
            </Link>.
          </Callout>

          {/* ====================================================== */}
          {/*  SUPPORTED FILE TYPES                                    */}
          {/* ====================================================== */}
          <SectionHeading id="supported-files">Supported File Types</SectionHeading>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Format</th>
                  <th className="text-left px-4 py-2 font-semibold">Extensions</th>
                  <th className="text-left px-4 py-2 font-semibold">How it&apos;s processed</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">PDF</td>
                  <td className="px-4 py-2 text-muted-foreground">.pdf</td>
                  <td className="px-4 py-2 text-muted-foreground">Text extraction + visual AI analysis</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Images</td>
                  <td className="px-4 py-2 text-muted-foreground">.png, .jpg, .jpeg, .webp, .gif, .bmp</td>
                  <td className="px-4 py-2 text-muted-foreground">Visual AI analysis (OCR built-in)</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Word</td>
                  <td className="px-4 py-2 text-muted-foreground">.docx, .doc</td>
                  <td className="px-4 py-2 text-muted-foreground">Full text extraction</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Spreadsheets</td>
                  <td className="px-4 py-2 text-muted-foreground">.xlsx, .xls</td>
                  <td className="px-4 py-2 text-muted-foreground">Converted to CSV for analysis</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium">Plain text</td>
                  <td className="px-4 py-2 text-muted-foreground">.txt, .csv, .json, .xml, .md</td>
                  <td className="px-4 py-2 text-muted-foreground">Direct text analysis</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ====================================================== */}
          {/*  FAQ                                                     */}
          {/* ====================================================== */}
          <SectionHeading id="faq">Frequently Asked Questions</SectionHeading>

          <div className="space-y-6">
            <div>
              <p className="font-semibold mb-1">What is a parser?</p>
              <p className="text-sm text-muted-foreground">
                A parser is a reusable extraction template. You define the fields you want
                (like &quot;invoice number&quot;, &quot;amount&quot;, &quot;date&quot;), and
                the AI uses that definition to extract data from any document you send it.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Do I need to code?</p>
              <p className="text-sm text-muted-foreground">
                No. The entire setup — creating parsers, defining schemas, testing, and
                connecting integrations — is done through the web interface. The API is
                available for developers who want programmatic access, but it&apos;s optional.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">How accurate is the extraction?</p>
              <p className="text-sm text-muted-foreground">
                Parsli uses Google&apos;s Gemini 2.5 Pro, one of the most advanced AI models
                available. Accuracy depends on document quality and schema clarity. Well-defined
                schemas with clear field descriptions and extraction instructions yield the best
                results. The AI also provides confidence scores so you can flag uncertain extractions.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">What happens when I run out of credits?</p>
              <p className="text-sm text-muted-foreground">
                Extractions will pause until your credits reset (every 30 days) or you upgrade
                to a higher plan. Existing data and integrations remain intact.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Is my data secure?</p>
              <p className="text-sm text-muted-foreground">
                Yes. Documents are processed and results are stored in your account. We use
                Supabase with row-level security, and API keys are stored as SHA-256 hashes.
                Gmail integration uses read-only OAuth access.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Can I process documents automatically?</p>
              <p className="text-sm text-muted-foreground">
                Yes, in several ways: (1) Connect Gmail to auto-extract from email attachments,
                (2) Use the inbound webhook to send documents from other systems, or (3) Use
                the API to integrate extraction into your own workflows.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">What&apos;s the difference between the API key and the inbound webhook?</p>
              <p className="text-sm text-muted-foreground">
                <strong>API key</strong> — for authenticated programmatic access. Pass it as a Bearer token
                in the Authorization header. You can create, revoke, and manage multiple keys.
                <br />
                <strong>Inbound webhook</strong> — a unique URL per parser. Send documents directly
                to it without authentication headers. Useful for simple integrations and no-code tools.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Can I export my data?</p>
              <p className="text-sm text-muted-foreground">
                Yes. Use the Google Sheets integration for live CSV export, copy JSON from the
                Activity tab, or use the API to pull results programmatically.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">What if the AI extracts wrong data?</p>
              <p className="text-sm text-muted-foreground">
                Try these steps: (1) Add clearer field descriptions, (2) Add custom extraction
                instructions, (3) Make sure your field types match the data (e.g. use &quot;decimal&quot;
                for currency amounts), (4) Use single-select/multi-select to constrain values to
                known options.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">What&apos;s the difference between &quot;Extract Fields&quot; and &quot;Extract Everything&quot;?</p>
              <p className="text-sm text-muted-foreground">
                <strong>Extract Fields</strong> — you define specific fields (like &quot;Invoice Number&quot;,
                &quot;Total&quot;) and the AI extracts exactly those fields every time. Best for
                repeatable, structured workflows.
                <br />
                <strong>Extract Everything</strong> — the AI extracts all data it finds and
                determines the structure automatically. Best for varied documents or when
                you want a quick, comprehensive extraction without setting up a schema.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Can I switch between Extract Fields and Extract Everything?</p>
              <p className="text-sm text-muted-foreground">
                The extraction mode is set when you create a parser. To switch modes, create a
                new parser with the other mode. Your existing documents and results are preserved
                in the original parser.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">How does the Google Docs integration work?</p>
              <p className="text-sm text-muted-foreground">
                After connecting your Google Drive, every document you process automatically creates
                a formatted Google Doc with the extracted data. The doc includes all fields, tables,
                and metadata organized into readable sections. You can optionally specify a folder to
                keep your docs organized.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 mb-8 border rounded-xl p-8 bg-card text-center">
            <h2 className="text-xl font-bold mb-2">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Create your free account and extract data from your first document in minutes.
            </p>
            <Button asChild size="lg">
              <a href={`${APP_URL}/dashboard`} className="inline-flex items-center gap-2">
                Go to Parsers <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Contact */}
          <div className="text-center text-sm text-muted-foreground pb-8">
            <p>
              Have a question not covered here?{" "}
              <a href="mailto:support@parsli.co" className="text-primary underline underline-offset-2">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
