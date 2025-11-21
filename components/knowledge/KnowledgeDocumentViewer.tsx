'use client'

import * as React from 'react'
import { X, FileText, Download, Maximize2, Minimize2, Split, Columns } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { KnowledgeDocument } from '@/lib/knowledge-actions'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface KnowledgeDocumentViewerProps {
    document: KnowledgeDocument
    onClose: () => void
}

export function KnowledgeDocumentViewer({ document, onClose }: KnowledgeDocumentViewerProps) {
    const [isMaximized, setIsMaximized] = React.useState(false)

    // Helper to determine if we should show split view
    const showSplitView = document.type === 'file' &&
        (document.mime_type?.startsWith('image/') || document.mime_type === 'application/pdf')

    return (
        <div className={`fixed inset-0 z-50 bg-background flex flex-col transition-all duration-200 ${isMaximized ? 'p-0' : 'p-4 md:p-8'}`}>
            <div className={`flex-1 flex flex-col bg-background border rounded-lg shadow-2xl overflow-hidden ${isMaximized ? 'rounded-none border-0' : ''}`}>

                {/* Header */}
                <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm">{document.name}</h2>
                            <p className="text-xs text-muted-foreground capitalize">{document.mime_type || 'Unknown Type'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)}>
                            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {showSplitView ? (
                        <ResizablePanelGroup direction="horizontal">
                            {/* Source Pane */}
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <div className="h-full flex flex-col bg-muted/10">
                                    <div className="h-9 border-b flex items-center px-4 text-xs font-medium text-muted-foreground bg-muted/5">
                                        Source File
                                    </div>
                                    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                                        {document.mime_type?.startsWith('image/') ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/knowledge_assets/${document.storage_path}`}
                                                alt="Source"
                                                className="max-w-full max-h-full object-contain shadow-sm rounded-md"
                                            />
                                        ) : document.mime_type === 'application/pdf' ? (
                                            <iframe
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/knowledge_assets/${document.storage_path}#toolbar=0`}
                                                className="w-full h-full rounded-md border shadow-sm bg-white"
                                                title="PDF Viewer"
                                            />
                                        ) : (
                                            <div className="text-center text-muted-foreground">
                                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                <p>Preview not available for this file type.</p>
                                                <Button variant="link" className="mt-2 h-auto p-0">Download to view</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Extracted Content Pane */}
                            <ResizablePanel defaultSize={50} minSize={30}>
                                <div className="h-full flex flex-col bg-background">
                                    <div className="h-9 border-b flex items-center px-4 text-xs font-medium text-muted-foreground bg-muted/5 justify-between">
                                        <span>Extracted Content</span>
                                        <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                            Markdown
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="p-8 max-w-3xl mx-auto prose dark:prose-invert prose-sm">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {document.content || '*No content extracted yet.*'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    ) : (
                        <div className="h-full flex flex-col bg-background">
                            <div className="h-9 border-b flex items-center px-4 text-xs font-medium text-muted-foreground bg-muted/5 justify-between">
                                <span>{document.type === 'link' ? 'Web Content' : 'Document Content'}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-8 max-w-3xl mx-auto prose dark:prose-invert prose-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {document.content || '*No content available.*'}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
