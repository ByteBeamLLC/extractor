# Parsli Guide Page Template

> Based on analysis of Supademo's guide blog posts (dummy-data, sales-demo, customer-onboarding-specialist, in-app-training, sops-in-healthcare, demo-automation).
> This document defines the template for programmatic guide pages at `/guides/[slug]`.

---

## 1. Route & URL Structure

```
/guides/                           -> Guide hub page (index)
/guides/{descriptive-slug}         -> Individual guide
```

- Slugs: lowercase, hyphenated, task-focused, 3-7 words
- Pattern: `{action}-{data-type}-from-{document-type}` or `{action}-{workflow}-with-{tool}`
- Examples:
  - `/guides/extract-line-items-from-invoices`
  - `/guides/automate-invoice-processing-with-google-sheets`
  - `/guides/extract-data-from-scanned-documents`

---

## 2. Page Layout (Two-Column After Hero)

```
+---------------------------------------------------------------+
| [Announcement bar / latest feature update]                     |
+---------------------------------------------------------------+
| [Nav]                                                          |
+---------------------------------------------------------------+
| Breadcrumb: Home > Guides > Guide Title                        |
+-----------------------------+---------------------------------+
| H1 Title                    | Featured image                  |
| Author + date               | (gradient bg + product          |
| Category badge              |  screenshot + topic label)      |
+-----------------------------+---------------------------------+
|                                                                |
+------------------+--------------------------------------------+
| ON THIS PAGE     | Opening paragraphs (hook + bridge)          |
| (sticky sidebar) |                                             |
|                  +--------------------------------------------+
| - TL;DR          | TL;DR callout box                          |
| - Section 1      |                                             |
| - Section 2      +--------------------------------------------+
| - Section 3      | H2 sections (body content)                 |
| - ...            | ...                                        |
| - FAQs           |                                             |
|                  +--------------------------------------------+
| [Free Tools]     | FAQ accordion                              |
|                  +--------------------------------------------+
|                  | Related articles (3-col grid)               |
+------------------+--------------------------------------------+
| [Full-width CTA banner]                                        |
+---------------------------------------------------------------+
| [Footer]                                                       |
+---------------------------------------------------------------+
```

### Key Layout Rules

1. **Hero**: Split layout. Title + metadata on left, featured image on right. Gradient background (primary/5 to transparent).
2. **Sidebar**: Sticky "ON THIS PAGE" table of contents. Lists all H2 headings. Nested H3s collapse/expand. Active heading highlighted. Below TOC: links to related free tools.
3. **Main column**: 660-720px max-width for readability. Generous line height (1.75). Content blocks separated by consistent spacing.

---

## 3. Hero Section

### Structure

```tsx
<section> {/* gradient bg */}
  <Breadcrumb>Home > Guides > {guide.title}</Breadcrumb>

  <div> {/* two-column split */}
    <div> {/* left */}
      <h1>{guide.h1}</h1>
      <AuthorByline avatar={author.avatar} name={author.name} date={guide.updatedAt} />
      <Badge>{guide.category}</Badge>
    </div>

    <div> {/* right - featured image */}
      <div> {/* gradient card */}
        <Badge>{guide.category}</Badge>
        <h2>{guide.imageTitle}</h2>
        <ProductScreenshot />
      </div>
    </div>
  </div>
</section>
```

### Categories (badge + breadcrumb)

| Category               | Use For                                           |
|------------------------|---------------------------------------------------|
| Document Extraction    | Guides about extracting data from specific docs   |
| Workflow Automation    | Guides about automating doc processing pipelines  |
| Integration Guide      | Guides pairing Parsli with Google Sheets, Zapier  |
| Data Conversion        | Guides about format conversion (PDF->Excel, etc.) |

### Featured Image

