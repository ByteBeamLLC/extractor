"use client"

import type { SchemaDefinition } from "@/lib/schema/types"

import { cn } from "@/lib/utils"
import { Plus, X } from "lucide-react"

interface SchemasTabsProps {
  schemas: SchemaDefinition[]
  activeSchemaId: string
  onSelectSchema: (schemaId: string) => void
  onCloseSchema: (schemaId: string) => void
  onAddSchema: () => void
}

export function SchemasTabs({ schemas, activeSchemaId, onSelectSchema, onCloseSchema, onAddSchema }: SchemasTabsProps) {
  return (
    <div id="tab-bar" className="flex-shrink-0 bg-gray-100 pl-6 border-b border-gray-200 flex items-center">
      <div id="tab-container" className="relative flex-grow overflow-x-auto -mb-px tab-container">
        <div className="flex items-center whitespace-nowrap pr-2">
          {schemas.map((schema) => {
            const isActive = schema.id === activeSchemaId
            return (
              <button
                key={schema.id}
                type="button"
                className={cn(
                  "group relative inline-flex items-center max-w-xs mr-1 px-3 py-2 text-sm rounded-t-md border-b-2",
                  isActive
                    ? "bg-white text-indigo-600 border-indigo-500"
                    : "bg-transparent text-gray-500 border-transparent hover:bg-gray-200",
                )}
                onClick={() => onSelectSchema(schema.id)}
                title={schema.name}
              >
                <span className="truncate max-w-[10rem] pr-1">{schema.name}</span>
                <span
                  className={cn(
                    "ml-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-700",
                  )}
                  onClick={(event) => {
                    event.stopPropagation()
                    onCloseSchema(schema.id)
                  }}
                  aria-label="Close schema tab"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              </button>
            )
          })}
          <button
            onClick={onAddSchema}
            className="ml-2 p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 sticky right-0 bg-gray-100"
            title="New schema"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
