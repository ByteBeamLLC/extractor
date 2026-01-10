"use client"

import * as React from "react"
import { Plus, Upload, FolderPlus, Search, LayoutGrid, List as ListIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DocumentExtractionFolderTree, type DocumentExtractionFolder } from "./DocumentExtractionFolderTree"
import { DocumentExtractionFileCard, type DocumentExtractionFile } from "./DocumentExtractionFileCard"
import { DocumentExtractionViewer } from "./DocumentExtractionViewer"
import { ExtractionMethodSelector, useExtractionMethod } from "./ExtractionMethodSelector"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useSession } from "@/lib/supabase/hooks"

export function DocumentExtractionDashboard() {
  const session = useSession()
  const supabase = createSupabaseBrowserClient()

  const [folders, setFolders] = React.useState<DocumentExtractionFolder[]>([])
  const [files, setFiles] = React.useState<DocumentExtractionFile[]>([])
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = React.useState<DocumentExtractionFile | null>(null)
  const [isLoadingFile, setIsLoadingFile] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [extractionMethod, setExtractionMethod] = useExtractionMethod()

  // Dialog states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState("")
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const GUEST_STORAGE_KEY = "document_extraction_guest_data_v1"

  const fetchFolders = React.useCallback(async () => {
    if (!session?.user?.id) {
      // Guest user - load from localStorage
      try {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(GUEST_STORAGE_KEY) : null
        if (stored) {
          const data = JSON.parse(stored)
          setFolders(data.folders || [])
        } else {
          setFolders([])
        }
      } catch (error) {
        console.error("Error loading guest folders:", error)
        setFolders([])
      }
      return
    }

    try {
      const response = await fetch("/api/document-extraction/folders")
      if (!response.ok) throw new Error("Failed to fetch folders")
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error fetching folders:", error)
    }
  }, [session?.user?.id])

  const fetchFiles = React.useCallback(async () => {
    if (!session?.user?.id) {
      // Guest user - load from localStorage
      try {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(GUEST_STORAGE_KEY) : null
        if (stored) {
          const data = JSON.parse(stored)
          const allFiles = data.files || []
          const filtered = selectedFolderId
            ? allFiles.filter((f: DocumentExtractionFile) => f.folder_id === selectedFolderId)
            : allFiles.filter((f: DocumentExtractionFile) => !f.folder_id)
          setFiles(filtered)
        } else {
          setFiles([])
        }
      } catch (error) {
        console.error("Error loading guest files:", error)
        setFiles([])
      } finally {
        setIsLoading(false)
      }
      return
    }

    try {
      const url = selectedFolderId
        ? `/api/document-extraction/files?folder_id=${selectedFolderId}`
        : "/api/document-extraction/files"
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch files")
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, selectedFolderId])

  React.useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  React.useEffect(() => {
    setIsLoading(true)
    fetchFiles()
  }, [fetchFiles])

  // Poll for file status updates (for guest users, check extraction status)
  React.useEffect(() => {
    const hasProcessingFiles = files.some(
      (f) => f.extraction_status === "processing" || f.extraction_status === "pending"
    )

    if (!hasProcessingFiles) return

    if (!session?.user?.id) {
      // For guest users, check if extraction is complete by looking at files
      // The extraction happens async, so we'll update when the response comes back
      return
    }

    const interval = setInterval(() => {
      fetchFiles()
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [files, fetchFiles, session?.user?.id])

  // Handle guest extraction results
  React.useEffect(() => {
    if (!session?.user?.id && files.length > 0) {
      // Check for pending files and poll their extraction status
      const pendingFiles = files.filter(
        (f) => f.extraction_status === "pending" || f.extraction_status === "processing"
      )

      pendingFiles.forEach((file) => {
        // Check if we have a pending extraction for this file
        // The extraction API will be called from handleUpload, and we need to poll for results
        // For now, we'll update status when extraction completes via the upload handler
      })
    }
  }, [files, session?.user?.id])

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const saveGuestData = React.useCallback((folders: DocumentExtractionFolder[], files: DocumentExtractionFile[]) => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(
        GUEST_STORAGE_KEY,
        JSON.stringify({ folders, files, updatedAt: new Date().toISOString() })
      )
    } catch (error) {
      console.error("Error saving guest data:", error)
    }
  }, [])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    if (!session?.user?.id) {
      // Guest user - save to localStorage
      const newFolder: DocumentExtractionFolder = {
        id: crypto.randomUUID(),
        name: newFolderName.trim(),
        parent_id: selectedFolderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const updatedFolders = [...folders, newFolder]
      setFolders(updatedFolders)
      saveGuestData(updatedFolders, files)
      setNewFolderName("")
      setIsCreateFolderOpen(false)
      return
    }

    try {
      const response = await fetch("/api/document-extraction/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: selectedFolderId,
        }),
      })

      if (!response.ok) throw new Error("Failed to create folder")

      setNewFolderName("")
      setIsCreateFolderOpen(false)
      fetchFolders()
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) return

    setIsUploading(true)
    try {
      if (!session?.user?.id) {
        // Guest user - store in localStorage and process extraction
        const fileId = crypto.randomUUID()
        const fileUrl = URL.createObjectURL(uploadFile)
        
        const newFile: DocumentExtractionFile = {
          id: fileId,
          name: uploadFile.name,
          folder_id: selectedFolderId,
          file_url: fileUrl,
          mime_type: uploadFile.type || null,
          file_size: uploadFile.size,
          extraction_status: "pending",
          extraction_method: extractionMethod,
          layout_data: null,
          extracted_text: null,
          error_message: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const updatedFiles = [...files, newFile]
        setFiles(updatedFiles)
        saveGuestData(folders, updatedFiles)

        // Update file status to processing
        newFile.extraction_status = "processing"
        const processingFiles = [...files, newFile]
        setFiles(processingFiles)
        saveGuestData(folders, processingFiles)

        // Trigger extraction for guest user
        const arrayBuffer = await uploadFile.arrayBuffer()
        // Convert ArrayBuffer to base64 (browser-compatible)
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ""
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        
        // Call extraction API (it will handle guest mode)
        console.log("[document-extraction] Sending extraction request with method:", extractionMethod)
        
        fetch("/api/document-extraction/extract-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_id: fileId,
            file_name: uploadFile.name,
            mime_type: uploadFile.type,
            file_data: base64,
            extraction_method: extractionMethod, // Pass extraction method preference
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
              throw new Error(errorData.details || errorData.error || "Extraction failed")
            }
            const result = await response.json()
            
            console.log("[document-extraction] Extraction result:", {
              hasLayoutData: !!result.layout_data,
              hasBlocks: !!result.layout_data?.blocks,
              blocksCount: result.layout_data?.blocks?.length || 0,
              hasExtractedText: !!result.extracted_text,
              extractedTextCount: result.extracted_text?.length || 0,
              fullResult: result,
            })
            
            // Update file with extraction results
            const updatedFiles = processingFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    extraction_status: "completed",
                    layout_data: result.layout_data || null,
                    extracted_text: result.extracted_text || [],
                    updated_at: new Date().toISOString(),
                  }
                : f
            )
            setFiles(updatedFiles)
            saveGuestData(folders, updatedFiles)
          })
          .catch((error) => {
            console.error("Error during extraction:", error)
            // Update file status to error
            const errorMessage = error instanceof Error ? error.message : "Extraction failed"
            const errorFiles = processingFiles.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    extraction_status: "error",
                    error_message: errorMessage,
                    updated_at: new Date().toISOString(),
                  }
                : f
            )
            setFiles(errorFiles)
            saveGuestData(folders, errorFiles)
            
            // Show user-friendly error
            alert(`Extraction failed: ${errorMessage}`)
          })

        setUploadFile(null)
        setIsUploadOpen(false)
        return
      }

      // Authenticated user - use API
      const formData = new FormData()
      formData.append("file", uploadFile)
      if (selectedFolderId) {
        formData.append("folder_id", selectedFolderId)
      }
      formData.append("extraction_method", extractionMethod)

      const response = await fetch("/api/document-extraction/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload file")

      setUploadFile(null)
      setIsUploadOpen(false)
      fetchFiles()
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  // Fetch full file data when opening a file for viewing
  const handleOpenFile = async (file: DocumentExtractionFile) => {
    if (!session?.user?.id) {
      // Guest user - file already has all data in localStorage
      setSelectedFile(file)
      return
    }

    // For authenticated users, fetch full file data including layout_data and gemini_full_text
    setIsLoadingFile(true)
    try {
      const response = await fetch(`/api/document-extraction/files?id=${file.id}`)
      if (!response.ok) throw new Error("Failed to fetch file")
      const data = await response.json()
      setSelectedFile(data.file || file)
    } catch (error) {
      console.error("Error fetching file data:", error)
      // Fall back to the file from the list
      setSelectedFile(file)
    } finally {
      setIsLoadingFile(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    if (!session?.user?.id) {
      // Guest user - remove from localStorage
      const file = files.find((f) => f.id === fileId)
      if (file?.file_url && file.file_url.startsWith("blob:")) {
        URL.revokeObjectURL(file.file_url)
      }
      const updatedFiles = files.filter((f) => f.id !== fileId)
      setFiles(updatedFiles)
      saveGuestData(folders, updatedFiles)
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
      return
    }

    try {
      const response = await fetch(`/api/document-extraction/files?id=${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete file")

      fetchFiles()
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return files
    const query = searchQuery.toLowerCase()
    return files.filter((file) => file.name.toLowerCase().includes(query))
  }, [files, searchQuery])

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-6 px-6 py-8 lg:px-10">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Document Extraction
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload documents and extract layout and text content.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                  <DialogDescription>Enter a name for the new folder.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="My Folder"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFolder()
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Select a file to extract layout and text content.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept="image/*,.pdf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Extraction Method</Label>
                    <ExtractionMethodSelector 
                      value={extractionMethod}
                      onChange={setExtractionMethod}
                      className="w-full"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/10 p-4 overflow-y-auto">
          <DocumentExtractionFolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No files yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Upload a document to get started with extraction.
              </p>
              <Button className="mt-6" onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-2"
              }
            >
              {filteredFiles.map((file) => (
                <DocumentExtractionFileCard
                  key={file.id}
                  file={file}
                  onOpen={() => handleOpenFile(file)}
                  onDelete={() => handleDeleteFile(file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoadingFile && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading file...</p>
          </div>
        </div>
      )}

      {selectedFile && !isLoadingFile && (
        <DocumentExtractionViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  )
}

