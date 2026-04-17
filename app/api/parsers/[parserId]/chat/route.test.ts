import { describe, expect, it, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import type { UIMessage } from "ai"

/**
 * Route tests focus on our request-validation + blocking layer; the LLM call
 * itself is mocked because streamText is owned by the AI SDK and exhaustively
 * tested upstream. What we own:
 *   - auth enforcement
 *   - ownership checks against parsers / parser_processed_documents
 *   - body validation (documentId, messages, per-turn length)
 *   - blocked-state short-circuit streams
 *   - successful streamText invocation arguments
 */

// ─── Mocks ────────────────────────────────────────────────────────────────
// We mutate `authUser` and the two table fetchers per-test so we can exercise
// every branch without re-instantiating the route module.

let authUser: { id: string } | null = { id: "user-1" }
let parserRow: any = {
  id: "parser-1",
  user_id: "user-1",
  fields: [],
  extraction_type: "fields",
}
let parserError: any = null
let docRow: any = {
  id: "doc-1",
  parser_id: "parser-1",
  user_id: "user-1",
  status: "completed",
  results: { field_a: "value" },
  file_name: "f.pdf",
  source_type: "upload",
  processed_at: null,
  page_count: 1,
  confidence: {},
}
let docError: any = null

// Supabase mock: single() returns the pre-set row/error, chained query builder
// returns a shape compatible with our route's calls.
vi.mock("@/lib/supabase/server", () => {
  const selectBuilder = (row: any, error: any) => ({
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error }),
  })
  return {
    createSupabaseServerComponentClient: () => ({
      auth: {
        getUser: vi.fn().mockImplementation(async () => ({
          data: { user: authUser },
        })),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "parsers") {
          return { select: vi.fn(() => selectBuilder(parserRow, parserError)) }
        }
        return { select: vi.fn(() => selectBuilder(docRow, docError)) }
      }),
    }),
  }
})

// Analytics + error reporting are side-effecty no-ops in tests.
vi.mock("@/lib/analytics/server", () => ({
  trackServerEvent: vi.fn(),
}))
vi.mock("@/lib/errorReporting", () => ({
  reportError: vi.fn(),
}))

// systemPrompt is pure; we swap in a stub so tests don't depend on schema
// rendering internals.
vi.mock("@/lib/chat/systemPrompt", () => ({
  buildChatSystemPrompt: vi.fn(() => "STUB_SYSTEM_PROMPT"),
}))

// Spy streamText calls. We return a tiny stub that satisfies the route's
// `.toUIMessageStreamResponse()` usage — a Response with a plausible SSE body.
const streamTextSpy = vi.fn()
vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai")
  return {
    ...actual,
    streamText: (args: any) => {
      streamTextSpy(args)
      return {
        toUIMessageStreamResponse: () =>
          new Response("data: {\"type\":\"text-end\"}\n\n", {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          }),
      }
    },
  }
})

// Reset mutable state between tests.
beforeEach(() => {
  authUser = { id: "user-1" }
  parserRow = {
    id: "parser-1",
    user_id: "user-1",
    fields: [],
    extraction_type: "fields",
  }
  parserError = null
  docRow = {
    id: "doc-1",
    parser_id: "parser-1",
    user_id: "user-1",
    status: "completed",
    results: { field_a: "value" },
    file_name: "f.pdf",
    source_type: "upload",
    processed_at: null,
    page_count: 1,
    confidence: {},
  }
  docError = null
  streamTextSpy.mockClear()
})

// ─── Helpers ──────────────────────────────────────────────────────────────
async function importRoute() {
  return await import("./route")
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(
    new Request("http://localhost/api/parsers/parser-1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

const userMsg = (text: string): UIMessage => ({
  id: "m1",
  role: "user",
  parts: [{ type: "text", text }],
})

// ─── Module metadata ──────────────────────────────────────────────────────

describe("chat route module flags", () => {
  it("raises maxDuration to 800s (Fluid Compute ceiling)", async () => {
    const mod = await importRoute()
    expect(mod.maxDuration).toBe(800)
  })

  it("runs on the Node.js runtime (streamText needs fetch + crypto)", async () => {
    const mod = await importRoute()
    expect(mod.runtime).toBe("nodejs")
  })
})

// ─── Auth ─────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns 401 when no session", async () => {
    authUser = null
    const { POST } = await importRoute()
    const res = await POST(makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }), {
      params: { parserId: "parser-1" },
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorized" })
  })
})

// ─── Body validation ──────────────────────────────────────────────────────

