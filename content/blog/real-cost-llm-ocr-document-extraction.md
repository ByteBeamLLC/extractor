---
title: "The Real Cost of Using LLMs for OCR (And the Architecture That Cut It by 60x)"
description: "We benchmarked 8 approaches to extracting data from scanned PDFs. Here's what actually works, what fails silently, and the two-phase architecture that reduced cost from $3.12 to $0.05 per document."
slug: "real-cost-llm-ocr-document-extraction"
type: "blog"
author: "Parsli Team"
publishedAt: "2026-04-03"
readTime: "14 min read"
keywords:
  - "Gemini PDF timeout 502 error"
  - "OpenRouter 502 bad gateway Gemini fix"
  - "LLM PDF extraction stuck processing"
  - "scanned PDF extraction serverless timeout"
  - "reduce LLM OCR cost per page"
  - "Vercel waitUntil timeout extraction"
  - "multimodal LLM document extraction slow"
  - "Gemini base64 PDF 503 GOAWAY"
  - "OCR model benchmark comparison 2026"
  - "two phase OCR LLM extraction pipeline"
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

## Every Way This Fails at Scale (And How to Fix Each One)

Cost wasn't our only problem. We encountered five distinct failure modes that every team building on multimodal LLMs will eventually hit. If you're searching for any of these errors, you're in the right place.

### Gemini 502 Bad Gateway Error via OpenRouter

**Symptom:** Intermittent `502 Bad Gateway` when sending PDFs to Gemini 2.5 Pro via OpenRouter. The request connects (DNS + TCP handshake succeeds) but the response never comes. OpenRouter logs show no "generation" entry for the failed request — it's invisible.

