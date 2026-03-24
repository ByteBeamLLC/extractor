export interface SolutionPage {
  slug: string
  keyword: string
  metaTitle: string
  metaDescription: string
  h1: string
  h1Accent: string
  subtitle: string
  comparisonHeadline: string
  painPoints: string[]
  solutions: string[]
  saveLine: string
  calloutBox: { title: string; description: string }
  supportedTypes: { emoji: string; name: string }[]
  howItWorks: { step: string; title: string; description: string }[]
  benefits: { title: string; description: string }[]
  seoSections: { heading: string; content: string }[]
  faq: { question: string; answer: string }[]
  codeExample?: { title: string; language: string; code: string }
  adCopyVariants: string[]
  relatedKeywords: string[]
  ctaPainPoint: string
}

export const solutions: SolutionPage[] = [
  {
    slug: "pdf-to-excel",
    keyword: "pdf to excel converter",
    metaTitle: "Convert PDF to Excel Automatically with AI | Parsli",
    metaDescription:
      "Stop copying data manually. Parsli's AI extracts tables, numbers, and text from any PDF into clean Excel or Google Sheets in seconds. Free to start.",
    h1: "Convert Any PDF to Excel",
    h1Accent: "In Seconds, Not Hours",
    subtitle:
      "Stop copying data manually. Parsli's AI extracts tables, numbers, and text from any PDF into clean Excel or Google Sheets — automatically.",
    comparisonHeadline: "Skip the copy-paste nightmare",
    painPoints: [
      "Copy-pasting data from PDFs one cell at a time",
      "Tables break when you paste into Excel",
      "Scanned PDFs are completely unreadable",
      "Different document layouts mean starting over",
      "Hours of manual cleanup after every conversion",
    ],
    solutions: [
      "Upload any PDF and get clean spreadsheet data",
      "AI preserves table structure — rows, columns, headers",
      "Built-in OCR handles scanned and image-based PDFs",
      "Works on any layout without templates or configuration",
      "Data is ready to use — no cleanup needed",
    ],
    saveLine: "Save 10+ hours per week on manual data entry.",
    calloutBox: {
      title: "Works with Scanned PDFs Too",
      description:
        "Built-in OCR means even photographed or scanned documents are extracted accurately. No separate OCR tool or clean digital PDF required.",
    },
    supportedTypes: [
      { emoji: "📄", name: "Native PDFs" },
      { emoji: "📷", name: "Scanned PDFs" },
      { emoji: "🖼️", name: "Image-Based PDFs" },
      { emoji: "🏦", name: "Bank Statements" },
      { emoji: "🧾", name: "Invoices & Reports" },
    ],
    howItWorks: [
      {
        step: "1",
        title: "Upload Your PDF",
        description:
          "Drag and drop any PDF — scanned, native, or image-based. Parsli handles them all.",
      },
      {
        step: "2",
        title: "AI Extracts Structured Data",
        description:
          "Our AI reads the entire document, identifies tables, and extracts every field with 95%+ accuracy.",
      },
      {
        step: "3",
        title: "Download Excel or Connect Sheets",
        description:
          "Export clean data as Excel, CSV, or send it directly to Google Sheets with one click.",
      },
    ],
    benefits: [
      {
        title: "Handles Scanned PDFs",
        description:
          "Built-in OCR means even photographed or scanned documents are extracted accurately. No separate OCR tool needed.",
      },
      {
        title: "Preserves Table Structure",
        description:
          "AI detects rows, columns, and headers automatically — your spreadsheet comes out clean and ready to use.",
      },
      {
        title: "Works with Any Document Type",
        description:
          "Bank statements, invoices, reports, receipts — if it has data, Parsli can [extract data from PDFs without code](/guides/extract-data-from-pdfs-without-code) into a spreadsheet.",
      },
      {
        title: "No Code Required",
        description:
          "Define what you need with a visual schema builder. No programming, no templates, no manual zone drawing.",
      },
    ],
    seoSections: [
      {
        heading: "Why Convert PDF to Excel?",
        content:
          "PDFs are great for sharing documents, but they lock your data inside. When you need to analyze, sort, filter, or calculate — you need that data in a spreadsheet. Whether you're an accountant reconciling invoices, a data analyst processing reports, or a business owner tracking expenses, converting PDF to Excel is one of the most common data tasks.\n\nThe problem is that most PDF-to-Excel converters either break your table formatting, can't handle scanned documents, or require you to manually fix the output. Parsli's AI extraction solves all three problems because it understands document structure the way a human would — reading context, identifying table boundaries, and mapping data to the right cells.",
      },
      {
        heading: "Can You Extract Tables from Scanned PDFs?",
        content:
          "Yes. This is one of the most common questions, and one of the biggest limitations of traditional converters. Scanned PDFs are essentially images — there's no text data to copy. Most free converters simply can't handle them.\n\nParsli uses built-in OCR (optical character recognition) powered by Google Gemini 2.5 Pro to read scanned and image-based PDFs. It doesn't just recognize characters — it understands the visual layout of tables, columns, and rows, extracting data with the same structure you see in the original document.",
      },
      {
        heading: "PDF to Excel vs Manual Data Entry",
        content:
          "Manual data entry from PDFs takes 15-30 minutes per document, depending on complexity. A 50-page bank statement or a stack of invoices can consume an entire day. And manual entry introduces errors — transposed digits, missed rows, misaligned columns.\n\nWith AI-powered extraction, a single document is processed in under 3 seconds with 95%+ accuracy. That's the difference between spending a day on data entry and spending 30 seconds. Multiply that across hundreds of documents per month, and the time savings are transformative.",
      },
    ],
    faq: [
      {
        question: "Is Parsli's PDF to Excel converter free?",
        answer:
          "Yes! The free tier includes 30 pages per month with no credit card required. For higher volumes, paid plans start at $20/month.",
      },
      {
        question: "Can you convert scanned PDFs to Excel?",
        answer:
          "Yes. Built-in OCR powered by Google Gemini 2.5 Pro handles scanned, photographed, and image-based PDFs — no separate OCR tool needed.",
      },
      {
        question: "Does it preserve table formatting?",
        answer:
          "Yes. The AI detects rows, columns, and headers automatically. Your spreadsheet comes out clean and structured, matching the original document layout.",
      },
      {
        question: "What formats can I export to?",
        answer:
          "Excel (.xlsx), CSV, or directly to Google Sheets. You can also get [structured JSON via the API](/guides/pdf-to-json-extraction) for custom workflows.",
      },
      {
        question: "How accurate is the conversion?",
        answer:
          "95%+ accuracy on most documents, including complex multi-column tables and scanned PDFs. Accuracy improves further with clear, high-resolution source documents.",
      },
      {
        question:
          "What's the difference between the free tool and Parsli AI?",
        answer:
          "The free PDF to Excel tool handles simple text-based PDFs. Parsli AI handles scanned documents, complex layouts, custom extraction schemas, [batch document processing](/guides/batch-process-documents-automatically), and automation via integrations and API.",
      },
    ],
    adCopyVariants: [
      "PDF to Excel in Seconds — AI-Powered",
      "Stop Retyping PDFs — Auto-Extract to Excel",
      "AI Converts Any PDF to Clean Spreadsheet Data",
      "Scanned PDFs? No Problem. Extract to Excel Free",
      "From PDF Chaos to Clean Excel — 3 Seconds Flat",
    ],
    relatedKeywords: [
      "extract tables from pdf",
      "pdf data extraction",
      "convert pdf to structured data",
      "pdf to csv converter",
    ],
    ctaPainPoint: "copying data from PDFs manually",
  },
  {
    slug: "invoice-parsing",
    keyword: "invoice parsing software",
    metaTitle: "Automate Invoice Parsing with AI | Parsli",
    metaDescription:
      "Extract invoice numbers, line items, totals, and vendor details from any invoice format — PDFs, scans, or images. No templates needed. Free to start.",
    h1: "Automate Invoice Parsing",
    h1Accent: "With AI, Not Templates",
    subtitle:
      "Extract invoice numbers, line items, totals, and vendor details from any invoice format — PDFs, scans, or images. No templates or rules to configure.",
    comparisonHeadline: "Skip the template-based parsing mess",
    painPoints: [
      "Every vendor sends a different invoice layout",
      "Manual data entry into accounting software",
      "Template-based parsers break on new formats",
      "Scanned or photographed invoices are unreadable",
      "Hours spent on data entry instead of analysis",
    ],
    solutions: [
      "AI reads any invoice layout without templates",
      "Data flows directly to your accounting tools",
      "Adapts to new vendor formats automatically",
      "Built-in OCR handles scans and photos",
      "Process a full invoice in under 3 seconds",
    ],
    saveLine: "Eliminate 90% of manual invoice data entry.",
    calloutBox: {
      title: "No Templates Needed",
      description:
        "Unlike template-based parsers, Parsli's AI adapts to any vendor's invoice format automatically. New vendor? Just send the invoice — no setup required.",
    },
    supportedTypes: [
      { emoji: "📄", name: "PDF Invoices" },
      { emoji: "📷", name: "Scanned Invoices" },
      { emoji: "📧", name: "Emailed Invoices" },
      { emoji: "🖼️", name: "Image Invoices" },
      { emoji: "📝", name: "Word & Excel" },
    ],
    howItWorks: [
      {
        step: "1",
        title: "Send Your Invoice",
        description:
          "Upload directly, forward via email, or send through the API. Any format works — PDF, image, or scan.",
      },
      {
        step: "2",
        title: "AI Reads and Extracts All Fields",
        description:
          "Parsli identifies vendor name, invoice number, line items, taxes, totals, and every field you define.",
      },
      {
        step: "3",
        title: "Data Flows to Your Tools",
        description:
          "Extracted data lands in Google Sheets, your accounting software, or your own systems via webhooks and API.",
      },
    ],
    benefits: [
      {
        title: "Works on Any Invoice Layout",
        description:
          "No templates or zones to configure. Parsli's AI understands document structure, so it handles any vendor's invoice format out of the box.",
      },
      {
        title: "Accurate Line Item Extraction",
        description:
          "Multi-row tables with description, quantity, unit price, and totals — extracted correctly every time.",
      },
      {
        title: "Handles Scanned Invoices",
        description:
          "Photographed or scanned invoices are processed with built-in OCR. No clean PDF required.",
      },
      {
        title: "Integrates with Your Workflow",
        description:
          "Connect to [QuickBooks](/guides/extract-invoice-data-to-quickbooks), Xero, Google Sheets, or any tool via [Zapier](/guides/parse-email-attachments-with-zapier), [Make](/guides/automate-receipt-processing-with-make), webhooks, or REST API.",
      },
    ],
    seoSections: [
      {
        heading: "Why Automate Invoice Processing?",
        content:
          "If your team processes more than 50 invoices per month, manual data entry is costing you real money. An AP clerk spends 3-5 minutes per invoice on data entry — that's 4+ hours per week just on typing. And manual entry has a 1-4% error rate, which means incorrect payments, duplicate entries, and time spent fixing mistakes.\n\nAutomated invoice parsing eliminates the data entry step entirely. The AI reads the invoice, extracts the fields you need, and sends structured data to your accounting system. Your team reviews and approves instead of typing — which is faster, more accurate, and far less tedious. Learn how to [automate invoice processing for your small business](/guides/automate-invoice-processing-for-small-business).",
      },
      {
        heading: "What Data Can Be Extracted from Invoices?",
        content:
          "Parsli extracts every standard invoice field: invoice number, date, due date, vendor name and address, PO number, line items (description, quantity, unit price, amount), subtotal, tax, discounts, and total. You can also define custom fields — like project codes, department names, or GL codes — using natural language instructions in the schema builder.\n\nFor line item tables, the AI handles multi-row descriptions, merged cells, and varying column layouts. It doesn't rely on fixed positions or templates — it reads the table the way you would.",
      },
      {
        heading: "Template-Based Parsing vs AI Parsing",
        content:
          "Traditional invoice parsers (like Docparser or older versions of Parseur) require you to create a template for each document layout. You draw zones around fields, set extraction rules, and test. When a vendor changes their invoice design — or you onboard a new vendor — you create a new template.\n\nAI parsing skips all of that. Parsli's AI understands document structure without templates. It reads the full context of the page, identifies fields semantically, and extracts data regardless of layout. New vendor? Just send the invoice. No setup required.",
      },
    ],
    faq: [
      {
        question: "Can Parsli handle invoices from different vendors?",
        answer:
          "Yes. The AI adapts to any vendor's invoice format without templates or per-vendor configuration. Just send the invoice and Parsli extracts the data.",
      },
      {
        question: "What fields can be extracted from invoices?",
        answer:
          "Invoice number, dates, vendor details, PO number, line items (description, quantity, unit price, amount), subtotal, tax, discounts, total, and any custom fields you define.",
      },
      {
        question: "Can I process emailed invoices automatically?",
        answer:
          "Yes. Forward invoices to your Parsli inbox or connect Gmail for automatic processing. Extracted data flows to your tools without manual intervention.",
      },
      {
        question: "How does AI parsing compare to template-based parsing?",
        answer:
          "AI parsing requires zero setup per vendor and adapts to layout changes automatically. Template-based parsers need manual configuration for each format and break when layouts change.",
      },
      {
        question: "Is there an API for invoice processing?",
        answer:
          "Yes. Send invoices via REST API and get [structured JSON back](/guides/pdf-to-json-extraction) in under 3 seconds. Perfect for integrating invoice extraction into your own applications.",
      },
    ],
    adCopyVariants: [
      "Invoice Parsing on Autopilot — AI-Powered",
      "Extract Invoice Data in Seconds, Not Hours",
      "No Templates Needed — AI Reads Any Invoice",
      "Stop Manual Invoice Entry — Automate with AI",
      "Invoice OCR That Actually Works — Try Free",
    ],
    relatedKeywords: [
      "automated invoice processing",
      "invoice OCR",
      "invoice extraction",
      "accounts payable automation",
      "pdf parser for invoices",
    ],
    ctaPainPoint: "entering invoice data manually",
  },
  {
    slug: "bank-statement-extraction",
    keyword: "bank statement to excel",
    metaTitle: "Convert Bank Statements to Excel Instantly | Parsli",
    metaDescription:
      "Upload any bank statement PDF — even scanned ones — and get clean, structured transaction data in Excel or CSV. No manual data entry. Free to start.",
    h1: "Convert Bank Statements to Excel",
    h1Accent: "Instantly, From Any Bank",
    subtitle:
      "Upload any bank statement PDF — even scanned ones — and get clean, structured transaction data in Excel or CSV. No manual data entry.",
    comparisonHeadline: "Skip retyping 100+ transactions by hand",
    painPoints: [
      "Retyping transactions from PDF statements by hand",
      "Different banks use different statement formats",
      "Scanned or printed statements have no copyable text",
      "Multi-page statements take hours to process",
      "Errors from manual entry throw off reconciliation",
    ],
    solutions: [
      "Upload a statement and get structured data in seconds",
      "AI adapts to any bank's format automatically",
      "Built-in OCR reads scanned and printed statements",
      "Multi-page statements processed as a single dataset",
      "95%+ accuracy eliminates reconciliation errors",
    ],
    saveLine: "Process a 50-page statement in 10 seconds, not 3 hours.",
    calloutBox: {
      title: "Works with Any Bank",
      description:
        "Chase, Bank of America, Wells Fargo, HSBC, or your local credit union — Parsli adapts to any bank's statement layout without per-bank configuration.",
    },
    supportedTypes: [
      { emoji: "💻", name: "Digital PDFs" },
      { emoji: "📷", name: "Scanned Statements" },
      { emoji: "🖨️", name: "Printed Statements" },
      { emoji: "📑", name: "Multi-Page Statements" },
      { emoji: "🏦", name: "Any Bank Format" },
    ],
    howItWorks: [
      {
        step: "1",
        title: "Upload Bank Statement PDF",
        description:
          "Drop in any bank statement — from any bank, any format. Scanned, printed, or digital.",
      },
      {
        step: "2",
        title: "AI Extracts Every Transaction",
        description:
          "Date, description, amount, balance — Parsli reads and structures every line of every transaction.",
      },
      {
        step: "3",
        title: "Export to Excel, CSV, or Sheets",
        description:
          "Download clean data as Excel or CSV, or push it directly to Google Sheets for instant analysis.",
      },
    ],
    benefits: [
      {
        title: "Works with Any Bank Format",
        description:
          "Chase, Bank of America, Wells Fargo, HSBC — Parsli's AI adapts to any bank's statement layout without configuration.",
      },
      {
        title: "Handles Scanned Statements",
        description:
          "Printed or scanned bank statements are processed with built-in OCR. No clean digital PDF required.",
      },
      {
        title: "Extracts All Transaction Fields",
        description:
          "Date, description, debit, credit, running balance — every field is captured and structured accurately.",
      },
      {
        title: "Processes Multi-Page Statements",
        description:
          "50-page annual statement? No problem. Parsli processes every page and returns one clean, unified dataset. You can also [batch process documents automatically](/guides/batch-process-documents-automatically).",
      },
    ],
    seoSections: [
      {
        heading: "Why Convert Bank Statements to Excel?",
        content:
          "Accountants, bookkeepers, and financial analysts regularly need bank transaction data in spreadsheet format for reconciliation, auditing, and analysis. But banks provide statements as PDFs — and most don't offer CSV downloads for older statements or scanned documents.\n\nManually retyping transactions is the most common workaround, and it's painfully slow. A typical monthly statement with 100+ transactions takes 1-2 hours to type, and errors are inevitable. AI-powered extraction converts the entire statement in seconds with structured output you can immediately use.",
      },
      {
        heading: "Can You Extract Data from Scanned Bank Statements?",
        content:
          "Yes. Many bank statements — especially older ones, paper archives, or statements from smaller banks — are only available as scans or photos. These are images, not digital text, so traditional copy-paste doesn't work.\n\nParsli's built-in OCR reads scanned bank statements the same way it reads digital PDFs. It identifies the transaction table structure, recognizes dates, amounts, and descriptions, and outputs clean structured data. Even low-quality scans are handled with AI-enhanced character recognition.",
      },
      {
        heading: "How AI Bank Statement Extraction Works",
        content:
          "Traditional bank statement converters use fixed rules — they look for text at specific positions on the page. This breaks whenever a bank changes their format or when you switch banks.\n\nParsli uses AI that reads the full page context. It identifies the transaction table by understanding what a bank statement looks like — recognizing patterns like date columns, debit/credit amounts, and running balances. This means it works on any bank's format without configuration. Upload the statement, and the AI figures out the structure automatically.",
      },
    ],
    faq: [
      {
        question: "Does it work with any bank's statement format?",
        answer:
          "Yes. Parsli's AI adapts to any bank's layout automatically — Chase, Bank of America, Wells Fargo, HSBC, and thousands more. No per-bank configuration needed.",
      },
      {
        question: "Can you extract data from scanned bank statements?",
        answer:
          "Yes. Built-in OCR reads scanned and printed statements with the same accuracy as digital PDFs. Even low-quality scans are handled.",
      },
      {
        question: "What transaction fields are extracted?",
        answer:
          "Date, description, debit amount, credit amount, and running balance. You can also define custom fields like category or reference number.",
      },
      {
        question: "Can it handle multi-page statements?",
        answer:
          "Yes. A 50-page annual statement is processed as a single unified dataset — all transactions in one clean export.",
      },
      {
        question: "How long does extraction take?",
        answer:
          "Most statements are processed in under 10 seconds, regardless of page count. A typical monthly statement with 100+ transactions takes about 3 seconds.",
      },
    ],
    adCopyVariants: [
      "Bank Statement to Excel in Seconds",
      "Stop Retyping Bank Transactions — Use AI",
      "Any Bank, Any Format — Extract to Excel Free",
      "Scanned Bank Statements? Extract to CSV Instantly",
      "Bank PDF to Spreadsheet — Automated with AI",
    ],
    relatedKeywords: [
      "bank statement data extraction",
      "bank statement converter",
      "bank pdf to csv",
      "bank statement OCR",
    ],
    ctaPainPoint: "retyping bank transactions",
  },
  {
    slug: "no-code-document-parser",
    keyword: "no-code document parser",
    metaTitle: "Parse Any Document Without Code | Parsli",
    metaDescription:
      "Define what data you need in plain English. Parsli's AI handles the rest — no templates, no zones, no programming required. Free to start.",
    h1: "Parse Any Document",
    h1Accent: "Without Writing Code",
    subtitle:
      "Define what data you need in plain English. Parsli's AI handles the rest — no templates, no zones, no programming required.",
    comparisonHeadline: "Skip hiring a developer to build parsers",
    painPoints: [
      "Need a developer to build custom document parsers",
      "Template-based tools require per-format configuration",
      "Rule-based systems break when layouts change",
      "Weeks of setup before you extract a single field",
      "Every new document type means starting over",
    ],
    solutions: [
      "Visual schema builder — point and click",
      "AI adapts to any document layout automatically",
      "Describe fields in plain English, not regex",
      "Start extracting in minutes, not weeks",
      "One parser handles unlimited document variations",
    ],
    saveLine: "Go from zero to extracting data in under 5 minutes.",
    calloutBox: {
      title: "No Developer Required",
      description:
        "Anyone on your team — operations, finance, HR — can set up a document parser in minutes using the visual schema builder. No programming knowledge needed.",
    },
    supportedTypes: [
      { emoji: "📄", name: "PDFs" },
      { emoji: "🖼️", name: "Images" },
      { emoji: "📷", name: "Scanned Docs" },
      { emoji: "📧", name: "Emails" },
      { emoji: "📝", name: "Word & Excel" },
    ],
    howItWorks: [
      {
        step: "1",
        title: "Describe Your Fields",
        description:
          "Use the visual schema builder to define field names, types, and extraction instructions — in plain English.",
      },
      {
        step: "2",
        title: "Upload or Send Documents",
        description:
          "Drag and drop files, forward emails, or connect via API. PDFs, images, scans — all supported.",
      },
      {
        step: "3",
        title: "Get Structured Data Instantly",
        description:
          "Extracted data flows to Google Sheets, webhooks, Zapier, Make, or your own systems automatically.",
      },
    ],
    benefits: [
      {
        title: "Visual Schema Builder",
        description:
          "Point-and-click interface to define extraction fields. Choose types, set requirements, and add instructions — no code needed.",
      },
      {
        title: "AI Understands Context",
        description:
          "No rigid templates or zone drawing. Parsli's AI reads and understands the full document, adapting to any layout.",
      },
      {
        title: "Works with Any Document Type",
        description:
          "PDFs, images, scans, emails, Word docs — if it contains data, Parsli can extract it.",
      },
      {
        title: "5,000+ App Integrations",
        description:
          "Connect to Google Sheets, [Zapier](/guides/parse-email-attachments-with-zapier), [Make](/guides/automate-receipt-processing-with-make), and thousands more. Or use webhooks and the REST API for custom workflows.",
      },
    ],
    seoSections: [
      {
        heading: "What Is No-Code Document Parsing?",
        content:
          "No-code document parsing means extracting structured data from documents — PDFs, invoices, receipts, forms — without writing any code. Instead of building custom scripts or configuring regex patterns, you use a visual interface to tell the system what data you need, and AI handles the extraction. See how to [extract data from PDFs without code](/guides/extract-data-from-pdfs-without-code).\n\nThis is a fundamental shift from traditional document processing. Older tools require developers to write parsing rules or draw extraction zones for every document template. With no-code AI parsing, anyone on your team — operations, finance, HR — can set up a document parser in minutes.",
      },
      {
        heading: "Who Needs a No-Code Document Parser?",
        content:
          "Any team that regularly processes documents but doesn't have developer resources to build custom extraction. Common examples: finance teams processing invoices, HR teams handling resumes and applications, operations teams managing [shipping documents](/guides/extract-data-from-shipping-documents), and real estate teams [extracting data from contracts](/guides/extract-data-from-contracts). Other popular use cases include healthcare teams processing [medical records](/guides/extract-data-from-medical-records), claims departments handling [insurance claims](/guides/extract-data-from-insurance-claims), accountants extracting data from [tax forms](/guides/extract-data-from-tax-forms), and facilities teams digitizing [utility bills](/guides/extract-data-from-utility-bills).\n\nIf your current process involves someone manually reading documents and typing data into a spreadsheet or system, a no-code document parser can automate that entire step. The ROI is immediate — less manual work, fewer errors, faster turnaround.",
      },
      {
        heading: "No-Code vs Developer-Built Document Parsing",
        content:
          "Building document parsing in-house typically requires: an OCR engine, a text extraction pipeline, custom parsing logic per document type, error handling, and ongoing maintenance when formats change. That's weeks of developer time per document type, plus ongoing maintenance.\n\nA no-code platform like Parsli replaces all of that with a 5-minute setup. You define your schema visually, upload a document, and start extracting. The AI model is already trained on millions of documents — no training data from you required. And when document formats change, the AI adapts automatically.",
      },
    ],
    faq: [
      {
        question: "Do I need technical skills to use Parsli?",
        answer:
          "No. The visual schema builder uses plain English descriptions. Anyone on your team can create a parser and start extracting data in minutes.",
      },
      {
        question: "What document types are supported?",
        answer:
          "PDFs, images (JPEG, PNG), scanned documents, emails, Word docs (.docx), and Excel files (.xlsx). If it contains data, Parsli can extract it.",
      },
      {
        question: "Can I define custom extraction fields?",
        answer:
          "Yes. Add any field you need with types like text, number, date, boolean, table, list, and more. Use natural language instructions to guide the AI.",
      },
      {
        question:
          "How is this different from template-based parsers?",
        answer:
          "No zones to draw, no rules to write. Parsli's AI understands document context and adapts to any layout automatically. Template parsers break when formats change — Parsli doesn't.",
      },
      {
        question: "Can I automate document processing end-to-end?",
        answer:
          "Yes. Connect via email forwarding, API, Zapier, Make, or webhooks for fully hands-free processing. You can even [batch process documents automatically](/guides/batch-process-documents-automatically). Documents in, structured data out — automatically.",
      },
    ],
    adCopyVariants: [
      "Document Parsing Without Code — AI Does It All",
      "No Templates. No Zones. Just Define and Extract",
      "Parse PDFs, Invoices, Receipts — Zero Code",
      "AI Document Parser — No Programming Required",
      "From Document to Data in Minutes, Not Weeks",
    ],
    relatedKeywords: [
      "no-code data extraction tool",
      "AI PDF parser no-code",
      "document automation no-code",
      "no-code OCR",
    ],
    ctaPainPoint: "building document parsing from scratch",
  },
  {
    slug: "document-parsing-api",
    keyword: "document parsing API",
    metaTitle: "Document Parsing API for Developers | Parsli",
    metaDescription:
      "One API call to extract structured data from any document. RESTful, fast, and accurate — powered by Google Gemini 2.5 Pro. Free tier available.",
    h1: "Document Parsing API",
    h1Accent: "One Call, Structured Data",
    subtitle:
      "One API call to extract structured data from any document. RESTful, fast, and accurate — powered by Google Gemini 2.5 Pro.",
    comparisonHeadline: "Skip building your own OCR pipeline",
    painPoints: [
      "Building and maintaining custom OCR pipelines",
      "Training ML models on your own document data",
      "Handling different document formats and layouts",
      "OCR accuracy drops on scanned or noisy documents",
      "Weeks of development before you can extract a field",
    ],
    solutions: [
      "Single REST endpoint for all document types",
      "Pre-trained AI — no training data from you",
      "Handles PDFs, images, scans, any layout",
      "AI-enhanced OCR for high accuracy on any input",
      "Start extracting in minutes with your API key",
    ],
    saveLine: "Replace months of OCR pipeline work with a single API call.",
    calloutBox: {
      title: "Pre-Trained AI — No Training Data Required",
      description:
        "Parsli's AI is already trained on millions of documents. Send any document type and get structured data back — no training data, no model fine-tuning from you.",
    },
    supportedTypes: [
      { emoji: "📄", name: "PDF" },
      { emoji: "🖼️", name: "JPEG & PNG" },
      { emoji: "📷", name: "TIFF" },
      { emoji: "📝", name: "Word (.docx)" },
      { emoji: "📊", name: "Excel (.xlsx)" },
    ],
    howItWorks: [
      {
        step: "1",
        title: "Send Document via REST API",
        description:
          "POST your PDF, image, or scan to the extraction endpoint with your API key and schema ID.",
      },
      {
        step: "2",
        title: "AI Extracts Per Your Schema",
        description:
          "Parsli processes the document against your defined extraction schema — custom fields, types, and instructions.",
      },
      {
        step: "3",
        title: "Get Structured JSON Response",
        description:
          "Receive clean, typed JSON with extracted fields, confidence scores, and metadata. Ready for your pipeline. Learn more about [PDF to JSON extraction](/guides/pdf-to-json-extraction).",
      },
    ],
    benefits: [
      {
        title: "Simple REST API",
        description:
          "Clean RESTful endpoints with clear documentation. Authenticate with an API key. Extract with a single POST request.",
      },
      {
        title: "Any Document Type",
        description:
          "PDF, JPEG, PNG, TIFF, Word — send any document format. You can even [extract data from Excel to JSON](/guides/extract-data-from-excel-to-json). Built-in OCR handles scanned and image-based documents.",
      },
      {
        title: "Custom Extraction Schemas",
        description:
          "Define exactly what fields to extract with types, validation rules, and natural language instructions.",
      },
      {
        title: "Sub-3-Second Processing",
        description:
          "Most documents are processed in under 3 seconds. Built for production workloads with reliable uptime.",
      },
    ],
    seoSections: [
      {
        heading: "What Is a Document Parsing API?",
        content:
          "A document parsing API is a web service that accepts a document (PDF, image, scan) and returns structured data — typically as JSON. Instead of building your own OCR and extraction pipeline, you send the document to an API endpoint, and it returns the extracted fields.\n\nParsli's API goes beyond basic OCR. It uses Google Gemini 2.5 Pro to understand document structure, context, and semantics. You define a schema describing the fields you need, and the AI extracts them from any document layout — no templates, no training data, no per-format configuration.",
      },
      {
        heading: "How to Integrate Document Extraction into Your App",
        content:
          "Integration takes three steps: (1) Create an extraction schema in the Parsli dashboard defining your fields. (2) Get your API key. (3) Send a POST request with your document and schema ID. The response is structured JSON you can immediately use in your application.\n\nParsli supports both synchronous extraction (response includes results) and webhook callbacks for async processing. SDKs are available for Python, Node.js, and cURL examples are in the docs. Most developers have a working integration in under 30 minutes.",
      },
      {
        heading: "Building Your Own OCR vs Using an API",
        content:
          "Building an in-house document parsing pipeline typically requires: Tesseract or a commercial OCR engine, text extraction and cleanup, custom parsing logic per document type, table detection, and ongoing maintenance. That's 2-4 weeks of development per document type, plus infra costs and maintenance.\n\nA document parsing API like Parsli replaces all of that with a single endpoint. You get AI-powered extraction that handles any document type — from [contracts](/guides/extract-data-from-contracts) and [medical records](/guides/extract-data-from-medical-records) to [insurance claims](/guides/extract-data-from-insurance-claims) and [tax forms](/guides/extract-data-from-tax-forms) — any layout, with built-in OCR, all for a predictable per-page price. The trade-off is straightforward: build and maintain it yourself, or pay per page for a solution that just works.",
      },
    ],
    faq: [
      {
        question: "How do I authenticate with the API?",
        answer:
          "Use a Bearer token with your API key in the Authorization header. Get your key from the Parsli dashboard — takes 30 seconds.",
      },
      {
        question: "What document formats does the API accept?",
        answer:
          "PDF, JPEG, PNG, TIFF, Word (.docx), and Excel (.xlsx). Send documents as a URL or base64-encoded payload.",
      },
      {
        question: "How fast is the API?",
        answer:
          "Most documents are processed in under 3 seconds. Built for production workloads with reliable uptime and consistent response times.",
      },
      {
        question: "Can I define custom extraction schemas?",
        answer:
          "Yes. Create schemas in the dashboard with custom fields, types (text, number, date, table, list), and natural language instructions to guide the AI.",
      },
      {
        question: "Is there a free tier?",
        answer:
          "Yes. 30 free pages per month with no credit card required. Paid plans start at $20/month for higher volumes.",
      },
      {
        question: "Do you support webhooks for async processing?",
        answer:
          "Yes. Configure webhook callbacks to receive results when extraction completes. Ideal for [batch document processing](/guides/batch-process-documents-automatically) and background jobs.",
      },
    ],
    codeExample: {
      title: "Extract Data from Any Document",
      language: "javascript",
      code: `const response = await fetch('https://api.parsli.co/v1/extract', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document_url: 'https://example.com/invoice.pdf',
    schema_id: 'inv_schema_001'
  })
});

const { data } = await response.json();
console.log(data.fields);
// {
//   invoice_number: "INV-2026-001",
//   vendor: "Acme Corp",
//   total: "$1,362.50",
//   line_items: [
//     { description: "Widget A", qty: 10, amount: "$1,000.00" },
//     { description: "Widget B", qty: 5, amount: "$250.00" }
//   ]
// }`,
    },
    adCopyVariants: [
      "Document Parsing API — One Call, Structured Data",
      "Extract Data from Any Document — REST API",
      "Developer-Friendly Document Extraction API",
      "PDF to JSON in 3 Seconds — API-First",
      "Document AI API — Free Tier Available",
    ],
    relatedKeywords: [
      "pdf data extraction API",
      "document digitization API",
      "information extraction API",
      "OCR API",
    ],
    ctaPainPoint: "building document parsing infrastructure",
  },
  {
    slug: "logistics-document-automation",
    keyword: "logistics document automation",
    metaTitle: "Automate Logistics Document Processing with AI | Parsli",
    metaDescription: "Automate BOL, freight invoice, and shipping document processing. AI extracts data from any carrier format and pushes to your WMS/TMS. 92% time reduction. Start free.",
    h1: "Automate Logistics Document Processing",
    h1Accent: "From Loading Dock to Database",
    subtitle: "Stop hiring more clerks to keep up with paperwork. Parsli's AI extracts structured data from bills of lading, freight invoices, packing lists, and shipping documents — any carrier, any format.",
    comparisonHeadline: "End the manual data entry bottleneck",
    painPoints: [
      "Manually keying BOL data into your WMS — 12+ minutes per document",
      "Different format for every carrier — UPS, FedEx, XPO, ODFL all look different",
      "Faded thermal dock prints that traditional OCR can't read",
      "3-7 day billing lag because freight invoices sit in a manual processing queue",
      "Scaling means hiring more data entry clerks — not a sustainable model",
    ],
    solutions: [
      "AI reads any carrier's BOL or invoice format without templates",
      "Handles faded thermal prints, carbon copies, and handwritten annotations",
      "Process 300+ documents per day — no additional headcount needed",
      "Extracted data flows to your WMS, TMS, or ERP in seconds via API",
      "92% time reduction — from 12.7 minutes to under 1 minute per document",
    ],
    saveLine: "Save 60+ clerk-hours per day on logistics document processing.",
    calloutBox: {
      title: "Works with Dock-Quality Documents",
      description: "Google Gemini 2.5 Pro reads faded thermal BOL prints, low-contrast warehouse scans, and even handwritten notes — documents that break traditional OCR. No pre-processing or image cleanup required.",
    },
    supportedTypes: [
      { emoji: "\u{1F4CB}", name: "Bills of Lading" },
      { emoji: "\u{1F9FE}", name: "Freight Invoices" },
      { emoji: "\u{1F4E6}", name: "Packing Lists" },
      { emoji: "\u{1F6C3}", name: "Customs Forms" },
      { emoji: "\u{1F4EC}", name: "Delivery Notes" },
    ],
    howItWorks: [
      {
        step: "1",
        title: "Forward Documents via Email or API",
        description: "Forward BOLs and freight invoices from your inbox, scan them at the dock, or send via REST API. Parsli ingests from any source.",
      },
      {
        step: "2",
        title: "AI Extracts Data Per Your Schema",
        description: "Define the fields you need — shipper, consignee, weight, freight class, PRO number, charges — and the AI extracts them from any format.",
      },
      {
        step: "3",
        title: "Data Flows to Your WMS/TMS",
        description: "Extracted data pushes to your warehouse management system, TMS, ERP, or Google Sheets automatically via webhooks, Zapier, or REST API.",
      },
    ],
    benefits: [
      {
        title: "Any Carrier Format",
        description: "UPS, FedEx, XPO, ODFL, Estes, R+L, Saia — the AI adapts to any carrier's document layout without carrier-specific templates or configuration.",
      },
      {
        title: "Dock-Quality OCR",
        description: "Google Gemini 2.5 Pro reads faded thermal prints, crooked scans, and carbon copies that traditional OCR engines can't process. No image pre-processing needed.",
      },
      {
        title: "WMS/TMS Integration",
        description: "Push extracted data directly to your existing systems via REST API, webhooks, or [Zapier](/guides/parse-email-attachments-with-zapier). No middleware required.",
      },
      {
        title: "Freight Audit Trail",
        description: "Every extraction includes confidence scores and original document links. Build automated 3-way matching between BOLs, POs, and invoices for freight audit.",
      },
    ],
    seoSections: [
      {
        heading: "Why Logistics Document Processing Needs Automation",
        content: "A mid-size 3PL processes 300-500 shipping documents daily — bills of lading, freight invoices, packing lists, customs forms, and delivery notes. At 12+ minutes per document for manual data entry, that's 60-100 clerk-hours per day just typing data from paper into screens.\n\nThe problem isn't just speed. [20-30% of freight invoices contain errors](/blog/bol-errors-prevention-guide) when processed manually — wrong freight class, incorrect weight, missed surcharges. Each error triggers a billing dispute, delay, or financial loss. And the talent pool for data entry clerks in logistics hubs like Columbus is getting tighter every year.\n\nAI-powered document automation eliminates this bottleneck. Instead of clerks manually reading and typing, the AI reads the document, extracts structured data per your schema, and pushes it directly to your WMS or TMS. Processing time drops from 12.7 minutes to under 1 minute — a [92% reduction](/blog/cost-of-manual-data-entry-3pl) with dramatically fewer errors.",
      },
      {
        heading: "What Logistics Documents Can Be Automated?",
        content: "Parsli handles the full spectrum of logistics paperwork. [Bills of lading](/document-types/bills-of-lading) — extract shipper, consignee, description of goods, weight, freight class, NMFC code, PRO number, and special instructions from any BOL format. [Freight invoices](/document-types/freight-invoices) — extract carrier name, PRO number, origin/destination, weight, class, rates, surcharges, accessorial charges, and totals.\n\nBeyond BOLs and freight invoices, Parsli processes packing lists (item descriptions, quantities, weights, dimensions), customs forms (HS codes, declared values, country of origin), and delivery notes (recipient, delivery date, signature confirmation, exceptions). Each document type uses a custom schema — you define exactly which fields to extract.",
      },
      {
        heading: "From Loading Dock to Database in Seconds",
        content: "Here's what the workflow looks like in practice. A driver hands over a BOL at your receiving dock. Your warehouse associate scans it with a phone or desk scanner. The scan hits Parsli via email forwarding or API webhook. Within seconds, the AI extracts shipper name, consignee, weight, piece count, freight class, and PRO number. That data appears in your WMS immediately — no clerk involvement, no manual keying, no delay.\n\nFor freight invoices, the flow is similar. Carrier invoices arrive via email. Parsli's Gmail integration auto-processes attachments from carrier email addresses. Extracted data — rates, surcharges, totals — flows to your accounting system for automated 3-way matching against BOLs and POs. Discrepancies get flagged; clean matches get auto-approved.",
      },
    ],
    faq: [
      {
        question: "Can Parsli handle different BOL formats from different carriers?",
        answer: "Yes. Parsli's AI adapts to any document layout without templates. Whether it's a UPS, FedEx, XPO, ODFL, or custom carrier BOL, the AI reads the document and extracts the fields you defined in your schema.",
      },
      {
        question: "Does it work with faded thermal BOL prints?",
        answer: "Yes. Parsli uses Google Gemini 2.5 Pro which reads faded thermal prints, low-contrast scans, and carbon copies significantly better than traditional OCR. No image pre-processing required.",
      },
      {
        question: "Can I integrate with my WMS or TMS?",
        answer: "Yes. Use the REST API or webhooks to push extracted data directly to any WMS, TMS, or ERP system. Parsli also integrates with Zapier (5,000+ apps), Make, and Google Sheets.",
      },
      {
        question: "How many documents can Parsli process per day?",
        answer: "There's no daily processing limit beyond your plan's monthly page quota. Most logistics operations process 300-500+ documents per day on Growth or Pro plans without issues.",
      },
      {
        question: "What about customs and international shipping documents?",
        answer: "Parsli processes customs declarations, commercial invoices, certificates of origin, and other international trade documents. The AI supports documents in multiple languages.",
      },
      {
        question: "How accurate is the extraction?",
        answer: "95%+ accuracy on standard logistics documents. Each extraction includes per-field confidence scores so you can auto-approve high-confidence results and route exceptions for human review.",
      },
    ],
    codeExample: {
      title: "Extract BOL Data via API",
      language: "javascript",
      code: `const response = await fetch('https://api.parsli.co/v1/extract', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    parser_id: 'your_bol_parser_id',
    file_url: 'https://example.com/bol-document.pdf',
  }),
});

const data = await response.json();
// {
//   "shipper_name": "ABC Manufacturing Co.",
//   "consignee_name": "XYZ Distribution LLC",
//   "weight": "12,450 lbs",
//   "freight_class": "85",
//   "pro_number": "PRO-2026-004817",
//   "description_of_goods": "Industrial components, NMFC 156400",
//   "pieces": 24,
//   "special_instructions": "Dock delivery, no appointment needed"
// }`,
    },
    adCopyVariants: [
      "Stop keying BOL data by hand. Parsli AI extracts from any carrier format.",
      "From loading dock to WMS in seconds. Automate 3PL document processing.",
      "92% faster logistics document processing. No templates, no training.",
    ],
    relatedKeywords: [
      "logistics document automation",
      "automate bill of lading processing",
      "freight invoice automation",
      "3PL document processing",
      "shipping document OCR",
      "WMS data entry automation",
      "BOL data extraction",
      "freight document parsing",
    ],
    ctaPainPoint: "Still keying BOL data into your WMS by hand?",
  },
]

export function getAllSolutions(): SolutionPage[] {
  return solutions
}

export function getSolutionBySlug(slug: string): SolutionPage | undefined {
  return solutions.find((s) => s.slug === slug)
}

export function getAllSolutionSlugs(): string[] {
  return solutions.map((s) => s.slug)
}
