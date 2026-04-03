---
title: "The Real Cost of Using LLMs for OCR (And the Architecture That Cut It by 60x)"
description: "We tried extracting data from 24-page scanned PDFs using Gemini 2.5 Pro. It cost $3.12 per document and failed half the time. Here's what we learned, the OCR models we benchmarked, and the two-phase pipeline that actually works."
slug: "real-cost-llm-ocr-document-extraction"
type: "blog"
author: "Parsli Team"
publishedAt: "2026-04-03"
readTime: "14 min read"
keywords:
  - "LLM OCR cost"
  - "scanned PDF data extraction AI"
  - "Gemini PDF extraction slow expensive"
  - "multimodal LLM document processing"
  - "OCR model benchmark comparison 2026"
  - "extract data from scanned PDF"
  - "AI document extraction pipeline"
  - "reduce document extraction cost"
  - "VLM OCR vs Gemini"
  - "two phase OCR LLM pipeline"
citations:
  - source: "Google AI Developers Forum"
    url: "https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197"
    claim: "Known intermittent timeout issues when calling the Gemini API with PDF files encoded as base64"
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
  - source: "Koncile"
    url: "https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction"
    claim: "Claude excels in respecting formats, being careful in handling sensitive data and managing complex structures"
  - source: "CodeSOTA OCR Benchmarks"
    url: "https://www.codesota.com/ocr"
    claim: "PaddleOCR-VL is 253% faster than dots.ocr in throughput benchmarks"
---

Published: April 3, 2026 · 14 min read

## Key Takeaways

