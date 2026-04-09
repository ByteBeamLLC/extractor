export type AnalyticsEventMap = {
  sign_up_started: { source: "login_page" | "auth_dialog" }
  sign_up_completed: {
    user_id: string
    email: string
    source: "login_page" | "auth_dialog" | "anonymous_conversion" | "google_oauth"
  }
  anonymous_converted: {
    user_id: string
    email: string
    source: "login_page" | "auth_dialog" | "google_oauth"
    anon_user_id?: string
  }
  demo_started: { step_id: string }
  demo_completed: { total_steps: number }
  demo_skipped: { skipped_at_step: string; skipped_at_step_index: number }
  first_value: {
    user_id: string
    parser_id: string
    document_id: string
    source_type: string
    is_first_extraction: boolean
  }

  // Handwriting-to-text free tool events
  hwt_upload: {
    file_type: string
    file_size_kb: number
    source: "upload" | "drag_drop"
  }
  hwt_sample_click: {
    sample_label: string
  }
  hwt_extraction_start: {
    source: "upload" | "sample"
    file_type: string
  }
  hwt_extraction_success: {
    source: "upload" | "sample"
    word_count: number
    duration_ms: number
    file_type: string
    lifetime_tool_uses?: number
  }
  hwt_extraction_error: {
    source: "upload" | "sample"
    error_type: "no_text" | "server_error" | "invalid_file" | "file_too_large"
    file_type: string
  }
  hwt_copy: {
    word_count: number
  }
  hwt_download: {
    word_count: number
  }
  hwt_reset: {
    had_result: boolean
  }
  // Server-side: logged per API call for reliable tracking
  hwt_server_extraction: {
    distinct_id: string
    file_type: string
    success: boolean
    word_count: number
    duration_ms: number
    error_type?: string
    model_used?: string
    doc_type?: string
    language?: string
  }

  // Handwriting → app bridge funnel
  hwt_bridge_starter_clicked: {
    doc_type: string
    language: string
    chip_index: number
  }
  hwt_bridge_provisioned: {
    distinct_id: string
    user_id: string
    parser_id: string
    document_id: string
    doc_type: string
    language: string
    is_anonymous: boolean
    duration_ms: number
  }
  hwt_bridge_followup_sent: {
    parser_id: string
    document_id: string
    doc_type: string
  }
  hwt_bridge_handoff_consumed: {
    parser_id: string
    document_id: string
  }

  // ─── Lifecycle events ───

  // Session tracking (fires on each new session across entire site)
  session_started: {
    session_number: number
    days_since_first_visit: number
    days_since_last_session: number
    traffic_source: string
    is_return_visitor: boolean
    lifetime_tool_uses: number
  }

  // Page views with enriched context
  page_viewed: {
    page_path: string
    referrer: string
    traffic_source: string
    session_number: number
    is_return_visitor: boolean
  }

  // Tool page specifically (subset of page_viewed, easier to query)
  tool_page_viewed: {
    tool_name: string
    traffic_source: string
    session_number: number
    days_since_first_visit: number
    lifetime_tool_uses: number
  }

  // CTA clicks anywhere on the tool page
  cta_clicked: {
    cta_text: string
    cta_location: string
    page_path: string
    lifetime_tool_uses: number
    session_number: number
  }

  // Conversion from free tool → app (captures pre-signup context)
  signup_from_tool: {
    tool_name: string
    tool_uses_before_signup: number
    days_since_first_visit: number
    session_count: number
    traffic_source: string
  }

  // Authenticated user returns to free tool
  return_to_free_tool: {
    tool_name: string
    current_plan: string
    days_since_last_use: number
  }

  // ─── Funnel milestone events ───

  // User arrives at the login/signup page (measures CTA → signup form drop-off)
  login_page_viewed: {
    referrer: string
    traffic_source: string
    has_attribution: boolean // came from a paid ad (gclid/utm present)
    landing_page: string // first page they ever hit
  }

  // User confirmed email and exchanged auth code for session (server-side)
  email_confirmed: {
    user_id: string
    email: string
  }

  // User created a new parser (server-side)
  parser_created: {
    user_id: string
    parser_id: string
    parser_name: string
    extraction_type: string
    has_template: boolean
    is_first_parser: boolean
  }

  // User saved schema fields on a parser (server-side)
  schema_saved: {
    user_id: string
    parser_id: string
    field_count: number
  }

  // ─── Landing page (paid ad) events ───

  // LP page view with full UTM context for keyword-level attribution
  lp_viewed: {
    lp_page: string
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_term: string // Google Ads keyword via {keyword} ValueTrack
    utm_content: string
    has_gclid: boolean
    traffic_source: string
    session_number: number
  }

  // CTA click on landing page — carries keyword context for conversion attribution
  lp_cta_clicked: {
    lp_page: string
    cta_text: string
    cta_href: string
    cta_section: string
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_term: string
    utm_content: string
  }

  // Scroll depth milestones (25/50/75/100%) — measures engagement per keyword
  lp_scroll_depth: {
    lp_page: string
    depth_pct: number
    utm_term: string
    utm_campaign: string
  }

  // ─── Product Hunt launch banner ───
  ph_banner_shown: {
    location: string
  }
  ph_banner_email_submitted: {
    location: string
  }

  // ─── Structure detection bridge banner ───
  bridge_banner_shown: {
    location: string
    structure_type: string
    structure_count: number
    lifetime_tool_uses: number
  }
  bridge_banner_cta_clicked: {
    location: string
    structure_type: string
    lifetime_tool_uses: number
  }

  // ─── Document chat events ───
  chat_message_sent: {
    user_id: string
    parser_id: string
    document_id: string
    tool_calls: number
    tool_names: string[]
    latency_ms: number
  }
  chat_error: {
    user_id: string
    parser_id: string
    document_id: string
    error: string
  }

  // ─── Extraction-ready re-engagement notifications ───
  // Funnel: scheduled → sent → clicked. The `nid` UUID ties all stages
  // of the same notification together across channels (push + email).

  // Server: fired from process-document worker when extraction completes
  // and we insert a pending email job (and, in Phase 2, send a push).
  notification_scheduled: {
    user_id: string
    nid: string
    channel: "email" | "push"
    document_id: string
    parser_id: string
    is_first_value: boolean
    extraction_type: string
  }

  // Server: fired from cron when an email actually goes out.
  notification_sent: {
    user_id: string
    nid: string
    channel: "email" | "push"
    document_id: string
    parser_id: string
    is_first_value: boolean
    extraction_type: string
  }

  // Server: fired from cron when an email is suppressed by dedupe rules
  // (push already clicked, user already returned, frequency cap, etc.).
  notification_suppressed: {
    user_id: string
    nid: string
    channel: "email" | "push"
    document_id: string
    parser_id: string
    reason:
      | "push_clicked"
      | "email_clicked"
      | "user_disabled"
      | "expired"
  }

  // Client: fired when a user lands on the app with `?nid=...` in the URL.
  // Captures the channel from `utm_source` so the funnel splits cleanly.
  notification_clicked: {
    user_id: string
    nid: string
    channel: "email" | "push"
    document_id?: string
  }

  // ─── Bridge session lifecycle ───
  bridge_session_created: {
    user_id: string
    parser_id: string
    document_id: string
    is_anonymous: boolean
  }
  bridge_session_consumed: {
    user_id: string
    parser_id: string | null
    document_id: string | null
    anon_user_id: string
  }
  bridge_session_rejected: {
    user_id: string
    reason: "expired_or_consumed"
  }

  // ─── Email continuation (deep link from notification emails) ───
  email_continue_success: {
    user_id: string
    nid: string | null
    purpose: string
    target_url: string
  }
  email_continue_rejected: {
    user_id?: string
    nid?: string | null
    reason: "expired_or_consumed" | "user_not_found" | "session_creation_failed"
  }
}

export type AnalyticsEvent = keyof AnalyticsEventMap
