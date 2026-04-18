import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import {
  exchangeCodeForTokens,
  getQuickBooksEnvironment,
} from "@/lib/extractor/quickbooks/oauth"
import {
  fetchAllAccounts,
  fetchAllCustomers,
  fetchAllTaxCodes,
  fetchAllVendors,
  getCompanyInfo,
  getQuickBooksClient,
} from "@/lib/extractor/quickbooks/client"
import type { QuickBooksConfig } from "@/lib/extractor/types"

export const runtime = "nodejs"
export const maxDuration = 60

// GET /api/auth/quickbooks/callback?code=...&state=...&realmId=...
// Intuit redirects here after the user authorizes. We exchange the code,
// pull the company info + initial reference snapshot, and persist a new
// parser_integrations row (or update the existing one if reconnecting).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const stateRaw = searchParams.get("state")
  const realmId = searchParams.get("realmId")
  const error = searchParams.get("error")

  if (!stateRaw) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 })
  }

  let state: { parserId: string; userId: string }
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString())
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 })
  }

  const { parserId, userId } = state
  const redirectBase = `${request.nextUrl.origin}/parsers/${parserId}/export`

  if (error || !code || !realmId) {
    return NextResponse.redirect(
      `${redirectBase}?quickbooksError=${encodeURIComponent(error ?? "missing_code_or_realm")}`
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const supabase = createSupabaseServiceRoleClient()

    const { data: parser } = await supabase
      .from("parsers")
      .select("id")
      .eq("id", parserId)
      .eq("user_id", userId)
      .single()

    if (!parser) {
      return NextResponse.redirect(`${redirectBase}?quickbooksError=unauthorized`)
    }

    const env = getQuickBooksEnvironment()

    // Look up any existing QBO integration on this parser. We allow exactly
    // one per parser — reconnecting overwrites the row in place.
    const { data: existing } = await supabase
      .from("parser_integrations")
      .select("id, config")
      .eq("parser_id", parserId)
      .eq("type", "quickbooks")
      .maybeSingle()

    const existingConfig = (existing as any)?.config as Partial<QuickBooksConfig> | undefined

    const baseConfig: QuickBooksConfig = {
      realm_id: realmId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      refresh_token_issued_at: new Date().toISOString(),
      environment: env,
      company_name: existingConfig?.company_name ?? "QuickBooks",
      target_entity: existingConfig?.target_entity ?? "bill",
      field_mapping: existingConfig?.field_mapping ?? {},
      default_vendor_id: existingConfig?.default_vendor_id ?? null,
      default_account_id: existingConfig?.default_account_id ?? null,
      default_tax_code_id: existingConfig?.default_tax_code_id ?? null,
      default_payment_account_id: existingConfig?.default_payment_account_id ?? null,
      payment_type: existingConfig?.payment_type ?? null,
      auto_create_vendor: existingConfig?.auto_create_vendor ?? false,
      attach_source_document: existingConfig?.attach_source_document ?? true,
      accounts_snapshot: existingConfig?.accounts_snapshot ?? [],
      vendors_snapshot: existingConfig?.vendors_snapshot ?? [],
      customers_snapshot: existingConfig?.customers_snapshot ?? [],
      tax_codes_snapshot: existingConfig?.tax_codes_snapshot ?? [],
      snapshot_refreshed_at: existingConfig?.snapshot_refreshed_at ?? null,
    }

    // Insert or update FIRST so we have a row id, then refresh snapshots in
    // place. This way if the snapshot fetch fails we still have working OAuth
    // and the user can manually refresh from the setup UI.
    let integrationId: string
    if (existing) {
      integrationId = (existing as any).id
      await supabase
        .from("parser_integrations")
        .update({
          config: baseConfig,
          is_active: true,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integrationId)
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("parser_integrations")
        .insert({
          parser_id: parserId,
          user_id: userId,
          type: "quickbooks",
          name: "QuickBooks Online",
          config: baseConfig,
          is_active: true,
        })
        .select("id")
        .single()
      if (insertError || !inserted) {
        console.error("[qbo-callback] Insert failed:", insertError)
        return NextResponse.redirect(`${redirectBase}?quickbooksError=db_insert_failed`)
      }
      integrationId = (inserted as any).id
    }

    // Pull company name + reference data. Anything that fails here is logged
    // but doesn't break the OAuth flow — the user can refresh from the UI.
    try {
      const client = await getQuickBooksClient(baseConfig, integrationId, supabase)
      const [info, accounts, vendors, customers, taxCodes] = await Promise.all([
        getCompanyInfo(client).catch((e) => {
          console.warn("[qbo-callback] getCompanyInfo failed:", e)
          return null
        }),
        fetchAllAccounts(client).catch((e) => {
          console.warn("[qbo-callback] fetchAllAccounts failed:", e)
          return []
        }),
        fetchAllVendors(client).catch((e) => {
          console.warn("[qbo-callback] fetchAllVendors failed:", e)
          return []
        }),
        fetchAllCustomers(client).catch((e) => {
          console.warn("[qbo-callback] fetchAllCustomers failed:", e)
          return []
        }),
        fetchAllTaxCodes(client).catch((e) => {
          console.warn("[qbo-callback] fetchAllTaxCodes failed:", e)
          return []
        }),
      ])

      const enriched: QuickBooksConfig = {
        ...client.config,
        company_name: info?.CompanyName ?? baseConfig.company_name,
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

      await supabase
        .from("parser_integrations")
        .update({
          config: enriched,
          name: `QuickBooks Online (${enriched.company_name})`,
        })
        .eq("id", integrationId)
    } catch (err) {
      console.warn("[qbo-callback] Snapshot fetch failed:", err)
    }

    return NextResponse.redirect(`${redirectBase}?quickbooksConnected=true`)
  } catch (err) {
    console.error("[qbo-callback] Error:", err)
    return NextResponse.redirect(`${redirectBase}?quickbooksError=token_exchange_failed`)
  }
}
