export type AnalyticsEventMap = {
  sign_up_started: { source: "login_page" | "auth_dialog" }
  sign_up_completed: {
    user_id: string
    email: string
    source: "login_page" | "auth_dialog"
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
}

export type AnalyticsEvent = keyof AnalyticsEventMap
