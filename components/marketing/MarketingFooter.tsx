import Link from "next/link"
import Image from "next/image"

const footerLinks = {
  Product: [
    { href: "/solutions/pdf-to-excel", label: "PDF to Excel" },
    { href: "/solutions/invoice-parsing", label: "Invoice Parsing" },
    { href: "/solutions/bank-statement-extraction", label: "Bank Statement Extraction" },
    { href: "/solutions/no-code-document-parser", label: "No-Code Parser" },
    { href: "/solutions/document-parsing-api", label: "Document Parsing API" },
  ],
  Tools: [
    { href: "/tools/pdf-to-excel", label: "PDF to Excel Converter" },
  ],
  Resources: [
    { href: "/blog", label: "Blog" },
    { href: "/docs", label: "Documentation" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs#api", label: "API Reference" },
  ],
  "Use Cases": [
    { href: "/use-cases/invoice-parsing", label: "Invoice Parsing" },
    { href: "/use-cases/email-parsing", label: "Email Parsing" },
    { href: "/use-cases/pdf-data-extraction", label: "PDF Data Extraction" },
    { href: "/use-cases/pdf-to-excel", label: "PDF to Excel" },
    { href: "/use-cases/receipt-scanning", label: "Receipt Scanning" },
  ],
  Compare: [
    { href: "/alternative/nanonets", label: "vs Nanonets" },
    { href: "/alternative/docparser", label: "vs Docparser" },
    { href: "/alternative/parseur", label: "vs Parseur" },
    { href: "/alternative/upstage", label: "vs Upstage" },
  ],
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/parsli-icon.png"
                alt="Parsli"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-bold tracking-tight">Parsli</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered document data extraction. Turn any document into structured data.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Parsli. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="mailto:support@parsli.co"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
