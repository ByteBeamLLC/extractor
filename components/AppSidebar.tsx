'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
    LayoutDashboard,
    Library,
    Sparkles,
    Tag,
    ChefHat,
    ChevronRight,
    ClipboardList,
    Package,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from '@/components/ui/sidebar'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

// Types for navigation items
interface NavItem {
    title: string
    icon: React.ComponentType<{ className?: string }>
    value: string
    hidden?: boolean
    requiresAccess?: 'recipe-builder' // Add more access types as needed
}

interface NavItemWithChildren {
    title: string
    icon: React.ComponentType<{ className?: string }>
    value: string
    children: NavSubItem[]
    requiresAccess?: 'recipe-builder'
}

interface NavSubItem {
    title: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
    children?: { title: string; value: string }[]
}

type NavigationItem = NavItem | NavItemWithChildren

function hasChildren(item: NavigationItem): item is NavItemWithChildren {
    return 'children' in item && Array.isArray(item.children)
}

interface AppSidebarProps {
    onNavigate: (view: string) => void
    activeView: string
}

export function AppSidebar({ onNavigate, activeView }: AppSidebarProps) {
    const [openMenus, setOpenMenus] = useState<string[]>(['recipe-builder'])
    const [hasRecipeBuilderAccess, setHasRecipeBuilderAccess] = useState(false)
    const [accessLoading, setAccessLoading] = useState(true)

    // Function to check recipe builder access
    const checkAccess = useCallback(async () => {
        try {
            setAccessLoading(true)
            const response = await fetch('/api/recipe-builder/access')
            const data = await response.json()
            setHasRecipeBuilderAccess(data.hasAccess === true)
        } catch (error) {
            console.error('Failed to check recipe builder access:', error)
            setHasRecipeBuilderAccess(false)
        } finally {
            setAccessLoading(false)
        }
    }, [])

    // Check access on mount and when auth state changes
    useEffect(() => {
        checkAccess()

        // Listen for auth state changes
        const supabase = createSupabaseBrowserClient()
        if (!supabase) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                    checkAccess()
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [checkAccess])

    // Navigation items configuration
    const navItems: NavigationItem[] = [
        {
            title: 'Home',
            icon: LayoutDashboard,
            value: 'home',
        },
        {
            title: 'Recipe Builder',
            icon: ChefHat,
            value: 'recipe-builder',
            requiresAccess: 'recipe-builder',
            children: [
                {
                    title: 'Dashboard',
                    value: 'recipe-builder-dashboard',
                    icon: LayoutDashboard,
                },
                {
                    title: 'Recipes',
                    value: 'recipe-builder-recipes',
                    icon: ClipboardList,
                },
                {
                    title: 'Ingredients',
                    value: 'recipe-builder-ingredients',
                    icon: Package,
                    children: [
                        { title: 'USDA Ingredients', value: 'recipe-builder-ingredients-usda' },
                        { title: 'Manage Ingredients', value: 'recipe-builder-ingredients-manage' },
                        { title: 'Custom Ingredients', value: 'recipe-builder-ingredients-custom' },
                    ],
                },
            ],
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
        // Label Maker - hidden but kept for future use
        {
            title: 'Label Maker',
            icon: Tag,
            value: 'label-maker',
            hidden: true,
        },
    ]

    const toggleMenu = (menuValue: string) => {
        setOpenMenus((prev) =>
            prev.includes(menuValue)
                ? prev.filter((v) => v !== menuValue)
                : [...prev, menuValue]
        )
    }

    const isActiveInGroup = (item: NavItemWithChildren): boolean => {
        return item.children.some((child) => {
            if (activeView === child.value) return true
            if (child.children) {
                return child.children.some((subChild) => activeView === subChild.value)
            }
            return false
        })
    }

    const renderNavItem = (item: NavigationItem) => {
        // Skip hidden items
        if ('hidden' in item && item.hidden) {
            return null
        }

        // Check access requirements
        if (item.requiresAccess === 'recipe-builder' && !hasRecipeBuilderAccess) {
            return null
        }

        if (hasChildren(item)) {
            const isOpen = openMenus.includes(item.value)
            const isActive = isActiveInGroup(item)

            return (
                <Collapsible
                    key={item.value}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(item.value)}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip={item.title}
                                isActive={isActive}
                            >
                                <item.icon className="size-4" />
                                <span>{item.title}</span>
                                <ChevronRight
                                    className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {item.children.map((child) => (
                                    <React.Fragment key={child.value}>
                                        {child.children ? (
                                            // Nested sub-items (e.g., Ingredients > Manage/Custom)
                                            <>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        onClick={() => onNavigate(child.value)}
                                                        isActive={activeView === child.value}
                                                        className="font-medium"
                                                    >
                                                        {child.icon && <child.icon className="size-4" />}
                                                        <span>{child.title}</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                {child.children.map((subChild) => (
                                                    <SidebarMenuSubItem key={subChild.value}>
                                                        <SidebarMenuSubButton
                                                            onClick={() => onNavigate(subChild.value)}
                                                            isActive={activeView === subChild.value}
                                                            className="pl-6"
                                                        >
                                                            <span>{subChild.title}</span>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </>
                                        ) : (
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    onClick={() => onNavigate(child.value)}
                                                    isActive={activeView === child.value}
                                                >
                                                    {child.icon && <child.icon className="size-4" />}
                                                    <span>{child.title}</span>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        )}
                                    </React.Fragment>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            )
        }

        return (
            <SidebarMenuItem key={item.value}>
                <SidebarMenuButton
                    onClick={() => onNavigate(item.value)}
                    isActive={activeView === item.value}
                    tooltip={item.title}
                >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    return (
        <Sidebar collapsible="icon" className="!top-14 !bottom-0 !h-[calc(100svh-3.5rem)]">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(renderNavItem)}
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
