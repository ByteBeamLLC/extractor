import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { STATIC_SCHEMA_TEMPLATES } from "@/lib/schema-templates";
import type { Database } from "@/lib/supabase/types";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "dev-admin-key-change-in-production";
const ALLOWED_DOMAINS = ["bytebeam.co", "mhaddad.com.jo"];

export async function POST(request: NextRequest) {
  try {
    // Verify admin access via API key
    const apiKey = request.headers.get("x-admin-api-key");
    if (apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, userId, allowedDomains, allowedEmails } = body;

    if (!templateId || !userId) {
      return NextResponse.json(
        { error: "templateId and userId are required" },
        { status: 400 }
      );
    }

    // Find the template in static templates
    const template = STATIC_SCHEMA_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user exists
    const { data: user, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate domains and emails if provided
    const domains = allowedDomains || ALLOWED_DOMAINS;
    const emails = allowedEmails || null;

    // At least one restriction method should be provided
    if ((!Array.isArray(domains) || domains.length === 0) && (!Array.isArray(emails) || emails.length === 0)) {
      return NextResponse.json(
        { error: "Either allowedDomains or allowedEmails must be a non-empty array" },
        { status: 400 }
      );
    }

    // Check if template already exists
    const { data: existingTemplates } = await supabaseAdmin
      .from("schema_templates")
      .select("id, name")
      .eq("user_id", userId)
      .eq("name", template.name);

    if (existingTemplates && existingTemplates.length > 0) {
      return NextResponse.json(
        {
          error: "Template with this name already exists for this user",
          existing: existingTemplates[0],
        },
        { status: 409 }
      );
    }

    // Create the shared template
    const now = new Date().toISOString();
    const payload: Database["public"]["Tables"]["schema_templates"]["Insert"] =
    {
      id: `shared-${templateId}-${Date.now()}`,
      user_id: userId,
      name: template.name,
      description: template.description,
      agent_type: template.agentType,
      fields: template.fields as any,
      allowed_domains: domains,
      allowed_emails: emails,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from("schema_templates")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Template creation error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create shared template" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shared template created successfully",
      data: {
        id: data.id,
        name: data.name,
        allowed_domains: data.allowed_domains,
        allowed_emails: data.allowed_emails,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("Create shared template error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