**Root cause:** Google Vertex AI (one of OpenRouter's backend providers for Gemini) intermittently [fails on large PDF base64 payloads](https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197). The error happens at the provider level before OpenRouter can log it as a generation.

**Fix:** Use [OpenRouter's provider routing](https://openrouter.ai/docs/guides/routing/provider-selection) to prefer Google AI Studio over Vertex. Add this to your request body:

```json
{
  "provider": {
    "order": ["google", "google-vertex"],
    "allow_fallbacks": true
  }
}
```

This eliminated the 502s for us immediately. Google AI Studio handles large payloads more reliably than Vertex. If AI Studio fails for any reason, OpenRouter auto-falls back to Vertex — but for most requests, AI Studio serves without error.

**How to debug:** Check your OpenRouter Activity page. Each request shows which provider served it (Google AI Studio vs Google Vertex). If you see mostly Vertex and intermittent failures, provider routing is your fix.

### Gemini PDF Timeout: 503 GOAWAY and Base64 Payload Limits

**Symptom:** Requests with large PDF base64 payloads hang for 2-5 minutes, then return `503 GOAWAY` or simply disconnect. Your OpenRouter logs show the request was sent but no response was received.

**Root cause:** Gemini's vision encoder has to process every page of the PDF as an image. A 24-page scanned PDF creates a massive base64 payload (10-35MB) that overwhelms the model's processing pipeline. Google's own developers forum [confirms this is a known limitation](https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197).

**Fix:** Never send a whole multi-page PDF as one base64 blob. Split into individual pages first, send each page separately, then merge the results. A single page is small enough (~200KB-1MB) that Gemini processes it in 5-30 seconds without issue.

### Vercel waitUntil() Timeout Killing Background Extraction

**Symptom:** Your extraction API returns 200 to the client, but the background extraction via `waitUntil()` never completes. Documents stay stuck in "processing" status. No error logs. The Vercel function log shows the 200 response but nothing else.

**Root cause:** `waitUntil()` runs within the same `maxDuration` budget as the main request. If your synchronous work (auth, file upload, database writes) consumes 30 of your 60 seconds, the AI call only gets 30 seconds — not enough for a multi-page PDF.

**Fix:** Decouple the extraction entirely. Your API endpoint should:
1. Store the file
2. Create a document record with status "processing"
3. Return 200 immediately

Then use a **database trigger** (Supabase `pg_net`, or a webhook) to fire an async HTTP call to a dedicated extraction worker endpoint with its own `maxDuration` (we use 600 seconds).

**Important `pg_net` gotcha:** The default timeout for `net.http_post()` is 5,000ms. If your worker takes longer than 5 seconds (it will), the connection is dropped and the worker might not receive the request. Set `timeout_milliseconds := 600000` to match your worker's budget.

### Documents Stuck in "Processing" Forever

**Symptom:** Users upload a document and see an infinite loading spinner. The database row shows `status: "processing"`, `results: null`, `processed_at: null`. No error message. This can persist indefinitely.

**Root cause:** Multiple possible causes:
- The `waitUntil()` background work was killed by the serverless timeout (see above)
- The AI call returned a 502/503 and the error handler was also killed before it could update the database
- A retry loop exhausted all attempts and the final error was never written to the DB

**Fix:** Three layers of defense:
1. **Decouple extraction from the HTTP request** so the worker has its own timeout
2. **Wrap extraction in try/catch** with a guaranteed `UPDATE status = 'error'` in the catch block
3. **Add a cleanup mechanism** — a cron job or scheduled check that finds documents stuck in "processing" for more than N minutes and marks them as "error" with a timeout message

### LLM Output Token Explosion: $0.13 Per Page

**Symptom:** Your OpenRouter bills are much higher than expected. Each page extraction costs $0.08-$0.14. Output tokens are 8,000-19,000 per page — far more than the actual content on the page.

**Root cause:** You're asking the LLM to both OCR the page AND produce structured JSON in one call. A prompt like "extract all data as structured JSON" causes the model to generate verbose output with full key names, formatting, confidence metadata, and repetitive structure for every row of tabular data.

**Fix:** Separate reading from structuring:
- **Phase 1 (Read):** Ask the model to "convert this page to clean markdown." Output: ~200-500 tokens of raw text.
- **Phase 2 (Think):** Send all page texts to a cheaper model to produce structured JSON. One call instead of N.

This dropped our per-page cost from $0.13 to effectively nothing for the OCR step, with one consolidation call at the end.

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

### How do I fix Gemini 502 errors when processing PDFs through OpenRouter?

Add provider routing to your OpenRouter request body: `"provider": { "order": ["google", "google-vertex"], "allow_fallbacks": true }`. This prefers Google AI Studio (more reliable for large payloads) and falls back to Vertex automatically. The 502s come from Vertex AI struggling with large base64 PDF payloads.

### Why does my PDF extraction get stuck in "processing" on Vercel?

Most likely your `waitUntil()` background work is being killed by `maxDuration`. The serverless function timeout applies to the entire invocation including background work. Decouple extraction into a separate worker endpoint triggered by a database event, with its own timeout budget (300-600 seconds).

### How much does it cost to extract data from a scanned PDF using Gemini?

Sending a scanned page directly to Gemini 2.5 Pro costs ~$0.13 per page ($1.25/M input + $10/M output tokens). A 24-page document costs ~$3.12. Using a two-phase approach (dedicated OCR model + cheaper LLM for structuring) reduces this to ~$0.05 per document — about 60x cheaper.

### What's the best OCR model for scanned document extraction in 2026?

For text fidelity: dots.ocr-1.5 (3B params, 83.9 on olmOCR-Bench). For structured documents (tables, receipts, invoices): HunyuanOCR (0.9B params, 94.1 on OmniDocBench). For easiest integration: Mistral OCR 3 ($1-2 per 1,000 pages, managed API on Vertex AI). For speed: PaddleOCR-VL (0.9B, 253% faster than dots.ocr).

### Why not just use Gemini or GPT-4o directly for OCR?

They work great for single pages. For multi-page scanned documents, they're too slow (4+ minutes), too expensive ($0.13/page), and unreliable (502/503 errors, timeouts). Purpose-built VLM-OCR models (0.9-3B params) produce better text fidelity at a fraction of the cost. Save general-purpose LLMs for reasoning and structuring, not pixel reading.

### How do I handle multi-page PDFs with LLM extraction?

Split the PDF into individual pages server-side (pdf-lib works for this), OCR each page in parallel using a lightweight vision model, then either return the concatenated markdown (for full-content extraction) or send all text to an LLM for structured field extraction (one call). Never send the whole multi-page PDF as one request.

### What is Supabase pg_net and how do I use it for background jobs?

`pg_net` is a PostgreSQL extension that makes async HTTP calls from inside database triggers. When a row is inserted, a trigger function fires `net.http_post()` to your worker endpoint. The HTTP call is non-blocking — it doesn't slow down the INSERT. Set `timeout_milliseconds` to match your worker's max duration. This replaces `waitUntil()` for serverless background processing.

### How fast is Parsli's PDF processing?

Small documents (1-5 pages): under 15 seconds. Large scanned documents (20+ pages): 60-90 seconds. We process pages in parallel with up to 10 concurrent OCR requests.

### How does Parsli handle scanned PDFs?

We split multi-page scanned PDFs into individual pages, OCR each page in parallel using vision-language models, then consolidate the results. For "full content" extraction, we return clean markdown that preserves the document layout. For structured extraction, an LLM maps the text to your defined schema and returns JSON.

---

## Going Further

- [Best AI Document Data Extraction Tools in 2026](/blog/best-ai-document-data-extraction-tools) — Comprehensive comparison of 7 extraction platforms
- [Free PDF to Excel Converter](/tools/pdf-to-excel) — Try extraction instantly, no signup
- [Extract Table Data from PDFs](/guides/extract-table-data-from-pdfs) — Step-by-step guide for tabular documents
- [Parsli vs Amazon Textract](/compare/textract) — Feature and pricing comparison
