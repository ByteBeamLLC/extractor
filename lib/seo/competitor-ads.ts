/**
 * Competitor ad landing page data.
 * Each entry generates a page at /ads/compare/[slug]
 */

export interface CompetitorAdData {
  slug: string
  name: string
  logo: string // path in /public/logos/
  tagline: string // one-line positioning of the competitor
  headline: string // hero headline (use {competitor} as placeholder)
  subheadline: string
  painPoints: string[] // 3 specific pains of using this competitor
  comparisonRows: { feature: string; them: string; parsli: string }[]
  switchTestimonial: {
    quote: string
    name: string
    role: string
    company: string
  }
  migrationSteps: { title: string; description: string }[]
  /** Unique differentiators vs this specific competitor */
  differentiators: { title: string; description: string }[]
}

export const competitorAds: CompetitorAdData[] = [
  {
    slug: "parseur",
    name: "Parseur",
    logo: "/logos/parseur.svg",
    tagline: "Template-based email & document parser",
    headline: "Looking for a Parseur Alternative?",
    subheadline:
      "Parsli uses AI instead of templates. No rules to maintain, parses any format automatically, and costs up to 50% less at scale.",
    painPoints: [
      "Parseur's template system needs a new template for every document layout — and breaks when senders change their format",
      "Limited to 20 pages/month on the free plan vs. Parsli's 30 — and paid tiers give you fewer pages per dollar",
      "No AI understanding of document context — it matches patterns, not meaning, so accuracy drops on complex documents",
    ],
    comparisonRows: [
      { feature: "Extraction method", them: "Template matching", parsli: "AI (Gemini 2.5 Pro)" },
      { feature: "New formats", them: "New template per layout", parsli: "AI adapts automatically" },
      { feature: "Free plan", them: "20 pages/mo", parsli: "30 pages/mo" },
      { feature: "Starter price", them: "$33/mo (100 pages)", parsli: "$16/mo (250 pages)" },
      { feature: "Accuracy", them: "Pattern-dependent", parsli: "99%" },
      { feature: "Attachments", them: "Supported", parsli: "Supported" },
    ],
    switchTestimonial: {
      quote: "We switched from Parseur after our third template broke in a month. Parsli's AI handles every vendor format without any setup.",
      name: "Sarah M.",
      role: "Operations Manager",
      company: "Logistics Company",
    },
    migrationSteps: [
      { title: "Create a Parsli parser", description: "Sign up free, name your parser, define fields with the visual schema builder." },
      { title: "Redirect email forwarding", description: "Point your auto-forwarding to your new Parsli address. Takes 30 seconds." },
      { title: "Done — AI handles the rest", description: "No templates to recreate. The AI extracts your fields from any format automatically." },
    ],
    differentiators: [
      { title: "AI, Not Templates", description: "Parseur matches patterns. Parsli understands documents semantically — context, tables, relationships." },
      { title: "More Pages, Lower Price", description: "250 pages for $16/mo vs. Parseur's 100 pages for $33/mo. Better value at every tier." },
      { title: "Zero Maintenance", description: "No templates to rebuild when formats change. The AI adapts automatically." },
    ],
  },
  {
    slug: "docparser",
    name: "Docparser",
    logo: "/logos/docparser.svg",
    tagline: "Rule-based document parser for PDFs",
    headline: "Looking for a Docparser Alternative?",
    subheadline:
      "Docparser requires rules and templates per document type. Parsli uses AI — define your fields once and extract from any format automatically.",
    painPoints: [
      "Docparser needs a parsing rule set for every document layout — new vendor? New template. Changed format? Fix the rules.",
      "No AI understanding — it uses zonal OCR and anchor keywords, which fail on complex or varied layouts",
      "Pricing starts at $39/mo for just 100 pages — Parsli gives you 250 pages for $16/mo",
    ],
    comparisonRows: [
      { feature: "Technology", them: "Zonal OCR + rules", parsli: "AI (Gemini 2.5 Pro)" },
      { feature: "Setup per format", them: "Build parsing rules", parsli: "0 min (AI adapts)" },
      { feature: "Table extraction", them: "Basic (predefined zones)", parsli: "Full AI-powered" },
      { feature: "Scanned documents", them: "Limited quality", parsli: "Full support inc. handwriting" },
      { feature: "Free plan", them: "No (14-day trial)", parsli: "30 pages/mo forever" },
      { feature: "Starter price", them: "$39/mo (100 pages)", parsli: "$16/mo (250 pages)" },
    ],
    switchTestimonial: {
      quote: "Docparser needed a separate rule set for every vendor's invoice. With Parsli, one parser handles all of them — zero configuration.",
      name: "James K.",
      role: "Finance Lead",
      company: "E-commerce Brand",
    },
    migrationSteps: [
      { title: "Create a Parsli parser", description: "Sign up free, define your extraction fields visually. No rules to configure." },
      { title: "Upload or forward documents", description: "Send documents via upload, email forwarding, API, or webhook — same methods you used with Docparser." },
      { title: "AI extracts your data", description: "No rule sets to recreate. The AI reads document context and extracts your fields from any layout." },
    ],
    differentiators: [
      { title: "AI Replaces Rules", description: "No zonal OCR, no anchor keywords, no parsing rules. Parsli's AI understands document structure natively." },
      { title: "Real Table Extraction", description: "Docparser uses predefined zones for tables. Parsli's AI detects and extracts tables from any position in any layout." },
      { title: "2.5x More Pages, 60% Less Cost", description: "250 pages for $16/mo vs. Docparser's 100 pages for $39/mo." },
    ],
  },
  {
    slug: "mailparser",
    name: "Mailparser",
    logo: "/logos/mailparser.svg",
    tagline: "Rule-based email parser",
    headline: "Looking for a Mailparser Alternative?",
    subheadline:
      "Mailparser uses parsing rules that break when email formats change. Parsli uses AI — it adapts to any sender automatically and parses attachments too.",
    painPoints: [
      "Mailparser needs custom parsing rules for each email format — when senders update their templates, your rules break",
      "Can't extract data from PDF or image attachments — you need a separate tool for invoices and receipts",
      "Rule debugging is painful — when data is wrong or missing, figuring out which rule failed takes hours",
    ],
    comparisonRows: [
      { feature: "Extraction method", them: "Parsing rules", parsli: "AI (Gemini 2.5 Pro)" },
      { feature: "Format changes", them: "Rules break", parsli: "AI adapts automatically" },
      { feature: "Parse attachments", them: "No", parsli: "Yes (PDF, images)" },
      { feature: "Accuracy", them: "Rule-dependent", parsli: "99%" },
      { feature: "Free plan", them: "30 emails/mo", parsli: "30 pages/mo" },
      { feature: "Starter price", them: "$33/mo", parsli: "$16/mo (250 pages)" },
    ],
    switchTestimonial: {
      quote: "Mailparser couldn't handle our vendor invoices as PDF attachments. Parsli parses the email AND the attachment in one workflow.",
      name: "Tom H.",
      role: "Finance Manager",
      company: "Supply Chain Company",
    },
    migrationSteps: [
      { title: "Create a Parsli email parser", description: "Sign up free, define the fields you need from emails and attachments." },
      { title: "Redirect email forwarding", description: "Change your auto-forwarding from Mailparser's address to your new Parsli address." },
      { title: "Attachments work automatically", description: "No separate workflow needed — Parsli parses email body + attachments together." },
    ],
    differentiators: [
      { title: "AI, Not Rules", description: "No parsing rules to build or maintain. Parsli's AI understands email content semantically." },
      { title: "Attachments Built-In", description: "Mailparser can't touch PDF attachments. Parsli extracts from email body + attachments in one flow." },
      { title: "Half the Price", description: "$16/mo for 250 pages vs. Mailparser's $33/mo. Better extraction for less." },
    ],
  },
  {
    slug: "airparser",
    name: "Airparser",
    logo: "/logos/airparser.png",
    tagline: "AI-assisted document parser",
    headline: "Looking for an Airparser Alternative?",
    subheadline:
      "Airparser uses basic AI with limited accuracy. Parsli is powered by Google Gemini 2.5 Pro — the most capable document AI available — with better accuracy and more integrations.",
    painPoints: [
      "Airparser's AI struggles with complex documents — tables, multi-page files, and varied layouts often produce incomplete or wrong extractions",
      "Limited integration options — no native Google Sheets, no webhooks, fewer automation paths than Parsli",
      "Smaller model with less document understanding than Parsli's Google Gemini 2.5 Pro engine",
    ],
    comparisonRows: [
      { feature: "AI model", them: "Proprietary (limited)", parsli: "Google Gemini 2.5 Pro" },
      { feature: "Table extraction", them: "Basic", parsli: "Full structure preserved" },
      { feature: "Integrations", them: "Limited", parsli: "5,000+ (Zapier, Make, Sheets, API)" },
      { feature: "Email parsing", them: "Supported", parsli: "Supported + attachments" },
      { feature: "Free plan", them: "Limited trial", parsli: "30 pages/mo forever" },
      { feature: "Accuracy on complex docs", them: "Inconsistent", parsli: "99%" },
    ],
    switchTestimonial: {
      quote: "Airparser couldn't reliably extract table data from our invoices. Parsli gets every row right, even on scanned documents.",
      name: "Lisa C.",
      role: "Data Operations",
      company: "Accounting Firm",
    },
    migrationSteps: [
      { title: "Create a Parsli parser", description: "Sign up free, define your fields with the visual schema builder." },
      { title: "Upload your documents", description: "Same flow — upload, email forward, or API. Parsli supports all ingestion methods." },
      { title: "Better results, instantly", description: "Google Gemini 2.5 Pro delivers higher accuracy from the first document." },
    ],
    differentiators: [
      { title: "Google Gemini 2.5 Pro", description: "The most capable multimodal AI for document understanding — not a limited proprietary model." },
      { title: "Real Table Extraction", description: "Complex tables, nested line items, multi-page documents — extracted with full structure." },
      { title: "5,000+ Integrations", description: "Google Sheets, Zapier, Make, webhooks, REST API — connect Parsli to your entire stack." },
    ],
  },
  {
    slug: "nanonets",
    name: "Nanonets",
    logo: "/logos/nanonets.png",
    tagline: "Enterprise IDP platform",
    headline: "Looking for a Nanonets Alternative?",
    subheadline:
      "Nanonets is powerful but expensive and complex. Parsli delivers the same AI extraction at a fraction of the cost — no sales calls, no implementation project.",
    painPoints: [
      "Nanonets requires a sales call to get pricing — Parsli's pricing is transparent and starts at $16/mo",
      "Complex setup with model training requirements — Parsli works out of the box with zero training needed",
      "Enterprise-focused pricing puts it out of reach for small and mid-size teams processing hundreds (not millions) of documents",
    ],
    comparisonRows: [
      { feature: "Pricing", them: "Contact sales", parsli: "From $16/mo (transparent)" },
      { feature: "Setup", them: "Model training + implementation", parsli: "2 minutes, no training" },
      { feature: "Free plan", them: "Limited trial", parsli: "30 pages/mo forever" },
      { feature: "AI model", them: "Proprietary", parsli: "Google Gemini 2.5 Pro" },
      { feature: "Accuracy", them: "High (after training)", parsli: "99% (zero training)" },
      { feature: "Target user", them: "Enterprise (100K+ docs/mo)", parsli: "Any team size" },
    ],
    switchTestimonial: {
      quote: "Nanonets wanted $500/mo and a 2-week implementation. Parsli was free to start and we were extracting data in 5 minutes.",
      name: "David R.",
      role: "AP Lead",
      company: "Distribution Company",
    },
    migrationSteps: [
      { title: "Sign up for Parsli (free)", description: "No sales call needed. Create your account and first parser in under 2 minutes." },
      { title: "Define your schema", description: "Use the visual builder — no model training, no annotation, no implementation project." },
      { title: "Start extracting immediately", description: "Upload documents and get structured data in seconds. Zero training time." },
    ],
    differentiators: [
      { title: "Transparent Pricing", description: "No sales calls, no hidden costs. $16/mo for 250 pages. See all plans upfront." },
      { title: "Zero Training Required", description: "Nanonets needs model training. Parsli's AI works out of the box on any document." },
      { title: "Built for Every Team Size", description: "From solo operators to large teams. No enterprise minimums or implementation projects." },
    ],
  },
]

export function getCompetitorAd(slug: string): CompetitorAdData | undefined {
  return competitorAds.find((c) => c.slug === slug)
}

export function getAllCompetitorAdSlugs(): string[] {
  return competitorAds.map((c) => c.slug)
}
