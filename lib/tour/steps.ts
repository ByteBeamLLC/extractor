export interface TourStepConfig {
  id: string
  /** Route path — absolute if `absolute` is true, otherwise suffix after /parsers/[parserId]/ */
  route: string
  /** When true, route is an absolute path (e.g. "/dashboard") instead of parser-relative */
  absolute?: boolean
  title: string
  description: string
}

export const PARSER_TOUR_STEPS: TourStepConfig[] = [
  {
    id: "welcome",
    route: "/dashboard",
    absolute: true,
    title: "Welcome to Parsli!",
    description:
      "Parsli extracts structured data from your documents using AI. Create a parser to define what data you want to extract — then feed it documents via upload, email, or API.",
  },
  {
    id: "overview",
    route: "",
    title: "Your parser dashboard",
    description:
      "This is your parser's home — stats, quick actions, and your unique email forwarding address. Let's walk through how to set it up.",
  },
  {
    id: "schema",
    route: "schema",
    title: "Configure extraction",
    description:
      'For field-based parsers, add fields manually or use "Auto-Detect Fields." For full-content parsers, add optional instructions to guide the AI.',
  },
  {
    id: "documents",
    route: "documents",
    title: "Upload documents",
    description:
      "Upload documents here to run extraction against your fields. Drag and drop or click to browse — results appear instantly.",
  },
  {
    id: "import",
    route: "import",
    title: "More ways to ingest documents",
    description:
      "Forward emails to your parser's unique address, send documents via webhook, or use the REST API for programmatic access.",
  },
  {
    id: "export",
    route: "export",
    title: "Use your extracted data",
    description:
      "Download as CSV or JSON, or connect integrations like Google Sheets, Google Docs, Zapier, Make, and webhooks to automate your workflow.",
  },
]
