---
title: "The Real Cost of Using LLMs for OCR (And the Architecture That Cut It by 60x)"
description: "We benchmarked 8 approaches to extracting data from scanned PDFs. Here's what actually works, what fails silently, and the two-phase architecture that reduced cost from $3.12 to $0.05 per document."
slug: "real-cost-llm-ocr-document-extraction"
type: "blog"
author: "Parsli Team"
publishedAt: "2026-04-03"
readTime: "14 min read"
keywords:
  - "LLM OCR cost"
  - "scanned PDF data extraction"
  - "Gemini PDF extraction"
  - "OCR pipeline architecture"
  - "document extraction at scale"
  - "reduce LLM extraction cost"
citations:
  - source: "Google AI Developers Forum"
    url: "https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197"
    claim: "Known intermittent timeout issues when calling the Gemini API with PDF files encoded as base64"
  - source: "OpenRouter Documentation"
    url: "https://openrouter.ai/docs/guides/routing/provider-selection"
    claim: "If a provider returns an error, OpenRouter will automatically fall back to the next provider"
  - source: "Unstract"
    url: "https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/"
    claim: "Start with more traditional OCR models, which are fast, cheap, and often very accurate, even for structured data like tables"
  - source: "E2E Networks OCR Benchmark"
    url: "https://www.e2enetworks.com/blog/complete-guide-open-source-ocr-models-2025"
    claim: "Real H100 benchmarks show $141-$697 per million pages vs $1,500+ for cloud APIs"
  - source: "dots.ocr-1.5 Benchmarks"
    url: "https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5"
    claim: "dots.ocr-1.5 achieves 83.9 on olmOCR-Bench and 0.031 TextEdit on OmniDocBench, outperforming Gemini 2.5 Pro"
  - source: "Tencent HunyuanOCR"
    url: "https://huggingface.co/tencent/HunyuanOCR"
    claim: "HunyuanOCR achieves SOTA performance with only 0.9B parameters, scoring 94.1 on OmniDocBench"
  - source: "Mistral AI"
    url: "https://mistral.ai/news/mistral-ocr-3"
    claim: "Mistral OCR 3 available at $1-2 per 1,000 pages with markdown output and HTML table reconstruction"
  - source: "OpenRouter"
    url: "https://openrouter.ai/docs/api/reference/limits"
    claim: "No platform-level rate limits for paid users on OpenRouter"
---

Published: April 3, 2026 · 14 min read

## Key Takeaways

