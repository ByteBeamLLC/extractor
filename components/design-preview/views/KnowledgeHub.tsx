'use client'

import * as React from 'react'
import {
    Folder,
    FolderOpen,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KnowledgeHubTable, KnowledgeItem } from './knowledge/KnowledgeHubTable'
import { KnowledgeDetailsPanel } from './knowledge/KnowledgeDetailsPanel'

// Mock Data for Tree
interface TreeItem {
    id: string
    name: string
    children?: TreeItem[]
}

const folderTree: TreeItem[] = [
    {
        id: 'root',
        name: 'Knowledge Base',
        children: [
            {
                id: 'prod-docs',
                name: 'Product Documentation',
                children: [
                    { id: 'api-docs', name: 'API References' },
                    { id: 'guides', name: 'User Guides' },
                ]
            },
            {
                id: 'legal',
                name: 'Legal & Compliance',
                children: [
                    { id: 'contracts', name: 'Contracts' },
                    { id: 'policies', name: 'Internal Policies' },
                ]
            },
            { id: 'marketing', name: 'Marketing Assets' },
            { id: 'finance', name: 'Financial Reports' },
        ]
    }
]

// Mock Data for Table
const mockItems: KnowledgeItem[] = [
    { id: '1', name: 'Q4_Financial_Report.pdf', type: 'file', status: 'indexed', aiStatus: 'grounded', size: '2.4 MB', updated: '2 hours ago' },
    { id: '2', name: 'Employee_Handbook_2024.docx', type: 'file', status: 'indexed', aiStatus: 'grounded', size: '4.1 MB', updated: '1 day ago' },
    { id: '3', name: 'API_Documentation_Link', type: 'link', status: 'processing', aiStatus: 'analyzing', size: '-', updated: '5 mins ago' },
    { id: '4', name: 'Invoice_Template_v2.xlsx', type: 'file', status: 'error', aiStatus: 'ready', size: '1.2 MB', updated: '3 days ago' },
    { id: '5', name: 'Competitor_Analysis.pdf', type: 'file', status: 'indexed', aiStatus: 'grounded', size: '8.5 MB', updated: '1 week ago' },
    { id: '6', name: 'Meeting_Notes_Nov.txt', type: 'file', status: 'indexed', aiStatus: 'ready', size: '12 KB', updated: '2 weeks ago' },
]

export function KnowledgeHub() {
    const [selectedFolderId, setSelectedFolderId] = React.useState<string>('root')
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['root', 'prod-docs']))
    const [selectedItems, setSelectedItems] = React.useState<string[]>([])
    const [activeItem, setActiveItem] = React.useState<KnowledgeItem | null>(null)

    const toggleFolder = (id: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedFolders(newExpanded)
    }

    const handleSelect = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedItems([...selectedItems, id])
        } else {
            setSelectedItems(selectedItems.filter(item => item !== id))
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(mockItems.map(item => item.id))
        } else {
            setSelectedItems([])
        }
    }

    // Recursive Tree Renderer
    const renderTree = (items: TreeItem[], depth = 0) => {
        return items.map(item => {
            const isExpanded = expandedFolders.has(item.id)
            const isSelected = selectedFolderId === item.id
            const hasChildren = item.children && item.children.length > 0

            return (
                <div key={item.id}>
                    <div
                        className={`
              flex items-center py-1.5 px-2 cursor-pointer text-sm rounded-md transition-colors
              ${isSelected ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted/50 text-muted-foreground'}
            `}
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        onClick={() => {
                            setSelectedFolderId(item.id)
                            if (hasChildren) toggleFolder(item.id)
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleFolder(item.id)
                            }}
                            className={`mr-1 p-0.5 rounded-sm hover:bg-muted ${!hasChildren ? 'invisible' : ''}`}
                        >
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                        {isExpanded ? <FolderOpen className="h-4 w-4 mr-2 text-blue-500" /> : <Folder className="h-4 w-4 mr-2 text-blue-500" />}
                        <span className="truncate">{item.name}</span>
                    </div>
                    {hasChildren && isExpanded && renderTree(item.children!, depth + 1)}
                </div>
            )
        })
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg">Knowledge Hub</h2>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="h-8">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add Content
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                            <Filter className="h-3.5 w-3.5 mr-1.5" />
                            Filter
                        </Button>
                    </div>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search knowledge..." className="pl-8 h-9" />
                </div>
            </div>

            {/* Main Content - Three Pane Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Tree View */}
                <div className="w-64 border-r flex flex-col bg-muted/5">
                    <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Folders
                    </div>
                    <ScrollArea className="flex-1 px-2">
                        {renderTree(folderTree)}
                    </ScrollArea>
                    <div className="p-3 border-t">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            New Folder
                        </Button>
                    </div>
                </div>

                {/* Center Pane: Data Grid */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    <div className="p-4 flex-1 overflow-auto">
                        <KnowledgeHubTable
                            items={mockItems}
                            selectedItems={selectedItems}
                            onSelect={handleSelect}
                            onSelectAll={handleSelectAll}
                            onItemClick={setActiveItem}
                        />
                    </div>
                    <div className="h-9 border-t flex items-center justify-between px-4 text-xs text-muted-foreground bg-muted/5">
                        <span>{mockItems.length} items</span>
                        <span>{selectedItems.length} selected</span>
                    </div>
                </div>

                {/* Right Pane: Inspector */}
                {activeItem && (
                    <KnowledgeDetailsPanel
                        item={activeItem}
                        onClose={() => setActiveItem(null)}
                    />
                )}
            </div>
        </div>
    )
}
