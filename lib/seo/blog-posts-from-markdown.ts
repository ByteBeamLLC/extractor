/**
 * Parses markdown blog posts from content/blog/ into BlogPost objects.
 * Markdown files use YAML frontmatter for metadata and standard markdown
 * for content (headings, paragraphs, lists, blockquotes).
 */
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import type { BlogPost, ContentBlock } from "./blog-posts"

const CONTENT_DIR = path.join(process.cwd(), "content", "blog")

/** Convert markdown body text into ContentBlock[] */
function parseMarkdownToBlocks(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = markdown.split("\n")
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip empty lines
    if (line.trim() === "") {
      i++
      continue
    }

    // Skip horizontal rules
    if (/^---+\s*$/.test(line.trim())) {
      i++
      continue
    }

    // Skip "Published:" line
    if (line.trim().startsWith("Published:")) {
      i++
      continue
    }

    // Skip the H1 title (# heading)
    if (/^# [^#]/.test(line)) {
      i++
      continue
    }

    // H2 heading
    if (/^## /.test(line)) {
      blocks.push({ type: "heading", level: 2, text: line.replace(/^## /, "").trim() })
      i++
      continue
    }

    // H3 heading
    if (/^### /.test(line)) {
      blocks.push({ type: "heading", level: 3, text: line.replace(/^### /, "").trim() })
      i++
      continue
    }

    // Blockquote → callout
    if (/^> /.test(line)) {
      const calloutLines: string[] = []
      while (i < lines.length && /^> /.test(lines[i])) {
        calloutLines.push(lines[i].replace(/^> /, "").trim())
        i++
      }
      blocks.push({ type: "callout", text: calloutLines.join(" ") })
      continue
    }

    // Unordered list
    if (/^- /.test(line)) {
      const items: string[] = []
      while (i < lines.length && (/^- /.test(lines[i]) || /^ {2,}/.test(lines[i]))) {
        if (/^- /.test(lines[i])) {
          items.push(lines[i].replace(/^- /, "").trim())
        } else {
          // Continuation line — append to last item
          if (items.length > 0) {
            items[items.length - 1] += " " + lines[i].trim()
          }
        }
        i++
      }
      blocks.push({ type: "list", items })
      continue
    }

    // InteractiveDemo component → cta
    if (line.trim().startsWith("<InteractiveDemo")) {
      // Skip until closing tag or self-closing
      while (i < lines.length && !lines[i].includes("/>") && !lines[i].includes("</InteractiveDemo>")) {
        i++
      }
      i++ // skip the closing line
      // Check if previous heading was "See Parsli in Action"
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock?.type === "heading" && lastBlock.text === "See Parsli in Action") {
        blocks.pop() // remove the heading, replace with CTA
      }
      blocks.push({ type: "cta", headline: "See Parsli in Action" })
      continue
    }

    // "Going Further" section → cta (heading + link list)
    if (line.trim() === "## Going Further") {
      // Skip all remaining content (links, etc.)
      i++
      while (i < lines.length) {
        i++
      }
      blocks.push({ type: "cta", headline: "Going Further" })
      continue
    }

    // Tables: convert to list items
    if (/^\|/.test(line.trim())) {
      const tableRows: string[] = []
      const headerLine = lines[i]
      i++
      // Skip separator line (|---|---|...)
      if (i < lines.length && /^\|[-\s|:]+\|/.test(lines[i].trim())) {
        i++
      }
      // Parse header columns
      const headers = headerLine.split("|").filter(c => c.trim()).map(c => c.trim())
      // Parse data rows
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        const cols = lines[i].split("|").filter(c => c.trim()).map(c => c.trim())
        const parts = headers.map((h, idx) => `**${h}:** ${cols[idx] || "—"}`).join(" | ")
        tableRows.push(parts)
        i++
      }
      if (tableRows.length > 0) {
        blocks.push({ type: "list", items: tableRows })
      }
      continue
    }

    // Regular paragraph — collect consecutive non-empty, non-special lines
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,3} /.test(lines[i]) &&
      !/^- /.test(lines[i]) &&
      !/^> /.test(lines[i]) &&
      !/^\|/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("<") &&
      !/^---+\s*$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim())
      i++
    }

    if (paragraphLines.length > 0) {
      const text = paragraphLines.join(" ")
      // Skip the "Key Takeaways" label line
      if (text === "**Key Takeaways**") continue
      blocks.push({ type: "paragraph", text })
    }
  }

  return blocks
}

/** Extract key takeaways from the markdown body */
function extractKeyTakeaways(markdown: string): string[] {
  const lines = markdown.split("\n")
  const ktIdx = lines.findIndex((l) => l.trim() === "**Key Takeaways**")
  if (ktIdx === -1) return []

  const items: string[] = []
  let i = ktIdx + 1
  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i++
      continue
    }
    if (/^- /.test(lines[i])) {
      let item = lines[i].replace(/^- /, "").trim()
      i++
      // Continuation lines
      while (i < lines.length && lines[i].trim() !== "" && !/^- /.test(lines[i]) && !/^#/.test(lines[i])) {
        item += " " + lines[i].trim()
        i++
      }
      items.push(item)
    } else if (/^#/.test(lines[i])) {
      break // Hit next section
    } else {
      i++
    }
  }
  return items
}

/** Strip content before the first H2 (intro + key takeaways) to get main content */
function getMainContent(markdown: string): string {
  const lines = markdown.split("\n")
  const firstH2 = lines.findIndex((l) => /^## /.test(l))
  if (firstH2 === -1) return markdown
  return lines.slice(firstH2).join("\n")
}

/** Extract /blog/ slugs referenced in the markdown */
function extractRelatedSlugs(markdown: string): string[] {
  const slugs = new Set<string>()
  const regex = /\]\(\/blog\/([a-z0-9-]+)\)/g
  let match
  while ((match = regex.exec(markdown)) !== null) {
    slugs.add(match[1])
  }
  return Array.from(slugs)
}

/** Category mapping by slug */
const categoryMap: Record<string, string> = {
  "best-ai-document-data-extraction-tools": "Industry",
  "extract-invoice-data-to-excel": "Guide",
  "llm-ocr-vs-traditional-ocr": "Comparison",
  "extract-table-data-from-pdfs": "Guide",
  "email-parser-vs-virtual-assistant": "Comparison",
  "invoice-extraction-tools-benchmark": "Comparison",
  "real-cost-llm-ocr-document-extraction": "Engineering",
}

/** Parse a single markdown file into a BlogPost */
function parseMarkdownBlogPost(filePath: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data: fm, content } = matter(raw)

  const slug = fm.slug as string
  const keyTakeaways = extractKeyTakeaways(content)
  const mainContent = getMainContent(content)
  const blocks = parseMarkdownToBlocks(mainContent)
  const relatedSlugs = extractRelatedSlugs(content)

  return {
    slug,
    title: fm.title as string,
    metaTitle: fm.title as string,
    metaDescription: fm.description as string,
    publishedAt: fm.publishedAt as string,
    updatedAt: fm.publishedAt as string,
    author: "Talal Bazerbachi",
    authorTitle: "Founder at Parsli",
    readTime: fm.readTime as string,
    excerpt: fm.description as string,
    category: categoryMap[slug] ?? "Industry",
    keyTakeaways,
    content: blocks,
    relatedSlugs,
  }
}

/** Load all markdown blog posts from content/blog/ */
export function loadMarkdownBlogPosts(): BlogPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseMarkdownBlogPost(path.join(CONTENT_DIR, f)))
}

export const contentBlogPosts: BlogPost[] = loadMarkdownBlogPosts()