- Sending scanned PDFs directly to multimodal LLMs (Gemini 2.5 Pro) for extraction costs **$0.13 per page** and takes **40-60 seconds per page** — [$3.12 for a 24-page document](https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197).
- Separating OCR from structuring (two-phase pipeline) reduces cost to **~$0.05 per document** — a 60x improvement.
- Purpose-built VLM-OCR models like [HunyuanOCR](https://huggingface.co/tencent/HunyuanOCR) (0.9B params) outperform Gemini 2.5 Pro on text fidelity while being 100x cheaper to run.
- The most cost-effective managed solution today is [Mistral OCR 3](https://mistral.ai/news/mistral-ocr-3) on Google Vertex AI at $1-2 per 1,000 pages.

---

## The Problem Nobody Talks About

Every tutorial on AI document extraction shows the same thing: send a PDF to GPT-4o or Gemini, get structured JSON back. It looks magical in demos. Single-page invoices, clean scans, instant results.

Then you try it with real documents.

A 24-page scanned call log. A 50-page bank statement. An insurance claim with mixed handwriting and printed text. Suddenly the magic stops. Requests time out. Costs spiral. Results come back garbled or not at all.

We hit this wall building [Parsli](https://parsli.co), and we spent weeks working through the problem. This post documents everything we learned — the approaches that failed, the benchmarks that surprised us, and the architecture that finally worked.

---

## The Naive Approach: Send the Whole PDF to an LLM

Our initial architecture was simple. Upload a PDF, base64-encode it, send it to Gemini 2.5 Pro via OpenRouter with a prompt like "extract all data as structured JSON." For small documents (1-5 pages), this works beautifully.

For a 24-page scanned document, here's what actually happens:

**The request hangs for 4+ minutes**, then the serverless function times out. The document stays in "processing" forever. No error, no results, no feedback to the user.

Why? Gemini has to:
1. Decode and rasterize every page of the PDF as images
2. Process each image through its vision encoder (thousands of tokens per page)
3. Reason about the content and produce structured JSON
4. Generate 10,000+ output tokens

For a 24-page scanned call log, this means 30,000+ input tokens (mostly image data) and potentially 200,000+ output tokens for the full structured response. The model simply cannot do this within a reasonable time or cost budget.

### The Numbers That Opened Our Eyes

When we checked our OpenRouter logs after the first successful chunked extraction, we saw:

| Per-Page Request | Input Tokens | Output Tokens | Cost | Time |
|-----------------|-------------|---------------|------|------|
| Page 1 | 1,580 | 13,783 | $0.14 | ~40s |
| Page 2 | 550 | 11,753 | $0.12 | ~35s |
| Page 3 | 1,580 | 8,017 | $0.08 | ~30s |
| Average | ~1,200 | ~12,000 | **$0.13** | **~38s** |

**$0.13 per page. $3.12 for one 24-page document.** That's not a viable product at any price point.

The output token count was the killer — 8,000 to 19,000 tokens per page because we were asking Gemini to produce full structured JSON for every single page. A scanned call log page with 80 rows of data generates a massive JSON response.

---

## What Else Goes Wrong at Scale

Cost wasn't our only problem. We encountered three other failure modes that every team building on multimodal LLMs will eventually hit.

### 1. Provider 502 Errors

Google Vertex AI (one of OpenRouter's providers for Gemini) intermittently returns [502 Bad Gateway errors on large PDF base64 payloads](https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197). This is a known issue. It doesn't show up in OpenRouter's logs as a failed "generation" — it just silently fails.

We fixed this by using [OpenRouter's provider routing](https://openrouter.ai/docs/guides/routing/provider-selection) to prefer Google AI Studio over Vertex:

```json
{
  "provider": {
    "order": ["google", "google-vertex"],
    "allow_fallbacks": true
  }
}
```

This eliminated the 502s entirely. If you're hitting intermittent failures with Gemini via OpenRouter, check which provider is serving your requests.

### 2. Serverless Timeout Starvation

Our initial architecture ran extraction inside a Vercel serverless function using `waitUntil()`. The function had 60 seconds total for authentication, file handling, database writes, **and** the AI extraction. The synchronous work consumed 30+ seconds, leaving the AI call with barely enough time to start before the function was killed.

The fix: decouple the extraction into a separate worker triggered by a database insert (using Supabase `pg_net` to fire an async HTTP call to a dedicated endpoint with a 600-second budget).

### 3. Silent Failures with No Recovery

When a serverless function is killed mid-extraction, there's no catch block, no error log, no cleanup. The document row stays in "processing" status forever. The user sees an infinite spinner. The server-side analytics events never fire.

This is the worst failure mode because it's invisible. You only discover it when a customer emails asking why their document never finished.

---

## The Two-Phase Architecture

The fundamental insight — which the [document processing industry](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/) has known for years — is simple: **don't use the LLM as your OCR engine.**

An LLM is good at understanding and structuring text. It's terrible at reading pixels efficiently. These are two different jobs that should be done by two different tools.

### Phase 1: Read (OCR per page)

Split the PDF into individual pages. Send each page to a lightweight model that converts the image to clean markdown text. This is the "reading" step — no structuring, no JSON, just faithful text conversion.

```
Page image → OCR model → markdown text (~300 tokens)
```

Run all pages in parallel with concurrency control.

### Phase 2: Think (Structure the text)

Concatenate all page texts. Send the full text to an LLM with your extraction schema. One call, text-only, produces the final structured output.

```
All page texts → LLM → structured JSON
```

### The Cost Difference

| Approach | Cost (24 pages) | Time | Reliability |
|----------|----------------|------|-------------|
| Whole PDF → Gemini Pro | Timeout/failure | 4+ min | Fails on >10 pages |
| Per-page → Gemini Pro (structured JSON) | $3.12 | ~7 min | Works but expensive |
| Per-page → OCR model (markdown) + LLM consolidation | **~$0.05** | **~60-90s** | Reliable |

60x cost reduction. 4x speed improvement. And it actually completes instead of timing out.

---

## Benchmarking OCR Models: What Should Do the "Reading"?

If the LLM shouldn't do the OCR, what should? We evaluated every serious option.

### The Contenders

| Model | Params | olmOCR-Bench | OmniDocBench TextEdit↓ | Tables | Deployment |
|-------|--------|-------------|----------------------|--------|------------|
| Gemini 2.5 Pro | Huge | ~80 (est) | 0.075 | Good | OpenRouter |
| **dots.ocr-1.5** | 3B | **83.9** | **0.031** | 90.7 | HuggingFace / self-host |
| **HunyuanOCR** | **0.9B** | ~80 | 0.042 | **91.8** | HuggingFace / self-host |
| PaddleOCR-VL | 0.9B | 80.0 | 0.035 | 84.1 | Self-host |
| Chandra OCR 2 | 5B | 83.1 | - | 88.0 | Datalab API / self-host |
| DeepSeek-OCR | 3B | 75.7 | 0.073 | 80.2 | Vertex AI (managed) |
| Mistral OCR 3 | - | - | - | Good | Vertex AI (managed) |

Source: [olmOCR-Bench](https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5), [OmniDocBench](https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5), [E2E Networks](https://www.e2enetworks.com/blog/complete-guide-open-source-ocr-models-2025)

### Key Findings

**dots.ocr-1.5 has the highest text fidelity.** It scored [0.031 on OmniDocBench TextEdit](https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5) — meaning it introduces fewer errors than any other model, including Gemini 2.5 Pro (0.075). For raw accuracy on scanned documents, nothing beats it.

**HunyuanOCR is the best value.** At only [0.9B parameters](https://huggingface.co/tencent/HunyuanOCR), it's 3x smaller than dots.ocr-1.5 but achieves 94.1 on OmniDocBench for complex document parsing. It's particularly strong on tables (91.8) and receipts (92.5) — the exact document types that matter for business extraction.

**Gemini 2.5 Pro is the worst option for OCR.** It scores 0.075 on TextEdit — 2.4x worse than dots.ocr-1.5. And it costs orders of magnitude more. The only reason to use it is if you need zero infrastructure (it's available as an API).

**Mistral OCR 3 is the best managed option.** At [$1-2 per 1,000 pages](https://mistral.ai/news/mistral-ocr-3) with native markdown + HTML table output, it's the easiest to integrate. Available as a managed API on Google Vertex AI — no GPU hosting needed.

### What About PaddleOCR?

PaddleOCR-VL (0.9B) is the **fastest** model — 253% faster than dots.ocr. But accuracy is lower (80.0 vs 83.9 on olmOCR-Bench). It's the right choice for high-volume batch processing where speed matters more than precision.

---

## Choosing the Consolidation Model

Phase 2 (structuring the text into JSON) doesn't need a vision model at all — it's pure text-to-JSON. This opens up cheaper, faster options.

We tested token-based routing:

| Input Size | Model | Cost (per M tokens) | Why |
|------------|-------|------|-----|
| ≤ 10K tokens (~5-10 pages) | GPT-5.4 Nano | $0.20 in / $1.25 out | Cheapest, purpose-built for extraction |
| > 10K tokens (10+ pages) | Claude Haiku 4.5 | $0.80 in / $4.00 out | Best structured output reliability |

GPT-5.4 Nano is designed specifically for "classification, data extraction, ranking" — exactly what consolidation needs. Claude Haiku wins on format adherence for complex schemas with nested objects and arrays.

The key insight: **you don't need the same model for reading and thinking.** Use the best tool for each job.

---

## The Architecture That Works

Here's what we settled on:

```
Upload PDF
    │
    ▼
Split into pages (pdf-lib, server-side)
    │
    ▼
┌─────────────────────────────────────┐
│  Phase 1: Read (parallel, 10 concurrent) │
│                                     │
│  Page 1 ──→ OCR model ──→ markdown  │
│  Page 2 ──→ OCR model ──→ markdown  │
│  Page 3 ──→ OCR model ──→ markdown  │
│  ...                                │
│  Page N ──→ OCR model ──→ markdown  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Phase 2: Think (single call)       │
│                                     │
│  For "full content" extraction:     │
│  → Return concatenated markdown     │
│  → No LLM call needed              │
│                                     │
│  For "fields" extraction:           │
│  → All page texts + schema          │
│  → GPT-5.4 Nano or Claude Haiku    │
│  → Structured JSON output           │
└─────────────────────────────────────┘
    │
    ▼
Results stored, user notified via Realtime
```

### Key Design Decisions

**Per-page splitting with pdf-lib.** We use `pdf-lib` server-side to split the PDF into individual single-page buffers. Each page becomes its own small PDF, sent independently to the OCR model. This means one page failing doesn't take down the whole document.

**Concurrency control without external dependencies.** A simple worker-pool pattern (15 lines of code) caps parallel requests at 10. No need for `p-limit` or Redis queues.

**Timeout safety.** Before submitting each new page, we check elapsed time. If less than 30 seconds remain in the worker's budget, we skip remaining pages and consolidate with what we have. Partial results beat no results.

**Graceful degradation.** If consolidation fails, we fall back to returning the raw markdown. The user still gets their extracted text — just not perfectly structured.

**For full-content extraction, skip the consolidation LLM entirely.** The per-page markdown already preserves text and layout faithfully. Sending 50K+ tokens to an LLM just to reformat it as JSON is wasteful and error-prone.

---

## Practical Advice for Your Pipeline

If you're building document extraction on top of LLMs, here's what we wish someone had told us:

**1. Never send a whole multi-page PDF as one base64 blob to any LLM.** It will timeout, cost a fortune, or both. Split first, always.

**2. Use OpenRouter's provider routing.** If you're using Gemini via OpenRouter, add `provider: { order: ["google", "google-vertex"] }` to prefer Google AI Studio. Vertex AI has intermittent 502 issues with large payloads.

**3. Measure output tokens, not just input tokens.** Our per-page extraction was generating 13,000 output tokens per page because the prompt asked for structured JSON. Switching to "just convert to markdown" dropped output to ~300 tokens — a 40x reduction in the most expensive part of the API call.

**4. Don't use your most expensive model for OCR.** Gemini 2.5 Pro costs $1.25/M input + $10/M output. A 0.9B VLM-OCR model produces better text fidelity at a fraction of the cost. Save the expensive models for reasoning, not reading.

**5. Decouple extraction from your HTTP request.** Your user-facing endpoint should create a job and return immediately. Process extraction asynchronously with a proper timeout budget. Use database triggers or queues to kick off the work.

**6. Always handle partial failures.** Some pages will fail (OCR errors, API timeouts, corrupt images). Your pipeline should continue with the pages that succeeded and clearly indicate what's missing.

---

## What's Next

We're actively exploring:

- **Dedicated VLM-OCR models** (HunyuanOCR, dots.ocr-1.5) to replace Gemini entirely for the reading step
- **Mistral OCR 3** on Vertex AI as a managed alternative ($1-2 per 1,000 pages)
- **Multi-model OCR pools** for redundancy — if one model fails on a page, another picks it up

The document extraction space is evolving fast. The approaches that were state-of-the-art 6 months ago (single-pass multimodal LLMs) are already being replaced by hybrid pipelines that separate reading from reasoning.

The winners will be the teams that combine cheap, fast, deterministic OCR with intelligent LLM-powered structuring. Not one model doing everything — the right model for each job.

---

## See Parsli in Action

Parsli handles all of this automatically. Upload a PDF, scanned document, or image — we split, OCR, structure, and deliver clean data in seconds. No pipeline to build, no models to host.

[Try Parsli free — 30 pages/month, no credit card required.](/pricing)

[See the API docs](/docs) · [Compare pricing](/pricing) · [Follow our engineering journey on X](https://x.com/parsaborz)

---

## FAQ

### How does Parsli handle scanned PDFs?

We split multi-page scanned PDFs into individual pages, OCR each page in parallel using vision-language models, then consolidate the results. For "full content" extraction, we return clean markdown. For structured extraction, an LLM maps the text to your defined schema.

### What accuracy can I expect from AI document extraction?

On standard business documents (invoices, receipts, call logs), modern VLM-OCR models achieve 83-94% on benchmark suites like olmOCR-Bench and OmniDocBench. Accuracy depends on scan quality, document complexity, and whether the content is printed or handwritten.

### Why not just use Gemini or GPT-4o directly?

They work great for single pages. For multi-page scanned documents, they're too slow (4+ minutes), too expensive ($0.13/page), and unreliable (502 errors, timeouts). Purpose-built OCR models are faster, cheaper, and more accurate at the "reading" step.

### What's the cheapest way to extract data from scanned PDFs at scale?

Mistral OCR 3 on Google Vertex AI at $1-2 per 1,000 pages for the OCR step, combined with GPT-5.4 Nano ($0.20/M tokens) for structuring. Total cost: under $0.01 per page for most documents.

### How fast is Parsli's PDF processing?

Small documents (1-5 pages): under 15 seconds. Large scanned documents (20+ pages): 60-90 seconds. We process pages in parallel with up to 10 concurrent OCR requests.

---

## Going Further

- [Best AI Document Data Extraction Tools in 2026](/blog/best-ai-document-data-extraction-tools) — Comprehensive comparison of 7 extraction platforms
- [Free PDF to Excel Converter](/tools/pdf-to-excel) — Try extraction instantly, no signup
- [Extract Table Data from PDFs](/guides/extract-table-data-from-pdfs) — Step-by-step guide for tabular documents
- [Parsli vs Amazon Textract](/compare/textract) — Feature and pricing comparison