- Gradient background using primary color (#2782ff at 10-20% opacity)
- Product screenshot showing Parsli UI relevant to the guide topic
- Category label badge overlaid on image
- Short title text overlaid (e.g., "Extract Invoice Line Items")

---

## 4. Content Sections (In Order)

Every guide follows this exact sequence. Not every section is required, but the order must be maintained.

### 4.1 Opening Hook (2-3 paragraphs, no heading)

**Purpose**: Immediately connect with the reader's pain point.

**Pattern**: Start with a relatable scenario, then bridge to the topic.

```
Paragraph 1: Describe the painful manual process the reader is doing today.
             Use specific details ("You open the PDF, scroll to page 3, squint
             at the table, and start copying cells one by one into your spreadsheet").

Paragraph 2: Acknowledge why this is harder than it seems. Name the real friction
             (format inconsistency, scanned docs, varying layouts, scale).

Paragraph 3: Bridge to the guide — "This guide shows you exactly how to [achieve
             the outcome] — from manual approaches to fully automated pipelines."
```

### 4.2 TL;DR Callout Box

**Purpose**: Let skimmers get the core value in 10 seconds. Also great for LLM citations.

**Visual**: Blue/primary gradient background, lightning bolt icon, 4-6 bullet points.

```tsx
<div className="rounded-xl bg-primary/5 border border-primary/20 p-6 sm:p-8">
  <div className="flex items-center gap-2 mb-4">
    <Zap className="h-5 w-5 text-primary" />
    <span className="font-bold text-primary uppercase text-sm tracking-wider">TL;DR</span>
  </div>
  <ul className="space-y-3">
    {guide.tldr.map(point => (
      <li className="flex gap-3">
        <span className="text-primary mt-1">-</span>
        <span className="text-sm leading-relaxed">{point}</span>
      </li>
    ))}
  </ul>
</div>
```

**Content rules**:
- 4-6 bullet points
- Lead each bullet with a **bold phrase** summarizing the point
- Focus on facts and outcomes, not product features
- Last bullet can mention "Tools like Parsli" naturally
- Must be self-contained — a reader who only reads TL;DR should get the core message

### 4.3 "What is [X]?" — Definition Section

**Purpose**: Define the topic for SEO featured snippets and reader clarity.

**Pattern**:
```
H2: What is [topic]?

2 paragraphs defining the concept clearly. First paragraph = definition.
Second paragraph = practical example showing the concept in action.

Use italics for examples: "For instance, extracting line items from an
invoice means pulling the vendor name, item descriptions, quantities,
unit prices, and totals into structured fields."
```

### 4.4 "Why [X] Is Hard / The Challenge" — Problem Section

**Purpose**: Validate the reader's frustration. Build empathy before offering solutions.

**Pattern**:
```
H2: Why [manual approach] doesn't scale

1 intro paragraph naming the core friction.

Bullet list of 3-5 specific challenges:
- **Challenge name**: 1-2 sentence description
- **Challenge name**: 1-2 sentence description
- ...
```

### 4.5 "How to [Do X]" — Methods / Step-by-Step Section

**Purpose**: The core educational content. Walk through approaches from simple to advanced.

**Pattern**: Use numbered H3 subheadings for each method/step.

```
H2: How to extract [data] from [document type]

H3: Method 1: Manual copy-paste
  - When it works (bullet list)
  - When it breaks (bullet list)
  - Verdict paragraph

H3: Method 2: Using [free tool / Python / API]
  - Step-by-step instructions
  - Code example or screenshot (if applicable)
  - Pros/cons

H3: Method 3: AI-powered extraction with Parsli
  - Step-by-step walkthrough (3-4 steps)
  - Link to relevant free tool: "Try it free →"
  - Screenshot or product UI reference
```

**Product integration rule**: Parsli appears as ONE of the methods (usually the last / best one). Other methods get honest coverage. Never dismiss alternatives unfairly.

### 4.6 Comparison Table (Optional but Recommended)

**Purpose**: Help readers compare approaches at a glance. Great for featured snippets.

**Visual**: Full-width table with colored header row, green checkmarks for advantages.

```
| Approach         | Speed    | Accuracy | Handles Scanned PDFs | Cost   | Scale       |
|------------------|----------|----------|----------------------|--------|-------------|
| Manual copy-paste| Slow     | Low      | No                   | Free   | 1-5 docs    |
| Adobe Acrobat    | Medium   | Medium   | No                   | $20/mo | 10-50 docs  |
| Python (tabula)  | Fast     | Medium   | No                   | Free   | Unlimited   |
| Parsli           | Fast     | High     | Yes                  | Free*  | Unlimited   |
```

*Parsli column gets primary color highlight, but table must include honest data for all options.*

### 4.7 Use Cases / Examples Section (Optional)

**Purpose**: Show real-world applications. Helps readers see themselves in the content.

**Pattern**: Numbered H3 subheadings with 2-3 paragraphs each.

```
H2: Common use cases for [topic]

H3: 1. Accounts payable automation
  - Scenario description
  - How extraction fits in

H3: 2. Expense reporting
  - Scenario description
  - How extraction fits in
```

### 4.8 Best Practices Section

**Purpose**: Actionable advice that positions the author as an expert.

**Pattern**: Numbered H3 subheadings, each with 1-2 paragraphs.

```
H2: Best practices for [topic]

H3: 1. [Practice name]
  - 1-2 paragraphs explaining why and how

H3: 2. [Practice name]
  - 1-2 paragraphs
```

### 4.9 Common Mistakes Section (Optional)

**Purpose**: Help readers avoid pitfalls. Good for "People also ask" SEO.

**Pattern**: Same as best practices but framed as anti-patterns.

```
H2: [N] common mistakes when [doing X]

H3: 1. [Mistake name]
  - Why it happens + how to avoid it

H3: 2. [Mistake name]
  - Why it happens + how to avoid it
```

### 4.10 Conclusion + CTA

**Purpose**: Summarize and convert.

**Pattern**:
```
H2: [Wrap-up heading, e.g., "From manual extraction to automated pipelines"]

1-2 paragraphs summarizing the guide's key message.
End with a natural bridge to Parsli.

<CTA Box>
  "Stop copying data out of documents manually."
  "Parsli extracts structured data from PDFs, invoices, and emails — automatically.
   30 free pages/month, no credit card required."
  [Try it for free →]  [Book a demo]
</CTA Box>
```

### 4.11 FAQ Section

**Purpose**: Capture "People also ask" queries. FAQPage schema for rich snippets.

**Pattern**: 5-8 questions in collapsible accordion format.

```
H2: Frequently Asked Questions

<Accordion>
  Q: [Question targeting a long-tail keyword]
  A: [2-4 sentence answer. Can mention Parsli naturally in 1-2 answers.]

  Q: [Question]
  A: [Answer]
  ...
</Accordion>
```

**Question writing rules**:
- Use natural language questions people actually search
- First question should be the most basic/definitional
- Include 1-2 "how to" questions
- Include 1 comparison question ("What's the difference between X and Y?")
- Include 1 tool/recommendation question
- Answers should be self-contained (useful without reading the full guide)

---

## 5. Content Block Types (Component Library)

### Paragraph
Standard body text. Max 3-4 sentences. No walls of text.

### Heading (H2)
Section headers. Question format preferred ("How to...", "What is...", "Why does...").
Maps to TOC entries.

### Heading (H3)
Subsection headers. Often numbered ("1. Method name", "2. Method name").
Collapsible in TOC under parent H2.

### Bullet List
Unordered list for features, benefits, challenges. Bold lead phrase + description.

### Numbered List
For sequential steps or ranked items.

### TL;DR Callout
Blue gradient box at top of article. 4-6 summary bullets. One per guide.

### Tip/Note Callout
Inline callout box for tips, warnings, or key insights.
- **Tip** (blue border-left, blue bg): Helpful advice
- **Warning** (amber border-left, amber bg): Common pitfall
- **Note** (gray border-left, gray bg): Additional context

```tsx
<div className="rounded-lg border-l-4 border-primary bg-primary/5 px-6 py-4">
  <p className="text-sm leading-relaxed font-medium">{text}</p>
</div>
```

### Comparison Table
Full-width table with header row. Parsli column highlighted with primary color.
Use checkmarks (green) and X marks (red) for boolean comparisons.

### Step-by-Step Block
Numbered steps with title + description. Used in "How to" sections.

```tsx
<div className="flex gap-4">
  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center
                  justify-center text-sm font-bold shrink-0">1</div>
  <div>
    <h4 className="font-semibold">{step.title}</h4>
    <p className="text-muted-foreground">{step.description}</p>
  </div>
</div>
```

### Free Tool Callout
Links to a relevant free tool. Appears 1-2 times in the guide body.

```tsx
<div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6">
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center
                    justify-center shrink-0">
      <Zap className="text-primary text-lg" />
    </div>
    <div>
      <p className="font-semibold mb-1">{tool.title}</p>
      <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
      <Link href={tool.href} className="text-sm font-medium text-primary">
        Try it free <ArrowRight />
      </Link>
    </div>
  </div>
</div>
```

### Product Screenshot
App UI screenshot relevant to the guide topic. Used sparingly (1-2 per guide).

### Mid-Article CTA
Soft CTA appearing ~60% through the guide. Not a hard sell.

```tsx
<div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-6 py-4
                flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  <p className="text-sm font-medium leading-relaxed">{text}</p>
  <AuthButton size="sm" showArrow>Try it for free</AuthButton>
</div>
```

### End-of-Article CTA
Full-width CTA box after conclusion, before FAQ.

### FAQ Accordion
Collapsible question/answer pairs with FAQPage JSON-LD schema.

---

## 6. Sidebar: "ON THIS PAGE" TOC

### Structure

```tsx
<aside className="sticky top-24"> {/* fixed on scroll */}
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
    On this page
  </p>
  <nav>
    {guide.headings.map(h2 => (
      <div>
        <a href={`#${h2.id}`} className={active ? "text-primary font-medium" : "text-muted-foreground"}>
          {h2.text}
        </a>
        {h2.children?.map(h3 => (
          <a href={`#${h3.id}`} className="pl-4 text-sm text-muted-foreground">
            {h3.text}
          </a>
        ))}
      </div>
    ))}
  </nav>

  {/* Related free tools below TOC */}
  <div className="mt-8 pt-6 border-t">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      Try Free
    </p>
    {guide.relatedTools.map(tool => (
      <Link href={tool.href} className="block text-sm text-primary hover:underline mb-2">
        {tool.title} ->
      </Link>
    ))}
  </div>
