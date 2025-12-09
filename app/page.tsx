'use client'

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

import * as React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { HomeView } from '@/components/views/HomeView'
import { AgentHubView } from '@/components/views/AgentHubView'
import { KnowledgeView } from '@/components/views/KnowledgeView'
import { CopilotView } from '@/components/copilot/CopilotView'
import { LabelMakerPage } from '@/components/views/LabelMakerPage'
import { WorkspaceProvider } from '@/components/workspace/WorkspaceStoreProvider'

export default function Home() {
  const [activeView, setActiveView] = React.useState("home")

  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar onNavigate={setActiveView} activeView={activeView} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-background">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />

            </div>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden bg-muted/10 min-w-0">
            {activeView === "home" && <HomeView />}
            {activeView === "agent-hub" && <AgentHubView />}
            {activeView === "knowledge" && <KnowledgeView />}
            {activeView === "copilot" && <CopilotView />}
            {activeView === "label-maker" && <LabelMakerPage />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  )
}