- Sending scanned PDFs directly to Gemini 2.5 Pro for extraction costs **$0.13 per page** and takes **40-60 seconds per page** — [$3.12 for a 24-page document](https://discuss.ai.google.dev/t/gemini-2-0-flash-api-long-response-times-and-503-goaway-errors-with-pdf-base64-input/86197).
- Multimodal LLMs are great at *understanding* text but terrible at *reading* pixels efficiently — purpose-built OCR models are 2.4x more accurate and 100x cheaper at the reading step.
- Separating "reading" (OCR) from "thinking" (structuring) reduces cost to **~$0.05 per document** — a **60x improvement**.
- A [0.9B parameter model](https://huggingface.co/tencent/HunyuanOCR) outperforms Gemini 2.5 Pro on document text fidelity. Model size is not what matters for OCR.

---

## The Promise vs. The Reality

Every demo of AI document extraction looks the same. Upload a PDF. Get structured JSON back. Magic.

And it *is* magic — for a single-page invoice on a clean white background.

Then your customer uploads a 24-page scanned call log. Or a 50-page bank statement. Or an insurance packet with mixed handwriting, stamps, and faded print. The magic stops. The request takes minutes. The results come back garbled — or don't come back at all.

We build [Parsli](https://parsli.co), a document extraction platform, and we hit every one of these walls. This post documents what we learned trying to make AI extraction actually work on the documents real people upload — not the clean samples in tutorials.

---

## What Happens When You Send a Large Scanned PDF to Gemini

Our initial approach was straightforward: take the uploaded PDF, base64-encode it, send it to Gemini 2.5 Pro, ask it to extract all data as structured JSON. For a 1-3 page invoice, this works perfectly — fast, accurate, reasonable cost.

For a 24-page scanned document, here's what actually happens:

**Gemini has to do two jobs at once.** First, it processes every page as an image through its vision encoder — converting raw pixels into an internal representation. For scanned documents, this is essentially OCR. Then it has to reason about the content and produce structured output. Both tasks share the same context window and compute budget.

**The request hangs.** For 24 pages of scanned content, Gemini needs 4+ minutes just to process the images. Most serverless environments timeout at 60-300 seconds. The request dies mid-processing. No error, no partial result — just silence.

**When it does complete, the output is enormous.** We found Gemini generating **8,000 to 19,000 output tokens per page** when asked for structured JSON. A scanned call log page with 80 rows of data becomes a massive JSON response. At Gemini Pro's output pricing, that's **$0.13 per page**.

### The Real Numbers

| What we measured | Value |
|-----------------|-------|
| Average input tokens per page (image) | ~1,200 |
| Average output tokens per page (structured JSON) | **~12,000** |
| Cost per page | **$0.13** |
| Time per page | **38 seconds** |
| Cost for 24-page document | **$3.12** |
| Total time for 24 pages (parallel) | **~7 minutes** |
| Success rate on 24-page scans | **~30%** (timeouts, 502s) |

At $3.12 per document with a 30% success rate, this is not a viable product architecture.

---

## The Root Problem: Using an LLM as an OCR Engine

Here's the insight that changed everything for us: **Gemini 2.5 Pro is one of the worst OCR engines you can use.**

Not because it's a bad model — it's extraordinary at reasoning. But when you send it a scanned page image, you're asking a 175B+ parameter general-purpose intelligence to do the same job a 0.9B parameter specialized model does better, faster, and for a fraction of the cost.

The [document processing industry](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/) has known this for years: **you should start with traditional or specialized OCR models, which are fast, cheap, and often very accurate, even for structured data like tables.** The LLM's job should be understanding and structuring, not reading.

We just had to learn it the hard way.

### Where Gemini Falls Short on OCR

To understand why, look at the benchmarks. [OmniDocBench](https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5) measures text fidelity — how accurately a model reproduces the text in a document (lower is better):

| Model | Size | TextEdit Score ↓ | Meaning |
|-------|------|-----------------|---------|
| **dots.ocr-1.5** | 3B | **0.031** | Best text accuracy |
| PaddleOCR-VL-1.5 | 0.9B | 0.035 | Near-best, tiny model |
| **HunyuanOCR** | **0.9B** | 0.042 | Excellent at 1/200th the size of Gemini |
| DeepSeek-OCR | 3B | 0.073 | Good |
| Gemini 2.5 Pro | Huge | **0.075** | **2.4x worse than dots.ocr** |
| Gemini 3 Pro | Huge | 0.066 | Better, still behind specialized models |

A **0.9B parameter model** (HunyuanOCR) produces more accurate text from scanned documents than Gemini 2.5 Pro. Model size doesn't matter for OCR — task-specific training does.

---

## The Output Token Trap

Even after we split our PDF into per-page requests (to avoid the timeout), costs were still absurd. The culprit wasn't input tokens — it was output.

When you prompt an LLM with "extract all data as structured JSON," it generates verbose output. Every row of a table becomes a JSON object with full key names. A scanned page with 80 call records produces 12,000+ output tokens of JSON — even though the actual raw text content is maybe 500 tokens.

**Output tokens are the expensive part.** Gemini 2.5 Pro charges $10/M for output tokens vs $1.25/M for input. We were paying 8x the input rate for the model to essentially format text as JSON — something that doesn't need a $10/M token model.

The fix was obvious once we saw it: **don't ask the vision model for structured output at all.** Ask it for raw text. Then structure the text with a cheaper model in a separate step.

---

## The Two-Phase Pipeline: Read, Then Think

We restructured our entire extraction pipeline around one principle: the tool that reads the document should not be the same tool that structures the data.

### Phase 1: Read

Split the PDF into individual pages. Send each page to a vision model with a simple instruction: **"Convert this page to clean markdown text."** No JSON, no schema, no extraction logic. Just faithful text reproduction.

Output: ~200-500 tokens of markdown per page. Fast, cheap, accurate.

Run all pages in parallel.

### Phase 2: Think

Take all the page texts, concatenate them, and decide what to do:

- **For "full content" extraction** (the user just wants the document text): return the markdown directly. No LLM call needed at all.
- **For structured field extraction** (the user defined a schema): send the full text to an LLM with the schema. One call, text-only, produces the final JSON.

### The Numbers: Before vs. After

| Metric | Single-pass (Gemini Pro) | Two-phase pipeline |
|--------|------------------------|-------------------|
| Cost per page (OCR step) | $0.13 | ~$0.002 |
| Cost for 24-page document | $3.12 | ~$0.05 |
| Output tokens per page | 12,000 | ~300 |
| Time for 24 pages | 7+ min (often timeout) | ~60-90 seconds |
| Success rate | ~30% | ~99% |
| Improvement | — | **60x cheaper, 5x faster** |

---

## Benchmarking OCR Models: What Should Do the Reading?

Once we decided to separate OCR from structuring, the question became: which model should handle the reading step?

We evaluated every serious option available in 2026. Here are the results.

### Accuracy Benchmarks

**olmOCR-Bench** (overall document OCR quality, higher is better):

| Model | Params | Overall | Tables | Old Scans | Math |
|-------|--------|---------|--------|-----------|------|
| **dots.ocr-1.5** | 3B | **83.9** | **90.7** | **85.5** | **85.9** |
| Chandra OCR 2 | 5B | 83.1 | 88.0 | 80.3 | 82.2 |
| olmOCR v0.4 | 7B | 82.4 | 84.9 | 82.3 | 83.0 |
| PaddleOCR-VL | 0.9B | 80.0 | 84.1 | 71.0 | 85.7 |
| DeepSeek-OCR | 3B | 75.7 | 80.2 | 73.6 | 77.2 |

Source: [olmOCR-Bench via dots.ocr-1.5](https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5)

**OmniDocBench** (complex document parsing, [HunyuanOCR benchmarks](https://huggingface.co/tencent/HunyuanOCR)):

| Model | Params | Overall | Tables | Receipts |
|-------|--------|---------|--------|----------|
| **HunyuanOCR** | **0.9B** | **94.1** | **91.8** | **92.5** |
| PaddleOCR-VL-1.5 | 0.9B | 91.8 | - | - |
| dots.ocr-1.5 | 3B | - | 90.7 | - |

### Speed vs. Accuracy Tradeoff

| Model | Params | Accuracy (olmOCR) | Relative Speed | Best For |
|-------|--------|-------------------|---------------|----------|
| PaddleOCR-VL | 0.9B | 80.0 | **Fastest** (253% faster than dots.ocr) | High-volume batch processing |
| HunyuanOCR | 0.9B | ~80 | Fast | Structured docs (invoices, receipts, tables) |
| dots.ocr-1.5 | 3B | 83.9 | Moderate | Highest accuracy, old scans, handwriting |
| Chandra OCR 2 | 5B | 83.1 | ~2 pg/s | Handwriting, complex layouts |

Source: [E2E Networks](https://www.e2enetworks.com/blog/complete-guide-open-source-ocr-models-2025), [CodeSOTA](https://www.codesota.com/ocr)

### Managed API Options

If you don't want to host GPU infrastructure:

| Service | Pricing | Output Format | Platform |
|---------|---------|---------------|----------|
| **Mistral OCR 3** | [$1-2 per 1,000 pages](https://mistral.ai/news/mistral-ocr-3) | Markdown + HTML tables | Google Vertex AI, Mistral API |
| DeepSeek-OCR | $0.30/M in, $1.20/M out | Text | Google Vertex AI |
| Google Document AI | $0.065/page (Form Parser) | Structured JSON | Google Cloud |

Mistral OCR 3 at $1-2 per 1,000 pages is remarkable — that's $0.002 per page with native markdown output. For teams that want to avoid self-hosting, it's the clear winner.

### Our Recommendation

| Use Case | Best Model | Why |
|----------|-----------|-----|
| Structured business docs (invoices, receipts, forms) | **HunyuanOCR** (0.9B) | Best on tables (91.8), tiny model, cheapest to run |
| Maximum text accuracy (old scans, handwriting) | **dots.ocr-1.5** (3B) | Highest olmOCR-Bench score (83.9) |
| No GPU infrastructure | **Mistral OCR 3** | Managed API, $0.002/page |
| High-volume batch (millions of pages) | **PaddleOCR-VL** (0.9B) | 253% faster, [good enough accuracy](https://www.codesota.com/ocr) |

---

## Choosing the Right Model for Structuring

The Phase 2 model (turning OCR text into structured JSON) is a pure text-to-text task. No vision needed. This opens up cheaper, faster options than what you'd use for Phase 1.

What matters here: **structured output reliability** (does it produce valid JSON that matches your schema?) and cost.

| Input Size | Best Model | Cost | Strength |
|------------|-----------|------|----------|
| Small docs (≤10K tokens) | GPT-5.4 Nano | $0.20/M in, $1.25/M out | [Designed for data extraction](https://openrouter.ai/openai/gpt-5.4-nano), cheapest |
| Large/complex docs (>10K tokens) | Claude Haiku 4.5 | $0.80/M in, $4.00/M out | [Best structured output consistency](https://www.koncile.ai/en/ressources/claude-gpt-or-gemini-which-is-the-best-llm-for-invoice-extraction) |

GPT-5.4 Nano is purpose-built for "classification, data extraction, ranking." Claude Haiku has the best format adherence for complex nested schemas. Gemini Flash is cheap but [8% more error-prone on multi-step structured output](https://www.appaca.ai/resources/llm-comparison/gemini-2.5-flash-vs-claude-4.5-haiku) than Haiku.

The key principle: **you don't need the same model for reading and thinking.** Match each step to the cheapest model that does that specific job well.

---

## The Architecture

```
Upload PDF
    │
    ▼
Split into individual pages
    │
    ▼
┌─────────────────────────────────────────┐
│  Phase 1: Read (parallel, 10 concurrent)│
│                                         │
│  Each page → OCR model → markdown text  │
│  (~200-500 tokens per page, ~5-10s)     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Phase 2: Think                         │
│                                         │
│  Full content → return markdown as-is   │
│  Structured fields → LLM + schema → JSON│
└─────────────────────────────────────────┘
    │
    ▼
Clean, structured results
```

### Design Decisions That Mattered

**Split per-page, not per-section.** We tried splitting by content region (tables, headers, paragraphs). It was fragile and required layout analysis. Splitting by page is deterministic and works with any document type.

**Parallel OCR with concurrency control.** All pages are processed simultaneously, capped at 10 concurrent requests. A simple worker-pool pattern — no queuing infrastructure needed.

**Timeout safety with partial results.** If the processing budget is running low, we stop submitting new pages and work with what we have. 20 of 24 pages is better than 0 of 24 pages.

**Skip the LLM for full-content extraction.** If the user just wants the document text (not specific fields), the OCR markdown is the final output. No second LLM call needed. This is the most common use case and it's now nearly free.

**Graceful degradation over hard failure.** If the structuring step fails, we return the raw markdown. If a page fails OCR, other pages still complete. Every failure mode produces some useful output rather than nothing.

---

## What We'd Do Differently

Looking back at our journey from "just send it to Gemini" to a reliable two-phase pipeline:

**1. We would have measured output tokens from day one.** The cost problem wasn't the image processing — it was asking for structured JSON output. If we'd tracked output tokens per request early on, we'd have caught the $0.13/page problem immediately instead of discovering it weeks later in billing.

**2. We would have tested purpose-built OCR models before using Gemini for OCR.** We assumed the most powerful model would be the most accurate at everything. A 0.9B model beating Gemini on text fidelity was genuinely surprising.

**3. We would have separated reading from thinking on day one.** The single-pass approach (image → structured JSON) is seductive because it's simple. But it couples two fundamentally different tasks with very different cost profiles. Separating them earlier would have saved us weeks.

**4. We would have built for partial failure from the start.** Multi-page documents will always have pages that fail — bad scans, torn corners, blank pages. A pipeline that returns nothing when one page fails is a pipeline that fails constantly in production.

---

## Where the Industry Is Heading

The document extraction space is moving fast. Here's what we're watching:

**Specialized OCR models are getting dramatically smaller and better.** HunyuanOCR (0.9B) matching or beating Gemini Pro on structured document benchmarks was unthinkable a year ago. The trend is clear: task-specific models will dominate OCR, not general-purpose giants.

**Managed OCR APIs are becoming commodity-priced.** Mistral OCR 3 at [$1-2 per 1,000 pages](https://mistral.ai/news/mistral-ocr-3) makes self-hosting OCR models hard to justify unless you're processing millions of pages monthly.

**The "just use one model" approach is dying.** The future is multi-model pipelines where each step uses the cheapest model that does that specific job well. OCR with a 0.9B VLM. Structuring with a fast text model. Reasoning with a frontier model — but only when needed.

**The winners will separate reading from thinking.** Not one model doing everything. The right model for each job.

---

## Try It on Your Documents

We built [Parsli](https://parsli.co) to handle all of this automatically — splitting, OCR, structuring, and delivery. Upload a PDF, scanned document, or image. Define the fields you want, or let AI detect them. Get clean, structured data in seconds.

[Try Parsli free — 30 pages/month, no credit card required.](/pricing)

[See the API docs](/docs) · [Compare pricing](/pricing)

---

## FAQ

### How much does it cost to extract data from a scanned PDF using AI?

Sending a scanned page directly to Gemini 2.5 Pro costs ~$0.13 per page. A 24-page document: ~$3.12. Using a two-phase approach (dedicated OCR model + cheaper LLM for structuring) reduces this to ~$0.05 per document — about 60x cheaper.

### What's the best OCR model for scanned document extraction in 2026?

For text fidelity: [dots.ocr-1.5](https://modelscope.cn/models/rednote-hilab/dots.ocr-1.5) (3B params, 83.9 on olmOCR-Bench). For structured documents: [HunyuanOCR](https://huggingface.co/tencent/HunyuanOCR) (0.9B params, 94.1 on OmniDocBench). For easiest integration: [Mistral OCR 3](https://mistral.ai/news/mistral-ocr-3) ($1-2 per 1,000 pages). For speed: [PaddleOCR-VL](https://www.codesota.com/ocr) (0.9B, fastest throughput).

### Why not just use Gemini or GPT-4o directly for document extraction?

They work well for single-page, clean documents. For multi-page scanned documents, they're too slow (4+ minutes), too expensive ($0.13/page), and unreliable (timeouts on large PDFs). Purpose-built VLM-OCR models produce better text fidelity at a fraction of the cost.

### How should I handle multi-page PDFs in my extraction pipeline?

Split into individual pages, OCR each page in parallel with a lightweight vision model, then either return the concatenated text (for full-content extraction) or send all text to an LLM to produce structured output (for field extraction). Never send a whole multi-page PDF as one base64 blob to any LLM.

### Is Gemini 2.5 Pro good at OCR?

Gemini 2.5 Pro scores 0.075 on OmniDocBench TextEdit — 2.4x worse than dots.ocr-1.5 (0.031) and worse than HunyuanOCR (0.042), a model that's roughly 200x smaller. Gemini is excellent at reasoning about text, but specialized OCR models are more accurate at reading it.

### What's the fastest way to extract data from scanned PDFs?

Process pages in parallel using a lightweight OCR model (PaddleOCR-VL is the fastest at [253% faster than dots.ocr](https://www.codesota.com/ocr)). With 10 concurrent pages, a 24-page document completes in 60-90 seconds.

### Do I need to self-host OCR models?

Not necessarily. Mistral OCR 3 is available as a managed API on Google Vertex AI at $1-2 per 1,000 pages. DeepSeek-OCR is also available as a managed endpoint on Vertex AI. For higher volume or lower latency, self-hosting on a single A100 GPU with a 0.9B-3B model is cost-effective.

---

## Going Further

- [Best AI Document Data Extraction Tools in 2026](/blog/best-ai-document-data-extraction-tools) — Comprehensive comparison of 7 extraction platforms
- [Free PDF to Excel Converter](/tools/pdf-to-excel) — Try extraction instantly, no signup
- [Extract Table Data from PDFs](/guides/extract-table-data-from-pdfs) — Step-by-step guide for tabular documents
- [Parsli vs Amazon Textract](/compare/textract) — Feature and pricing comparison