</aside>
```

### Behavior
- Sticky position below navbar
- Active heading highlighted as user scrolls (IntersectionObserver)
- H3s nested under parent H2 with left border indicator
- Collapses to hidden on mobile (content-only view)

---

## 7. SEO Requirements Per Guide

### Metadata
```tsx
{
  title: "{Guide Title} | Parsli",              // 50-60 chars
  description: "{Action-oriented summary}",       // 150-160 chars
  canonical: "https://parsli.co/guides/{slug}",
  openGraph: {
    type: "article",
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
    authors: ["Talal Bazerbachi"],
  },
  twitter: { card: "summary_large_image" },
}
```

### JSON-LD (3 blocks)
1. **BreadcrumbList**: Home > Guides > {title}
2. **Article**: Title, author, dates, publisher, image
3. **FAQPage**: All FAQ Q&A pairs (if FAQ section exists)

### Internal Linking Targets Per Guide
Each guide must link to:
- 1-2 **free tools** (inline callout boxes)
- 1-2 **solutions** pages (in Related Resources)
- 1-2 **comparison** pages (in Related Resources)
- 1-2 **blog posts** (in Related Articles)
- The **guides hub** page (via breadcrumb)

---

## 8. Product Integration Rules

### Do
- Present Parsli as one of several approaches (usually the recommended one)
- Show honest pros/cons of all methods including manual ones
- Link to free tools that let readers try immediately without signup
- Use product screenshots only when they illustrate the concept being taught
- Mention specific features by name (schema builder, email forwarding, confidence scoring)

### Don't
- Lead with Parsli — lead with the reader's problem
- Dismiss competitors or manual methods unfairly
- Put product CTAs in the first 40% of the article
- Use more than 2 mid-article CTAs
- Make the TL;DR about Parsli features

### CTA Placement Rules
1. **Mid-article CTA** (~60% through): Soft, inline banner. "Want to automate this? Try Parsli free."
2. **Free tool callout** (after relevant method section): Links to the free browser tool.
3. **End CTA** (after conclusion, before FAQ): Full CTA box with signup + demo buttons.

---

## 9. Data Structure (TypeScript)

```typescript
export interface GuideData {
  slug: string
  title: string
  h1: string
  metaTitle: string
  metaDescription: string
  publishedAt: string
  updatedAt: string
  author: string
  authorTitle: string
  readTime: string
  category: "Document Extraction" | "Workflow Automation" | "Integration Guide" | "Data Conversion"

