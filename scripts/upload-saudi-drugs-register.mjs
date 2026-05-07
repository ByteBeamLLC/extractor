#!/usr/bin/env node
/**
 * Uploads data/saudi-drugs-register.md as a Knowledge Hub document for a
 * specific user. The schema "Drug Trade Name Proposer (SFDA)" resolves
 * `{kb:Saudi Drug Register}` against the document this script writes.
 *
 * Usage:
 *   node scripts/upload-saudi-drugs-register.mjs bazerbachi.8@gmail.com
 *
 * Env required (in .env at repo root):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, join, resolve } from "node:path"
import { readFileSync, statSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, "..")

// In a worktree the canonical .env lives at the main repo root, not the worktree root.
config({ path: join(REPO_ROOT, ".env") })
config({ path: join(REPO_ROOT, "..", "..", "..", ".env") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DOCUMENT_NAME = "Saudi Drug Register"
const SOURCE_PATH = join(REPO_ROOT, "data", "saudi-drugs-register.md")

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  )
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/upload-saudi-drugs-register.mjs <email>")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserIdByEmail(targetEmail) {
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`auth.admin.listUsers failed: ${error.message}`)
    const match = data?.users?.find(
      (u) => (u.email || "").toLowerCase() === targetEmail.toLowerCase()
    )
    if (match) return match.id
    if (!data?.users || data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  const stat = statSync(SOURCE_PATH)
  const content = readFileSync(SOURCE_PATH, "utf8")
  const sizeKb = `${(stat.size / 1024).toFixed(0)} KB`
  console.log(
    `Source: ${SOURCE_PATH}\nBytes: ${stat.size} (${sizeKb})\nApprox tokens: ${Math.round(content.length / 4).toLocaleString()}`
  )

  console.log(`Looking up user by email: ${email}`)
  const userId = await findUserIdByEmail(email)
  if (!userId) {
    console.error(`No auth user found for email ${email}`)
    process.exit(1)
  }
  console.log(`Resolved user_id: ${userId}`)

  // Check for an existing document with this exact name for this user.
  const { data: existing, error: selectError } = await supabase
    .from("knowledge_documents")
    .select("id, name, user_id, knowledge_base_id")
    .eq("user_id", userId)
    .eq("name", DOCUMENT_NAME)
    .limit(1)

  if (selectError) {
    console.error(`Select failed: ${selectError.message}`)
    process.exit(1)
  }

  const payload = {
    name: DOCUMENT_NAME,
    type: "file",
    status: "indexed",
    ai_status: "ready",
    size: sizeKb,
    url: null,
    knowledge_base_id: null,
    user_id: userId,
    content,
    mime_type: "text/markdown",
    storage_path: null,
    updated_at: new Date().toISOString(),
  }

  if (existing && existing.length > 0) {
    const id = existing[0].id
    console.log(`Existing document found (id=${id}). Updating in place.`)
    const { error: updateError } = await supabase
      .from("knowledge_documents")
      .update(payload)
      .eq("id", id)
    if (updateError) {
      console.error(`Update failed: ${updateError.message}`)
      process.exit(1)
    }
    console.log("Updated.")
  } else {
    console.log("No existing document. Inserting new row.")
    const { data: inserted, error: insertError } = await supabase
      .from("knowledge_documents")
      .insert(payload)
      .select("id")
      .single()
    if (insertError) {
      console.error(`Insert failed: ${insertError.message}`)
      process.exit(1)
    }
    console.log(`Inserted (id=${inserted.id}).`)
  }

  console.log(
    `\nReady. The schema 'Drug Trade Name Proposer (SFDA)' will resolve {kb:${DOCUMENT_NAME}} for ${email}.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
