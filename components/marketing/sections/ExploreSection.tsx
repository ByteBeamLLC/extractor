import Link from "next/link"
import {
  ArrowRight,
  GitCompareArrows,
  BookOpen,
  Lightbulb,
  Building2,
  FileText,
} from "lucide-react"
import { SectionWrapper } from "@/components/marketing/shared/SectionWrapper"

const hubs = [
  {
    icon: GitCompareArrows,
    name: "Compare Alternatives",
    description:
      "See how Parsli stacks up against Parseur, Nanonets, Docparser, and 20+ other tools.",
    href: "/compare",
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    icon: Lightbulb,
    name: "Solutions",
    description:
      "Purpose-built workflows for PDF-to-Excel, invoice parsing, bank statements, and more.",
    href: "/solutions",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    icon: BookOpen,
    name: "Blog",
    description:
      "Guides, comparisons, and tutorials on document extraction, OCR, and automation.",
    href: "/blog",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    icon: Building2,
    name: "Industries",
    description:
      "How finance, healthcare, legal, logistics, and other industries use Parsli.",
    href: "/industries",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    icon: FileText,
    name: "Document Types",
    description:
      "Extract data from invoices, receipts, contracts, bank statements, forms, and more.",
    href: "/document-types",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
]

export function ExploreSection() {
  return (
    <SectionWrapper id="explore">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Explore Parsli
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dive deeper into how Parsli works for your industry, document type,
          or workflow.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((hub) => (
          <Link
            key={hub.name}
            href={hub.href}
            className="group rounded-xl border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${hub.bgColor} ${hub.color} mb-4`}
            >
              <hub.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              {hub.name}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {hub.description}
            </p>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  )
}