  /** Featured image config */
  imageTitle: string   // Short title overlaid on featured image

  /** TL;DR bullet points (4-6) */
  tldr: string[]

  /** Content blocks */
  content: GuideContentBlock[]

  /** FAQ pairs */
  faqs: { question: string; answer: string }[]

  /** Related page slugs */
  relatedTools: { href: string; title: string; description: string }[]
  relatedSolutions: string[]
  relatedCompare: string[]
  relatedBlog: string[]
}

export type GuideContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; variant: "tip" | "warning" | "note"; text: string }
  | { type: "tldr"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; highlightColumn?: number }
  | { type: "step"; number: number; title: string; description: string }
  | { type: "tool-callout"; href: string; title: string; description: string }
  | { type: "mid-cta"; text: string }
  | { type: "cta"; headline?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "pros-cons"; pros: string[]; cons: string[] }
```

---

## 10. Content Flow Template (Copy-Paste Skeleton)

```
[Opening hook - 2-3 paragraphs, no heading]

## TL;DR
[4-6 bullet callout box]

## What is [topic]?
[Definition paragraph]
[Example paragraph in italics]

## Why [manual approach] is painful
[Intro paragraph]
[Bullet list of 3-5 challenges with bold headers]

## How to [do X]: [N] methods compared
[Comparison table - optional]

