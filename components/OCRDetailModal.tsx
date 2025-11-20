"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import "@mdxeditor/editor/style.css"
import type { MDXEditorMethods } from "@mdxeditor/editor"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExtractionResultsView } from "@/components/document-viewer/ExtractionResultsView"
import type { ExtractionJob } from "@/lib/schema"
import { cn } from "@/lib/utils"

interface OCRDetailModalProps {
  job: ExtractionJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkdownChange?: (markdown: string) => void
}

export function OCRDetailModal({ job, open, onOpenChange, onMarkdownChange }: OCRDetailModalProps) {
  const markdown = job?.ocrMarkdown?.trim() ?? ""
  const originalFileUrl = job?.originalFileUrl ?? ""
  const hasOriginalFile = originalFileUrl.length > 0

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [originalFileUrl, open, job?.id])

  // Load MDXEditor client-side to avoid SSR, and keep a ref for programmatic updates
  const [EditorMod, setEditorMod] = useState<any>(null)
  const editorRef = useRef<MDXEditorMethods | null>(null)
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    let active = true
      ; (async () => {
        const mod = await import("@mdxeditor/editor")
        if (active) setEditorMod(mod)
      })()
    return () => {
      active = false
    }
  }, [])

  const editorPlugins = useMemo(() => {
    if (!EditorMod) return []

    const toolbarContents = () => (
      <>
        <EditorMod.UndoRedo />
        <EditorMod.Separator />
        <EditorMod.BlockTypeSelect />
        <EditorMod.Separator />
        <EditorMod.BoldItalicUnderlineToggles />
        <EditorMod.Separator />
        <EditorMod.ListsToggle />
        <EditorMod.Separator />
        <EditorMod.CreateLink />
        <EditorMod.Separator />
        <EditorMod.InsertTable />
        <EditorMod.InsertImage />
        <EditorMod.InsertThematicBreak />
        <EditorMod.Separator />
        <EditorMod.DiffSourceToggleWrapper>
          <EditorMod.UndoRedo />
        </EditorMod.DiffSourceToggleWrapper>
      </>
    )

    return [
      EditorMod.toolbarPlugin({
        toolbarClassName:
          'sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b',
        toolbarContents,
      }),
      EditorMod.headingsPlugin(),
      EditorMod.listsPlugin(),
      EditorMod.linkPlugin(),
      EditorMod.quotePlugin(),
      EditorMod.thematicBreakPlugin(),
      EditorMod.markdownShortcutPlugin(),
      EditorMod.tablePlugin(),
      EditorMod.codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
      EditorMod.codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', tsx: 'TSX', css: 'CSS' } }),
      EditorMod.imagePlugin(),
    ]
  }, [EditorMod])

  // When the selected job (or its markdown) changes, update the editor content
  useEffect(() => {
    if (editorRef.current) {
      // Only update if the markdown is different from what's currently in the editor
      // This prevents infinite loops when onChange triggers markdown updates
      const currentMarkdown = editorRef.current.getMarkdown()
      if (currentMarkdown !== markdown) {
        isUpdatingRef.current = true
        editorRef.current.setMarkdown(markdown)
        // Reset the flag after a short delay to allow the editor to update
        setTimeout(() => {
          isUpdatingRef.current = false
        }, 100)
      }
    }
  }, [markdown, job?.id])

  const isPdfFile = originalFileUrl.toLowerCase().includes('.pdf') || job?.fileName?.toLowerCase().endsWith('.pdf')
  const isImageFile = originalFileUrl.toLowerCase().match(/\.(png|jpg|jpeg|gif|bmp|webp)$/) ||
    job?.fileName?.toLowerCase().match(/\.(png|jpg|jpeg|gif|bmp|webp)$/)

  const [activeTab, setActiveTab] = useState<"file" | "markdown">("file")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh] p-0 m-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Document Viewer</DialogTitle>
          <DialogDescription>
            {job
              ? `${job.fileName ?? "Untitled"} · ${job.status === "completed" ? "Completed" : job.status}`
              : "Select a job to view its document and markdown output."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Original File / Markdown Toggle */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Original File</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown Content</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1 relative overflow-auto bg-gray-50">
              {activeTab === "file" ? (
                <>
                  {hasOriginalFile && !imageError ? (
                    <>
                      {!imageLoaded && !isPdfFile ? <Skeleton className="absolute inset-4 rounded-md" /> : null}
                      {isPdfFile ? (
                        <iframe
                          src={originalFileUrl}
                          className="w-full h-full border-0"
                          title="PDF Document"
                        />
                      ) : isImageFile ? (
                        <div className="flex items-center justify-center p-4 min-h-full">
                          <img
                            src={originalFileUrl}
                            alt="Original Document"
                            className={cn(
                              "max-w-full max-h-full object-contain transition-opacity duration-200 shadow-lg",
                              imageLoaded ? "opacity-100" : "opacity-0",
                            )}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full p-4">
                          <p className="text-sm text-muted-foreground">Unsupported file type for preview</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-sm text-muted-foreground">
                      <div className="rounded-full bg-muted-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
                        {job ? job.status : "No Job"}
                      </div>
                      <p className="mt-2">
                        {job ? "No original file is available for this job." : "Select a job to view its document."}
                      </p>
                    </div>
                  )}
                  {imageError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 p-4 text-center text-sm text-destructive">
                      <p>Failed to load original file.</p>
                      <p className="text-xs text-muted-foreground">
                        Check that the file is accessible and the format is supported.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-background">
                  <div className="p-6">
                    <div className="mx-auto w-full max-w-[820px]">
                      {EditorMod ? (
                        <EditorMod.MDXEditor
                          ref={editorRef}
                          markdown={markdown}
                          onChange={(value: string) => {
                            if (!isUpdatingRef.current) {
                              onMarkdownChange?.(value)
                            }
                          }}
                          contentEditableClassName="prose prose-lg max-w-none dark:prose-invert flex-1 min-h-0 prose-headings:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed prose-pre:overflow-x-auto prose-pre:max-w-full prose-img:max-h-[70vh] [&_table]:block [&_table]:min-w-max [&_table]:max-w-none [&_table]:overflow-x-auto [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap"
                          className="flex flex-col h-full min-h-0"
                          plugins={editorPlugins}
                        />
                      ) : (
                        <Skeleton className="w-full h-[60vh] rounded-md" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Extraction Results */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="p-4 border-b bg-muted/50 flex-shrink-0">
              <h3 className="font-medium text-sm">Extraction Results</h3>
            </div>
            <div className="flex-1 overflow-hidden min-h-0 bg-background">
              {job?.results ? (
                <ExtractionResultsView results={job.results} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <p>No extraction results available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
