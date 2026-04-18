import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import {
  fetchAllAccounts,
  fetchAllCustomers,
  fetchAllTaxCodes,
  fetchAllVendors,
  getQuickBooksClient,
} from "@/lib/extractor/quickbooks/client"
import type { QuickBooksConfig } from "@/lib/extractor/types"

export const runtime = "nodejs"
export const maxDuration = 60

// POST /api/parsers/[parserId]/integrations/quickbooks/refs
// Refreshes the cached accounts/vendors/customers/tax_codes snapshots on the
// QuickBooks integration row for this parser. Returns the fresh snapshot so
// the setup UI can re-render dropdowns immediately.
export async function POST(
  _request: NextRequest,
  { params }: { params: { parserId: string } }
) {
  const supabase = createSupabaseServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: integration, error } = await supabase
    .from("parser_integrations")
    .select("id, user_id, type, config")
    .eq("parser_id", params.parserId)
    .eq("user_id", user.id)
    .eq("type", "quickbooks")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!integration) {
    return NextResponse.json({ error: "QuickBooks integration not found" }, { status: 404 })
  }

  const config = (integration as any).config as QuickBooksConfig
  const integrationId = (integration as any).id as string

  try {
    const client = await getQuickBooksClient(config, integrationId, supabase)
    const [accounts, vendors, customers, taxCodes] = await Promise.all([
      fetchAllAccounts(client),
      fetchAllVendors(client),
      fetchAllCustomers(client),
      fetchAllTaxCodes(client),
    ])

    const updated: QuickBooksConfig = {
      ...client.config,
      accounts_snapshot: accounts.map((a) => ({
        Id: a.Id,
        Name: a.Name,
        AccountType: a.AccountType,
        AccountSubType: a.AccountSubType,
        Classification: a.Classification,
      })),
      vendors_snapshot: vendors.map((v) => ({
        Id: v.Id,
        Name: v.DisplayName,
        CurrencyRef: v.CurrencyRef?.value,
      })),
      customers_snapshot: customers.map((c) => ({ Id: c.Id, Name: c.DisplayName })),
      tax_codes_snapshot: taxCodes.map((t) => ({ Id: t.Id, Name: t.Name, TaxGroup: t.TaxGroup })),
      snapshot_refreshed_at: new Date().toISOString(),
    }

    await supabase.from("parser_integrations").update({ config: updated }).eq("id", integrationId)

    return NextResponse.json({
      accounts: updated.accounts_snapshot,
      vendors: updated.vendors_snapshot,
      customers: updated.customers_snapshot,
      tax_codes: updated.tax_codes_snapshot,
      refreshed_at: updated.snapshot_refreshed_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to refresh references"
    await supabase
      .from("parser_integrations")
      .update({ last_error: message })
      .eq("id", integrationId)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
