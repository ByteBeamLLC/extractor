export const faqItems = [
  {
    question: "What types of documents can Parsli process?",
    answer:
      "Parsli supports PDFs, images (PNG, JPG, WebP, GIF, BMP), Word documents (.docx, .doc), Excel spreadsheets (.xlsx, .xls), and plain text files (.txt, .csv, .json, .xml, .md). Our built-in OCR handles scanned documents and photos of documents.",
  },
  {
    question: "Do I need coding skills to use Parsli?",
    answer:
      "No. The entire setup — creating parsers, defining schemas, testing extractions, and connecting integrations — is done through our visual web interface. We also offer a REST API for developers who want programmatic access, but it's completely optional.",
  },
  {
    question: "How accurate is the AI extraction?",
    answer:
      "Parsli uses Google's Gemini 2.5 Pro, one of the most advanced AI models available. Accuracy depends on document quality and how well you define your schema. Well-defined schemas with clear field descriptions typically achieve 95%+ accuracy. The AI also provides confidence scores so you can flag uncertain extractions.",
  },
  {
    question: "What happens when I run out of pages?",
    answer:
      "Extractions will pause until your pages reset (every 30 days) or you upgrade to a higher plan. Your existing data, parsers, and integrations remain intact. You'll receive an email notification when you're approaching your limit.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use Supabase with row-level security, ensuring each user can only access their own data. API keys are stored as SHA-256 hashes. Our Gmail integration uses read-only OAuth access — we can never send, delete, or modify your emails.",
  },
  {
    question: "Can I process documents automatically?",
    answer:
      "Absolutely. You can: (1) Connect Gmail to auto-extract from email attachments as they arrive, (2) Use the inbound webhook URL to send documents from other systems, or (3) Use the REST API to integrate extraction into your own applications and workflows.",
  },
  {
    question: "How does Parsli compare to Parseur or Docparser?",
    answer:
      "Parsli uses the latest AI models (Gemini 2.5 Pro) for superior accuracy, especially on complex documents. Our pricing is typically 30% lower than competitors with a generous free tier. We also offer a no-code schema builder, real-time integrations, and a full REST API — all included in every plan.",
  },
  {
    question: "Can I try Parsli for free?",
    answer:
      "Yes! Our free plan includes 30 pages per month, up to 3 parsers, and full access to all features including API access and webhook integrations. No credit card required to get started.",
  },
]
