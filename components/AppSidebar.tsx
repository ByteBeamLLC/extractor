'use client'

import * as React from 'react'
import {
    LayoutDashboard,
    Store,
    Library,
    Sparkles,
    Tag,
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
            title: 'Home',
            icon: LayoutDashboard,
            value: 'home',
        },
        {
            title: 'Label Maker',
            icon: Tag,
            value: 'label-maker',
        },
        {
            title: 'Co-pilot',
            icon: Sparkles,
            value: 'copilot',
        },
        {
            title: 'Knowledge Hub',
            icon: Library,
            value: 'knowledge',
        },
    ]

    return (
        <Sidebar collapsible="icon" className="!top-14 !bottom-0 !h-[calc(100svh-3.5rem)]">
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
                    v1.0
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
