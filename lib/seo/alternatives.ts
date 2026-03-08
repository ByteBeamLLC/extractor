export interface AlternativeData {
  slug: string
  competitor: string
  metaTitle: string
  metaDescription: string
  h1: string
  heroDescription: string
  comparisonPoints: {
    feature: string
    parsli: string
    competitor: string
    parsliWins: boolean
  }[]
  reasons: { title: string; description: string }[]
}

export const alternatives: AlternativeData[] = [
  {
    slug: "parseur",
    competitor: "Parseur",
    metaTitle: "Parsli vs Parseur - Best Parseur Alternative in 2026",
    metaDescription:
      "Looking for a Parseur alternative? Parsli offers AI-powered document extraction with lower pricing, modern AI models, and a no-code interface. Compare features.",
    h1: "The Best Parseur Alternative",
    heroDescription:
      "Parsli offers the same document and email parsing capabilities as Parseur — but with more advanced AI, lower pricing, and a modern no-code interface.",
    comparisonPoints: [
      { feature: "AI Model", parsli: "Google Gemini 2.5 Pro", competitor: "Proprietary", parsliWins: true },
      { feature: "Free Plan", parsli: "30 pages/month", competitor: "Limited trial", parsliWins: true },
      { feature: "Starting Price", parsli: "$27/month (annual)", competitor: "$39/month", parsliWins: true },
      { feature: "Email Parsing", parsli: "Gmail automation", competitor: "Email forwarding", parsliWins: true },
      { feature: "No-Code Setup", parsli: "Visual schema builder", competitor: "Template-based", parsliWins: true },
      { feature: "REST API", parsli: "Included in all plans", competitor: "Paid plans only", parsliWins: true },
      { feature: "Google Sheets", parsli: "IMPORTDATA formula", competitor: "Google Sheets integration", parsliWins: false },
      { feature: "Zapier", parsli: "Via webhooks", competitor: "Native integration", parsliWins: false },
    ],
    reasons: [
      { title: "More Advanced AI", description: "Parsli uses Google's Gemini 2.5 Pro — a state-of-the-art multimodal AI model that understands document layouts, tables, and context better than rule-based systems." },
      { title: "Lower Pricing", description: "Parsli's pricing is approximately 30% lower than Parseur at every tier. Our free plan includes 30 pages/month with no credit card required." },
      { title: "Modern No-Code Interface", description: "Define extraction schemas visually with our schema builder. Choose field types, set requirements, and add extraction instructions — all without templates." },
      { title: "Full API Access on All Plans", description: "REST API, webhooks, and all integrations are included in every plan — including the free tier." },
    ],
  },
  {
    slug: "docparser",
    competitor: "Docparser",
    metaTitle: "Parsli vs Docparser - Best Docparser Alternative in 2026",
    metaDescription:
      "Looking for a Docparser alternative? Parsli offers AI-powered document parsing with no zonal OCR setup, modern AI models, and lower pricing. Compare now.",
    h1: "The Best Docparser Alternative",
    heroDescription:
      "Parsli replaces Docparser's zone-based OCR with AI that understands entire documents. No template setup, no zone drawing — just define your schema and start extracting.",
    comparisonPoints: [
      { feature: "Extraction Method", parsli: "AI-powered (Gemini 2.5 Pro)", competitor: "Zonal OCR + rules", parsliWins: true },
      { feature: "Setup Required", parsli: "Define schema, done", competitor: "Draw zones per template", parsliWins: true },
      { feature: "Free Plan", parsli: "30 pages/month", competitor: "14-day trial", parsliWins: true },
      { feature: "Starting Price", parsli: "$27/month (annual)", competitor: "$39/month", parsliWins: true },
      { feature: "OCR Quality", parsli: "AI-enhanced OCR", competitor: "Traditional OCR", parsliWins: true },
      { feature: "Table Extraction", parsli: "AI table detection", competitor: "Zone-based", parsliWins: true },
      { feature: "Email Parsing", parsli: "Gmail automation", competitor: "Email forwarding", parsliWins: true },
      { feature: "Integrations", parsli: "Sheets, Zapier, Make, API", competitor: "Sheets, Zapier, API", parsliWins: false },
    ],
    reasons: [
      { title: "No Zonal OCR Setup", description: "Docparser requires you to draw extraction zones on document templates. Parsli's AI understands document structure automatically — no zone drawing needed." },
      { title: "Better Accuracy", description: "AI-powered extraction understands context and layout, while zonal OCR breaks when document formats change slightly." },
      { title: "Handles Any Layout", description: "Parsli adapts to any document layout without template configuration. Docparser needs a new template for each document format." },
      { title: "Modern Technology", description: "Built on Google Gemini 2.5 Pro — the same AI that powers the most advanced document understanding systems." },
    ],
  },
  {
    slug: "nanonets",
    competitor: "Nanonets",
    metaTitle: "Parsli vs Nanonets - Best Nanonets Alternative in 2026",
    metaDescription:
      "Looking for a Nanonets alternative? Parsli offers no-training-data document extraction with AI. Simpler setup, lower pricing, and instant accuracy.",
    h1: "The Best Nanonets Alternative",
    heroDescription:
      "Unlike Nanonets, Parsli doesn't require training data or model training. Define your schema and start extracting immediately with pre-trained AI.",
    comparisonPoints: [
      { feature: "Training Required", parsli: "None — works instantly", competitor: "Requires labeled training data", parsliWins: true },
      { feature: "Setup Time", parsli: "Minutes", competitor: "Hours to days", parsliWins: true },
      { feature: "Free Plan", parsli: "30 pages/month, ongoing", competitor: "Limited trial", parsliWins: true },
      { feature: "Starting Price", parsli: "$27/month (annual)", competitor: "$499/month", parsliWins: true },
      { feature: "AI Model", parsli: "Gemini 2.5 Pro (pre-trained)", competitor: "Custom trained models", parsliWins: true },
      { feature: "Enterprise Features", parsli: "Growing", competitor: "Mature", parsliWins: false },
      { feature: "Custom Model Training", parsli: "Not available", competitor: "Available", parsliWins: false },
    ],
    reasons: [
      { title: "Zero Training Required", description: "Nanonets requires you to label training documents and train custom models. Parsli works out of the box with pre-trained AI — define your schema and extract." },
      { title: "Dramatically Lower Price", description: "Nanonets starts at $499/month. Parsli starts at $27/month with a generous free plan. Same quality extraction at a fraction of the cost." },
      { title: "Instant Setup", description: "No training phase means you can start extracting data in minutes, not days. No minimum document count required." },
      { title: "Simpler Interface", description: "Parsli's no-code schema builder is designed for simplicity. No ML expertise needed." },
    ],
  },
  {
    slug: "upstage",
    competitor: "Upstage",
    metaTitle: "Parsli vs Upstage Document Parse - Best Alternative in 2026",
    metaDescription:
      "Looking for an Upstage Document Parse alternative? Parsli offers a complete no-code platform with integrations, not just an API. Compare features.",
    h1: "The Best Upstage Document AI Alternative",
    heroDescription:
      "Upstage offers a document parsing API. Parsli offers a complete platform — no-code interface, visual schema builder, integrations, and API. Everything in one place.",
    comparisonPoints: [
      { feature: "Interface", parsli: "Full no-code platform", competitor: "API only", parsliWins: true },
      { feature: "Schema Builder", parsli: "Visual, no-code", competitor: "Not available", parsliWins: true },
      { feature: "Integrations", parsli: "Sheets, Zapier, Make, Gmail", competitor: "None built-in", parsliWins: true },
      { feature: "Target User", parsli: "Anyone (no-code to developer)", competitor: "Developers only", parsliWins: true },
      { feature: "Free Plan", parsli: "30 pages/month", competitor: "API credits trial", parsliWins: true },
      { feature: "Document AI Research", parsli: "Uses Gemini 2.5 Pro", competitor: "In-house models (Solar)", parsliWins: false },
      { feature: "Enterprise API", parsli: "Growing", competitor: "Mature", parsliWins: false },
    ],
    reasons: [
      { title: "Complete Platform, Not Just an API", description: "Upstage provides an API endpoint. Parsli provides a full platform — web interface, schema builder, integrations, Gmail automation, and API." },
      { title: "No-Code for Everyone", description: "Non-technical users can create parsers, define schemas, and connect integrations without any coding. Upstage requires developer skills." },
      { title: "Built-In Integrations", description: "Google Sheets, Zapier, Make, Gmail, and webhooks are built in. With Upstage, you'd need to build all integrations yourself." },
      { title: "Simpler Pricing", description: "Page-based pricing starting at free. No complex API credit calculations." },
    ],
  },
]

export function getAlternativeBySlug(slug: string): AlternativeData | undefined {
  return alternatives.find((a) => a.slug === slug)
}

export function getAllAlternativeSlugs(): string[] {
  return alternatives.map((a) => a.slug)
}
