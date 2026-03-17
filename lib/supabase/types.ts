export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_audit_log: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          advanced_field_credits: number
          billing_interval: string
          created_at: string
          credits_included: number
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_default: boolean
          is_public: boolean
          max_documents_per_job: number | null
          max_file_size_mb: number | null
          max_jobs_per_month: number | null
          max_schemas: number | null
          name: string
          overage_price_per_credit_cents: number | null
          plan_type: string
          price_cents: number
          simple_field_credits: number
          slug: string
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          advanced_field_credits?: number
          billing_interval?: string
          created_at?: string
          credits_included?: number
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_public?: boolean
          max_documents_per_job?: number | null
          max_file_size_mb?: number | null
          max_jobs_per_month?: number | null
          max_schemas?: number | null
          name: string
          overage_price_per_credit_cents?: number | null
          plan_type?: string
          price_cents?: number
          simple_field_credits?: number
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          advanced_field_credits?: number
          billing_interval?: string
          created_at?: string
          credits_included?: number
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_public?: boolean
          max_documents_per_job?: number | null
          max_file_size_mb?: number | null
          max_jobs_per_month?: number | null
          max_schemas?: number | null
          name?: string
          overage_price_per_credit_cents?: number | null
          plan_type?: string
          price_cents?: number
          simple_field_credits?: number
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      copilot_chats: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string | null
          id: string
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "copilot_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          currency: string | null
          description: string | null
          discount_percent: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          name: string
          price_cents: number
          slug: string
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          currency?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name: string
          price_cents: number
          slug: string
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          currency?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          reference_id: string | null
          reference_type: string | null
          type: string
          usage_details: Json | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reference_id?: string | null
          reference_type?: string | null
          type: string
          usage_details?: Json | null
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          usage_details?: Json | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "credit_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_credits_purchased: number
          lifetime_credits_received: number
          lifetime_credits_used: number
          low_balance_notified_at: string | null
          low_balance_threshold: number
          negative_balance_notified_at: string | null
          period_credits_used: number
          period_end: string | null
          period_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_credits_purchased?: number
          lifetime_credits_received?: number
          lifetime_credits_used?: number
          low_balance_notified_at?: string | null
          low_balance_threshold?: number
          negative_balance_notified_at?: string | null
          period_credits_used?: number
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_credits_purchased?: number
          lifetime_credits_received?: number
          lifetime_credits_used?: number
          low_balance_notified_at?: string | null
          low_balance_threshold?: number
          negative_balance_notified_at?: string | null
          period_credits_used?: number
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_extraction_files: {
        Row: {
          created_at: string
          error_message: string | null
          extracted_text: Json | null
          extraction_method: string | null
          extraction_status: string
          file_size: number | null
          file_url: string
          folder_id: string | null
          gemini_error_message: string | null
          gemini_extraction_status: string
          gemini_full_text: string | null
          id: string
          layout_data: Json | null
          layout_error_message: string | null
          layout_extraction_status: string
          mime_type: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          extracted_text?: Json | null
          extraction_method?: string | null
          extraction_status?: string
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          gemini_error_message?: string | null
          gemini_extraction_status?: string
          gemini_full_text?: string | null
          id?: string
          layout_data?: Json | null
          layout_error_message?: string | null
          layout_extraction_status?: string
          mime_type?: string | null
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          extracted_text?: Json | null
          extraction_method?: string | null
          extraction_status?: string
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          gemini_error_message?: string | null
          gemini_extraction_status?: string
          gemini_full_text?: string | null
          id?: string
          layout_data?: Json | null
          layout_error_message?: string | null
          layout_extraction_status?: string
          mime_type?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extraction_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_extraction_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extraction_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_extraction_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_extraction_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      downloaded_jobs: {
        Row: {
          downloaded_at: string | null
          id: string
          job_id: string
          payment_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          job_id: string
          payment_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          job_id?: string
          payment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "downloaded_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "tool_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloaded_jobs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_job_embeddings: {
        Row: {
          chunk_id: string
          content_hash: string
          content_text: string
          created_at: string | null
          embedding: string
          id: string
          job_id: string
          metadata: Json | null
          schema_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chunk_id: string
          content_hash: string
          content_text: string
          created_at?: string | null
          embedding: string
          id?: string
          job_id: string
          metadata?: Json | null
          schema_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chunk_id?: string
          content_hash?: string
          content_text?: string
          created_at?: string | null
          embedding?: string
          id?: string
          job_id?: string
          metadata?: Json | null
          schema_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_job_embeddings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "extraction_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_job_embeddings_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_jobs: {
        Row: {
          advanced_fields_count: number | null
          agent_type: string | null
          billing_processed: boolean | null
          billing_processed_at: string | null
          completed_at: string | null
          created_at: string
          file_name: string
          file_url: string | null
          id: string
          input_documents: Json | null
          ocr_annotated_image_url: string | null
          ocr_markdown: string | null
          original_file_url: string | null
          results: Json | null
          schema_id: string
          simple_fields_count: number | null
          status: string
          total_credits_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advanced_fields_count?: number | null
          agent_type?: string | null
          billing_processed?: boolean | null
          billing_processed_at?: string | null
          completed_at?: string | null
          created_at?: string
          file_name: string
          file_url?: string | null
          id?: string
          input_documents?: Json | null
          ocr_annotated_image_url?: string | null
          ocr_markdown?: string | null
          original_file_url?: string | null
          results?: Json | null
          schema_id: string
          simple_fields_count?: number | null
          status?: string
          total_credits_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advanced_fields_count?: number | null
          agent_type?: string | null
          billing_processed?: boolean | null
          billing_processed_at?: string | null
          completed_at?: string | null
          created_at?: string
          file_name?: string
          file_url?: string | null
          id?: string
          input_documents?: Json | null
          ocr_annotated_image_url?: string | null
          ocr_markdown?: string | null
          original_file_url?: string | null
          results?: Json | null
          schema_id?: string
          simple_fields_count?: number | null
          status?: string
          total_credits_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      extractor_subscriptions: {
        Row: {
          api_access: boolean
          created_at: string
          credits_free: number
          credits_reset_at: string
          credits_used: number
          id: string
          max_parsers: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_access?: boolean
          created_at?: string
          credits_free?: number
          credits_reset_at?: string
          credits_used?: number
          id?: string
          max_parsers?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_access?: boolean
          created_at?: string
          credits_free?: number
          credits_reset_at?: string
          credits_used?: number
          id?: string
          max_parsers?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fhir_resources: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          is_deleted: boolean | null
          last_updated: string | null
          resource_id: string
          resource_type: string
          version_id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          is_deleted?: boolean | null
          last_updated?: string | null
          resource_id: string
          resource_type: string
          version_id?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          is_deleted?: boolean | null
          last_updated?: string | null
          resource_id?: string
          resource_type?: string
          version_id?: number
        }
        Relationships: []
      }
      foundation_foods: {
        Row: {
          added_sugars_g: number | null
          alcohol_g: number | null
          ash_g: number | null
          caffeine_mg: number | null
          calcium_mg: number | null
          carbohydrate_g: number | null
          cholesterol_mg: number | null
          common_allergens: string[] | null
          copper_mg: number | null
          created_at: string | null
          description_ar: string | null
          description_en: string
          dietary_fiber_g: number | null
          energy_kcal: number | null
          energy_kj: number | null
          folate_mcg_dfe: number | null
          food_code: string | null
          food_group: string | null
          food_subgroup: string | null
          halal_status: string | null
          id: string
          iron_mg: number | null
          magnesium_mg: number | null
          manganese_mg: number | null
          monounsaturated_fat_g: number | null
          niacin_mg: number | null
          phosphorus_mg: number | null
          polyunsaturated_fat_g: number | null
          potassium_mg: number | null
          protein_g: number | null
          raw_metadata: Json | null
          raw_nutrients: Json | null
          riboflavin_mg: number | null
          saturated_fat_g: number | null
          scientific_name: string | null
          search_vector: unknown
          selenium_mcg: number | null
          sodium_mg: number | null
          source_db: string
          source_id: string
          source_version: string | null
          thiamin_mg: number | null
          total_fat_g: number | null
          total_sugars_g: number | null
          trans_fat_g: number | null
          updated_at: string | null
          vitamin_a_mcg_rae: number | null
          vitamin_b12_mcg: number | null
          vitamin_b6_mg: number | null
          vitamin_c_mg: number | null
          vitamin_d_mcg: number | null
          vitamin_e_mg: number | null
          vitamin_k_mcg: number | null
          water_g: number | null
          zinc_mg: number | null
        }
        Insert: {
          added_sugars_g?: number | null
          alcohol_g?: number | null
          ash_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          carbohydrate_g?: number | null
          cholesterol_mg?: number | null
          common_allergens?: string[] | null
          copper_mg?: number | null
          created_at?: string | null
          description_ar?: string | null
          description_en: string
          dietary_fiber_g?: number | null
          energy_kcal?: number | null
          energy_kj?: number | null
          folate_mcg_dfe?: number | null
          food_code?: string | null
          food_group?: string | null
          food_subgroup?: string | null
          halal_status?: string | null
          id?: string
          iron_mg?: number | null
          magnesium_mg?: number | null
          manganese_mg?: number | null
          monounsaturated_fat_g?: number | null
          niacin_mg?: number | null
          phosphorus_mg?: number | null
          polyunsaturated_fat_g?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          raw_metadata?: Json | null
          raw_nutrients?: Json | null
          riboflavin_mg?: number | null
          saturated_fat_g?: number | null
          scientific_name?: string | null
          search_vector?: unknown
          selenium_mcg?: number | null
          sodium_mg?: number | null
          source_db: string
          source_id: string
          source_version?: string | null
          thiamin_mg?: number | null
          total_fat_g?: number | null
          total_sugars_g?: number | null
          trans_fat_g?: number | null
          updated_at?: string | null
          vitamin_a_mcg_rae?: number | null
          vitamin_b12_mcg?: number | null
          vitamin_b6_mg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
          vitamin_e_mg?: number | null
          vitamin_k_mcg?: number | null
          water_g?: number | null
          zinc_mg?: number | null
        }
        Update: {
          added_sugars_g?: number | null
          alcohol_g?: number | null
          ash_g?: number | null
          caffeine_mg?: number | null
          calcium_mg?: number | null
          carbohydrate_g?: number | null
          cholesterol_mg?: number | null
          common_allergens?: string[] | null
          copper_mg?: number | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string
          dietary_fiber_g?: number | null
          energy_kcal?: number | null
          energy_kj?: number | null
          folate_mcg_dfe?: number | null
          food_code?: string | null
          food_group?: string | null
          food_subgroup?: string | null
          halal_status?: string | null
          id?: string
          iron_mg?: number | null
          magnesium_mg?: number | null
          manganese_mg?: number | null
          monounsaturated_fat_g?: number | null
          niacin_mg?: number | null
          phosphorus_mg?: number | null
          polyunsaturated_fat_g?: number | null
          potassium_mg?: number | null
          protein_g?: number | null
          raw_metadata?: Json | null
          raw_nutrients?: Json | null
          riboflavin_mg?: number | null
          saturated_fat_g?: number | null
          scientific_name?: string | null
          search_vector?: unknown
          selenium_mcg?: number | null
          sodium_mg?: number | null
          source_db?: string
          source_id?: string
          source_version?: string | null
          thiamin_mg?: number | null
          total_fat_g?: number | null
          total_sugars_g?: number | null
          trans_fat_g?: number | null
          updated_at?: string | null
          vitamin_a_mcg_rae?: number | null
          vitamin_b12_mcg?: number | null
          vitamin_b6_mg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
          vitamin_e_mg?: number | null
          vitamin_k_mcg?: number | null
          water_g?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      gmail_processed_messages: {
        Row: {
          gmail_message_id: string
          id: string
          integration_id: string
          processed_at: string
          user_id: string
        }
        Insert: {
          gmail_message_id: string
          id?: string
          integration_id: string
          processed_at?: string
          user_id: string
        }
        Update: {
          gmail_message_id?: string
          id?: string
          integration_id?: string
          processed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_processed_messages_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "parser_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_sessions: {
        Row: {
          converted_at: string | null
          converted_to_user_id: string | null
          created_at: string
          credits_remaining: number
          credits_used: number
          expires_at: string
          id: string
          ip_address: unknown
          last_used_at: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_used_at?: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string
          credits_remaining?: number
          credits_used?: number
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_used_at?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      knowledge_bases: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          ai_status: string
          content: string | null
          created_at: string
          id: string
          knowledge_base_id: string | null
          mime_type: string | null
          name: string
          size: string | null
          status: string
          storage_path: string | null
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          ai_status?: string
          content?: string | null
          created_at?: string
          id?: string
          knowledge_base_id?: string | null
          mime_type?: string | null
          name: string
          size?: string | null
          status?: string
          storage_path?: string | null
          type: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          ai_status?: string
          content?: string | null
          created_at?: string
          id?: string
          knowledge_base_id?: string | null
          mime_type?: string | null
          name?: string
          size?: string | null
          status?: string
          storage_path?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      overage_records: {
        Row: {
          created_at: string
          id: string
          overage_amount_cents: number
          overage_credits: number
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          overage_amount_cents?: number
          overage_credits?: number
          period_end: string
          period_start: string
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          overage_amount_cents?: number
          overage_credits?: number
          period_end?: string
          period_start?: string
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parser_api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          parser_id: string
          permissions: string[]
          rate_limit_per_minute: number | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          parser_id: string
          permissions?: string[]
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          parser_id?: string
          permissions?: string[]
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parser_api_keys_parser_id_fkey"
            columns: ["parser_id"]
            isOneToOne: false
            referencedRelation: "parsers"
            referencedColumns: ["id"]
          },
        ]
      }
      parser_integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          last_error: string | null
          last_triggered_at: string | null
          name: string
          parser_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_triggered_at?: string | null
          name: string
          parser_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_triggered_at?: string | null
          name?: string
          parser_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parser_integrations_parser_id_fkey"
            columns: ["parser_id"]
            isOneToOne: false
            referencedRelation: "parsers"
            referencedColumns: ["id"]
          },
        ]
      }
      parser_processed_documents: {
        Row: {
          confidence: Json | null
          created_at: string
          credits_used: number
          error_message: string | null
          expires_at: string | null
          file_name: string
          file_size: number | null
          id: string
          integration_status: Json | null
          mime_type: string | null
          page_count: number | null
          parser_id: string
          processed_at: string | null
          results: Json | null
          source_type: string
          status: string
          user_id: string
        }
        Insert: {
          confidence?: Json | null
          created_at?: string
          credits_used?: number
          error_message?: string | null
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          integration_status?: Json | null
          mime_type?: string | null
          page_count?: number | null
          parser_id: string
          processed_at?: string | null
          results?: Json | null
          source_type: string
          status?: string
          user_id: string
        }
        Update: {
          confidence?: Json | null
          created_at?: string
          credits_used?: number
          error_message?: string | null
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          integration_status?: Json | null
          mime_type?: string | null
          page_count?: number | null
          parser_id?: string
          processed_at?: string | null
          results?: Json | null
          source_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parser_processed_documents_parser_id_fkey"
            columns: ["parser_id"]
            isOneToOne: false
            referencedRelation: "parsers"
            referencedColumns: ["id"]
          },
        ]
      }
      parsers: {
        Row: {
          created_at: string
          description: string | null
          document_count: number
          extraction_mode: string
          extraction_prompt_override: string | null
          fields: Json
          id: string
          inbound_email: string | null
          inbound_webhook_token: string | null
          last_processed_at: string | null
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_count?: number
          extraction_mode?: string
          extraction_prompt_override?: string | null
          fields?: Json
          id?: string
          inbound_email?: string | null
          inbound_webhook_token?: string | null
          last_processed_at?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_count?: number
          extraction_mode?: string
          extraction_prompt_override?: string | null
          fields?: Json
          id?: string
          inbound_email?: string | null
          inbound_webhook_token?: string | null
          last_processed_at?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "tool_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          tour_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          tour_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          tour_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      recipe_builder_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recipe_lookups: {
        Row: {
          allergens: Json | null
          created_at: string | null
          diet_types: Json | null
          exported_at: string | null
          id: string
          may_contain_allergens: Json | null
          nutrients: Json | null
          updated_at: string | null
        }
        Insert: {
          allergens?: Json | null
          created_at?: string | null
          diet_types?: Json | null
          exported_at?: string | null
          id?: string
          may_contain_allergens?: Json | null
          nutrients?: Json | null
          updated_at?: string | null
        }
        Update: {
          allergens?: Json | null
          created_at?: string | null
          diet_types?: Json | null
          exported_at?: string | null
          id?: string
          may_contain_allergens?: Json | null
          nutrients?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          allergens: string[] | null
          allergens_ar: Json | null
          barcode: string | null
          category: string | null
          costs: Json | null
          created_at: string | null
          description: string | null
          diet_types: string[] | null
          diet_types_ar: Json | null
          id: string
          ingredients: Json | null
          ingredients_ar: Json | null
          inventory: Json | null
          labels: Json | null
          may_contain_allergens: string[] | null
          metadata: Json | null
          name: string
          name_ar: string | null
          nutrition: Json | null
          owner_email: string | null
          preparation_time_minutes: number | null
          serving: Json | null
          status: string | null
          steps: Json | null
          sub_category: string | null
          translations_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          allergens_ar?: Json | null
          barcode?: string | null
          category?: string | null
          costs?: Json | null
          created_at?: string | null
          description?: string | null
          diet_types?: string[] | null
          diet_types_ar?: Json | null
          id: string
          ingredients?: Json | null
          ingredients_ar?: Json | null
          inventory?: Json | null
          labels?: Json | null
          may_contain_allergens?: string[] | null
          metadata?: Json | null
          name: string
          name_ar?: string | null
          nutrition?: Json | null
          owner_email?: string | null
          preparation_time_minutes?: number | null
          serving?: Json | null
          status?: string | null
          steps?: Json | null
          sub_category?: string | null
          translations_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          allergens_ar?: Json | null
          barcode?: string | null
          category?: string | null
          costs?: Json | null
          created_at?: string | null
          description?: string | null
          diet_types?: string[] | null
          diet_types_ar?: Json | null
          id?: string
          ingredients?: Json | null
          ingredients_ar?: Json | null
          inventory?: Json | null
          labels?: Json | null
          may_contain_allergens?: string[] | null
          metadata?: Json | null
          name?: string
          name_ar?: string | null
          nutrition?: Json | null
          owner_email?: string | null
          preparation_time_minutes?: number | null
          serving?: Json | null
          status?: string | null
          steps?: Json | null
          sub_category?: string | null
          translations_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schema_fields: {
        Row: {
          constraints: Json | null
          created_at: string
          description: string | null
          display_in_summary: boolean | null
          extraction_instructions: string | null
          id: string
          is_transformation: boolean | null
          name: string
          parent_id: string | null
          position: number | null
          required: boolean | null
          schema_id: string
          transformation_config: Json | null
          transformation_source: string | null
          transformation_source_column_id: string | null
          transformation_type: string | null
          type: string
          updated_at: string
        }
        Insert: {
          constraints?: Json | null
          created_at?: string
          description?: string | null
          display_in_summary?: boolean | null
          extraction_instructions?: string | null
          id?: string
          is_transformation?: boolean | null
          name: string
          parent_id?: string | null
          position?: number | null
          required?: boolean | null
          schema_id: string
          transformation_config?: Json | null
          transformation_source?: string | null
          transformation_source_column_id?: string | null
          transformation_type?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          constraints?: Json | null
          created_at?: string
          description?: string | null
          display_in_summary?: boolean | null
          extraction_instructions?: string | null
          id?: string
          is_transformation?: boolean | null
          name?: string
          parent_id?: string | null
          position?: number | null
          required?: boolean | null
          schema_id?: string
          transformation_config?: Json | null
          transformation_source?: string | null
          transformation_source_column_id?: string | null
          transformation_type?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schema_fields_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "schema_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schema_fields_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_templates: {
        Row: {
          agent_type: string
          allowed_domains: string[] | null
          allowed_emails: string[] | null
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          allowed_domains?: string[] | null
          allowed_emails?: string[] | null
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          allowed_domains?: string[] | null
          allowed_emails?: string[] | null
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schemas: {
        Row: {
          created_at: string
          fields: Json | null
          id: string
          name: string
          table_state: Json | null
          template_id: string | null
          updated_at: string
          user_id: string
          visual_groups: Json | null
        }
        Insert: {
          created_at?: string
          fields?: Json | null
          id?: string
          name: string
          table_state?: Json | null
          template_id?: string | null
          updated_at?: string
          user_id: string
          visual_groups?: Json | null
        }
        Update: {
          created_at?: string
          fields?: Json | null
          id?: string
          name?: string
          table_state?: Json | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
          visual_groups?: Json | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_tier: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier: string
          status: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tool_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_file_names: string[] | null
          input_file_urls: string[] | null
          input_metadata: Json | null
          output_data: Json | null
          output_fhir_bundle: Json | null
          output_file_urls: string[] | null
          processing_started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          tool: Database["public"]["Enums"]["tool_type"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_file_names?: string[] | null
          input_file_urls?: string[] | null
          input_metadata?: Json | null
          output_data?: Json | null
          output_fhir_bundle?: Json | null
          output_file_urls?: string[] | null
          processing_started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tool: Database["public"]["Enums"]["tool_type"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_file_names?: string[] | null
          input_file_urls?: string[] | null
          input_metadata?: Json | null
          output_data?: Json | null
          output_fhir_bundle?: Json | null
          output_file_urls?: string[] | null
          processing_started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tool?: Database["public"]["Enums"]["tool_type"]
          user_id?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          event_name: string
          external_id: string
          id: string
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          properties: Json
          timestamp: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          external_id: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          properties?: Json
          timestamp?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          external_id?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          properties?: Json
          timestamp?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          features: Json | null
          monthly_extractions: number
          overage_allowed: boolean
          overage_price_per_unit: number | null
          plan_tier: string
        }
        Insert: {
          features?: Json | null
          monthly_extractions: number
          overage_allowed: boolean
          overage_price_per_unit?: number | null
          plan_tier: string
        }
        Update: {
          features?: Json | null
          monthly_extractions?: number
          overage_allowed?: boolean
          overage_price_per_unit?: number | null
          plan_tier?: string
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          created_at: string | null
          extraction_job_id: string | null
          id: string
          period_end: string
          period_start: string
          quantity: number
          subscription_id: string | null
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          extraction_job_id?: string | null
          id?: string
          period_end: string
          period_start: string
          quantity?: number
          subscription_id?: string | null
          usage_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          extraction_job_id?: string | null
          id?: string
          period_end?: string
          period_start?: string
          quantity?: number
          subscription_id?: string | null
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_extraction_job_id_fkey"
            columns: ["extraction_job_id"]
            isOneToOne: false
            referencedRelation: "extraction_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      usda_ingredients: {
        Row: {
          created_at: string | null
          data_type: string
          description: string
          fdc_id: number
          food_category: string | null
          id: string
          nutrients: Json | null
          publication_date: string | null
          scientific_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_type: string
          description: string
          fdc_id: number
          food_category?: string | null
          id?: string
          nutrients?: Json | null
          publication_date?: string | null
          scientific_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_type?: string
          description?: string
          fdc_id?: number
          food_category?: string | null
          id?: string
          nutrients?: Json | null
          publication_date?: string | null
          scientific_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          cancellation_reason: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          metadata: Json
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          metadata?: Json
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      visual_groups: {
        Row: {
          created_at: string
          field_ids: string[]
          id: string
          name: string
          schema_id: string
        }
        Insert: {
          created_at?: string
          field_ids?: string[]
          id?: string
          name: string
          schema_id: string
        }
        Update: {
          created_at?: string
          field_ids?: string[]
          id?: string
          name?: string
          schema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_groups_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_preferences: {
        Row: {
          created_at: string | null
          extraction_method: string | null
          last_opened_schema: string | null
          last_route: string | null
          open_tabs: Json | null
          sort: string | null
          updated_at: string | null
          user_id: string
          view_mode: string | null
        }
        Insert: {
          created_at?: string | null
          extraction_method?: string | null
          last_opened_schema?: string | null
          last_route?: string | null
          open_tabs?: Json | null
          sort?: string | null
          updated_at?: string | null
          user_id: string
          view_mode?: string | null
        }
        Update: {
          created_at?: string | null
          extraction_method?: string | null
          last_opened_schema?: string | null
          last_route?: string | null
          open_tabs?: Json | null
          sort?: string | null
          updated_at?: string | null
          user_id?: string
          view_mode?: string | null
        }
        Relationships: []
      }
      user_attribution: {
        Row: {
          id: string
          user_id: string
          gclid: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          landing_page: string | null
          captured_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gclid?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          landing_page?: string | null
          captured_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gclid?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          landing_page?: string | null
          captured_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_idempotency_key?: string
          p_reference_id?: string
          p_reference_type?: string
          p_type?: string
          p_user_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          reference_id: string | null
          reference_type: string | null
          type: string
          usage_details: Json | null
          user_id: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "credit_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_job_credits: {
        Args: { advanced_fields: number; simple_fields: number }
        Returns: number
      }
      deduct_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_idempotency_key?: string
          p_reference_id?: string
          p_reference_type?: string
          p_type?: string
          p_usage_details?: Json
          p_user_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          reference_id: string | null
          reference_type: string | null
          type: string
          usage_details: Json | null
          user_id: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "credit_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_billing_setting: { Args: { setting_key: string }; Returns: Json }
      get_embedding_stats: {
        Args: { p_schema_id: string; p_user_id: string }
        Returns: {
          avg_chunks_per_job: number
          newest_embedding: string
          oldest_embedding: string
          total_embeddings: number
          total_jobs: number
        }[]
      }
      get_food_groups: {
        Args: never
        Returns: {
          count: number
          food_group: string
        }[]
      }
      get_source_stats: {
        Args: never
        Returns: {
          count: number
          source_db: string
          source_version: string
        }[]
      }
      get_user_email: { Args: { user_uuid: string }; Returns: string }
      get_user_email_domain: { Args: never; Returns: string }
      get_user_jobs_with_payment: {
        Args: { p_user_id: string }
        Returns: {
          completed_at: string
          created_at: string
          input_file_names: string[]
          is_paid: boolean
          job_id: string
          status: string
          tool: string
        }[]
      }
      has_recipe_builder_access: { Args: never; Returns: boolean }
      is_recipe_builder_admin: { Args: never; Returns: boolean }
      provision_free_user: { Args: { p_user_id: string }; Returns: undefined }
      reset_subscription_period: {
        Args: {
          p_credits: number
          p_period_end: string
          p_period_start: string
          p_reference_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      search_extraction_jobs: {
        Args: {
          p_agent_type?: string
          p_date_end?: string
          p_date_start?: string
          p_limit?: number
          p_query_embedding: string
          p_schema_id: string
          p_similarity_threshold?: number
          p_user_id: string
        }
        Returns: {
          chunk_id: string
          content_preview: string
          job_id: string
          metadata: Json
          similarity_score: number
        }[]
      }
      search_foundation_foods: {
        Args: {
          food_group_filter?: string[]
          halal_only?: boolean
          result_limit?: number
          result_offset?: number
          search_query: string
          source_filter?: string[]
        }
        Returns: {
          added_sugars_g: number
          calcium_mg: number
          carbohydrate_g: number
          cholesterol_mg: number
          common_allergens: string[]
          description_ar: string
          description_en: string
          dietary_fiber_g: number
          energy_kcal: number
          food_group: string
          halal_status: string
          id: string
          iron_mg: number
          magnesium_mg: number
          potassium_mg: number
          protein_g: number
          rank: number
          saturated_fat_g: number
          sodium_mg: number
          source_db: string
          source_id: string
          total_fat_g: number
          total_sugars_g: number
          trans_fat_g: number
          vitamin_a_mcg_rae: number
          vitamin_c_mg: number
          vitamin_d_mcg: number
          zinc_mg: number
        }[]
      }
      secure_deduct_credits: {
        Args: {
          p_amount: number
          p_description: string
          p_idempotency_key: string
          p_reference_id: string
          p_reference_type: string
          p_usage_details?: Json
          p_user_id: string
        }
        Returns: {
          error_message: string
          is_overage: boolean
          new_balance: number
          success: boolean
          transaction_id: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      use_guest_credits: {
        Args: { p_amount: number; p_session_token: string }
        Returns: {
          error: string
          remaining: number
          success: boolean
        }[]
      }
      validate_credit_deduction: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          current_balance: number
          error_message: string
          has_overage_permission: boolean
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      job_status: "pending" | "processing" | "completed" | "error"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      tool_type:
        | "pil_spc_generation"
        | "pil_spc_translation"
        | "gap_analysis"
        | "epil_conversion"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      job_status: ["pending", "processing", "completed", "error"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      tool_type: [
        "pil_spc_generation",
        "pil_spc_translation",
        "gap_analysis",
        "epil_conversion",
      ],
    },
  },
} as const
