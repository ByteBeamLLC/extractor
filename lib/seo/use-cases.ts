export interface UseCaseData {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  h1: string
  heroDescription: string
  painPoints: { title: string; description: string }[]
  features: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
}

export const useCases: UseCaseData[] = [
  {
    slug: "invoice-parsing",
    title: "Invoice Parsing",
    metaTitle: "AI Invoice Parser — Extract Data Automatically",
    metaDescription:
      "Extract vendor names, amounts, line items, and due dates from invoices automatically with AI. No-code invoice parser with Google Sheets and Zapier integrations.",
    h1: "AI-Powered Invoice Parsing Software",
    heroDescription:
      "Stop manually entering invoice data. Parsli extracts vendor names, amounts, line items, due dates, and more from any invoice format — PDF, image, or email attachment.",
    painPoints: [
      {
        title: "Manual Invoice Processing is Slow",
        description:
          "Your team spends hours each week typing invoice data into spreadsheets or accounting software. According to the Institute of Finance and Management (IOFM), the average cost to manually process a single invoice is $15.97, with cycle times averaging 10–15 days — every invoice means more manual work and mounting costs.",
      },
      {
        title: "Data Entry Errors Cost Money",
        description:
          "One wrong digit in an invoice amount can lead to payment errors, late fees, and vendor disputes. The Association for Financial Professionals (AFP) reports that 3.6% of all payments contain errors, with the average cost to correct a single invoice error exceeding $53. Manual entry is inherently error-prone.",
      },
      {
        title: "Can't Keep Up with Volume",
        description:
          "As your business grows, so does the number of invoices. Ardent Partners research shows that 62% of AP departments still rely on manual data entry, creating unsustainable bottlenecks as invoice volumes grow. Hiring more people to process them isn't scalable or cost-effective. Learn how to [automate invoice processing for your small business](/guides/automate-invoice-processing-for-small-business).",
      },
    ],
    features: [
      {
        title: "Extract Any Invoice Field",
        description:
          "Invoice number, vendor name, billing address, line items, subtotal, tax, total, due date, PO number — define the fields you need.",
      },
      {
        title: "Table & Line Item Extraction",
        description:
          "Parsli's table field type extracts multi-row line items with description, quantity, unit price, and total for each line.",
      },
      {
        title: "Auto-Process from Gmail",
        description:
          "Connect Gmail to automatically extract data from invoice email attachments as they arrive. You can also [parse email attachments with Zapier](/guides/parse-email-attachments-with-zapier). No manual upload needed.",
      },
      {
        title: "Export to Accounting Tools",
        description:
          "Send extracted data to Google Sheets, [QuickBooks (via Zapier)](/guides/extract-invoice-data-to-quickbooks), Xero, or your own accounting system via webhooks.",
      },
    ],
    faqs: [
      {
        question: "What invoice formats does Parsli support?",
        answer:
          "Parsli processes PDF invoices, scanned invoices (images), Word document invoices, and email-based invoices. Our OCR handles any format.",
      },
      {
        question: "Can Parsli extract line items from invoices?",
        answer:
          "Yes. Use the table field type to extract multi-row line items including description, quantity, unit price, and line total.",
      },
      {
        question: "How accurate is invoice parsing?",
        answer:
          "With well-defined schemas, Parsli achieves 95%+ field-level accuracy, consistent with the Everest Group IDP PEAK Matrix benchmark for AI-powered extraction on structured documents. The AI provides confidence scores so you can flag uncertain extractions for review.",
      },
    ],
  },
  {
    slug: "email-parsing",
    title: "Email Parsing",
    metaTitle: "AI Email Parser — Auto-Extract Email Data",
    metaDescription:
      "Parse emails and extract structured data automatically with AI. Auto-process Gmail attachments, extract order details, leads, and notifications. No code required.",
    h1: "Automated Email Parsing & Data Extraction",
    heroDescription:
      "Turn incoming emails into structured data automatically. Parsli connects to your Gmail inbox and extracts data from email bodies and attachments in real-time.",
    painPoints: [
      {
        title: "Drowning in Email Data",
        description:
          "Important data arrives in emails every day — orders, leads, notifications, invoices. McKinsey Global Institute research shows knowledge workers spend 28% of their workday reading and responding to emails, and manually copying this data into other systems is a full-time job that could be automated.",
      },
      {
        title: "Missed Information",
        description:
          "According to the Radicati Group, the average professional receives 121 business emails per day — when data extraction depends on humans reading every one, things get missed. Important leads go cold and orders get delayed.",
      },
      {
        title: "No Structured Data",
        description:
          "Forrester estimates that 80% of business-critical data remains trapped in unstructured formats like emails and attachments. You need that data in spreadsheets, CRMs, or databases to act on it.",
      },
    ],
    features: [
      {
        title: "Gmail Inbox Automation",
        description:
          "Connect your Gmail account (read-only) and filter by sender. Parsli auto-processes attachments from specified email addresses.",
      },
      {
        title: "Parse Email Bodies & Attachments",
        description:
          "Extract data from both the email body text and attached files (PDFs, images, spreadsheets).",
      },
      {
        title: "Real-Time Processing",
        description:
          "Parsli checks your inbox every 5 minutes and processes new matching emails automatically.",
      },
      {
        title: "Route Data Anywhere",
        description:
          "Send extracted email data to Google Sheets, [Zapier](/guides/parse-email-attachments-with-zapier), [Make](/guides/automate-receipt-processing-with-make), CRMs, or any webhook endpoint.",
      },
    ],
    faqs: [
      {
        question: "Is my email data secure?",
        answer:
          "Yes. Parsli only requests read-only access to Gmail. We cannot send, delete, or modify your emails. All data is encrypted and stored with row-level security.",
      },
      {
        question: "Can I filter which emails get processed?",
        answer:
          "Yes. You set a sender filter so only emails from specific addresses are processed. For example, only process emails from invoices@supplier.com.",
      },
      {
        question: "Does Parsli work with Outlook or other email providers?",
        answer:
          "Currently Parsli has native Gmail integration. For other providers, you can forward emails to a Parsli webhook endpoint or use Zapier/Make to connect any email service.",
      },
    ],
  },
  {
    slug: "pdf-data-extraction",
    title: "PDF Data Extraction",
    metaTitle: "PDF Data Extraction Software - Extract Data from PDFs with AI",
    metaDescription:
      "Extract structured data from PDFs automatically using AI. Handles scanned PDFs, digital PDFs, tables, forms, and complex layouts. Built-in OCR. Start free.",
    h1: "Extract Data from PDFs Automatically with AI",
    heroDescription:
      "Turn any PDF into structured, usable data. Parsli's AI reads text, tables, forms, and even [handwritten content](/guides/extract-data-from-handwritten-documents) from both digital and scanned PDFs.",
    painPoints: [
      {
        title: "PDFs Lock Away Your Data",
        description:
          "IDC estimates over 2.5 trillion PDFs are in circulation globally, and Forrester research indicates that 80% of business-critical data remains trapped in unstructured formats. PDFs are designed for viewing, not data extraction — copying text loses structure, tables break, and scanned PDFs can't even be selected.",
      },
      {
        title: "Traditional OCR Falls Short",
        description:
          "Basic OCR tools give you raw text without understanding the document structure. Everest Group's IDP PEAK Matrix assessment finds that AI-powered extraction achieves 85–95% straight-through processing rates, compared to under 50% with template-based OCR — yet most teams still manually organize the extracted text.",
      },
      {
        title: "Every PDF is Different",
        description:
          "Invoices, [contracts](/guides/extract-data-from-contracts), reports — each has a different layout. According to Gartner, organizations that invest in AI-powered document understanding see 30–50% faster processing compared to rule-based approaches. You need an intelligent solution that adapts to any PDF format.",
      },
    ],
    features: [
      {
        title: "Digital & Scanned PDFs",
        description:
          "Works with both native digital PDFs and scanned document images. Built-in OCR handles any quality. Learn how to [extract data from PDFs without code](/guides/extract-data-from-pdfs-without-code).",
      },
      {
        title: "Table Extraction",
        description:
          "Automatically detect and extract table data from PDFs, preserving row and column structure.",
      },
      {
        title: "Custom Schema",
        description:
          "Define exactly what data you need — whether it's [tax forms](/guides/extract-data-from-tax-forms), [utility bills](/guides/extract-data-from-utility-bills), or [shipping documents](/guides/extract-data-from-shipping-documents). The AI uses your schema to extract only relevant information.",
      },
      {
        title: "Batch Processing",
        description:
          "Process hundreds of PDFs through the API or Gmail automation. Each extraction takes just seconds. See how to [batch process documents automatically](/guides/batch-process-documents-automatically).",
      },
    ],
    faqs: [
      {
        question: "Can Parsli handle scanned PDFs?",
        answer:
          "Yes. Parsli uses AI-powered OCR to read text from scanned documents, photos, and image-based PDFs.",
      },
      {
        question: "What about multi-page PDFs?",
        answer:
          "Parsli processes all pages of a PDF. One multi-page document uses one page credit regardless of the number of pages.",
      },
      {
        question: "Can I extract tables from PDFs?",
        answer:
          "Yes. Use the table field type in your schema to extract structured table data with rows and columns preserved.",
      },
    ],
  },
  {
    slug: "receipt-scanning",
    title: "Receipt Scanning",
    metaTitle: "AI Receipt Scanner - Extract Receipt Data Automatically",
    metaDescription:
      "Scan receipts and extract store name, items, totals, payment method, and more with AI. Photo receipts, PDF receipts, email receipts. Start free.",
    h1: "AI Receipt Scanning & Data Extraction",
    heroDescription:
      "Snap a photo or upload a PDF — Parsli extracts store name, items purchased, totals, taxes, and payment method from any receipt in seconds.",
    painPoints: [
      {
        title: "Receipt Piles Keep Growing",
        description: "Paper receipts pile up for expense reports, accounting, and tax preparation. The Global Business Travel Association (GBTA) reports that the average expense report costs $58 to process and takes 20 minutes to complete manually — making receipt backlogs an expensive problem.",
      },
      {
        title: "Expense Reports Take Forever",
        description: "Employees spend valuable time manually creating expense reports from stacks of receipts. According to a Certify study, 19% of expense reports contain errors, costing an average of $52 per report to correct — turning a tedious task into a costly one.",
      },
      {
        title: "Missing Deductions",
        description: "When receipts aren't digitized promptly, they get lost — along with potential tax deductions. The IRS requires adequate records under Publication 463 for all business expense deductions, meaning lost receipts translate directly into lost write-offs.",
      },
    ],
    features: [
      {
        title: "Photo Receipt Scanning",
        description: "Upload phone photos of receipts. The AI reads text even from crumpled, faded, or poorly lit photos.",
      },
      {
        title: "Itemized Extraction",
        description: "Extract individual line items including item name, quantity, and price — not just totals.",
      },
      {
        title: "Multi-Format Support",
        description: "Process paper receipts (photos), digital receipts (PDFs), and email receipts all in one place.",
      },
      {
        title: "Expense Automation",
        description: "Route receipt data to Google Sheets, accounting software, or expense management tools via Zapier. See how to [automate receipt processing with Make](/guides/automate-receipt-processing-with-make).",
      },
    ],
    faqs: [
      {
        question: "Can Parsli read blurry or faded receipts?",
        answer: "Parsli's AI is trained on real-world documents including imperfect images. While clearer images yield better results, it handles common quality issues well.",
      },
      {
        question: "Does it extract individual items from receipts?",
        answer: "Yes. Use the table field type to extract each line item with name, quantity, and price.",
      },
      {
        question: "Can I process receipts from my phone?",
        answer: "Yes. Upload photos from your phone through the web interface, or send receipt images to a Parsli webhook from your mobile app.",
      },
    ],
  },
  {
    slug: "document-automation",
    title: "Document Automation",
    metaTitle: "Document Automation — AI Document Processing",
    metaDescription:
      "Automate document processing from ingestion to data delivery with AI. No-code document automation with Gmail, Zapier, Make, and webhook integrations.",
    h1: "Automate Document Processing with AI",
    heroDescription:
      "Build end-to-end document processing workflows without writing code. From document ingestion to data extraction to delivery — fully automated.",
    painPoints: [
      {
        title: "Manual Processing Doesn't Scale",
        description: "As document volume grows, manual processing becomes a bottleneck. McKinsey estimates that 42% of finance activities are fully automatable with currently available technology, yet Deloitte reports that only 13% of organizations have fully automated their document workflows. You need automation that grows with your business — like [batch document processing](/guides/batch-process-documents-automatically).",
      },
      {
        title: "Disconnected Tools",
        description: "Documents arrive in email, get processed in one tool, and data gets manually entered into another. According to IDC, knowledge workers spend 2.5 hours per day searching for and consolidating information across disconnected tools — too many manual steps in a fragmented workflow.",
      },
      {
        title: "Inconsistent Results",
        description: "Different team members extract data differently. Gartner reports that poor data quality costs organizations an average of $12.9 million per year, with inconsistent manual document processing being a top contributor. Without standardized automation, data quality suffers.",
      },
    ],
    features: [
      {
        title: "No-Code Setup",
        description: "Create parsers, define schemas, and connect integrations entirely through the web interface. Zero coding required. Learn how to [extract data from PDFs without code](/guides/extract-data-from-pdfs-without-code).",
      },
      {
        title: "Multi-Source Ingestion",
        description: "Accept documents from Gmail, webhooks, API uploads, or manual upload. All processed through the same parser.",
      },
      {
        title: "Workflow Integrations",
        description: "Connect to [Zapier](/guides/parse-email-attachments-with-zapier) (5,000+ apps), [Make](/guides/automate-receipt-processing-with-make), Google Sheets, and custom webhooks for end-to-end automation.",
      },
      {
        title: "Consistent Output",
        description: "Your schema ensures every document produces the same structured output format, regardless of document variation.",
      },
    ],
    faqs: [
      {
        question: "Do I need technical skills to set up automation?",
        answer: "No. Parsli's no-code interface lets anyone create document processing workflows. The API is available for developers who want deeper integration.",
      },
      {
        question: "How many documents can I automate?",
        answer: "Parsli processes documents in seconds. With the Business plan, you can automate up to 10,000 documents per month. Contact us for higher volumes.",
      },
      {
        question: "Can I automate different document types?",
        answer: "Yes. Create separate parsers for each document type (invoices, receipts, [contracts](/guides/extract-data-from-contracts), etc.) and route documents to the right parser automatically.",
      },
    ],
  },
  {
    slug: "intelligent-document-processing",
    title: "Intelligent Document Processing",
    metaTitle: "Intelligent Document Processing (IDP) Software - AI-Powered",
    metaDescription:
      "AI-powered intelligent document processing platform. Extract, classify, and structure data from any document type. No-code IDP with enterprise integrations.",
    h1: "Intelligent Document Processing Platform",
    heroDescription:
      "Go beyond basic OCR with AI-powered intelligent document processing. Parsli understands document layouts, extracts structured data, and delivers results to your systems automatically.",
    painPoints: [
      {
        title: "OCR Alone Isn't Enough",
        description: "Traditional OCR gives you raw text. Everest Group's IDP PEAK Matrix Assessment shows the IDP market grew 35–40% year-over-year, driven by organizations moving beyond basic OCR to AI-powered document understanding. You need AI that understands document structure, context, and meaning.",
      },
      {
        title: "Complex Document Layouts",
        description: "Real-world documents — from [medical records](/guides/extract-data-from-medical-records) to [insurance claims](/guides/extract-data-from-insurance-claims) — have tables, multi-column layouts, headers, footers, and mixed content. Forrester research shows organizations implementing IDP achieve 50–70% reduction in document processing time, with the strongest gains on these complex, semi-structured documents. Basic tools can't handle this.",
      },
      {
        title: "Enterprise Integration",
        description: "Extracted data needs to flow into ERP, CRM, accounting, and other business systems without manual intervention. According to Deloitte's Global Intelligent Automation Survey, 73% of organizations cite integration with existing systems as the biggest challenge in document processing automation.",
      },
    ],
    features: [
      {
        title: "Layout-Aware AI",
        description: "Powered by Gemini 2.5 Pro, Parsli understands document layouts — tables, columns, headers, footers, and mixed content.",
      },
      {
        title: "Structured Output",
        description: "Define your schema once. The AI consistently produces clean, typed [JSON output](/guides/pdf-to-json-extraction) matching your specification.",
      },
      {
        title: "Confidence Scoring",
        description: "Every extraction includes confidence scores. Flag low-confidence results for human review automatically.",
      },
      {
        title: "Enterprise Integrations",
        description: "REST API, webhooks, [Zapier](/guides/parse-email-attachments-with-zapier), [Make](/guides/automate-receipt-processing-with-make), and Google Sheets. Connect to any business system.",
      },
    ],
    faqs: [
      {
        question: "What is Intelligent Document Processing?",
        answer: "IDP uses AI and machine learning to automatically extract, classify, and process data from documents — going beyond basic OCR to understand document structure and context.",
      },
      {
        question: "How is Parsli different from traditional IDP platforms?",
        answer: "Parsli is simpler and faster to set up than traditional IDP. No training data needed, no complex configuration. Define your schema and start extracting in minutes.",
      },
      {
        question: "Does Parsli require training data?",
        answer: "No. Parsli uses pre-trained AI models that work out of the box. Just define your schema and the AI adapts to your documents.",
      },
    ],
  },
  {
    slug: "ocr-data-extraction",
    title: "OCR Data Extraction",
    metaTitle: "AI OCR Data Extraction Software - Beyond Traditional OCR",
    metaDescription:
      "AI-powered OCR that extracts structured data from scanned documents, images, and photos. Goes beyond text recognition to understand document structure.",
    h1: "AI-Powered OCR & Data Extraction",
    heroDescription:
      "Beyond traditional OCR. Parsli doesn't just read text — it understands document structure and extracts organized, usable data from scanned documents and images.",
    painPoints: [
      {
        title: "Traditional OCR Gives Raw Text",
        description: "Grand View Research valued the global OCR market at $13.38 billion in 2023, but Gartner notes that traditional OCR without AI context achieves less than 70% accuracy on semi-structured documents. Standard OCR tools output a wall of text, and you still need to manually identify and organize the data you need.",
      },
      {
        title: "Poor Accuracy on Real Documents",
        description: "Faded prints, skewed scans, handwriting, and complex layouts cause traditional OCR to produce garbage output. According to the International Journal of Industrial Ergonomics, manual re-keying of OCR output introduces an additional 1–4% error rate per field, compounding extraction inaccuracies.",
      },
      {
        title: "No Structure, No Automation",
        description: "Without structured output, you can't automate downstream processes. McKinsey estimates that structured data extraction from unstructured documents is a prerequisite for 60% of enterprise automation initiatives — yet every document still needs manual review.",
      },
    ],
    features: [
      {
        title: "AI-Enhanced OCR",
        description: "Gemini 2.5 Pro combines visual understanding with language comprehension for far better accuracy than traditional OCR.",
      },
      {
        title: "Handles Poor Quality",
        description: "Faded text, skewed scans, phone photos, [handwriting](/guides/extract-data-from-handwritten-documents) — the AI handles real-world document quality issues.",
      },
      {
        title: "Structured Output",
        description: "Get clean [JSON](/guides/pdf-to-json-extraction), not raw text. Define your schema and receive organized data ready for your systems.",
      },
      {
        title: "Multi-Language Support",
        description: "The AI model supports documents in multiple languages without configuration changes.",
      },
    ],
    faqs: [
      {
        question: "Is Parsli better than traditional OCR?",
        answer: "Yes. Traditional OCR just recognizes characters. Parsli's AI understands document structure, context, and meaning to extract organized, typed data.",
      },
      {
        question: "What image formats are supported?",
        answer: "PNG, JPG, JPEG, WebP, GIF, and BMP. Any standard image format works.",
      },
      {
        question: "Can it read handwritten text?",
        answer: "The AI can process handwritten text, though accuracy depends on legibility. Clear handwriting yields good results.",
      },
    ],
  },
  {
    slug: "pdf-to-excel",
    title: "PDF to Excel",
    metaTitle: "PDF to Excel Converter - Convert PDF Tables to Excel with AI",
    metaDescription:
      "Convert PDF tables and data to Excel or Google Sheets automatically with AI. Preserves table structure, handles scanned PDFs. No manual formatting needed.",
    h1: "Convert PDF to Excel Automatically with AI",
    heroDescription:
      "Extract tables and data from PDFs directly into Excel or Google Sheets. Parsli preserves table structure and handles both digital and scanned PDFs.",
    painPoints: [
      {
        title: "Copy-Paste Breaks Tables",
        description: "Adobe reports that PDFs remain the dominant format for business document exchange, yet Forrester found that 82% of workers resort to manual copy-paste methods that lose table structure. Copying tables from PDFs into Excel loses all formatting — columns misalign and data merges into single cells.",
      },
      {
        title: "Manual Reformatting",
        description: "According to IDC, knowledge workers spend an average of 2.5 hours per day searching for and reformatting information — much of it involving PDF-to-spreadsheet conversion. Even with PDF-to-Excel tools, you spend time cleaning up and reformatting data to make it usable.",
      },
      {
        title: "Scanned PDFs Won't Convert",
        description: "Image-based and scanned PDFs can't be selected or copied at all. Everest Group reports that AI-powered OCR achieves 95–99% character accuracy on scanned documents, eliminating the need for manual retyping — yet without it, you're stuck retyping everything by hand.",
      },
    ],
    features: [
      {
        title: "Table Structure Preserved",
        description: "The AI understands table layouts and preserves row/column structure when extracting to spreadsheet format.",
      },
      {
        title: "Google Sheets Integration",
        description: "Direct IMPORTDATA integration with Google Sheets. Extracted data auto-populates your spreadsheet.",
      },
      {
        title: "Scanned PDF Support",
        description: "Built-in OCR handles scanned PDFs and image-based documents. No separate OCR step needed.",
      },
      {
        title: "Batch Conversion",
        description: "Convert hundreds of PDFs to spreadsheet data through the API or Gmail automation. Learn how to [batch process documents automatically](/guides/batch-process-documents-automatically).",
      },
    ],
    faqs: [
      {
        question: "How does Parsli convert PDFs to Excel?",
        answer: "Parsli uses AI to understand the PDF's structure, extract data according to your schema, and deliver it as structured JSON or CSV that you can import into Excel or Google Sheets.",
      },
      {
        question: "Does it handle multi-page tables?",
        answer: "Yes. Parsli processes all pages of a PDF and can extract tables that span multiple pages.",
      },
      {
        question: "Can I automate the conversion?",
        answer: "Yes. Set up Gmail automation or use the API to automatically convert PDFs to spreadsheet data as they arrive.",
      },
    ],
  },
  {
    slug: "pdf-to-csv",
    title: "PDF to CSV",
    metaTitle: "PDF to CSV Converter - Extract PDF Data as CSV with AI",
    metaDescription:
      "Convert PDF documents to CSV format automatically with AI. Extract tables, forms, and structured data from any PDF. Built-in OCR for scanned documents.",
    h1: "Convert PDF to CSV with AI",
    heroDescription:
      "Extract data from any PDF and get clean CSV output instantly. Perfect for importing into databases, spreadsheets, and data pipelines.",
    painPoints: [
      {
        title: "No Native PDF-to-CSV Path",
        description: "Despite PDFs being the most common business document format — Adobe estimates 3 trillion PDFs in existence — there is no native PDF-to-CSV conversion standard. Manual extraction is the only option for most teams.",
      },
      {
        title: "Data Pipeline Bottleneck",
        description: "Your data pipeline needs CSV input, but source data arrives in PDFs. Forrester reports that 80% of enterprise data remains unstructured, with PDF-locked data being a primary bottleneck in data pipeline automation. Manual conversion only makes this worse.",
      },
      {
        title: "Inconsistent Formatting",
        description: "Manual CSV creation leads to inconsistent column headers, data types, and formatting across files. According to Gartner, data quality issues stemming from manual formatting inconsistencies cost the average organization $12.9 million per year.",
      },
    ],
    features: [
      {
        title: "Clean CSV Output",
        description: "Get properly formatted CSV with consistent headers and data types. Ready for database import.",
      },
      {
        title: "Schema-Defined Columns",
        description: "Your schema defines the CSV columns. Every document produces the same consistent output structure.",
      },
      {
        title: "API Access",
        description: "Use the REST API to convert PDFs to CSV programmatically as part of your data pipeline. You can also [extract data from Excel to JSON](/guides/extract-data-from-excel-to-json).",
      },
      {
        title: "Google Sheets Feed",
        description: "Use the built-in CSV feed URL with Google Sheets IMPORTDATA for live, auto-refreshing data.",
      },
    ],
    faqs: [
      {
        question: "How do I get CSV output from Parsli?",
        answer: "Parsli provides a CSV feed URL for each parser. Use it with Google Sheets IMPORTDATA or fetch it from your application. The API also returns JSON that you can convert to CSV.",
      },
      {
        question: "Can I automate PDF-to-CSV conversion?",
        answer: "Yes. Use Gmail automation, webhooks, or the API to automatically convert PDFs to CSV as they arrive.",
      },
      {
        question: "Does the CSV output include headers?",
        answer: "Yes. Column headers match your schema field names. The format is consistent across all extractions.",
      },
    ],
  },
  {
    slug: "pdf-to-json",
    title: "PDF to JSON",
    metaTitle: "PDF to JSON Converter - Extract PDF Data as Structured JSON",
    metaDescription:
      "Convert PDF documents to structured JSON with AI. Define your schema and get typed, nested JSON output. REST API included. Perfect for developers.",
    h1: "Extract PDF Data as Structured JSON",
    heroDescription:
      "Turn any PDF into typed, structured JSON. Define your schema with field types, nested objects, and arrays. Get consistent output every time via API.",
    painPoints: [
      {
        title: "PDFs Are Developer-Hostile",
        description: "The PDF format is designed for printing, not data extraction. According to Stack Overflow's Developer Survey, document parsing is among the top frustrations for developers integrating external data sources, with PDF extraction cited as particularly challenging. Getting structured data out of PDFs requires specialized tooling.",
      },
      {
        title: "Untyped Raw Text",
        description: "Basic extraction gives you raw strings. Forrester's research on API-first architectures shows that typed, structured JSON output reduces downstream integration errors by 60–80% compared to raw text extraction. You need typed data — numbers as numbers, dates as dates, arrays as arrays.",
      },
      {
        title: "Inconsistent Structure",
        description: "Different PDFs produce different structures. Gartner predicts that by 2027, organizations that adopt schema-driven extraction will process documents 50% faster than those relying on ad hoc parsing. Your application needs a consistent JSON schema to work with.",
      },
    ],
    features: [
      {
        title: "Typed JSON Output",
        description: "Fields are typed (text, number, decimal, date, boolean). The AI returns properly typed JSON, not just strings. Learn more about [PDF to JSON extraction](/guides/pdf-to-json-extraction).",
      },
      {
        title: "Nested Objects & Arrays",
        description: "Support for nested object fields, arrays, and table types. Complex document structures map to clean JSON. See also [extracting data from Excel to JSON](/guides/extract-data-from-excel-to-json).",
      },
      {
        title: "REST API",
        description: "Send PDFs to the API and receive JSON responses. Bearer token auth, standard REST conventions.",
      },
      {
        title: "Schema Validation",
        description: "Define required fields, types, and constraints. The AI follows your schema specification consistently.",
      },
    ],
    faqs: [
      {
        question: "What does the JSON output look like?",
        answer: "The JSON matches your schema exactly. Each field you define becomes a key in the JSON object with the correct type. Tables become arrays of objects.",
      },
      {
        question: "Can I use this in my application?",
        answer: "Yes. The REST API lets you send PDFs and receive structured JSON. Use it in any programming language that can make HTTP requests.",
      },
      {
        question: "Is the JSON schema consistent across documents?",
        answer: "Yes. Your schema defines the output structure. Every document processed by the same parser produces JSON with the same keys and types.",
      },
    ],
  },
  {
    slug: "bill-of-lading-parsing",
    title: "Bill of Lading Parsing",
    metaTitle: "AI Bill of Lading Parser — Extract BOL Data",
    metaDescription: "Extract shipper, consignee, weight, freight class, and PRO numbers from any bill of lading format automatically with AI. Handles straight, order, and master BOLs.",
    h1: "AI-Powered Bill of Lading Parsing",
    heroDescription: "Stop manually keying BOL data into your WMS. Parsli extracts shipper names, consignee details, freight class, weight, PRO numbers, and all 17 FMCSA-mandated fields from any [bill of lading format](/blog/bill-of-lading-requirements-complete-guide) — straight, order, through, or master.",
    painPoints: [
      {
        title: "Non-Standardized BOL Formats",
        description: "Every shipper and carrier uses a different BOL layout. The Federal Motor Carrier Safety Administration (FMCSA) mandates 17 specific data fields under 49 CFR 375.505, yet every carrier formats these differently. Your team wastes time figuring out where data is on each form before they can even start entering it.",
      },
      {
        title: "Faded & Low-Quality Scans",
        description: "Dock-printed thermal BOLs fade quickly, and warehouse scans are often crooked or low-contrast. Traditional OCR chokes on these documents.",
      },
      {
        title: "Manual Entry Bottleneck at 300+ BOLs/Day",
        description: "The American Trucking Associations (ATA) reports that trucking is an $875.5 billion industry processing billions of shipping documents annually. A mid-size 3PL processes 300+ BOLs daily. At 12+ minutes per document, that's 60+ clerk-hours per day just on BOL data entry — manual processing at this scale is unsustainable. Learn why this [costs far more than you think](/blog/cost-of-manual-data-entry-3pl).",
      },
    ],
    features: [
      {
        title: "Extract All 17 FMCSA Fields",
        description: "Parsli extracts every field required by 49 CFR 375.505 — shipper, consignee, description of goods, weight, piece count, freight class, NMFC code, PRO number, and more.",
      },
      {
        title: "Handle Any BOL Format",
        description: "Straight BOLs, order BOLs, through BOLs, master BOLs, ocean BOLs — Parsli reads them all without template configuration. Integrate via the [document parsing API](/solutions/document-parsing-api) for full automation.",
      },
      {
        title: "Read Faded Scans & Handwriting",
        description: "Google Gemini 2.5 Pro reads dock-quality thermal prints, faded carbon copies, and handwritten annotations that traditional OCR cannot handle.",
      },
      {
        title: "Push to WMS/TMS via API & Webhooks",
        description: "Extracted BOL data flows directly to your WMS, TMS, or ERP via REST API, webhooks, [Zapier](/guides/parse-email-attachments-with-zapier), or Google Sheets — no manual re-entry.",
      },
    ],
    faqs: [
      {
        question: "Can Parsli handle BOLs from different carriers?",
        answer: "Yes. Parsli's AI adapts to any BOL layout without templates. Whether it's a UPS, FedEx, XPO, ODFL, or custom carrier BOL, the AI reads the document structure and extracts the fields you defined.",
      },
      {
        question: "What about faded thermal BOL prints?",
        answer: "Parsli uses Google Gemini 2.5 Pro which handles low-quality scans, faded thermal prints, and even handwritten annotations significantly better than traditional OCR engines.",
      },
      {
        question: "Can I process BOLs received via email?",
        answer: "Yes. Connect Gmail to auto-process BOL attachments from specific senders, or forward BOLs to a Parsli webhook for instant extraction. See our guide on freight invoice processing automation.",
      },
    ],
  },
  {
    slug: "freight-invoice-processing",
    title: "Freight Invoice Processing",
    metaTitle: "Freight Invoice Processing — AI Extraction",
    metaDescription: "Automate freight invoice processing with AI. Extract carrier names, PRO numbers, rates, surcharges, and accessorial charges from any carrier format. 92% time reduction.",
    h1: "Automated Freight Invoice Processing",
    heroDescription: "Every carrier sends invoices in a different format. Parsli's AI extracts carrier names, PRO numbers, base rates, fuel surcharges, accessorial charges, and totals from any freight invoice — [eliminating the 20-30% error rate](/blog/bol-errors-prevention-guide) of manual auditing.",
    painPoints: [
      {
        title: "Every Carrier Has a Different Format",
        description: "UPS, FedEx, XPO, ODFL, Estes — each carrier invoices differently. According to the American Transportation Research Institute (ATRI), freight operating costs averaged $2.251 per mile in 2023, making accurate invoice processing critical for margin protection. Your AP team memorizes dozens of layouts or wastes time hunting for fields on every invoice.",
      },
      {
        title: "Error-Prone Manual Auditing",
        description: "Industry data from Cass Information Systems shows that an estimated 20–30% of freight invoices contain billing errors, including rate discrepancies, duplicate charges, and incorrect accessorial fees. Manual auditing misses these overcharges that add up to thousands per month.",
      },
      {
        title: "Billing Delays Hurt Cash Flow",
        description: "Manual freight invoice processing creates a 3–7 day lag between receiving an invoice and entering it into your accounting system. The IOFM reports that late invoice processing costs companies an average of 3.1% in missed early-payment discounts, directly eroding margins. Automate the process to [cut costs dramatically](/blog/cost-of-manual-data-entry-3pl).",
      },
    ],
    features: [
      {
        title: "Freight-Specific Field Extraction",
        description: "Extract carrier name, PRO number, origin/destination, weight, class, base rate, fuel surcharge, accessorial charges, and total — fields specific to freight invoices.",
      },
      {
        title: "3-Way Matching (BOL/PO/Invoice)",
        description: "Cross-reference extracted freight invoice data against BOLs and purchase orders to catch billing errors before payment. Pair with [BOL parsing](/use-cases/bill-of-lading-parsing) for end-to-end automation.",
      },
      {
        title: "Batch Carrier Invoice Processing",
        description: "Process hundreds of carrier invoices per day. Forward invoices via email or upload in bulk — Parsli handles any volume without additional headcount.",
      },
      {
        title: "Audit Trail & Confidence Scores",
        description: "Every extraction includes confidence scores per field. Flag low-confidence extractions for human review while auto-approving high-confidence results.",
      },
    ],
    faqs: [
      {
        question: "Which carrier invoice formats does Parsli support?",
        answer: "Parsli works with any carrier invoice format — UPS, FedEx, XPO, ODFL, Estes, R+L Carriers, Saia, and more. The AI adapts to any layout without carrier-specific templates.",
      },
      {
        question: "Can Parsli catch freight billing errors?",
        answer: "Parsli extracts all line items and charges accurately, enabling automated 3-way matching between BOLs, POs, and invoices. This catches overcharges, duplicate charges, and rate discrepancies.",
      },
      {
        question: "How fast is freight invoice processing with Parsli?",
        answer: "Most freight invoices are processed in under 10 seconds. Compared to 12+ minutes of manual processing, that's a 92% time reduction. Process 300+ invoices per day without additional staff.",
      },
    ],
  },
]

export function getUseCaseBySlug(slug: string): UseCaseData | undefined {
  return useCases.find((uc) => uc.slug === slug)
}

export function getAllUseCaseSlugs(): string[] {
  return useCases.map((uc) => uc.slug)
}