### Method 1: [Simple/manual approach]
[When it works / when it breaks]

### Method 2: [Intermediate approach]
[Steps + tradeoffs]

### Method 3: AI-powered extraction with Parsli
[Steps + free tool callout]

[Mid-article CTA - ~60% mark]

## [N] use cases for [topic]
### 1. [Use case name]
### 2. [Use case name]

## Best practices
### 1. [Practice]
### 2. [Practice]

## Common mistakes to avoid
### 1. [Mistake]
### 2. [Mistake]

## [Conclusion heading]
[Summary + natural bridge to product]
[End CTA box]

## Frequently Asked Questions
[5-8 FAQ accordion items]

[Related Articles - 3-column grid]
[Full-width CTA banner]
```

---

## 11. Visual Design Specifications

### Colors
- **TL;DR box**: `bg-primary/5 border-primary/20` (soft blue)
- **Tip callout**: `border-l-4 border-primary bg-primary/5`
- **Warning callout**: `border-l-4 border-amber-500 bg-amber-50`
- **Comparison table Parsli column**: `bg-primary/5` header, green checkmarks
- **CTA box**: `bg-muted/30 border rounded-xl`
- **Featured image gradient**: `from-primary/10 via-primary/5 to-transparent`

### Typography
- **H1**: `text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight`
- **H2**: `text-2xl font-bold tracking-tight mt-10 mb-4`
- **H3**: `text-xl font-semibold mt-8 mb-3`
- **Body**: `text-base leading-relaxed text-muted-foreground`
- **TL;DR label**: `text-sm font-bold uppercase tracking-wider text-primary`
- **TOC heading**: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`

