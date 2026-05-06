/**
 * SFDA marketing tool registry. Powers the public /sfda hub and per-tool
 * landing pages. Content adapted from the originating tool implementations,
 * reshaped to follow the converting page anatomy used elsewhere in the
 * Bytebeam product family.
 *
 * Conversion model: each tool is rate-limited to a small number of free runs
 * (default 1). After the user hits the AHA moment, the primary CTA switches
 * to a sales-led demo booking — license is sold on the call, not self-serve.
 */

/** Where every "Book a demo" CTA points. Sales-led license conversion. */
export const BOOK_DEMO_URL =
  "https://calendly.com/talal-bytebeam/sfda-discovery"

/** Default number of free runs per tool before the demo gate kicks in. */
export const DEFAULT_FREE_USES = 1

export interface SfdaToolInput {
  id: string
  label: string
  description: string
  accept: string
  maxSize: number
  required: boolean
}

export interface SfdaToolOutput {
  label: string
  format: string
}

export interface SfdaToolFeature {
  icon: string
  title: string
  description: string
}

export interface SfdaToolStep {
  icon: string
  title: string
  description: string
}

export interface SfdaToolPersona {
  icon: string
  title: string
  description: string
}

export interface SfdaToolFaq {
  q: string
  a: string
}

export interface SfdaTool {
  slug: string
  name: string
  shortName: string
  headKeyword: string
  outcome: string
  description: string
  metaDescription: string
  icon: string
  badgeLabel: string
  ctaLabel: string
  inputs: SfdaToolInput[]
  output: SfdaToolOutput
  features: SfdaToolFeature[]
  steps: SfdaToolStep[]
  useCases: string[]
  outOfScope: string[]
  personas: SfdaToolPersona[]
  faqs: SfdaToolFaq[]
}

const MB = 1024 * 1024