describe("body validation", () => {
  it("returns 400 for invalid JSON", async () => {
    const { POST } = await importRoute()
    const req = new NextRequest(
      new Request("http://localhost/api/parsers/parser-1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{",
      })
    )
    const res = await POST(req, { params: { parserId: "parser-1" } })
    expect(res.status).toBe(400)
  })

  it("returns 400 when documentId is missing", async () => {
    const { POST } = await importRoute()
    const res = await POST(makeRequest({ messages: [userMsg("hi")] }), {
      params: { parserId: "parser-1" },
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "documentId is required" })
  })

  it("returns 400 when messages is empty", async () => {
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "messages is required" })
  })

  it("returns 400 when messages is not an array", async () => {
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: "not an array" }),
      { params: { parserId: "parser-1" } }
    )
    // treated as empty array → same path as empty messages
    expect(res.status).toBe(400)
  })

  it("returns 400 when latest user message exceeds 4000 chars", async () => {
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({
        documentId: "doc-1",
        messages: [userMsg("x".repeat(4001))],
      }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("4000"),
    })
  })

  it("accepts latest user message at exactly 4000 chars", async () => {
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({
        documentId: "doc-1",
        messages: [userMsg("x".repeat(4000))],
      }),
      { params: { parserId: "parser-1" } }
    )
    // Not 400 — passes validation and hits streamText
    expect(res.status).not.toBe(400)
    expect(streamTextSpy).toHaveBeenCalledOnce()
  })

  it("concatenates all text parts when checking the latest user length", async () => {
    const { POST } = await importRoute()
    const msg: UIMessage = {
      id: "m1",
      role: "user",
      parts: [
        { type: "text", text: "x".repeat(3000) },
        { type: "text", text: "y".repeat(1002) },
      ],
    }
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [msg] }),
      { params: { parserId: "parser-1" } }
    )
    // 3000 + 1002 = 4002 → should reject
    expect(res.status).toBe(400)
  })
})

// ─── Ownership ────────────────────────────────────────────────────────────

describe("ownership", () => {
  it("returns 404 when parser lookup returns error", async () => {
    parserError = { message: "not found" }
    parserRow = null
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Parser not found" })
  })

  it("returns 404 when document lookup returns error", async () => {
    docError = { message: "not found" }
    docRow = null
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Document not found" })
  })
})

// ─── Blocked document states ──────────────────────────────────────────────
// These should short-circuit with a canned SSE stream and NEVER call streamText
// (LLM would be wasted work when there's no content to discuss).

describe("blocked document states", () => {
  it("streams canned 'still processing' when doc is processing", async () => {
    docRow.status = "processing"
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(200)
    expect(streamTextSpy).not.toHaveBeenCalled()
    const text = await res.text()
    expect(text).toContain("still being processed")
  })

  it("streams canned message for pending status", async () => {
    docRow.status = "pending"
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(200)
    expect(streamTextSpy).not.toHaveBeenCalled()
    const text = await res.text()
    expect(text).toContain("still being processed")
  })

  it("streams canned 'extraction failed' when doc.status === 'error'", async () => {
    docRow.status = "error"
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(200)
    expect(streamTextSpy).not.toHaveBeenCalled()
    const text = await res.text()
    expect(text).toContain("Extraction failed")
  })

  it("streams canned 'no data' when results are empty", async () => {
    docRow.results = {}
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(200)
    expect(streamTextSpy).not.toHaveBeenCalled()
    const text = await res.text()
    expect(text).toContain("No data was extracted")
  })

  it("streams canned 'no data' when results is null", async () => {
    docRow.results = null
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(200)
    expect(streamTextSpy).not.toHaveBeenCalled()
  })

  it("SSE body is valid — uses text-start/delta/end chunks", async () => {
    docRow.status = "error"
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.headers.get("Content-Type")).toMatch(/event-stream/)
    const text = await res.text()
    expect(text).toMatch(/"type":"text-start"/)
    expect(text).toMatch(/"type":"text-delta"/)
    expect(text).toMatch(/"type":"text-end"/)
  })
})

// ─── Happy path: streamText invocation ────────────────────────────────────

describe("streamText invocation", () => {
  it("passes both tools for structured-fields parsers", async () => {
    parserRow.extraction_type = "fields"
    const { POST } = await importRoute()
    await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("sum the totals")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(streamTextSpy).toHaveBeenCalledOnce()
    const args = streamTextSpy.mock.calls[0][0]
    expect(Object.keys(args.tools).sort()).toEqual([
      "calculate",
      "query_extracted_data",
    ])
  })

  it("omits query_extracted_data for full_content parsers", async () => {
    parserRow.extraction_type = "full_content"
    const { POST } = await importRoute()
    await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("what's this?")] }),
      { params: { parserId: "parser-1" } }
    )
    const args = streamTextSpy.mock.calls[0][0]
    expect(Object.keys(args.tools)).toEqual(["calculate"])
  })

  it("stopWhen caps the tool loop at 5 steps", async () => {
    const { POST } = await importRoute()
    await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    const args = streamTextSpy.mock.calls[0][0]
    // stepCountIs(5) is a StopCondition function — we can at least verify a function is passed
    expect(typeof args.stopWhen).toBe("function")
  })

  it("uses the stubbed system prompt", async () => {
    const { POST } = await importRoute()
    await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    const args = streamTextSpy.mock.calls[0][0]
    expect(args.system).toBe("STUB_SYSTEM_PROMPT")
  })

  it("uses temperature 0.2 — deterministic chat over structured data", async () => {
    const { POST } = await importRoute()
    await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    const args = streamTextSpy.mock.calls[0][0]
    expect(args.temperature).toBe(0.2)
  })

  it("returns the streamText SSE response unchanged", async () => {
    const { POST } = await importRoute()
    const res = await POST(
      makeRequest({ documentId: "doc-1", messages: [userMsg("hi")] }),
      { params: { parserId: "parser-1" } }
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toMatch(/event-stream/)
  })
})
