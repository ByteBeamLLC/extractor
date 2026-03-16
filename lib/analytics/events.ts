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
}

export type AnalyticsEvent = keyof AnalyticsEventMap