export const SFDA_TOOLS: SfdaTool[] = [
  {
    slug: "spc-pil-generator",
    name: "SFDA SmPC & PIL Generator",
    shortName: "SmPC & PIL Generator",
    headKeyword: "SFDA SmPC generator",
    outcome:
      "Generate SFDA-aligned English SmPC and PIL drafts from your originator pack — in minutes, not weeks.",
    description:
      "Upload the originator SmPC and PIL plus your new-product data. The tool produces draft English SmPC and PIL aligned to SFDA Module 1.3 structure and GCC labelling expectations, ready for your regulatory team's review and sign-off.",
    metaDescription:
      "Generate SFDA-aligned English SmPC and PIL drafts from originator documents. Module 1.3-ready, editable DOCX output, built for KSA submissions.",
    icon: "FileText",
    badgeLabel: "SmPC & PIL Generator",
    ctaLabel: "Generate draft SmPC + PIL",
    inputs: [
      {
        id: "originator_smpc",
        label: "Originator SmPC",
        description: "EMA/EMC originator Summary of Product Characteristics",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
      {
        id: "originator_pil",
        label: "Originator PIL",
        description: "EMA/EMC originator Patient Information Leaflet",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
      {
        id: "product_data",
        label: "New product data",
        description:
          "Brand name, MAH, manufacturer, excipients, pack sizes, storage conditions",
        accept: ".pdf,.docx,.xlsx",
        maxSize: 10 * MB,
        required: true,
      },
      {
        id: "stability_study",
        label: "Stability study (optional)",
        description: "Informs storage statement and shelf life",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: false,
      },
    ],
    output: {
      label: "Draft SmPC and PIL (English)",
      format: "DOCX",
    },
    features: [
      {
        icon: "Shield",
        title: "Authority-aligned",
        description:
          "Output structure follows SFDA Module 1.3 expectations and the EMA QRD-derived layout adopted across GCC.",
      },
      {
        icon: "FileSearch",
        title: "Originator-anchored",
        description:
          "Pulls structure and clinical content from the originator dossier — no blank-page guesswork.",
      },
      {
        icon: "PenLine",
        title: "Editable DOCX out",
        description:
          "Your QPPV gets a real Word file, not a locked PDF — finish sign-off in your normal review tools.",
      },
    ],
    steps: [
      {
        icon: "Upload",
        title: "Upload originator pack",
        description:
          "Drop in the originator SmPC + PIL. PDFs or DOCX, up to 25 MB each.",
      },
      {
        icon: "ListChecks",
        title: "Add new product data",
        description:
          "Brand, MAH, manufacturer, excipients, pack sizes, storage. Fields map to SFDA's expected sections.",
      },
      {
        icon: "Download",
        title: "Download SmPC + PIL drafts",
        description:
          "Editable DOCX, ready for your QPPV / RA review and final sign-off.",
      },
    ],
    useCases: [
      "Preparing Module 1.3 labelling documents for a new SFDA submission.",
      "Building first-pass SmPC and PIL drafts for generic registrations.",
      "Aligning labelling between originator EU pack and KSA local pack.",
      "Out-licensing or in-licensing transfers where labelling needs adapting to KSA.",
    ],
    outOfScope: [
      "Regulatory sign-off — your QPPV or RA lead reviews and approves.",
      "Arabic translation — handled by the SmPC & PIL Arabic Translator.",
      "Module 3 quality content — labelling artefacts only.",
      "Promotional or marketing copy.",
    ],
    personas: [
      {
        icon: "Factory",
        title: "Local Saudi manufacturers",
        description:
          "Generic and OTC manufacturers preparing high-volume Module 1.3 packages without scaling headcount.",
      },
      {
        icon: "Globe",
        title: "Foreign manufacturers entering KSA",
        description:
          "MAHs adapting an originator pack to the local market — first KSA submission without an in-house RA team.",
      },
      {
        icon: "Users",
        title: "RA consultancies",
        description:
          "Firms running 10+ submissions a year — replace draft cycles with same-day output across client portfolios.",
      },
      {
        icon: "Building2",
        title: "MNC affiliate RA teams",
        description:
          "Local affiliate teams under headcount pressure, scaling submission throughput without scaling people.",
      },
    ],
    faqs: [
      {
        q: "Does the output meet SFDA's QRD-style template requirements?",
        a: "The draft is structured to align with SFDA's Module 1.3 expectations and the EMA QRD-derived layout that GCC authorities have largely adopted. Final formatting and wording is your regulatory team's responsibility before submission.",
      },
      {
        q: "Can I use this for innovator (new chemical entity) submissions?",
        a: "Yes — but innovator submissions usually require bespoke sections beyond what an originator-anchored draft covers. Treat the output as a structural starting point and expect your team to author the originator-specific sections from scratch.",
      },
      {
        q: "What happens to my source documents?",
        a: "Files are processed inside your Bytebeam workspace, not stored externally. Audit trail is retained for compliance review and can be wiped on request.",
      },
      {
        q: "How long does generation take?",
        a: "Typical SmPC + PIL drafts return in 3–8 minutes depending on the complexity of the originator pack. You can stay on the page or come back via the dashboard.",
      },
      {
        q: "Can the output go straight to submission?",
        a: "No. The draft is a structural starting point that replaces 60–80% of the manual work. Your QPPV/RA lead must review and approve before any SFDA submission.",
      },
      {
        q: "Does it handle pack-size, dosage form, or strength variations?",
        a: "Yes. Provide the new product data sheet with the variants and the tool produces correctly populated SmPC fields for each. Multi-strength packs become a single coherent SmPC with the right sections expanded.",
      },
    ],
  },
  {
    slug: "spc-pil-arabic-translator",
    name: "SFDA Arabic SmPC & PIL Translator",
    shortName: "Arabic SmPC & PIL Translator",
    headKeyword: "SFDA PIL Arabic translation",
    outcome:
      "Translate English SmPC and PIL into SFDA-compliant Arabic with regulator-ready RTL formatting.",
    description:
      "Upload finalised English SmPC and PIL. The tool produces Arabic translations using SFDA-recognised regulatory phrasing, with RTL layout and bilingual section headings — ready for review by your Arabic-fluent reviewer.",
    metaDescription:
      "Translate SmPC and PIL to Arabic for SFDA submission. Regulatory-aware phrasing, RTL formatting, Saudi-specific terminology, editable DOCX out.",
    icon: "Languages",
    badgeLabel: "Arabic Translator",
    ctaLabel: "Translate to Arabic",
    inputs: [
      {
        id: "english_smpc",
        label: "English SmPC",
        description: "Finalised English Summary of Product Characteristics",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
      {
        id: "english_pil",
        label: "English PIL",
        description: "Finalised English Patient Information Leaflet",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
    ],
    output: {
      label: "Arabic SmPC and PIL with RTL formatting",
      format: "DOCX",
    },
    features: [
      {
        icon: "Languages",
        title: "Regulatory Arabic, not generic translation",
        description:
          "Modern Standard Arabic with phrasing SFDA recognises. Avoids the calques and over-literal renderings that trigger Module 1.3 RFIs.",
      },
      {
        icon: "AlignRight",
        title: "RTL formatting built in",
        description:
          "Tables, lists, and section headings flip cleanly. No post-process reformatting in Word required.",
      },
      {
        icon: "BookOpen",
        title: "Section-aware",
        description:
          "SmPC and PIL section structure preserved. Bilingual headings if your local pack format requires them.",
      },
    ],
    steps: [
      {
        icon: "FileUp",
        title: "Upload English SmPC + PIL",
        description:
          "PDFs or DOCX. Final English versions, not drafts — translation aligns to your approved English text.",
      },
      {
        icon: "Languages",
        title: "Auto-translate with regulatory phrasing",
        description:
          "AI applies SFDA-accepted regulatory Arabic. Brand and scientific terms preserved with established transliterations.",
      },
      {
        icon: "FileDown",
        title: "Download Arabic DOCX",
        description:
          "Editable RTL Word file. Ready for your Arabic-fluent reviewer's sign-off.",
      },
    ],
    useCases: [
      "Producing the Arabic PIL required by SFDA for Module 1.3.",
      "Aligning bilingual Arabic/English labelling for the KSA market.",
      "Updating Arabic translations after a labelling variation.",
      "Catch-up translation work after an English SmPC update from the MAH.",
    ],
    outOfScope: [
      "Linguistic validation — readability testing with Arabic users is your team's responsibility.",
      "Pictogram or layout artwork.",
      "Translation of Module 3 quality content.",
      "Free-form marketing or promotional translation.",
    ],
    personas: [
      {
        icon: "Factory",
        title: "Manufacturers without in-house Arabic team",
        description:
          "Replace external translation-agency cycles. Same-day Arabic from the approved English source.",
      },
      {
        icon: "Users",
        title: "RA consultancies handling MAH portfolios",
        description:
          "Productize Arabic translation as a recurring service line, no per-project translation outsourcing.",
      },
      {
        icon: "Globe",
        title: "Foreign pharma entering KSA",
        description:
          "First Arabic SmPC + PIL package without hiring an Arabic regulatory writer.",
      },
      {
        icon: "RefreshCw",
        title: "Variation-heavy portfolios",
        description:
          "Every SmPC update needs an Arabic re-translation — automate the recurring overhead.",
      },
    ],
    faqs: [
      {
        q: "Which Arabic register does the tool produce?",
        a: "Modern Standard Arabic, using regulatory phrasing accepted by SFDA. Brand names and specific scientific terms are kept in their accepted Arabic transliteration where established.",
      },
      {
        q: "Do you preserve formatting from the source document?",
        a: "Section structure and tables are preserved. RTL flow is applied automatically. Final visual polish (font, kerning, page breaks) typically requires light DTP work.",
      },
      {
        q: "Will SFDA accept this Arabic without further review?",
        a: "No. Your Arabic-fluent reviewer must read and approve before submission. The tool replaces the time-intensive first-pass translation, not the regulatory review.",
      },
      {
        q: "Can I translate just the PIL, or just the SmPC?",
        a: "Both files are required by default for cross-document consistency. If you only have one, contact us — single-document workflows are supported on the Pro plan.",
      },
      {
        q: "How does it handle SFDA-specific terminology?",
        a: "A maintained glossary of SFDA-accepted regulatory Arabic terms is applied consistently across both documents. Where the regulator publishes a preferred translation, that wording is used.",
      },
      {
        q: "How long does translation take?",
        a: "Typical SmPC + PIL Arabic translation returns in 5–10 minutes depending on document length. Drafts save automatically to your dashboard.",
      },
    ],
  },
  {
    slug: "dossier-gap-analysis",
    name: "SFDA Dossier Gap Analysis",
    shortName: "Dossier Gap Analysis",
    headKeyword: "SFDA dossier review",
    outcome:
      "Catch SFDA labelling gaps before you submit — section-by-section gap report ranked by submission risk.",
    description:
      "Upload your English PIL, Arabic PIL, and English SmPC. The tool runs a structured comparison against SFDA Module 1.3 expectations and GCC labelling guidance, returning a per-section gap report ranked by likelihood of triggering an RFI or rejection.",
    metaDescription:
      "Pre-submission gap analysis for SFDA SmPC and PIL packs. Catches labelling, translation, and section-completeness gaps. Severity-ranked report.",
    icon: "SearchCheck",
    badgeLabel: "Gap Analysis",
    ctaLabel: "Run gap analysis",
    inputs: [
      {
        id: "english_pil",
        label: "English PIL",
        description: "Patient Information Leaflet, English",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
      {
        id: "arabic_pil",
        label: "Arabic PIL",
        description: "Patient Information Leaflet, Arabic",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
      {
        id: "english_smpc",
        label: "English SmPC",
        description: "Summary of Product Characteristics, English",
        accept: ".pdf,.docx",
        maxSize: 25 * MB,
        required: true,
      },
      {
        id: "product_data",
        label: "New drug data",
        description: "Brand name, MAH, manufacturer, excipients, pack sizes",
        accept: ".pdf,.docx,.xlsx",
        maxSize: 10 * MB,
        required: true,
      },
    ],
    output: {
      label: "Section-by-section gap report with severity ranking",
      format: "PDF + on-screen viewer",
    },
    features: [
      {
        icon: "AlertTriangle",
        title: "Severity-ranked findings",
        description:
          "Each gap tagged Critical (likely RFI/rejection), Major (probable RFI), or Minor (recommended fix).",
      },
      {
        icon: "GitCompare",
        title: "Cross-document checks",
        description:
          "Validates Arabic PIL against the English source and against the English SmPC — catches drift between artefacts.",
      },
      {
        icon: "BookCheck",
        title: "Guidance-grounded",
        description:
          "Findings cite the specific SFDA / GCC guidance section that drives each gap. No vague flags.",
      },
    ],
    steps: [
      {
        icon: "Upload",
        title: "Upload your three artefacts",
        description:
          "English PIL, Arabic PIL, English SmPC — plus the product data sheet.",
      },
      {
        icon: "Search",
        title: "Auto-comparison runs",
        description:
          "Section-by-section pass against SFDA Module 1.3 + GCC labelling expectations.",
      },
      {
        icon: "FileText",
        title: "Get severity-ranked report",
        description:
          "Critical / Major / Minor findings with citation to the SFDA guidance that drives each.",
      },
    ],
    useCases: [
      "Pre-submission self-check to reduce SFDA Requests for Information.",
      "Auditing a partner CMO's labelling output before signing off.",
      "Variation impact assessment before submitting a Type IB or Type II.",
      "QC sweep before a regulatory inspection.",
    ],
    outOfScope: [
      "Module 3 quality content — gap analysis covers labelling artefacts only.",
      "Regulatory sign-off — final review and submission decisions remain with your QPPV/RA lead.",
      "Pricing or commercial review.",
      "Translation correctness — use the Arabic Translator for that.",
    ],
    personas: [
      {
        icon: "ShieldCheck",
        title: "RA leads pre-submission",
        description:
          "Last-mile QC before the submission button. Catch gaps that cost weeks in RFI cycles.",
      },
      {
        icon: "Eye",
        title: "QPPVs auditing CMO output",
        description:
          "Validate labelling artefacts received from a contract manufacturer or partner agency.",
      },
      {
        icon: "Factory",
        title: "Manufacturers running variations",
        description:
          "Type IB/II changes — assess labelling impact before formal submission.",
      },
      {
        icon: "Users",
        title: "RA consultancies serving multiple MAHs",
        description:
          "Standardised QC layer across diverse client portfolios.",
      },
    ],
    faqs: [
      {
        q: "What does 'severity ranking' mean?",
        a: "Each gap is tagged Critical (likely RFI or rejection), Major (probable RFI), or Minor (recommended fix). The ranking is grounded in published SFDA guidance and common Module 1.3 deficiency patterns observed in real submissions.",
      },
      {
        q: "Will it find issues a human reviewer would miss?",
        a: "It is a complement, not a replacement. Use it for completeness sweeps; rely on your reviewer for clinical and pharmacological judgement.",
      },
      {
        q: "Does it check the Arabic against the English?",
        a: "Yes. The tool detects drift between the Arabic PIL and the English source, including missing sections, terminology mismatches, and structural inconsistencies.",
      },
      {
        q: "How long does an analysis take?",
        a: "Typical full-pack gap analysis runs in 2–5 minutes. Reports are saved to your dashboard for re-review.",
      },
      {
        q: "Can I run it on a partial pack?",
        a: "All three artefacts are required for a meaningful comparison. If you only have an SmPC, the gap analysis cannot validate cross-document consistency.",
      },
      {
        q: "Can I export the report for my QMS?",
        a: "Yes. Reports export as PDF with citations and severity tags suitable for QMS evidence and inspection-ready records.",
      },
    ],
  },
]

export function getSfdaTool(slug: string): SfdaTool | undefined {
  return SFDA_TOOLS.find((t) => t.slug === slug)
}

export function getAllSfdaToolSlugs(): string[] {
  return SFDA_TOOLS.map((t) => t.slug)
}

export function getOtherSfdaTools(slug: string): SfdaTool[] {
  return SFDA_TOOLS.filter((t) => t.slug !== slug)
}
