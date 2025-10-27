export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      schemas: {
        Row: {
          id: string
          user_id: string
          name: string
          fields: Json
          template_id: string | null
          visual_groups: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          fields?: Json
          template_id?: string | null
          visual_groups?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          fields?: Json
          template_id?: string | null
          visual_groups?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      schema_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          agent_type: "standard" | "pharma"
          fields: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          agent_type: "standard" | "pharma"
          fields?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          agent_type?: "standard" | "pharma"
          fields?: Json
          created_at?: string | null
          updated_at?: string | null
        }
      }
      extraction_jobs: {
        Row: {
          id: string
          schema_id: string
          user_id: string
          file_name: string
          status: "pending" | "processing" | "completed" | "error"
          results: Json | null
          ocr_markdown: string | null
          ocr_annotated_image_url: string | null
          original_file_url: string | null
          agent_type: "standard" | "pharma" | null
          created_at: string | null
          completed_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          schema_id: string
          user_id: string
          file_name: string
          status?: "pending" | "processing" | "completed" | "error"
          results?: Json | null
          ocr_markdown?: string | null
          ocr_annotated_image_url?: string | null
          original_file_url?: string | null
          agent_type?: "standard" | "pharma" | null
          created_at?: string | null
          completed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          status?: "pending" | "processing" | "completed" | "error"
          results?: Json | null
          ocr_markdown?: string | null
          ocr_annotated_image_url?: string | null
          original_file_url?: string | null
          agent_type?: "standard" | "pharma" | null
          created_at?: string | null
          completed_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
