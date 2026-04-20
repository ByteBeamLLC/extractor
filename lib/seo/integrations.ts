export interface IntegrationData {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  h1: string
  heroDescription: string
  steps: { title: string; description: string }[]
  benefits: string[]
  faqs: { question: string; answer: string }[]
  /**
   * Optional publish / update dates used by the RSS feed (app/feed.xml/route.ts)
   * and the sitemap. When absent, the feed falls back to its historical
   * default (2026-04-03). Set these when launching a new integration so it
   * surfaces as fresh content to feed readers and search engines.
   */
  publishedAt?: string
  updatedAt?: string
  /**
   * Optional flag to render a "New" badge on the /integrations index page.
   * Recommended for the first ~30 days after launch.
   */
  isNew?: boolean
}

export const integrations: IntegrationData[] = [
  {
    slug: "google-sheets",
    name: "Google Sheets",
    metaTitle: "Google Sheets Integration — Auto-Fill Data",
    metaDescription:
      "Send extracted document data directly to Google Sheets. Auto-refresh with IMPORTDATA formula. No code, no manual entry. PDF to Google Sheets automatically.",
    h1: "Google Sheets Integration",
    heroDescription:
      "Pull extracted data from PDFs, invoices, and documents directly into Google Sheets with a single IMPORTDATA formula. Auto-refreshes with every extraction.",
    steps: [
      { title: "Create a Parser", description: "Set up your parser with the fields you need (invoice number, amount, vendor, etc.)." },
      { title: "Add Google Sheets Integration", description: "In your parser's Integrations tab, click Add Integration and select Google Sheets." },
      { title: "Copy the Formula", description: "Copy the generated IMPORTDATA formula and paste it into any cell in your Google Sheet." },
      { title: "Data Flows Automatically", description: "Every time a document is processed, your spreadsheet updates with the latest extracted data." },
    ],
    benefits: [
      "No-code setup — just paste a formula",
      "Auto-refreshes when Google Sheets recalculates",
      "CSV format compatible with any spreadsheet",
      "Works with shared and team spreadsheets",
      "Combine with Google Sheets formulas and charts for [no-code PDF extraction](/guides/extract-data-from-pdfs-without-code)",
    ],
    faqs: [
      { question: "How does the Google Sheets integration work?", answer: "Parsli provides a CSV data feed URL for each parser. You use Google Sheets' IMPORTDATA function to pull this data into your spreadsheet. It refreshes automatically." },
      { question: "Can I choose which fields appear in the spreadsheet?", answer: "Yes. The CSV output includes all fields from your parser schema. The column headers match your field names." },
      { question: "Does it work with Excel?", answer: "The CSV feed URL works with any tool that can fetch CSV data. For Excel, you can use Power Query to import from the URL. You can also [extract data from Excel to JSON](/guides/extract-data-from-excel-to-json) directly." },
    ],
  },
  {
    slug: "zapier",
    name: "Zapier",
    metaTitle: "Parsli + Zapier — Connect to 5,000+ Apps",
    metaDescription:
      "Connect Parsli to 5,000+ apps with Zapier. Auto-send extracted document data to CRMs, spreadsheets, databases, and more. No code required.",
    h1: "Zapier Integration",
    heroDescription:
      "Connect Parsli to 5,000+ apps through Zapier. Every time a document is processed, extracted data automatically flows to your Zap — CRMs, databases, project management tools, and more. See how to [parse email attachments with Zapier](/guides/parse-email-attachments-with-zapier).",
    steps: [
      { title: "Create a Zap", description: "In Zapier, create a new Zap with the 'Webhooks by Zapier' trigger and choose 'Catch Hook'." },
      { title: "Copy Webhook URL", description: "Copy the webhook URL that Zapier generates for your Zap." },
      { title: "Add to Parsli", description: "In your parser's Integrations tab, add a Zapier integration and paste the webhook URL." },
      { title: "Build Your Workflow", description: "In Zapier, add actions to send data to any of 5,000+ connected apps." },
    ],
    benefits: [
      "Connect to 5,000+ applications",
      "No coding required",
      "Real-time data delivery",
      "Multi-step Zap workflows",
      "Filter and transform data in Zapier",
    ],
    faqs: [
      { question: "How does Parsli send data to Zapier?", answer: "Parsli sends a webhook POST request to your Zapier webhook URL every time a document is processed. The payload contains all extracted fields." },
      { question: "Can I test the integration?", answer: "Yes. In Parsli, click the Test button after adding the Zapier integration to send a sample payload. Zapier will detect the fields automatically." },
      { question: "What data format does Parsli send?", answer: "Parsli sends JSON with all extracted fields, plus metadata like parser name, document ID, file name, and timestamp. Great for [invoice automation for small business](/guides/automate-invoice-processing-for-small-business) workflows." },
    ],
  },
  {
    slug: "make",
    name: "Make",
    metaTitle: "Parsli + Make (Integromat) Integration",
    metaDescription:
      "Connect Parsli to Make (formerly Integromat) for powerful visual document processing automation. Send extracted data to any Make scenario via webhooks.",
    h1: "Make (Integromat) Integration",
    heroDescription:
      "Build powerful visual automations with Make. When Parsli processes a document, extracted data flows into your Make scenario for routing, transformation, and delivery. Follow our guide to [automate receipt processing with Make](/guides/automate-receipt-processing-with-make).",
    steps: [
      { title: "Create a Make Scenario", description: "In Make, create a new scenario with a Custom Webhook module as the trigger." },
      { title: "Copy Webhook URL", description: "Copy the webhook URL that Make generates." },
      { title: "Add to Parsli", description: "In your parser's Integrations tab, add a webhook integration with your Make URL." },
      { title: "Design Your Scenario", description: "Add Make modules to route, transform, and deliver the extracted data." },
    ],
    benefits: [
      "Visual scenario builder",
      "Advanced data transformation",
      "Conditional routing and filtering",
      "Error handling and retry logic",
      "Hundreds of connected apps",
    ],
    faqs: [
      { question: "Does Parsli have a native Make integration?", answer: "Parsli connects to Make via webhooks, which is Make's recommended approach for custom integrations. It works with Make's Custom Webhook module." },
      { question: "Can I transform data in Make?", answer: "Yes. Make's scenario builder lets you transform, filter, aggregate, and route data using dozens of built-in modules. Perfect for converting [PDF to JSON](/guides/pdf-to-json-extraction) at scale." },
      { question: "Is there a delay in data delivery?", answer: "No. Parsli sends webhook data in real-time as soon as document processing completes." },
    ],
  },
  {
    slug: "gmail",
    name: "Gmail",
    metaTitle: "Parsli + Gmail — Extract Email Attachments",
    metaDescription:
      "Automatically extract data from Gmail email attachments. Connect your inbox and process invoices, receipts, and documents as they arrive. Read-only access.",
    h1: "Gmail Inbox Automation",
    heroDescription:
      "Connect your Gmail inbox and automatically extract structured data from email attachments. Invoices, receipts, and documents are processed as they arrive — no manual upload needed.",
    steps: [
      { title: "Add Gmail Integration", description: "In your parser's Integrations tab, click Add Integration and select Gmail Inbox." },
      { title: "Connect Your Account", description: "Click 'Connect Gmail Account' and authorize read-only access." },
      { title: "Set Sender Filter", description: "Enter the sender address to filter (e.g., invoices@supplier.com). Only matching emails are processed." },
      { title: "Activate", description: "Click Activate. Parsli checks your inbox every 5 minutes for new matching emails with attachments." },
    ],
    benefits: [
      "Fully automatic — no manual uploads",
      "Read-only Gmail access (safe and secure)",
      "Filter by sender address",
      "Processes all attachment types",
      "Combine with other integrations for end-to-end automation — [no code required](/guides/extract-data-from-pdfs-without-code)",
    ],
    faqs: [
      { question: "Is my Gmail data safe?", answer: "Yes. Parsli only requests read-only access. We cannot send, delete, or modify your emails. Only attachment data is extracted." },
      { question: "How often does Parsli check my inbox?", answer: "Every 5 minutes. When a matching email with attachments is found, it's processed automatically." },
      { question: "Can I process emails from multiple senders?", answer: "You can create multiple Gmail integrations on the same parser with different sender filters, or create separate parsers for different document types." },
    ],
  },
  {
    slug: "webhooks",
    name: "Webhooks",
    metaTitle: "Parsli Webhooks — Send & Receive Docs",
    metaDescription:
      "Inbound webhooks to submit documents, outbound webhooks to receive extracted data. Connect Parsli to any HTTP endpoint. Bearer token and basic auth supported.",
    h1: "Webhook Integration",
    heroDescription:
      "Full webhook support for both sending documents to Parsli and receiving extracted data. Connect to any HTTP endpoint with standard authentication options.",
    steps: [
      { title: "Inbound: Get Your Webhook URL", description: "Each parser has a unique inbound webhook URL in the API tab. Send documents as multipart form data." },
      { title: "Outbound: Add a Webhook", description: "In Integrations, add a Webhook integration with your endpoint URL and HTTP method." },
      { title: "Configure Auth", description: "Optionally add Bearer token or Basic auth headers for outbound webhooks." },
      { title: "Test", description: "Click Test to verify the connection with a sample payload." },
    ],
    benefits: [
      "Standard HTTP protocol",
      "Inbound and outbound webhooks",
      "Bearer token and Basic auth",
      "JSON payload format",
      "Connect to any backend or service for [batch document processing](/guides/batch-process-documents-automatically)",
    ],
    faqs: [
      { question: "What's the webhook payload format?", answer: "Outbound webhooks send JSON with event type, parser info, extracted data, and document metadata (filename, MIME type, page count). Ideal for [PDF to JSON extraction](/guides/pdf-to-json-extraction) pipelines." },
      { question: "Can I use webhooks without API keys?", answer: "Yes. Inbound webhook URLs are unique per parser and don't require API key authentication. They use a token embedded in the URL." },
      { question: "Are webhooks reliable?", answer: "Parsli sends webhook requests immediately after extraction. If your endpoint is down, the data is still stored in Parsli and accessible via the API." },
    ],
  },
  {
    slug: "api",
    name: "REST API",
    metaTitle: "Parsli REST API - Document Parsing API for Developers",
    metaDescription:
      "Full REST API for document data extraction. Send PDFs, images, and documents via API, receive structured JSON. Bearer token auth. Developer-friendly.",
    h1: "Document Parsing REST API",
    heroDescription:
      "A developer-friendly REST API for extracting structured data from documents. Send files, receive typed JSON. Standard HTTP conventions with Bearer token authentication.",
    steps: [
      { title: "Create an API Key", description: "In your parser's API tab, click Create Key. Copy the key immediately — it's shown only once." },
      { title: "Send a Document", description: "POST to /api/v1/extract with your API key in the Authorization header and the file as base64 JSON or multipart form data." },
      { title: "Receive Structured JSON", description: "The API returns typed JSON matching your parser's schema, plus document metadata. See our guide on [PDF to JSON extraction](/guides/pdf-to-json-extraction)." },
      { title: "Integrate into Your App", description: "Use the API from any language — Python, Node.js, Java, Go, or any HTTP client." },
    ],
    benefits: [
      "Standard REST conventions",
      "Bearer token authentication",
      "JSON and multipart upload support",
      "Typed, schema-defined responses",
      "Works with any programming language",
    ],
    faqs: [
      { question: "What authentication does the API use?", answer: "Bearer token authentication. Pass your API key in the Authorization header: 'Authorization: Bearer ext_YOUR_KEY'." },
      { question: "What's the rate limit?", answer: "API requests are limited by your plan's monthly page allowance. Each successful extraction uses one page credit. For high volumes, learn how to [batch process documents automatically](/guides/batch-process-documents-automatically)." },
      { question: "Is there an SDK?", answer: "Not yet, but the API uses standard HTTP and JSON, so any HTTP client works. We provide curl examples in the docs." },
    ],
  },
  {
    slug: "quickbooks",
    name: "QuickBooks Online",
    metaTitle: "QuickBooks Online Integration — Push Bills Directly | Parsli",
    metaDescription:
      "Push extracted invoices, bills, and receipts straight into QuickBooks Online. Native OAuth, auto-create vendors, original PDF attached. No Zapier middleman. Start free.",
    h1: "QuickBooks Online Integration",
    heroDescription:
      "Parsli's native QuickBooks integration turns any invoice, bill, or receipt into a QuickBooks Bill, Expense, or Invoice automatically — with the original PDF attached. No Zapier, no Make, no templates. Connect in under 60 seconds and watch your AP inbox empty itself.",
    steps: [
      { title: "Connect QuickBooks", description: "Click Connect QuickBooks on your parser's Export tab. A one-click OAuth flow hands you off to Intuit, you pick your QuickBooks company, and you're back in Parsli in 30 seconds." },
      { title: "Map Your Fields Once", description: "Pick the target entity (Bill, Expense, or Invoice), choose a default expense account, and map your parser fields: vendor name, amount, date, line items. The dropdowns are pre-populated from your QuickBooks chart of accounts and vendor list." },
      { title: "Drop in Your Documents", description: "Upload invoices and receipts, forward them by email, or send them via API. Parsli reads them with AI, pulls out every mapped field, and matches the vendor against your QuickBooks vendor list automatically." },
      { title: "Bills Appear in QuickBooks", description: "Within seconds, the Bill lands in your QuickBooks company with the original PDF attached. Open the Bill in QuickBooks, review, and post. No copy-paste, no manual entry, no lost receipts." },
    ],
    benefits: [
      "**Direct to QuickBooks** — no Zapier, no Make, no middleware subscription fees",
      "**Auto-create missing vendors** — never stop an upload because a vendor isn't in your list yet (optional; off by default to prevent duplicates)",
      "**Source PDF attached** — the original invoice lands in QuickBooks as an Attachable on the Bill, so your books keep their audit trail",
      "**Duplicate-proof** — deterministic idempotency keys plus entity dedup mean the same invoice never creates two Bills",
      "**Works with Essentials, Plus, and Advanced** — all QuickBooks Online plans that support Bills",
      "**Sandbox-first, production-safe** — Intuit App Assessment approved, AES-256-GCM encrypted tokens at rest, zero-retention LLM processing",
      "**Flexible entity mapping** — push vendor invoices as Bills, cash/card receipts as Expenses, or customer invoices as Invoices — all from the same parser",
    ],
    faqs: [
      { question: "Is this a direct integration or does it go through Zapier?", answer: "It's direct. Parsli is a QuickBooks app listed on Intuit's developer platform, connected via OAuth 2.0 to Intuit's Accounting API. Your data flows Parsli → QuickBooks with no third-party automation tool in the middle — no Zapier/Make subscription required, no per-operation fees, and no attachment-handling quirks that plague webhook-based integrations." },
      { question: "Which QuickBooks plans does this work with?", answer: "QuickBooks Online Essentials, Plus, and Advanced — any plan that supports Bills. Simple Start doesn't have the Bills entity, but we can push Invoices and Expenses. QuickBooks Self-Employed and QuickBooks Desktop are not currently supported." },
      { question: "Does the original PDF get attached to the Bill?", answer: "Yes — files up to 25MB are uploaded as an Attachable on the created Bill, so the source document stays with the transaction for audit purposes. You see the attachment right in the QuickBooks Bill view. Larger files are skipped but the Bill still posts." },
      { question: "What happens if the vendor doesn't exist in my QuickBooks?", answer: "Your call — toggle auto-create on, and Parsli creates the vendor automatically using the extracted name. Toggle it off (default) and the delivery fails loudly with a clear error, so you can decide whether to pre-create the vendor or update the extracted name. This prevents silent duplicates that plague template-based AP tools." },
      { question: "Will I get duplicate Bills if a document gets reprocessed?", answer: "No. Every delivery carries a deterministic idempotency key that QuickBooks honors within its cache window. Beyond that window, Parsli checks whether the prior Bill still exists in your QuickBooks and skips if it does. You'd only get a second Bill if you explicitly deleted the first one in QuickBooks — and then we treat the reprocess as a legitimate recreate." },
      { question: "How secure is the OAuth token storage?", answer: "Refresh tokens are encrypted at rest with AES-256-GCM before they ever touch the database, per Intuit's security requirements. Tokens never appear in logs, never ship to the client, and are revoked at Intuit the moment you disconnect. We follow Intuit's Nov 2025 refresh-token rotation policy: the rotated token is persisted immediately on every refresh so your connection can't be invalidated by a race condition." },
      { question: "Can I use QuickBooks alongside other Parsli integrations?", answer: "Yes. Hook QuickBooks up for AP automation while also sending the same extraction data to [Google Sheets](/integrations/google-sheets) for reporting, Zapier for notifications, or your [REST API](/integrations/api) for custom pipelines. Every integration runs independently per parser." },
      { question: "How do I disconnect?", answer: "Two ways. Inside Parsli, click the trash icon on the QuickBooks card — this revokes the OAuth grant at Intuit and deletes the local credentials. Or disconnect from QuickBooks directly (Apps → My Apps → Disconnect). Either path invalidates the token and stops further writes to your books." },
    ],
    publishedAt: "2026-04-20",
    updatedAt: "2026-04-20",
    isNew: true,
  },
  {
    slug: "outlook",
    name: "Outlook",
    metaTitle: "Outlook Email Parsing — Extract Data from Outlook Emails | Parsli",
    metaDescription:
      "Parse Outlook emails and attachments automatically. AI extracts structured data from invoices, orders, and confirmations forwarded from Outlook. Free plan included.",
    h1: "Outlook Integration",
    heroDescription:
      "Auto-forward emails from Outlook to Parsli and get structured data back. The AI reads email bodies and attachments — invoices, orders, confirmations — and sends extracted data to your connected apps.",
    steps: [
      { title: "Get Your Parsli Inbox Address", description: "Each parser has a unique email address. Copy it from your parser's Import settings." },
      { title: "Set Up Outlook Rules", description: "In Outlook, create a rule that auto-forwards specific emails (by sender, subject, or keyword) to your Parsli inbox." },
      { title: "AI Extracts the Data", description: "Parsli reads the email body and all attachments, extracting the fields defined in your schema." },
      { title: "Data Flows to Your Apps", description: "Extracted data is pushed to Google Sheets, Zapier, Make, webhooks, or your API — automatically." },
    ],
    benefits: [
      "Works with Outlook 365 and Outlook Desktop",
      "Auto-forward rules require no add-ins or plugins",
      "Processes both email body and attachments (PDF, images, docs)",
      "AI handles format changes — no rule maintenance",
      "Combine with [email attachment parsing](/guides/parse-email-attachments-automatically) for full automation",
    ],
    faqs: [
      { question: "Do I need to install an add-in?", answer: "No. Parsli uses standard email forwarding — just set up an Outlook rule to forward emails to your Parsli inbox address. No plugins, no add-ins, no IT involvement." },
      { question: "Can it process Outlook attachments?", answer: "Yes. When you forward an email, all attachments (PDFs, images, docs) are processed automatically. The AI extracts data from both the email text and attachments." },
      { question: "Does it work with shared mailboxes?", answer: "Yes. Set up forwarding rules on the shared mailbox to send specific emails to Parsli. Works with any mailbox that supports email rules." },
    ],
  },
  {
    slug: "power-automate",
    name: "Power Automate",
    metaTitle: "Parsli + Power Automate — Document Parsing in Microsoft Flows",
    metaDescription:
      "Connect Parsli to Microsoft Power Automate for enterprise document parsing workflows. Extract data from PDFs and emails, trigger flows, and push to Microsoft 365 apps.",
    h1: "Power Automate Integration",
    heroDescription:
      "Build enterprise document processing flows with Microsoft Power Automate. When Parsli extracts data from a document, the webhook triggers your Power Automate flow — routing data to SharePoint, Dynamics 365, Teams, or any Microsoft 365 app.",
    steps: [
      { title: "Create a Power Automate Flow", description: "In Power Automate, create a new flow with 'When an HTTP request is received' as the trigger." },
      { title: "Copy the Webhook URL", description: "Power Automate generates a unique HTTP POST URL for your flow. Copy it." },
      { title: "Add to Parsli", description: "In your parser's export settings, add a webhook integration and paste the Power Automate URL." },
      { title: "Build Your Workflow", description: "In Power Automate, add actions to route extracted data to SharePoint, Dynamics 365, Excel Online, Teams, or any connector." },
    ],
    benefits: [
      "Native Microsoft 365 ecosystem integration",
      "Route document data to SharePoint, Teams, Dynamics 365",
      "Enterprise-grade security and compliance",
      "Combine with 500+ Power Automate connectors",
      "No custom code — visual flow designer",
    ],
    faqs: [
      { question: "How does Parsli trigger Power Automate?", answer: "Parsli sends an HTTP POST request (webhook) to your Power Automate flow URL when a document is processed. The JSON payload contains all extracted fields plus document metadata." },
      { question: "Can I use this with SharePoint?", answer: "Yes. A common pattern is: email arrives → Parsli extracts data → Power Automate flow creates a SharePoint list item or uploads to a document library with extracted metadata." },
      { question: "Is this suitable for enterprise?", answer: "Yes. Power Automate is Microsoft's enterprise automation platform with full compliance, DLP policies, and admin controls. Parsli sends data via standard HTTPS webhooks." },
    ],
  },
  {
    slug: "slack",
    name: "Slack",
    metaTitle: "Parsli + Slack — Send Extracted Document Data to Slack Channels",
    metaDescription:
      "Send parsed document data to Slack channels automatically. Get notified when invoices, orders, or documents are processed. Connect via Zapier or webhooks.",
    h1: "Slack Integration",
    heroDescription:
      "Get Slack notifications with extracted document data. When Parsli processes an invoice, receipt, or email, the key fields are posted to your Slack channel automatically — via Zapier, Make, or direct webhook.",
    steps: [
      { title: "Set Up a Slack Webhook", description: "In Slack, create an incoming webhook for your target channel (Settings > Integrations > Incoming Webhooks)." },
      { title: "Connect via Zapier/Make", description: "Create a Zap or Make scenario: Parsli webhook trigger → Slack message action. Map extracted fields to the message template." },
      { title: "Customize the Message", description: "Format which fields appear in the Slack message — invoice number, amount, vendor, status, or any extracted data." },
      { title: "Get Notified Automatically", description: "Every processed document triggers a Slack message with the key extracted data. Your team stays informed without checking Parsli." },
    ],
    benefits: [
      "Real-time notifications for processed documents",
      "Customizable message format with extracted fields",
      "Works via Zapier, Make, or direct Slack webhooks",
      "Keep teams informed without context-switching",
      "Combine with approval workflows in Slack",
    ],
    faqs: [
      { question: "Can I send to specific Slack channels?", answer: "Yes. Configure the Slack webhook or Zapier/Make action to target any channel — #invoices, #orders, #finance, or any custom channel." },
      { question: "What data appears in the Slack message?", answer: "You choose. Map any extracted fields (vendor name, amount, invoice number, etc.) to the Slack message template. Include as much or as little as your team needs." },
      { question: "Does Parsli have a native Slack app?", answer: "Not yet. Currently, Slack integration works through Zapier, Make, or direct incoming webhooks. A native Slack app is on the roadmap." },
    ],
  },
  {
    slug: "xero",
    name: "Xero",
    metaTitle: "Xero Integration — Auto-Import Invoices & Expenses | Parsli",
    metaDescription:
      "Extract data from invoices and receipts and send it to Xero automatically. AI-powered document parsing replaces manual data entry. Free plan included.",
    h1: "Xero Integration",
    heroDescription:
      "Stop manually entering invoices into Xero. Parsli extracts vendor, amount, date, and line items from any invoice format and pushes the data to Xero via Zapier or Make — automatically.",
    steps: [
      { title: "Create a Parser", description: "Define invoice fields: vendor name, invoice number, date, amount, tax, line items, currency." },
      { title: "Upload or Forward Invoices", description: "Upload via dashboard, forward supplier emails, or send via API." },
      { title: "Connect to Xero", description: "Use Zapier or Make to connect Parsli's webhook to Xero. Map extracted fields to Xero bill/expense fields." },
      { title: "Bills Created Automatically", description: "Every extracted invoice creates a draft bill or expense in Xero — ready for review and approval." },
    ],
    benefits: [
      "Eliminate manual invoice entry into Xero",
      "AI handles any invoice format (no templates needed)",
      "Works with scanned, emailed, and photographed invoices",
      "Automatic line item extraction for detailed coding",
      "Connect via Zapier (2,000+ Xero users) or Make",
    ],
    faqs: [
      { question: "How does Parsli connect to Xero?", answer: "Parsli sends extracted invoice data via webhook to Zapier or Make, which creates bills or expenses in Xero. This is more reliable than direct integrations because you can add validation and routing logic." },
      { question: "Can it extract line items for Xero?", answer: "Yes. Parsli's AI extracts full line item tables — description, quantity, unit price, amount, tax code. These map to Xero's bill line items." },
      { question: "Does it work with Xero's receipt scanning?", answer: "Parsli replaces Xero's built-in receipt OCR with more accurate AI extraction. It handles complex invoices and multi-page documents that Xero's scanner struggles with." },
    ],
  },
  {
    slug: "airtable",
    name: "Airtable",
    metaTitle: "Parsli + Airtable — Send Extracted Data to Airtable Bases",
    metaDescription:
      "Send parsed document data directly to Airtable. Extract invoices, forms, and documents into structured Airtable records. Connect via Zapier, Make, or webhooks.",
    h1: "Airtable Integration",
    heroDescription:
      "Push extracted document data into Airtable bases automatically. When Parsli processes a document, the structured data creates a new record in your Airtable base — via Zapier, Make, or webhook.",
    steps: [
      { title: "Create a Parser", description: "Define the fields you want extracted from your documents (names, dates, amounts, etc.)." },
      { title: "Connect via Zapier or Make", description: "Create an automation: Parsli webhook trigger → Airtable 'Create Record' action. Map extracted fields to Airtable columns." },
      { title: "Send Documents", description: "Upload via dashboard, forward emails, or send via API. Each document creates a new Airtable record." },
      { title: "Build on Your Data", description: "Use Airtable views, filters, and automations on your extracted data. Build dashboards, assign tasks, or trigger workflows." },
    ],
    benefits: [
      "No-code document pipeline into Airtable",
      "Map any extracted field to Airtable columns",
      "Works via Zapier (most popular) or Make",
      "Supports linked records, attachments, and formulas",
      "Build custom views and dashboards on extracted data",
    ],
    faqs: [
      { question: "How does data get into Airtable?", answer: "Parsli sends a webhook when a document is processed. Zapier or Make receives this webhook and creates a new record in your Airtable base with the extracted fields mapped to your table columns." },
      { question: "Can I include the original document?", answer: "Yes. Parsli's webhook payload includes a link to the original document. You can store this as an Airtable attachment or URL field." },
      { question: "What about existing Airtable records?", answer: "You can configure Zapier/Make to update existing records (search by a unique field like invoice number) or always create new records. The choice is yours." },
    ],
  },
  {
    slug: "hubspot",
    name: "HubSpot",
    metaTitle: "Parsli + HubSpot — Auto-Create CRM Contacts from Parsed Emails",
    metaDescription:
      "Extract lead data from emails and documents, then auto-create contacts in HubSpot CRM. AI-powered parsing for sales teams. Free plan included.",
    h1: "HubSpot Integration",
    heroDescription:
      "Turn incoming emails and documents into HubSpot contacts automatically. Parsli extracts name, email, company, phone, and custom fields — then pushes them to HubSpot CRM via Zapier or Make.",
    steps: [
      { title: "Create a Lead Parser", description: "Define contact fields: name, email, company, phone, source, notes, and any custom properties." },
      { title: "Forward Lead Emails", description: "Auto-forward lead notification emails, inquiry forms, or contact requests to your Parsli inbox." },
      { title: "Connect to HubSpot", description: "Use Zapier or Make: Parsli webhook → HubSpot 'Create/Update Contact' action. Map fields to HubSpot properties." },
      { title: "Contacts Created Automatically", description: "Every parsed email creates or updates a HubSpot contact with extracted data — no manual CRM entry." },
    ],
    benefits: [
      "Eliminate manual lead entry into HubSpot",
      "AI extracts contact fields from any email format",
      "Create or update contacts (de-duplicate by email)",
      "Add to lists, trigger workflows, assign owners",
      "Works with HubSpot Free, Starter, and Enterprise",
    ],
    faqs: [
      { question: "Can it de-duplicate contacts?", answer: "Yes. Configure Zapier/Make to search for existing contacts by email before creating. If found, update the existing record. If not, create a new one." },
      { question: "What about HubSpot custom properties?", answer: "Any field Parsli extracts can be mapped to any HubSpot property — standard or custom. This includes lead source, industry, deal size, or any custom field you define." },
      { question: "Can it trigger HubSpot workflows?", answer: "Yes. When a new contact is created via the integration, it can trigger any HubSpot workflow based on your existing enrollment criteria." },
    ],
  },
]

export function getIntegrationBySlug(slug: string): IntegrationData | undefined {
  return integrations.find((i) => i.slug === slug)
}

export function getAllIntegrationSlugs(): string[] {
  return integrations.map((i) => i.slug)
}
