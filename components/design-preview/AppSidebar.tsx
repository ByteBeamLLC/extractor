'use client'

import * as React from 'react'
import {
    LayoutDashboard,
    FileText,
    Bot,
    Store,
    Library,
} from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar'

interface AppSidebarProps {
    onNavigate: (view: string) => void
    activeView: string
}

export function AppSidebar({ onNavigate, activeView }: AppSidebarProps) {
    const navItems = [
        {
            title: 'Dashboard',
            icon: LayoutDashboard,
            value: 'dashboard',
        },
        {
            title: 'Agent Hub',
            icon: Store,
            value: 'agent-hub',
        },
        {
            title: 'Knowledge Hubs',
            icon: Library,
            value: 'knowledge-hub',
        },
    ]

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <span className="text-sm font-bold">EP</span>
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold">Extractor</span>
                        <span className="text-xs text-muted-foreground">Platform</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.value}>
                                    <SidebarMenuButton
                                        onClick={() => onNavigate(item.value)}
                                        isActive={activeView === item.value}
                                        tooltip={item.title}
                                    >
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                    Design Preview v1.0
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
