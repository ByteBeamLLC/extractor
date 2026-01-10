"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DocumentExtractionFolder {
  id: string
  name: string
  parent_id: string | null
  created_at: string
  updated_at: string
  children?: DocumentExtractionFolder[]
}

interface DocumentExtractionFolderTreeProps {
  folders: DocumentExtractionFolder[]
  selectedFolderId: string | null
  onSelectFolder: (folderId: string | null) => void
  expandedFolders: Set<string>
  onToggleFolder: (folderId: string) => void
}

function buildFolderTree(folders: DocumentExtractionFolder[]): DocumentExtractionFolder[] {
  const folderMap = new Map<string, DocumentExtractionFolder>()
  const rootFolders: DocumentExtractionFolder[] = []

  // Create map of all folders
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Build tree structure
  folders.forEach((folder) => {
    const folderNode = folderMap.get(folder.id)!
    if (folder.parent_id) {
      const parent = folderMap.get(folder.parent_id)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(folderNode)
      } else {
        rootFolders.push(folderNode)
      }
    } else {
      rootFolders.push(folderNode)
    }
  })

  return rootFolders
}

function renderFolderNode(
  folder: DocumentExtractionFolder,
  depth: number,
  selectedFolderId: string | null,
  expandedFolders: Set<string>,
  onSelectFolder: (folderId: string | null) => void,
  onToggleFolder: (folderId: string) => void
): React.ReactNode {
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id
  const hasChildren = folder.children && folder.children.length > 0

  return (
    <div key={folder.id}>
      <div
        className={cn(
          "flex items-center py-1.5 px-2 cursor-pointer text-sm rounded-md transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-muted/50 text-muted-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          onSelectFolder(folder.id)
          if (hasChildren) {
            onToggleFolder(folder.id)
          }
        }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              "h-4 w-4 mr-1.5 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        ) : (
          <div className="w-5.5 mr-1.5" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 mr-1.5" />
        ) : (
          <Folder className="h-4 w-4 mr-1.5" />
        )}
        <span className="truncate">{folder.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) =>
            renderFolderNode(
              child,
              depth + 1,
              selectedFolderId,
              expandedFolders,
              onSelectFolder,
              onToggleFolder
            )
          )}
        </div>
      )}
    </div>
  )
}

export function DocumentExtractionFolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  expandedFolders,
  onToggleFolder,
}: DocumentExtractionFolderTreeProps) {
  const tree = React.useMemo(() => buildFolderTree(folders), [folders])

  return (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          "flex items-center py-1.5 px-2 cursor-pointer text-sm rounded-md transition-colors mb-1",
          selectedFolderId === null
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-muted/50 text-muted-foreground"
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4 mr-1.5" />
        <span>All Files</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tree.map((folder) =>
          renderFolderNode(
            folder,
            0,
            selectedFolderId,
            expandedFolders,
            onSelectFolder,
            onToggleFolder
          )
        )}
      </div>
    </div>
  )
}





