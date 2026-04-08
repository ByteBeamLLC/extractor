"use client"

/**
 * Rich markdown renderer for chat assistant messages.
 *
 * Mirrors the look-and-feel of Claude / ChatGPT message bubbles:
 *   - GitHub-Flavored Markdown (tables, task lists, strikethrough, autolinks)
 *   - Syntax-highlighted code blocks with language label + copy button
 *   - Inline code styled as a small mono pill
 *   - Tables that scroll horizontally on overflow
 *   - Sized down for the chat panel (no prose plugin needed)
 *
 * Uses react-markdown + remark-gfm + rehype-highlight. Languages are
 * registered explicitly so the bundle stays small (~30 KB instead of
 * the ~150 KB you get from rehype-highlight's default common set).
 */

import { Children, isValidElement, useState, type ReactNode } from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import bash from "highlight.js/lib/languages/bash"
import javascript from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import python from "highlight.js/lib/languages/python"
import sql from "highlight.js/lib/languages/sql"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import yaml from "highlight.js/lib/languages/yaml"
import { Check, Copy } from "lucide-react"
import { copyToClipboard } from "@/lib/clipboard"

// Side-effect import: ships the github-dark code theme. Scoped under
// the .hljs class so it only affects code blocks rendered here.
import "highlight.js/styles/github-dark.css"

const HIGHLIGHT_LANGUAGES = {
  bash,
  javascript,
  js: javascript,
  json,
  python,
  py: python,
  sql,
  typescript,
  ts: typescript,
  xml,
  html: xml,
  yaml,
  yml: yaml,
}

interface MarkdownContentProps {
  children: string
}

export function MarkdownContent({ children }: MarkdownContentProps) {
  return (
    <div className="text-[13px] leading-relaxed text-foreground markdown-content">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, languages: HIGHLIGHT_LANGUAGES, ignoreMissing: true }],
        ]}
        components={MARKDOWN_COMPONENTS}
      >
        {children}
      </Markdown>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Components map
// ─────────────────────────────────────────────────────────────────────────────

const MARKDOWN_COMPONENTS: Components = {
  // Paragraphs — tight spacing for chat density
  p({ children }) {
    return <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>
  },

  // Headings — scaled down significantly from defaults; chat panel is narrow
  h1({ children }) {
    return <h1 className="text-base font-semibold mt-3 mb-1.5 first:mt-0">{children}</h1>
  },
  h2({ children }) {
    return <h2 className="text-[14px] font-semibold mt-3 mb-1.5 first:mt-0">{children}</h2>
  },
  h3({ children }) {
    return <h3 className="text-[13px] font-semibold mt-2.5 mb-1 first:mt-0">{children}</h3>
  },
  h4({ children }) {
    return (
      <h4 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mt-2.5 mb-1 first:mt-0">
        {children}
      </h4>
    )
  },
  h5({ children }) {
    return <h5 className="text-[12px] font-semibold mt-2 mb-1 first:mt-0">{children}</h5>
  },
  h6({ children }) {
    return <h6 className="text-[12px] font-semibold mt-2 mb-1 first:mt-0">{children}</h6>
  },

  // Lists — proper indentation, slightly muted markers
  ul({ children }) {
    return <ul className="my-1.5 ml-5 list-disc marker:text-muted-foreground/60 space-y-0.5">{children}</ul>
  },
  ol({ children }) {
    return (
      <ol className="my-1.5 ml-5 list-decimal marker:text-muted-foreground/60 space-y-0.5">
        {children}
      </ol>
    )
  },
  li({ children }) {
    return <li className="pl-1 [&>p]:my-0">{children}</li>
  },

  // Inline emphasis
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>
  },
  em({ children }) {
    return <em className="italic">{children}</em>
  },
  del({ children }) {
    return <del className="line-through text-muted-foreground">{children}</del>
  },

  // Links — open externally with safe rel
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    )
  },

  // Blockquote — left rail, slightly muted
  blockquote({ children }) {
    return (
      <blockquote className="my-2 pl-3 border-l-2 border-border text-muted-foreground italic [&>p]:my-0">
        {children}
      </blockquote>
    )
  },

  // Horizontal rule
  hr() {
    return <hr className="my-3 border-border/60" />
  },

  // Tables — wrapped in a horizontal scroll container so wide tables don't
  // blow out the chat panel width.
  table({ children }) {
    return (
      <div className="my-2.5 -mx-1 overflow-x-auto">
        <table className="min-w-full border border-border rounded-lg overflow-hidden text-[12px]">
          {children}
        </table>
      </div>
    )
  },
  thead({ children }) {
    return <thead className="bg-muted/50">{children}</thead>
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-border">{children}</tbody>
  },
  tr({ children }) {
    return <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
  },
  th({ children, style }) {
    return (
      <th
        style={style}
        className="px-3 py-1.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border"
      >
        {children}
      </th>
    )
  },
  td({ children, style }) {
    return (
      <td style={style} className="px-3 py-1.5 align-top">
        {children}
      </td>
    )
  },

  // Inline code vs. block code. Block code is wrapped by `pre`, so here we
  // only style the inline case. Block <code> is rendered as-is so the
  // highlight.js classes added by rehype-highlight pass through to the
  // styled <pre> below.
  code({ className, children, ...props }) {
    const isBlock = typeof className === "string" && /\blanguage-/.test(className)
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[12px] font-mono border border-border/60"
        {...props}
      >
        {children}
      </code>
    )
  },

  // Block code wrapper — replaces the default <pre> with a styled CodeBlock
  // that has a header (language label) and a copy button.
  pre({ children }) {
    // react-markdown builds `<pre><code className="language-X">…</code></pre>`,
    // so children is (usually) the single <code> element. Find the first
    // valid React element to read its className and detect the language.
    const codeChild = Children.toArray(children).find(isValidElement) as
      | React.ReactElement<{ className?: string }>
      | undefined
    const codeClassName =
      typeof codeChild?.props?.className === "string" ? codeChild.props.className : ""
    const language = /language-(\w+)/.exec(codeClassName)?.[1]
    const rawCode = extractText(children).replace(/\n$/, "")

    return (
      <CodeBlock language={language} rawCode={rawCode}>
        {children}
      </CodeBlock>
    )
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Code block with copy button
// ─────────────────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  children: ReactNode
  language?: string
  rawCode: string
}

function CodeBlock({ children, language, rawCode }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!(await copyToClipboard(rawCode))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="my-3 rounded-lg border border-border overflow-hidden bg-[#0d1117]">
      <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-b border-white/5">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide">
          {language ?? "plaintext"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-2.5 w-2.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-2.5 w-2.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono text-zinc-100">
        {children}
      </pre>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Recursively extract plain text from a React tree (used by the copy button). */
function extractText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode }
    return extractText(props.children)
  }
  return ""
}
