'use client'

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
import { AppSidebar } from '@/components/design-preview/AppSidebar'
import { DashboardView } from '@/components/design-preview/views/DashboardView'
import { AgentMarketplace } from '@/components/design-preview/views/AgentMarketplace'
import { KnowledgeHub } from '@/components/design-preview/views/KnowledgeHub'
import { WorkspaceProvider } from '@/components/workspace/WorkspaceStoreProvider'

export default function DesignPreviewPage() {
    const [activeView, setActiveView] = React.useState("dashboard")

    return (
        <WorkspaceProvider>
            <SidebarProvider>
                <AppSidebar onNavigate={setActiveView} activeView={activeView} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-background">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#">Platform</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>
                                            {activeView === 'dashboard' && 'Dashboard'}
                                            {activeView === 'agent-hub' && 'Agent Hub'}
                                            {activeView === 'knowledge-hub' && 'Knowledge Hubs'}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>

                    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10 min-w-0">
                        {activeView === "dashboard" && <DashboardView />}
                        {activeView === "agent-hub" && <AgentMarketplace />}
                        {activeView === "knowledge-hub" && <KnowledgeHub />}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </WorkspaceProvider>
    )
}
