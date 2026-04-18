/**
 * Focused test for the QuickBooks branch of the orchestrator.
 *
 * Why this lives in its own file (not the deliver tests):
 *   - We want to verify the wiring — that orchestrator passes the right args
 *     into deliverToQuickBooks, and that the result is mapped into the
 *     integration_status JSONB the way the UI expects.
 *   - The deliver function itself is tested exhaustively in deliver.test.ts;
 *     here we mock it and inspect the call site.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const deliverMock = vi.fn()

vi.mock("@/lib/extractor/quickbooks/deliver", () => ({
  deliverToQuickBooks: (...args: unknown[]) => deliverMock(...args),
}))
vi.mock("@/lib/extractor/google-docs/create-doc", () => ({
  createGoogleDoc: vi.fn(),
}))
vi.mock("@/lib/extractor/integrations/webhookDelivery", () => ({
  deliverWebhook: vi.fn(),
}))

import { deliverToIntegrations } from "./orchestrator"

beforeEach(() => {
  deliverMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

interface RecordedUpdate {
  table: string
  patch: any
  filterId?: string
}

function makeSupabase(integrations: any[], processedRow: any = { integration_status: {} }) {
  const updates: RecordedUpdate[] = []

  const integrationsBuilder = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: integrations, error: null }),
      }),
    }),
    update: vi.fn().mockImplementation((patch: any) => ({
      eq: vi.fn().mockImplementation((_col: string, val: string) => {
        updates.push({ table: "parser_integrations", patch, filterId: val })
        return Promise.resolve({ data: null, error: null })
      }),
    })),
  }
  const processedBuilder = {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: processedRow, error: null }),
      }),
    }),
    update: vi.fn().mockImplementation((patch: any) => ({
      eq: vi.fn().mockImplementation((_col: string, val: string) => {
        updates.push({ table: "parser_processed_documents", patch, filterId: val })
        return Promise.resolve({ data: null, error: null })
      }),
    })),
  }
  const supabase: any = {
    from: vi.fn().mockImplementation((table: string) =>
      table === "parser_integrations" ? integrationsBuilder : processedBuilder
    ),
  }
  return { supabase, updates }
}

describe("orchestrator: quickbooks branch", () => {
  it("invokes deliverToQuickBooks with the cleanResults and metadata", async () => {
    deliverMock.mockResolvedValueOnce({
      status: "delivered",
      delivered_at: "2026-04-17T10:00:00.000Z",
      qbo_entity_id: "BILL_42",
      qbo_entity_type: "bill",
      qbo_entity_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_42&realmId=R",
    })

    const integration = {
      id: "INTEG_QBO",
      type: "quickbooks",
      config: { realm_id: "R", access_token: "AT", refresh_token: "RT" },
    }
    const { supabase } = makeSupabase([integration])

    const status = await deliverToIntegrations(
      "PARSER_1",
      "My Parser",
      "DOC_1",
      { vendor: "Acme", total: 100, __meta__: { stripped: true } },
      { file_name: "invoice.pdf", mime_type: "application/pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    expect(deliverMock).toHaveBeenCalledTimes(1)
    const callArgs = deliverMock.mock.calls[0][0]
    expect(callArgs.parserId).toBe("PARSER_1")
    expect(callArgs.documentId).toBe("DOC_1")
    expect(callArgs.integrationId).toBe("INTEG_QBO")
    // __meta__ must be stripped before delivery — that's a non-obvious invariant
    // and we don't want to leak internal extraction metadata into QBO.
    expect(callArgs.results).toEqual({ vendor: "Acme", total: 100 })
    expect(callArgs.results).not.toHaveProperty("__meta__")
    expect(callArgs.metadata).toEqual({ file_name: "invoice.pdf", mime_type: "application/pdf" })

    // The orchestrator stores the QBO entity URL in the doc_url slot so the
    // existing IntegrationCard UI surfaces it without a new field.
    expect(status[integration.id]).toMatchObject({
      status: "delivered",
      doc_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_42&realmId=R",
    })
  })

  it("propagates failed status + error string from deliverToQuickBooks", async () => {
    deliverMock.mockResolvedValueOnce({
      status: "failed",
      error: "Vendor not found",
    })

    const integration = { id: "I", type: "quickbooks", config: {} }
    const { supabase, updates } = makeSupabase([integration])

    const status = await deliverToIntegrations(
      "P",
      "Name",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    expect(status[integration.id]).toEqual({
      status: "failed",
      delivered_at: undefined,
      error: "Vendor not found",
      doc_url: undefined,
    })

    // Failure path must record last_error on the integration row so the UI banner shows up.
    const lastErrorUpdate = updates.find(
      (u) => u.table === "parser_integrations" && u.patch.last_error === "Vendor not found"
    )
    expect(lastErrorUpdate).toBeDefined()
  })

  it("propagates skipped status without writing last_error or last_triggered_at", async () => {
    deliverMock.mockResolvedValueOnce({ status: "skipped", error: "QuickBooks integration not connected" })

    const integration = { id: "I", type: "quickbooks", config: {} }
    const { supabase, updates } = makeSupabase([integration])

    const status = await deliverToIntegrations(
      "P",
      "N",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    expect(status[integration.id].status).toBe("skipped")
    // Neither delivered nor failed → no integration row updates.
    const integrationUpdates = updates.filter((u) => u.table === "parser_integrations")
    expect(integrationUpdates).toHaveLength(0)
  })

  it("PERSISTS qbo_entity_id + qbo_entity_type so future deliveries can dedup (audit fix #1)", async () => {
    // Without these fields, the dedup check in deliverToQuickBooks has no
    // entity Id to look up in QBO, and reprocesses would silently double-post
    // after the request-id cache window expires.
    deliverMock.mockResolvedValueOnce({
      status: "delivered",
      delivered_at: "2026-04-18T10:00:00.000Z",
      qbo_entity_id: "BILL_42",
      qbo_entity_type: "bill",
      qbo_entity_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_42&realmId=R",
      attachable_id: "ATT_99",
    })

    const integration = { id: "INTEG_QBO", type: "quickbooks", config: {} }
    const { supabase, updates } = makeSupabase([integration])

    await deliverToIntegrations(
      "P",
      "N",
      "DOC_1",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    const docUpdate = updates.find((u) => u.table === "parser_processed_documents")
    expect(docUpdate).toBeDefined()
    const entry = docUpdate!.patch.integration_status.INTEG_QBO
    expect(entry.qbo_entity_id).toBe("BILL_42")
    expect(entry.qbo_entity_type).toBe("bill")
    expect(entry.qbo_entity_url).toBe(
      "https://sandbox.qbo.intuit.com/app/bill?txnId=BILL_42&realmId=R"
    )
    expect(entry.qbo_attachable_id).toBe("ATT_99")
  })

  it("merges delivery status into the document's integration_status JSONB", async () => {
    deliverMock.mockResolvedValueOnce({
      status: "delivered",
      delivered_at: "2026-04-17T10:00:00.000Z",
      qbo_entity_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=B&realmId=R",
    })

    const integration = { id: "INTEG_QBO", type: "quickbooks", config: {} }
    // Pre-existing email_message_id from a prior gmail run — must be preserved.
    const { supabase, updates } = makeSupabase([integration], {
      integration_status: { email_message_id: "abc-existing" },
    })

    await deliverToIntegrations(
      "P",
      "N",
      "DOC_1",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    const docUpdate = updates.find((u) => u.table === "parser_processed_documents")
    expect(docUpdate).toBeDefined()
    expect(docUpdate!.patch.integration_status).toEqual({
      email_message_id: "abc-existing",
      INTEG_QBO: expect.objectContaining({
        status: "delivered",
        doc_url: "https://sandbox.qbo.intuit.com/app/bill?txnId=B&realmId=R",
      }),
    })
  })

  it("survives a thrown error inside deliverToQuickBooks (caught by orchestrator's try/catch)", async () => {
    deliverMock.mockRejectedValueOnce(new Error("boom from QBO module"))

    const integration = { id: "I", type: "quickbooks", config: {} }
    const { supabase } = makeSupabase([integration])

    const status = await deliverToIntegrations(
      "P",
      "N",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    expect(status[integration.id]).toEqual({ status: "failed", error: "boom from QBO module" })
  })

  it("processes multiple integrations including QBO without one breaking another", async () => {
    deliverMock.mockResolvedValueOnce({
      status: "delivered",
      delivered_at: "2026-04-17T10:00:00.000Z",
      qbo_entity_url: "https://x",
    })
    const { supabase } = makeSupabase([
      { id: "WEBHOOK_1", type: "webhook", config: { url: "" } }, // skipped (no URL)
      { id: "QBO_1", type: "quickbooks", config: {} },
      { id: "GS_1", type: "google_sheets", config: {} }, // skipped
    ])

    const status = await deliverToIntegrations(
      "P",
      "N",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )

    expect(status.WEBHOOK_1.status).toBe("skipped")
    expect(status.QBO_1.status).toBe("delivered")
    expect(status.GS_1.status).toBe("skipped")
    expect(deliverMock).toHaveBeenCalledTimes(1)
  })
})

describe("orchestrator: regression — non-QBO integrations still work", () => {
  it("returns empty status when there are no active integrations (no crash)", async () => {
    const { supabase } = makeSupabase([])
    const status = await deliverToIntegrations(
      "P",
      "N",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )
    expect(status).toEqual({})
  })

  it("handles google_sheets / gmail_inbox as input/pull integrations (skipped)", async () => {
    const { supabase } = makeSupabase([
      { id: "GS", type: "google_sheets", config: {} },
      { id: "GM", type: "gmail_inbox", config: { gmail_address: "x@y.com" } },
    ])
    const status = await deliverToIntegrations(
      "P",
      "N",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )
    expect(status.GS.status).toBe("skipped")
    expect(status.GM.status).toBe("skipped")
  })

  it("uses 'Unknown type' fallback for an unrecognized integration type", async () => {
    const { supabase } = makeSupabase([{ id: "X", type: "rogue_type", config: {} }])
    const status = await deliverToIntegrations(
      "P",
      "N",
      "D",
      {},
      { file_name: "f.pdf", source_type: "upload", page_count: 1 },
      supabase
    )
    expect(status.X).toEqual({ status: "skipped", error: "Unknown type" })
  })
})
