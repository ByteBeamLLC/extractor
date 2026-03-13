export interface DocumentTypeData {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  h1: string
  heroDescription: string
  extractableFields: { name: string; description: string }[]
  supportedFormats: string[]
  faqs: { question: string; answer: string }[]
  relatedUseCases: string[]
  relatedIndustries: string[]
  relatedSolutions: string[]
}

export const documentTypes: DocumentTypeData[] = [
  {
    slug: "invoices",
    name: "Invoices",
    metaTitle: "Extract Data from Invoices with AI | Parsli",
    metaDescription:
      "AI-powered invoice data extraction. Pull vendor names, line items, totals, due dates, and more from any invoice format. PDF, image, email. Start free.",
    h1: "Invoice Data Extraction",
    heroDescription:
      "Extract structured data from any invoice format — PDF, scanned, image, or email attachment. Parsli's AI reads the document and returns clean, typed data.",
    extractableFields: [
      { name: "Invoice Number", description: "Unique identifier from the invoice header." },
      { name: "Vendor Name", description: "Supplier or vendor company name." },
      { name: "Invoice Date", description: "Date the invoice was issued." },
      { name: "Due Date", description: "Payment due date." },
      { name: "Line Items", description: "Table of items with description, quantity, unit price, and total." },
      { name: "Subtotal / Tax / Total", description: "Summary amounts including tax breakdowns." },
      { name: "PO Number", description: "Associated purchase order reference." },
      { name: "Payment Terms", description: "Net 30, Net 60, or custom payment terms." },
    ],
    supportedFormats: ["PDF", "Scanned PDF", "PNG", "JPG", "Word (.docx)", "Email attachments"],
    faqs: [
      { question: "Can Parsli extract line items from invoices?", answer: "Yes. Use the table field type to extract multi-row line items including description, quantity, unit price, and line total." },
      { question: "Does it handle invoices in different layouts?", answer: "Yes. The AI adapts to any invoice layout without template configuration. Perfect for [small business invoice automation](/guides/automate-invoice-processing-for-small-business)." },
      { question: "Can I auto-process invoices from email?", answer: "Yes. Connect Gmail and filter by sender to auto-extract data from invoice attachments. You can also [parse email attachments with Zapier](/guides/parse-email-attachments-with-zapier) or [extract invoice data to QuickBooks](/guides/extract-invoice-data-to-quickbooks)." },
    ],
    relatedUseCases: ["invoice-parsing", "email-parsing", "pdf-to-excel"],
    relatedIndustries: ["finance", "ecommerce", "logistics"],
    relatedSolutions: ["invoice-parsing"],
  },
  {
    slug: "receipts",
    name: "Receipts",
    metaTitle: "Extract Data from Receipts with AI | Parsli",
    metaDescription:
      "AI receipt data extraction. Scan paper receipts, PDF receipts, or email receipts and extract store, items, totals, and payment method. Start free.",
    h1: "Receipt Data Extraction",
    heroDescription:
      "Turn receipts into structured data. Snap a photo, upload a PDF, or forward an email receipt — Parsli extracts all the details automatically.",
    extractableFields: [
      { name: "Store Name", description: "Merchant or store name from the receipt header." },
      { name: "Date & Time", description: "Transaction date and time." },
      { name: "Items Purchased", description: "Line items with name, quantity, and price." },
      { name: "Subtotal", description: "Pre-tax total amount." },
      { name: "Tax", description: "Tax amount and rate." },
      { name: "Total", description: "Final amount charged." },
      { name: "Payment Method", description: "Cash, credit card (last 4 digits), or other payment type." },
    ],
    supportedFormats: ["Phone photos", "PDF receipts", "Scanned receipts", "Email receipts", "PNG", "JPG"],
    faqs: [
      { question: "Can it read blurry or faded receipts?", answer: "Parsli's AI handles common quality issues including blur, fading, and poor lighting. Clearer images yield better results." },
      { question: "Does it extract individual items?", answer: "Yes. Use the table field type to extract each line item with name, quantity, and price." },
      { question: "Can I process receipts from my phone?", answer: "Yes. Upload phone photos through the web interface or send images to a Parsli webhook. You can also [automate receipt processing with Make](/guides/automate-receipt-processing-with-make) for hands-free workflows." },
    ],
    relatedUseCases: ["receipt-scanning", "ocr-data-extraction"],
    relatedIndustries: ["finance", "ecommerce"],
    relatedSolutions: ["no-code-document-parser"],
  },
  {
    slug: "emails",
    name: "Emails",
    metaTitle: "Extract Data from Emails with AI | Parsli",
    metaDescription:
      "AI email data extraction. Parse email bodies and attachments automatically. Extract orders, leads, notifications, and structured data. Start free.",
    h1: "Email Data Extraction",
    heroDescription:
      "Extract structured data from email bodies and attachments automatically. Connect your inbox and turn incoming emails into actionable data.",
    extractableFields: [
      { name: "Sender", description: "Email sender name and address." },
      { name: "Subject", description: "Email subject line." },
      { name: "Body Content", description: "Specific data points extracted from the email body text." },
      { name: "Attachment Data", description: "Structured data extracted from email attachments (PDFs, images, etc.)." },
      { name: "Dates", description: "Dates mentioned in the email content." },
      { name: "Amounts", description: "Dollar amounts, quantities, or numeric values in the email." },
    ],
    supportedFormats: ["Gmail inbox (native)", "Email attachments (PDF, images, Word, Excel)", "Forwarded emails via webhook"],
    faqs: [
      { question: "Is my email data secure?", answer: "Yes. Parsli only requests read-only Gmail access. We cannot send, delete, or modify your emails." },
      { question: "Can I filter which emails get processed?", answer: "Yes. Set a sender filter so only emails from specific addresses are processed." },
      { question: "Does it work with Outlook?", answer: "Currently Parsli has native Gmail integration. For Outlook, forward emails to a Parsli webhook or [parse email attachments with Zapier](/guides/parse-email-attachments-with-zapier)." },
    ],
    relatedUseCases: ["email-parsing", "document-automation"],
    relatedIndustries: ["ecommerce", "logistics", "insurance"],
    relatedSolutions: ["no-code-document-parser"],
  },
  {
    slug: "pdfs",
    name: "PDFs",
    metaTitle: "Extract Data from Any PDF with AI | Parsli",
    metaDescription:
      "AI-powered PDF data extraction. Digital PDFs, scanned PDFs, forms, tables, and complex layouts. Built-in OCR. Get structured JSON or CSV. Start free.",
    h1: "PDF Data Extraction",
    heroDescription:
      "Extract structured data from any PDF — digital, scanned, forms, tables, or complex multi-page documents. Built-in OCR handles any quality. Try [extracting data from PDFs without code](/guides/extract-data-from-pdfs-without-code) or convert [PDF to JSON](/guides/pdf-to-json-extraction) in minutes.",
    extractableFields: [
      { name: "Text Fields", description: "Any text content: names, addresses, reference numbers, descriptions." },
      { name: "Tables", description: "Multi-row, multi-column table data with structure preserved." },
      { name: "Form Fields", description: "Data from fillable PDF form fields." },
      { name: "Numbers & Dates", description: "Typed numeric values and dates extracted in consistent formats." },
      { name: "Multi-Page Content", description: "Data spanning multiple pages extracted as a single structured result." },
    ],
    supportedFormats: ["Digital PDF", "Scanned PDF", "Image-based PDF", "Fillable PDF forms", "Multi-page PDF"],
    faqs: [
      { question: "Can Parsli handle scanned PDFs?", answer: "Yes. Built-in OCR reads text from scanned documents, photos, and image-based PDFs. No coding required — see how to [extract data from PDFs without code](/guides/extract-data-from-pdfs-without-code)." },
      { question: "What about multi-page PDFs?", answer: "Parsli processes all pages. One multi-page document uses one page credit. For large volumes, learn how to [batch process documents automatically](/guides/batch-process-documents-automatically)." },
      { question: "Can I extract tables from PDFs?", answer: "Yes. Use the table field type to extract structured table data with rows and columns preserved." },
    ],
    relatedUseCases: ["pdf-data-extraction", "pdf-to-excel", "pdf-to-csv", "pdf-to-json"],
    relatedIndustries: ["finance", "legal", "healthcare"],
    relatedSolutions: ["pdf-to-excel", "document-parsing-api"],
  },
  {
    slug: "spreadsheets",
    name: "Spreadsheets",
    metaTitle: "Extract Data from Excel & Spreadsheets with AI | Parsli",
    metaDescription:
      "AI spreadsheet data extraction. Parse Excel (.xlsx), CSV, and Google Sheets exports. Extract specific data points from complex spreadsheets. Start free.",
    h1: "Spreadsheet Data Extraction",
    heroDescription:
      "Extract specific data points from Excel files and spreadsheets. Parsli's AI reads complex spreadsheet layouts and returns the structured data you need.",
    extractableFields: [
      { name: "Header Row Data", description: "Column headers and their associated values." },
      { name: "Specific Cell Values", description: "Targeted extraction of specific cells or ranges." },
      { name: "Summary Totals", description: "Grand totals, subtotals, and calculated values." },
      { name: "Row-Level Data", description: "Individual row data extracted as structured records." },
    ],
    supportedFormats: ["Excel (.xlsx)", "Excel (.xls)", "CSV files", "Spreadsheet images/screenshots"],
    faqs: [
      { question: "Why use AI to extract from spreadsheets?", answer: "Spreadsheets often have complex layouts with merged cells, multiple header rows, and mixed content. The AI understands the structure and extracts clean data. You can also [extract data from Excel to JSON](/guides/extract-data-from-excel-to-json) for developer workflows." },
      { question: "Can it handle multi-sheet Excel files?", answer: "Parsli processes the content of uploaded Excel files. For multi-sheet files, the AI reads across sheets." },
      { question: "What about CSV files?", answer: "Yes. CSV files are supported as input. The AI can extract specific data points even from messy CSV data." },
    ],
    relatedUseCases: ["pdf-to-excel", "pdf-to-csv"],
    relatedIndustries: ["finance", "ecommerce"],
    relatedSolutions: ["pdf-to-excel"],
  },
  {
    slug: "bank-statements",
    name: "Bank Statements",
    metaTitle: "Extract Data from Bank Statements with AI | Parsli",
    metaDescription:
      "AI bank statement parsing. Extract transactions, balances, account details, and dates from any bank statement format. PDF and scanned. Start free.",
    h1: "Bank Statement Data Extraction",
    heroDescription:
      "Extract transaction data, account details, and balances from bank statements automatically. Works with PDF statements from any bank.",
    extractableFields: [
      { name: "Account Number", description: "Bank account number or last 4 digits." },
      { name: "Statement Period", description: "Start and end dates of the statement period." },
      { name: "Opening Balance", description: "Balance at the start of the period." },
      { name: "Closing Balance", description: "Balance at the end of the period." },
      { name: "Transactions", description: "Table of transactions with date, description, debit, credit, and running balance." },
      { name: "Bank Name", description: "Financial institution name and branch." },
    ],
    supportedFormats: ["PDF bank statements", "Scanned statements", "Image-based statements", "Downloaded CSV statements"],
    faqs: [
      { question: "Can it extract individual transactions?", answer: "Yes. Use the table field type to extract each transaction with date, description, debit/credit amount, and balance." },
      { question: "Does it work with any bank?", answer: "Yes. Parsli's AI adapts to any bank statement layout without bank-specific configuration." },
      { question: "Can I automate statement processing?", answer: "Yes. Forward bank statement emails to Parsli via Gmail automation, or upload via API for batch processing." },
    ],
    relatedUseCases: ["pdf-data-extraction", "pdf-to-excel"],
    relatedIndustries: ["finance"],
    relatedSolutions: ["bank-statement-extraction"],
  },
  {
    slug: "contracts",
    name: "Contracts",
    metaTitle: "Extract Data from Contracts with AI | Parsli",
    metaDescription:
      "AI contract data extraction. Pull party names, dates, terms, obligations, and key clauses from any contract format. Start free.",
    h1: "Contract Data Extraction",
    heroDescription:
      "Extract key terms, dates, parties, and obligations from contracts automatically. Speed up contract review and due diligence workflows. Follow our guide on [extracting data from contracts](/guides/extract-data-from-contracts).",
    extractableFields: [
      { name: "Party Names", description: "Names and details of all contracting parties." },
      { name: "Effective Date", description: "Contract start date or execution date." },
      { name: "Expiration / Renewal", description: "End date, renewal terms, and notice periods." },
      { name: "Contract Value", description: "Total value, payment amounts, and pricing terms." },
      { name: "Key Clauses", description: "Termination, indemnification, non-compete, and other critical clauses." },
      { name: "Governing Law", description: "Jurisdiction and governing law provisions." },
    ],
    supportedFormats: ["PDF contracts", "Word documents (.docx)", "Scanned contracts", "Image-based contracts"],
    faqs: [
      { question: "Can Parsli extract specific clauses?", answer: "Yes. Define fields for specific clause types and the AI will locate and extract them from the document." },
      { question: "Does it handle long contracts?", answer: "Yes. Parsli processes all pages of a document regardless of length." },
      { question: "Can I process contracts in bulk?", answer: "Yes. Use the REST API to [batch-process documents automatically](/guides/batch-process-documents-automatically) for due diligence or contract review projects." },
    ],
    relatedUseCases: ["pdf-data-extraction", "document-automation"],
    relatedIndustries: ["legal", "real-estate", "insurance"],
    relatedSolutions: ["document-parsing-api"],
  },
  {
    slug: "forms",
    name: "Forms",
    metaTitle: "Extract Data from Forms with AI | Parsli",
    metaDescription:
      "AI form data extraction. Parse paper forms, PDF forms, and scanned forms automatically. Extract field labels and values from any form layout. Start free.",
    h1: "Form Data Extraction",
    heroDescription:
      "Digitize paper forms, PDF forms, and scanned forms automatically. Parsli's AI reads form layouts and extracts labeled field values as structured data.",
    extractableFields: [
      { name: "Form Fields", description: "Any labeled field on the form (name, address, date, etc.)." },
      { name: "Checkboxes", description: "Checked/unchecked status of checkbox fields." },
      { name: "Signatures", description: "Detection of signed vs. unsigned signature fields." },
      { name: "Tables", description: "Tabular data within forms (itemized lists, schedules)." },
      { name: "Handwritten Content", description: "Handwritten text entries in form fields." },
    ],
    supportedFormats: ["Fillable PDF forms", "Paper forms (photos)", "Scanned forms", "Word document forms", "Image files"],
    faqs: [
      { question: "Can Parsli read handwritten form entries?", answer: "The AI can process handwritten text, though accuracy depends on legibility. Clear handwriting yields good results. Learn more in our guide on [extracting data from handwritten documents](/guides/extract-data-from-handwritten-documents)." },
      { question: "Does it detect checkboxes?", answer: "Yes. Use a boolean field type to detect checked/unchecked checkboxes on forms." },
      { question: "Can I process different form layouts with one parser?", answer: "Yes. Parsli's AI adapts to different layouts. One parser can handle variations of the same form type." },
    ],
    relatedUseCases: ["ocr-data-extraction", "pdf-data-extraction", "document-automation"],
    relatedIndustries: ["healthcare", "hr", "insurance"],
    relatedSolutions: ["no-code-document-parser"],
  },
]

export function getDocumentTypeBySlug(slug: string): DocumentTypeData | undefined {
  return documentTypes.find((dt) => dt.slug === slug)
}

export function getAllDocumentTypeSlugs(): string[] {
  return documentTypes.map((dt) => dt.slug)
}
