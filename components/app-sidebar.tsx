"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  ChevronsUpDown,
  LogOut,
  Loader2,
  LifeBuoy,
  ArrowLeft,
  ListChecks,
  FileText,
  Inbox,
  Share2,
  Code,
  Upload,
  UserPlus,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useActiveParser } from "@/components/extractor/parser-context"
import type { ExtractorSubscription } from "@/lib/extractor/types"
import { cn } from "@/lib/utils"

const mainNav = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { key: "docs", href: "https://parsli.co/docs", icon: BookOpen, label: "Documentation", external: true },
  { key: "help", href: "mailto:talal@bytebeam.co?subject=Parsli%20Support", icon: LifeBuoy, label: "Help & Support", external: true },
  { key: "settings", href: "/settings", icon: Settings, label: "Settings" },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()
  const { parser } = useActiveParser()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [subscription, setSubscription] = useState<ExtractorSubscription | null>(null)
  const [integrationCount, setIntegrationCount] = useState(0)
  const [apiKeyCount, setApiKeyCount] = useState(0)

  // Load subscription for usage display
  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from("extractor_subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSubscription(data)
      })
  }, [session?.user?.id, supabase])

  // Load integration and API key counts for parser nav badges
  useEffect(() => {
    if (!parser?.id || !session?.user?.id) {
      setIntegrationCount(0)
      setApiKeyCount(0)
      return
    }
    Promise.all([
      supabase
        .from("parser_integrations")
        .select("id", { count: "exact", head: true })
        .eq("parser_id", parser.id),
      supabase
        .from("parser_api_keys")
        .select("id", { count: "exact", head: true })
        .eq("parser_id", parser.id)
        .is("revoked_at", null),
    ]).then(([intRes, keyRes]) => {
      setIntegrationCount(intRes.count ?? 0)
      setApiKeyCount(keyRes.count ?? 0)
    })
  }, [parser?.id, session?.user?.id, supabase])

  // Determine if we're inside a parser route
  const isInsideParser = !!parser && pathname?.startsWith("/parsers/")

  const isMainNavActive = (item: typeof mainNav[number]) => {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard"
    }
    if ("external" in item && item.external) return false
    return pathname?.startsWith(item.href)
  }

  const parserNav = parser
    ? [
        { key: "overview", href: `/parsers/${parser.id}`, icon: FileText, label: "Overview", exact: true },
        { key: "schema", href: `/parsers/${parser.id}/schema`, icon: ListChecks, label: "Fields Schema", badge: parser.fields?.length || null },
        { key: "documents", href: `/parsers/${parser.id}/documents`, icon: Upload, label: "Documents", badge: parser.document_count || null },
        { key: "export", href: `/parsers/${parser.id}/export`, icon: Share2, label: "Integrations", badge: integrationCount || null },
        { key: "api", href: `/parsers/${parser.id}/api`, icon: Code, label: "API & Webhooks", badge: apiKeyCount || null },
        { key: "settings", href: `/parsers/${parser.id}/settings`, icon: Settings, label: "Settings" },
      ]
    : []

  const isParserNavActive = (item: typeof parserNav[number]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname?.startsWith(item.href)
  }

  // File upload handler for the persistent upload widget
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [sidebarUploadError, setSidebarUploadError] = useState<string | null>(null)

  const handleSidebarUpload = useCallback(
    async (file: File) => {
      if (!parser) return
      setSidebarUploadError(null)

      // Validate file before upload
      const { validateUploadFile } = await import("@/components/extractor/test/DocumentUploader")
      const validationError = validateUploadFile(file)
      if (validationError) {
        setSidebarUploadError(validationError)
        return
      }

      if (parser.fields.length === 0 && parser.extraction_type !== "full_content") {
        router.push(`/parsers/${parser.id}/documents`)
        return
      }

      setIsUploading(true)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const storagePath = `${session?.user?.id}/${parser.id}/pending/${crypto.randomUUID()}/${safeName}`
      try {
        // Upload file directly to Supabase Storage (bypasses Vercel body limit)
        const { error: storageError } = await supabase.storage
          .from("parser-documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          })
        if (storageError) throw new Error(`File upload failed: ${storageError.message}`)

        // Call extract API with storage path only — no file bytes in request body
        const res = await fetch(`/api/parsers/${parser.id}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: storagePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            source_type: "upload",
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const msg = body.error || "Upload failed"
          // Clean up orphaned storage file
          supabase.storage.from("parser-documents").remove([storagePath]).catch(() => {})
          if (res.status === 402 && session?.user?.is_anonymous) {
            openAuthDialog("sign-up")
            return
          }
          setSidebarUploadError(msg)
          return
        }
        // Navigate to documents page — Realtime subscription will show the processing doc
        router.push(`/parsers/${parser.id}/documents`)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        setSidebarUploadError(message)
        // Best-effort cleanup of orphaned storage file
        supabase.storage.from("parser-documents").remove([storagePath]).catch(() => {})
      } finally {
        setIsUploading(false)
      }
    },
    [parser, router, session?.user?.id, session?.user?.is_anonymous, supabase, openAuthDialog]
  )

  const displayName =
    (session?.user?.user_metadata?.full_name as string) ||
    session?.user?.email ||
    ""

  const initials = (() => {
    if (!displayName) return "U"
    if (displayName.includes("@")) return displayName.charAt(0).toUpperCase()
    const parts = displayName.split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
  })()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Image
                  src="/parsli-icon.png"
                  alt="Parsli"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-bold text-sm tracking-tight">
                    Parsli
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground/60">
                    Document Extraction
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        {isInsideParser ? (
          <>
            {/* Back to parsers */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Back to Parsers" data-arlo-id="back-to-parsers">
                      <Link href="/dashboard">
                        <ArrowLeft />
                        <span>Back to Parsers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Parser info */}
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-semibold truncate">{parser.name}</p>
                  {parser.description && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {parser.description}
                    </p>
                  )}
                  <Badge
                    variant={parser.status === "active" ? "default" : "secondary"}
                    className="text-[10px] mt-1.5"
                  >
                    {parser.status}
                  </Badge>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Parser navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Parser</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {parserNav.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        isActive={isParserNavActive(item)}
                        tooltip={item.label}
                        data-arlo-id={`nav-${item.key}`}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="flex-1" />

            {/* Persistent upload widget */}
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupContent>
                <div
                  data-arlo-id="sidebar-upload-zone"
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleSidebarUpload(file)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "mx-2 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-accent/30",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.docx,.doc,.xlsx,.xls,.txt,.csv,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleSidebarUpload(file)
                    }}
                    className="hidden"
                  />
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-muted-foreground" />
                  ) : (
                    <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  )}
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isUploading ? "Uploading..." : "Drop files here\nto extract data"}
                  </p>
                  {sidebarUploadError && (
                    <p className="text-[10px] text-destructive leading-tight mt-1 break-words">
                      {sidebarUploadError}
                    </p>
                  )}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          /* Default navigation */
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isMainNavActive(item)}
                      tooltip={item.label}
                      data-arlo-id={`nav-${item.key}`}
                    >
                      {"external" in item && item.external ? (
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </a>
                      ) : (
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {/* Pages Used */}
        {subscription && (
          <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Pages Used</span>
              <span className="text-xs font-semibold">
                {subscription.credits_used} / {subscription.credits_free}
              </span>
            </div>
            <Progress
              value={subscription.credits_free > 0 ? Math.min((subscription.credits_used / subscription.credits_free) * 100, 100) : 0}
              className="h-1.5"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {Math.max(subscription.credits_free - subscription.credits_used, 0)} page{Math.max(subscription.credits_free - subscription.credits_used, 0) !== 1 ? "s" : ""} remaining {subscription.tier === "anonymous" ? "today" : "this month"}
            </p>
          </div>
        )}

        <SidebarSeparator />

        {/* User account */}
        <SidebarMenu>
          <SidebarMenuItem>
            {session && !session.user.is_anonymous ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-xs">
                        {session.user.user_metadata?.full_name || "User"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings">
                      <Settings className="mr-2 size-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    {isSigningOut ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 size-4" />
                    )}
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size="lg"
                onClick={() => openAuthDialog("sign-up")}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <UserPlus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-xs">Guest</span>
                  <span className="truncate text-xs text-primary">Sign up free</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
