"use client"

import { useCallback, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  BookOpen,
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
import { useAuthDialog } from "@/components/auth/AuthDialogContext"
import { useSession, useSupabaseClient } from "@/lib/supabase/hooks"
import { useActiveParser } from "@/components/extractor/parser-context"
import { cn } from "@/lib/utils"

const mainNav = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { key: "docs", href: "/docs", icon: BookOpen, label: "Documentation" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const { openAuthDialog } = useAuthDialog()
  const { parser } = useActiveParser()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Determine if we're inside a parser route
  const isInsideParser = !!parser && pathname?.startsWith("/parsers/")

  const isMainNavActive = (item: typeof mainNav[number]) => {
    if (item.href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(item.href)
  }

  const parserNav = parser
    ? [
        { key: "overview", href: `/parsers/${parser.id}`, icon: LayoutDashboard, label: "Overview", exact: true },
        { key: "schema", href: `/parsers/${parser.id}/schema`, icon: ListChecks, label: "Fields", badge: parser.fields?.length || null },
        { key: "documents", href: `/parsers/${parser.id}/documents`, icon: FileText, label: "Documents", badge: parser.document_count || null },
        { key: "import", href: `/parsers/${parser.id}/import`, icon: Inbox, label: "Import" },
        { key: "export", href: `/parsers/${parser.id}/export`, icon: Share2, label: "Export" },
        { key: "api", href: `/parsers/${parser.id}/api`, icon: Code, label: "API" },
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

  const handleSidebarUpload = useCallback(
    async (file: File) => {
      if (!parser || parser.fields.length === 0) {
        router.push(`/parsers/${parser?.id}/documents`)
        return
      }
      setIsUploading(true)
      try {
        const buffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        )
        await fetch(`/api/parsers/${parser.id}/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: { name: file.name, type: file.type, data: base64, size: file.size },
            source_type: "upload",
          }),
        })
        router.push(`/parsers/${parser.id}/documents`)
      } catch {
        // Navigate to documents page even on error
        router.push(`/parsers/${parser.id}/documents`)
      } finally {
        setIsUploading(false)
      }
    },
    [parser, router]
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
                    <SidebarMenuButton asChild tooltip="Back to Parsers">
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
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
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
        {/* Help & Support */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help & Support">
              <a href="mailto:talal@bytebeam.co?subject=Parsli%20Support">
                <LifeBuoy />
                <span>Help & Support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        {/* User account */}
        <SidebarMenu>
          <SidebarMenuItem>
            {session ? (
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
                onClick={() => openAuthDialog("sign-in")}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LogOut className="size-4" />
                </div>
                <span className="font-medium">Sign in</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
