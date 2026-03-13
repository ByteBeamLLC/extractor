export interface IndustryData {
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  h1: string
  heroDescription: string
  painPoints: { title: string; description: string }[]
  useCases: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  relatedUseCases: string[]
  relatedDocumentTypes: string[]
  relatedSolutions: string[]
}

export const industries: IndustryData[] = [
  {
    slug: "finance",
    name: "Finance & Accounting",
    metaTitle: "AI Document Parsing for Finance & Accounting | Parsli",
    metaDescription:
      "Automate invoice, receipt, and bank statement extraction for finance teams. AI-powered document parsing built for accounting workflows. Start free.",
    h1: "Document Parsing for Finance & Accounting",
    heroDescription:
      "Automate data extraction from invoices, bank statements, receipts, and financial documents. Parsli's AI handles the manual data entry so your finance team can focus on analysis.",
    painPoints: [
      { title: "Manual Invoice Entry", description: "Finance teams spend hours each week manually keying invoice data into accounting systems." },
      { title: "Reconciliation Bottlenecks", description: "Matching bank statements to transactions is slow and error-prone when done manually." },
      { title: "Audit Trail Gaps", description: "Paper-based processes make it hard to maintain a clean, searchable audit trail." },
    ],
    useCases: [
      { title: "Invoice Processing", description: "Extract vendor, amount, line items, and due dates from invoices automatically. Learn how to [automate invoice processing for small business](/guides/automate-invoice-processing-for-small-business) or [extract invoice data to QuickBooks](/guides/extract-invoice-data-to-quickbooks)." },
      { title: "Bank Statement Parsing", description: "Pull transaction data from bank statements into structured spreadsheet format." },
      { title: "Receipt Digitization", description: "Scan and extract expense receipt data for reimbursement and [tax forms](/guides/extract-data-from-tax-forms)." },
      { title: "Financial Report Extraction", description: "Extract key figures from quarterly reports, balance sheets, and P&L statements." },
    ],
    faqs: [
      { question: "What financial documents does Parsli support?", answer: "Parsli processes invoices, bank statements, receipts, purchase orders, financial reports, [tax forms](/guides/extract-data-from-tax-forms), and any PDF or image-based financial document." },
      { question: "Can Parsli integrate with accounting software?", answer: "Yes. Use Zapier, Make, or webhooks to send extracted data to [QuickBooks](/guides/extract-invoice-data-to-quickbooks), Xero, FreshBooks, or any accounting platform." },
      { question: "How accurate is financial document parsing?", answer: "Parsli achieves 95%+ accuracy on standard financial documents. Confidence scores flag uncertain extractions for human review." },
    ],
    relatedUseCases: ["invoice-parsing", "receipt-scanning", "pdf-to-excel"],
    relatedDocumentTypes: ["invoices", "receipts", "bank-statements"],
    relatedSolutions: ["invoice-parsing", "bank-statement-extraction"],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    metaTitle: "AI Document Parsing for Real Estate | Parsli",
    metaDescription:
      "Extract data from leases, property documents, and closing paperwork automatically. AI document parsing for real estate professionals. Start free.",
    h1: "Document Parsing for Real Estate",
    heroDescription:
      "Extract structured data from leases, contracts, property listings, and closing documents. Reduce manual data entry and process paperwork faster.",
    painPoints: [
      { title: "Contract-Heavy Workflows", description: "Real estate deals generate dozens of documents that need data extracted and organized. See how to [extract data from contracts](/guides/extract-data-from-contracts) automatically." },
      { title: "Slow Closing Processes", description: "Manual document review delays closings and frustrates clients." },
      { title: "Scattered Property Data", description: "Key property details are locked in PDFs across multiple systems." },
    ],
    useCases: [
      { title: "Lease Extraction", description: "Pull tenant names, rent amounts, terms, and renewal dates from lease agreements. Also useful for [extracting data from utility bills](/guides/extract-data-from-utility-bills) across properties." },
      { title: "Closing Document Processing", description: "Extract key data from HUD statements, title documents, and closing disclosures." },
      { title: "Property Listing Parsing", description: "Extract property details, pricing, and specifications from listing documents." },
      { title: "Inspection Report Digitization", description: "Convert inspection reports into structured data for tracking and follow-up." },
    ],
    faqs: [
      { question: "Can Parsli handle multi-page lease agreements?", answer: "Yes. Parsli processes all pages of a document and extracts data across the entire file." },
      { question: "Does it work with scanned property documents?", answer: "Yes. Built-in OCR handles scanned documents, photos, and image-based PDFs." },
      { question: "Can I extract data from different lease formats?", answer: "Yes. Parsli's AI adapts to any document layout — no template configuration needed per format." },
    ],
    relatedUseCases: ["pdf-data-extraction", "document-automation"],
    relatedDocumentTypes: ["contracts", "pdfs", "forms"],
    relatedSolutions: ["no-code-document-parser"],
  },
  {
    slug: "logistics",
    name: "Logistics & Shipping",
    metaTitle: "AI Document Parsing for Logistics & Shipping | Parsli",
    metaDescription:
      "Extract data from bills of lading, packing lists, and shipping documents automatically. AI document parsing for logistics operations. Start free.",
    h1: "Document Parsing for Logistics & Shipping",
    heroDescription:
      "Automate data extraction from shipping documents, bills of lading, customs forms, and packing lists. Keep your supply chain data flowing without manual entry.",
    painPoints: [
      { title: "Paper-Heavy Supply Chains", description: "Logistics operations generate massive volumes of shipping documents that need data extracted." },
      { title: "Customs Delays", description: "Manual processing of customs and trade documents slows down cross-border shipments." },
      { title: "Tracking Data Gaps", description: "Key shipment data locked in PDFs creates visibility gaps across the supply chain." },
    ],
    useCases: [
      { title: "Bill of Lading Parsing", description: "Extract shipper, consignee, cargo details, and shipping terms from BOL documents. See our guide on [extracting data from shipping documents](/guides/extract-data-from-shipping-documents)." },
      { title: "Packing List Extraction", description: "Pull item descriptions, quantities, weights, and dimensions from packing lists." },
      { title: "Customs Document Processing", description: "Extract HS codes, values, and origin data from customs declarations and commercial invoices. Combine with [batch document processing](/guides/batch-process-documents-automatically) for high-volume operations." },
      { title: "Delivery Note Digitization", description: "Convert delivery receipts and POD documents into structured tracking data." },
    ],
    faqs: [
      { question: "Can Parsli process shipping documents in different languages?", answer: "Yes. The AI model supports documents in multiple languages without configuration changes." },
      { question: "Does it handle table data in packing lists?", answer: "Yes. Use the table field type to extract multi-row item lists with all columns preserved." },
      { question: "Can I automate document intake from email?", answer: "Yes. Connect Gmail to auto-process shipping documents from specific senders as they arrive." },
    ],
    relatedUseCases: ["email-parsing", "pdf-data-extraction", "document-automation"],
    relatedDocumentTypes: ["pdfs", "forms", "invoices"],
    relatedSolutions: ["document-parsing-api"],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    metaTitle: "AI Document Parsing for Healthcare | Parsli",
    metaDescription:
      "Extract data from medical forms, insurance claims, and patient documents with AI. HIPAA-conscious document parsing for healthcare. Start free.",
    h1: "Document Parsing for Healthcare",
    heroDescription:
      "Extract structured data from medical forms, insurance documents, lab reports, and patient records. Reduce administrative burden and speed up document workflows.",
    painPoints: [
      { title: "Administrative Overload", description: "Healthcare staff spend excessive time on paperwork instead of patient care." },
      { title: "Insurance Claim Delays", description: "Manual processing of insurance forms and claims leads to slow reimbursements." },
      { title: "Data Silos", description: "Patient information trapped in PDFs and scanned documents can't be searched or analyzed." },
    ],
    useCases: [
      { title: "Insurance Claim Processing", description: "Extract patient info, procedure codes, and amounts from [insurance claim forms](/guides/extract-data-from-insurance-claims)." },
      { title: "Lab Report Parsing", description: "Pull test results, reference ranges, and patient identifiers from lab reports." },
      { title: "Patient Intake Forms", description: "Digitize patient registration forms and extract demographics, insurance, and medical history. See our guide on [extracting data from medical records](/guides/extract-data-from-medical-records)." },
      { title: "Referral Document Processing", description: "Extract physician notes, diagnoses, and referral details from referral letters." },
    ],
    faqs: [
      { question: "Is Parsli HIPAA compliant?", answer: "Parsli uses encryption at rest and in transit with row-level security. Contact us for details on our security practices and BAA availability." },
      { question: "Can it handle handwritten medical forms?", answer: "The AI can process handwritten text, though accuracy depends on legibility. Clear handwriting yields good results. Learn more about [extracting data from handwritten documents](/guides/extract-data-from-handwritten-documents)." },
      { question: "Does Parsli work with EHR systems?", answer: "Use the REST API or webhook integrations to send extracted data to any EHR or practice management system." },
    ],
    relatedUseCases: ["pdf-data-extraction", "ocr-data-extraction", "document-automation"],
    relatedDocumentTypes: ["forms", "pdfs"],
    relatedSolutions: ["no-code-document-parser"],
  },
  {
    slug: "legal",
    name: "Legal",
    metaTitle: "AI Document Parsing for Legal Teams | Parsli",
    metaDescription:
      "Extract data from contracts, court filings, and legal documents with AI. Automate legal document processing and due diligence. Start free.",
    h1: "Document Parsing for Legal Teams",
    heroDescription:
      "Extract key data from contracts, court filings, and legal documents automatically. Speed up due diligence, contract review, and document management workflows.",
    painPoints: [
      { title: "Contract Review Backlog", description: "Legal teams can't keep up with the volume of contracts that need data extracted and reviewed." },
      { title: "Due Diligence is Slow", description: "Manually reviewing hundreds of documents during due diligence takes weeks." },
      { title: "Key Terms Get Missed", description: "Important contract clauses and dates get overlooked during manual review." },
    ],
    useCases: [
      { title: "Contract Data Extraction", description: "Pull party names, effective dates, terms, renewal clauses, and key obligations from contracts. Follow our step-by-step guide to [extract data from contracts](/guides/extract-data-from-contracts)." },
      { title: "Court Filing Processing", description: "Extract case numbers, parties, filing dates, and key information from court documents." },
      { title: "Due Diligence Automation", description: "[Batch-process documents automatically](/guides/batch-process-documents-automatically) across document rooms and extract key data points from hundreds of files." },
      { title: "Compliance Document Review", description: "Extract regulatory references, deadlines, and requirements from compliance documents." },
    ],
    faqs: [
      { question: "Can Parsli handle complex legal document layouts?", answer: "Yes. The AI understands multi-column layouts, numbered paragraphs, tables, and nested sections common in legal documents." },
      { question: "Is there an API for bulk processing?", answer: "Yes. The REST API supports automated [batch processing](/guides/batch-process-documents-automatically) for due diligence and large document sets. Extracted data can be output as [PDF to JSON](/guides/pdf-to-json-extraction)." },
      { question: "Can I extract specific clauses from contracts?", answer: "Yes. Define fields for specific clause types (termination, indemnification, etc.) and the AI will locate and extract them." },
    ],
    relatedUseCases: ["pdf-data-extraction", "document-automation"],
    relatedDocumentTypes: ["contracts", "pdfs", "forms"],
    relatedSolutions: ["document-parsing-api"],
  },
  {
    slug: "ecommerce",
    name: "E-Commerce",
    metaTitle: "AI Document Parsing for E-Commerce | Parsli",
    metaDescription:
      "Extract data from purchase orders, supplier invoices, and product catalogs automatically. AI document parsing for e-commerce operations. Start free.",
    h1: "Document Parsing for E-Commerce",
    heroDescription:
      "Automate data extraction from purchase orders, supplier invoices, product catalogs, and shipping documents. Keep your e-commerce operations running efficiently.",
    painPoints: [
      { title: "Order Volume Scaling", description: "As order volume grows, manual document processing becomes a bottleneck." },
      { title: "Supplier Document Variety", description: "Every supplier sends documents in different formats, making standardization difficult." },
      { title: "Inventory Data Gaps", description: "Product and pricing data locked in supplier PDFs creates catalog management headaches." },
    ],
    useCases: [
      { title: "Purchase Order Processing", description: "Extract SKUs, quantities, prices, and shipping details from purchase orders." },
      { title: "Supplier Invoice Parsing", description: "Auto-extract vendor data, line items, and totals from supplier invoices in any format." },
      { title: "Product Catalog Extraction", description: "Pull product names, specs, pricing, and images from supplier catalog PDFs." },
      { title: "Return & RMA Processing", description: "Extract return details, reasons, and item information from RMA documents." },
    ],
    faqs: [
      { question: "Can Parsli handle high-volume document processing?", answer: "Yes. With the Business plan, process up to 10,000 documents per month. Contact us for higher volumes." },
      { question: "Does it work with different supplier invoice formats?", answer: "Yes. Parsli's AI adapts to any document layout. One parser handles invoices from all your suppliers." },
      { question: "Can I connect to my e-commerce platform?", answer: "Use Zapier, Make, or the REST API to send extracted data to Shopify, WooCommerce, or any e-commerce platform." },
    ],
    relatedUseCases: ["invoice-parsing", "email-parsing", "document-automation"],
    relatedDocumentTypes: ["invoices", "receipts", "emails"],
    relatedSolutions: ["invoice-parsing"],
  },
  {
    slug: "hr",
    name: "Human Resources",
    metaTitle: "AI Document Parsing for HR & Recruiting | Parsli",
    metaDescription:
      "Extract data from resumes, employee forms, and HR documents with AI. Automate resume parsing, onboarding paperwork, and HR workflows. Start free.",
    h1: "Document Parsing for HR & Recruiting",
    heroDescription:
      "Automate data extraction from resumes, onboarding forms, employee documents, and compliance paperwork. Let your HR team focus on people, not data entry.",
    painPoints: [
      { title: "Resume Screening Overload", description: "Recruiters manually read and enter data from hundreds of resumes per open position." },
      { title: "Onboarding Paperwork", description: "New hire onboarding generates stacks of forms that need data extracted into HR systems." },
      { title: "Compliance Documentation", description: "Tracking certifications, licenses, and compliance documents manually is error-prone." },
    ],
    useCases: [
      { title: "Resume Parsing", description: "Extract candidate name, contact info, skills, experience, and education from resumes in any format." },
      { title: "Onboarding Form Processing", description: "Digitize [tax forms](/guides/extract-data-from-tax-forms), direct deposit authorizations, and employment agreements." },
      { title: "Certificate Extraction", description: "Pull certification names, dates, issuing authorities, and expiration dates from credential documents." },
      { title: "Timesheet Processing", description: "Extract hours, dates, and project codes from timesheet documents and images." },
    ],
    faqs: [
      { question: "Can Parsli parse resumes in different formats?", answer: "Yes. Parsli handles PDF resumes, Word documents, and image-based resumes. The AI adapts to any resume layout." },
      { question: "Does it integrate with ATS systems?", answer: "Use Zapier, Make, or the REST API to send parsed resume data to Greenhouse, Lever, Workday, or any ATS." },
      { question: "Can I process employee documents in bulk?", answer: "Yes. Use the API or email automation to batch-process onboarding documents, certifications, and compliance files." },
    ],
    relatedUseCases: ["pdf-data-extraction", "ocr-data-extraction", "document-automation"],
    relatedDocumentTypes: ["pdfs", "forms"],
    relatedSolutions: ["no-code-document-parser"],
  },
  {
    slug: "insurance",
    name: "Insurance",
    metaTitle: "AI Document Parsing for Insurance | Parsli",
    metaDescription:
      "Extract data from claims, policies, and insurance documents with AI. Automate underwriting and claims processing workflows. Start free.",
    h1: "Document Parsing for Insurance",
    heroDescription:
      "Automate data extraction from claims forms, policy documents, and supporting paperwork. Speed up underwriting, claims processing, and policy administration.",
    painPoints: [
      { title: "Slow Claims Processing", description: "Manual data extraction from claims forms and supporting documents delays settlement times." },
      { title: "Underwriting Bottlenecks", description: "Underwriters spend more time on data entry than risk assessment." },
      { title: "Policy Data Locked in PDFs", description: "Key policy terms and coverage details are buried in unstructured PDF documents." },
    ],
    useCases: [
      { title: "Claims Form Processing", description: "Extract claimant info, incident details, damage descriptions, and amounts from claims forms. See our guide on [extracting data from insurance claims](/guides/extract-data-from-insurance-claims)." },
      { title: "Policy Document Parsing", description: "Pull coverage limits, deductibles, effective dates, and terms from policy documents." },
      { title: "Supporting Document Extraction", description: "Process police reports, [medical records](/guides/extract-data-from-medical-records), and repair estimates attached to claims." },
      { title: "Application Processing", description: "Extract applicant information, risk factors, and coverage requests from insurance applications." },
    ],
    faqs: [
      { question: "Can Parsli process different types of insurance documents?", answer: "Yes. Create separate parsers for claims, policies, applications, and supporting documents — each with their own schema." },
      { question: "How does it handle supporting document attachments?", answer: "Use Gmail automation to process claims with attachments automatically, or upload documents via API for batch processing." },
      { question: "Can I flag specific data for review?", answer: "Yes. Parsli provides confidence scores for each extraction. Use webhooks to route low-confidence results to human reviewers." },
    ],
    relatedUseCases: ["pdf-data-extraction", "document-automation", "email-parsing"],
    relatedDocumentTypes: ["forms", "pdfs", "contracts"],
    relatedSolutions: ["no-code-document-parser"],
  },
]

export function getIndustryBySlug(slug: string): IndustryData | undefined {
  return industries.find((i) => i.slug === slug)
}

export function getAllIndustrySlugs(): string[] {
  return industries.map((i) => i.slug)
}
