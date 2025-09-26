"use client"

import { useState } from "react"
import type { ReactNode } from "react"

import { ColumnDialog } from "./ColumnDialog"
import type { FlatLeaf, SchemaField } from "@/lib/schema/types"
import { removeFieldById, updateFieldById } from "@/lib/schema/treeOps"

export interface ColumnHandlers {
  onAddColumn: () => void
  onEditColumn: (column: FlatLeaf) => void
  onDeleteColumn: (columnId: string) => void
}

interface ColumnsPanelProps {
  columns: FlatLeaf[]
  setFields: (updater: SchemaField[] | ((prev: SchemaField[]) => SchemaField[])) => void
  children: (handlers: ColumnHandlers) => ReactNode
}

interface DialogState {
  open: boolean
  mode: "create" | "edit"
  column: SchemaField | null
}

const cloneField = <T extends SchemaField>(field: T): T => JSON.parse(JSON.stringify(field)) as T

export function ColumnsPanel({ columns, setFields, children }: ColumnsPanelProps) {
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, mode: "create", column: null })

  const openDialog = (mode: "create" | "edit", column: SchemaField) => {
    setDialogState({ open: true, mode, column: cloneField(column) })
  }

  const closeDialog = () => {
    setDialogState({ open: false, mode: "create", column: null })
  }

  const handleAddColumn = () => {
    const newColumn: SchemaField = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Column ${columns.length + 1}`,
      type: "string",
      description: "",
      extractionInstructions: "",
      required: false,
    }
    setFields((prev) => [...prev, newColumn])
    openDialog("create", newColumn)
  }

  const handleEditColumn = (column: FlatLeaf) => {
    openDialog("edit", column)
  }

  const handleDeleteColumn = (columnId: string) => {
    setFields((prev) => removeFieldById(prev, columnId))
  }

  const handleSaveColumn = (updated: SchemaField) => {
    setFields((prev) => updateFieldById(prev, updated.id, () => cloneField(updated)))
    closeDialog()
  }

  return (
    <>
      {children({
        onAddColumn: handleAddColumn,
        onEditColumn: handleEditColumn,
        onDeleteColumn: handleDeleteColumn,
      })}

      <ColumnDialog
        open={dialogState.open}
        mode={dialogState.mode}
        column={dialogState.column}
        displayColumns={columns}
        onClose={closeDialog}
        onSave={handleSaveColumn}
      />
    </>
  )
}
