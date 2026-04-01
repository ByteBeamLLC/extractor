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
]

export function getIntegrationBySlug(slug: string): IntegrationData | undefined {
  return integrations.find((i) => i.slug === slug)
}

export function getAllIntegrationSlugs(): string[] {
  return integrations.map((i) => i.slug)
}