### Spacing
- Between content blocks: `space-y-5` (20px)
- Before H2: `mt-10` (40px)
- Before H3: `mt-8` (32px)
- Callout boxes: `p-6 sm:p-8`
- Article max-width: `max-w-3xl` (main column)
- TOC sidebar: `w-64` (fixed width)

---

## 12. Initial 10 Guide Pages to Build

| # | Slug | H1 | Category | Primary Tool |
|---|------|----|----------|-------------|
| 1 | extract-line-items-from-invoices | How to Extract Line Items from Invoices Automatically | Document Extraction | invoice-parser |
| 2 | extract-data-from-bank-statements | How to Extract Data from Bank Statements (PDF to Excel) | Document Extraction | bank-statement-parser |
| 3 | convert-receipts-to-spreadsheet | How to Convert Receipts to Spreadsheet Data | Data Conversion | receipt-scanner |
| 4 | extract-tables-from-pdf | How to Extract Tables from Any PDF Document | Document Extraction | pdf-table-extractor |
| 5 | parse-email-attachments-automatically | How to Parse Email Attachments Automatically | Workflow Automation | invoice-parser |
| 6 | extract-data-from-purchase-orders | How to Extract Data from Purchase Orders | Document Extraction | invoice-parser |
| 7 | automate-invoice-processing-with-google-sheets | How to Automate Invoice Processing with Google Sheets | Integration Guide | invoice-parser |
| 8 | extract-data-from-scanned-documents | How to Extract Data from Scanned Documents (OCR) | Document Extraction | image-to-text |
| 9 | pdf-to-google-sheets-automation | How to Send PDF Data to Google Sheets Automatically | Integration Guide | pdf-to-excel |
| 10 | extract-vendor-information-from-invoices | How to Extract Vendor Information from Invoices | Document Extraction | invoice-parser |

---

## 13. Differences from Supademo's Pattern (Parsli Adaptations)

| Supademo Pattern | Parsli Adaptation |
|------------------|-------------------|
| Embedded interactive demos (iframes) | Links to free browser tools (no signup) |
| YouTube video embeds | Product screenshots showing Parsli UI |
| "SUMMARIZE WITH AI" buttons (ChatGPT/Claude) | Omit (not relevant to our audience) |
| Purple/indigo gradient theme | Blue (#2782ff) primary color |
| SaaS/demo automation audience | Finance/ops/data teams audience |
| Demo Automation Playbooks category | Document Extraction, Workflow Automation, etc. |
| Product is an interactive demo tool | Product is a document extraction tool |
| Testimonials from named companies | Stats: 50k+ docs processed, 95%+ accuracy |

---

## 14. Sitemap & Schema Checklist

- [ ] Add `/guides` and all `/guides/[slug]` to `sitemap.ts`
- [ ] Priority: 0.7 for guides (same as blog)
- [ ] Add `generateStaticParams()` to guide route
- [ ] Add `generateMetadata()` with full OG + Twitter cards
- [ ] Add BreadcrumbList JSON-LD
- [ ] Add Article JSON-LD
- [ ] Add FAQPage JSON-LD (if FAQ section exists)
- [ ] Cross-link from blog posts to relevant guides
- [ ] Cross-link from solutions to relevant guides
- [ ] Cross-link from comparison pages to relevant guides
- [ ] Add guides to homepage ExploreSection
- [ ] Add guides hub to navigation
