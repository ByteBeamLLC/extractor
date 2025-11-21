'use client'

import * as React from 'react'
import {
    Folder,
    FolderOpen,
    Plus,
    Search,
    ChevronRight,
    ChevronDown,
    Filter,
    Upload,
    FileText,
    Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KnowledgeHubTable } from './KnowledgeHubTable'
import { KnowledgeDocumentViewer } from './KnowledgeDocumentViewer'
import {
    KnowledgeBase,
    KnowledgeDocument,
    getKnowledgeBases,
    getKnowledgeDocuments,
    createKnowledgeBase,
    createKnowledgeDocument,
    deleteKnowledgeItem
} from '@/lib/knowledge-actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function KnowledgeHub() {
    const [folders, setFolders] = React.useState<KnowledgeBase[]>([])
    const [documents, setDocuments] = React.useState<KnowledgeDocument[]>([])
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set())
    const [selectedItems, setSelectedItems] = React.useState<string[]>([])
    const [activeItem, setActiveItem] = React.useState<KnowledgeDocument | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    // Dialog States
    const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false)
    const [newFolderName, setNewFolderName] = React.useState('')
    const [isAddContentOpen, setIsAddContentOpen] = React.useState(false)

    // Add Content Form States
    const [contentType, setContentType] = React.useState<'link' | 'file'>('link')
    const [urlName, setUrlName] = React.useState('')
    const [urlLink, setUrlLink] = React.useState('')
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const [fetchedFolders, fetchedDocs] = await Promise.all([
                getKnowledgeBases(),
                getKnowledgeDocuments(selectedFolderId)
            ])
            setFolders(fetchedFolders)
            setDocuments(fetchedDocs)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [selectedFolderId])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

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
            setSelectedItems(documents.map(item => item.id))
        } else {
            setSelectedItems([])
        }
    }

    const handleCreateFolder = async () => {
        try {
            await createKnowledgeBase(newFolderName, selectedFolderId)
            setNewFolderName('')
            setIsCreateFolderOpen(false)
            fetchData()
        } catch (error) {
            console.error('Error creating folder:', error)
        }
    }

    const handleAddContent = async () => {
        setIsSubmitting(true)
        try {
            if (contentType === 'link') {
                await createKnowledgeDocument({
                    name: urlName,
                    type: 'link',
                    url: urlLink,
                    knowledge_base_id: selectedFolderId,
                })
            } else if (contentType === 'file' && selectedFile) {
                const formData = new FormData()
                formData.append('file', selectedFile)

                await createKnowledgeDocument({
                    name: selectedFile.name,
                    type: 'file',
                    knowledge_base_id: selectedFolderId,
                    size: formatBytes(selectedFile.size),
                    mime_type: selectedFile.type
                }, formData)
            }

            // Reset form
            setUrlName('')
            setUrlLink('')
            setSelectedFile(null)
            setIsAddContentOpen(false)
            fetchData()
        } catch (error) {
            console.error('Error adding content:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteKnowledgeItem(id, 'file')
                fetchData()
                if (activeItem?.id === id) {
                    setActiveItem(null)
                }
            } catch (error) {
                console.error('Error deleting item:', error)
            }
        }
    }

    // Recursive Tree Renderer
    const renderTree = (items: KnowledgeBase[], depth = 0) => {
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
                        <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add Content
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add Content</DialogTitle>
                                    <DialogDescription>
                                        Add a new file or link to your knowledge base.
                                    </DialogDescription>
                                </DialogHeader>

                                <Tabs defaultValue="link" className="w-full" onValueChange={(v) => setContentType(v as 'link' | 'file')}>
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="link">
                                            <LinkIcon className="h-4 w-4 mr-2" />
                                            Link
                                        </TabsTrigger>
                                        <TabsTrigger value="file">
                                            <Upload className="h-4 w-4 mr-2" />
                                            File Upload
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="link" className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="urlName">Name</Label>
                                            <Input
                                                id="urlName"
                                                placeholder="e.g. API Documentation"
                                                value={urlName}
                                                onChange={(e) => setUrlName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="urlLink">URL</Label>
                                            <Input
                                                id="urlLink"
                                                placeholder="https://example.com/docs"
                                                value={urlLink}
                                                onChange={(e) => setUrlLink(e.target.value)}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="file" className="space-y-4">
                                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {selectedFile ? formatBytes(selectedFile.size) : 'PDF, Images, Text, CSV, Excel'}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <DialogFooter>
                                    <Button onClick={handleAddContent} disabled={isSubmitting}>
                                        {isSubmitting ? 'Adding...' : 'Add Content'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

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
                        <div
                            className={`
                flex items-center py-1.5 px-2 cursor-pointer text-sm rounded-md transition-colors
                ${selectedFolderId === null ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted/50 text-muted-foreground'}
              `}
                            onClick={() => setSelectedFolderId(null)}
                        >
                            <Folder className="h-4 w-4 mr-2 text-blue-500" />
                            <span>All Documents</span>
                        </div>
                        {renderTree(folders)}
                    </ScrollArea>
                    <div className="p-3 border-t">
                        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                                    <Plus className="h-3.5 w-3.5 mr-2" />
                                    New Folder
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Folder</DialogTitle>
                                    <DialogDescription>
                                        Create a new folder to organize your knowledge base.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateFolder}>Create Folder</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Center Pane: Data Grid */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    <div className="p-4 flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading...
                            </div>
                        ) : (
                            <KnowledgeHubTable
                                items={documents}
                                selectedItems={selectedItems}
                                onSelect={handleSelect}
                                onSelectAll={handleSelectAll}
                                onItemClick={setActiveItem}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>
                    <div className="h-9 border-t flex items-center justify-between px-4 text-xs text-muted-foreground bg-muted/5">
                        <span>{documents.length} items</span>
                        <span>{selectedItems.length} selected</span>
                    </div>
                </div>
            </div>

            {/* Document Viewer Overlay */}
            {activeItem && (
                <KnowledgeDocumentViewer
                    document={activeItem}
                    onClose={() => setActiveItem(null)}
                />
            )}
        </div>
    )
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
