"use client"

import React from "react"
import { TanStackGridSheet } from "@/components/tanstack-grid/TanStackGridSheet"
import { GalleryView } from "@/components/gallery-view/GalleryView"
import type { SchemaDefinition, SchemaField, ExtractionJob, VisualGroup } from "@/lib/schema"

export interface StandardResultsViewProps {
  // Schema & data
  activeSchemaId: string
  activeSchema: SchemaDefinition
  displayColumns: SchemaField[]
  jobs: ExtractionJob[]

  // View state
  viewMode: 'grid' | 'gallery'
  selectedJobId: string | null
  expandedRowId: string | null

  // Callbacks for job interaction
  onSelectJob: (job: ExtractionJob | null) => void
  onRowDoubleClick: (job: ExtractionJob) => void
  onDeleteJob: (jobId: string) => void
  onToggleRowExpansion: (rowId: string | null) => void

  // Callbacks for column operations
  onAddColumn: () => void
  onEditColumn: (column: SchemaField) => void
  onDeleteColumn: (columnId: string) => void

  // Callbacks for cell operations
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void
  onUpdateReviewStatus: (
    jobId: string,
    columnId: string,
    status: 'verified' | 'needs_review',
    payload?: { reason?: string | null }
  ) => void
  onColumnRightClick: (columnId: string, event: React.MouseEvent) => void
  onOpenTableModal: (
    column: SchemaField,
    job: ExtractionJob,
    rows: Record<string, unknown>[],
    columnHeaders: Array<{ key: string; label: string }>
  ) => void

  // Render functions
  renderCellValue: (
    column: SchemaField,
    job: ExtractionJob,
    opts?: {
      refreshRowHeight?: () => void
      mode?: 'interactive' | 'summary' | 'detail'
      onUpdateCell?: (jobId: string, columnId: string, value: unknown) => void
      onOpenTableModal?: (
        column: SchemaField,
        job: ExtractionJob,
        rows: Record<string, unknown>[],
        columnHeaders: Array<{ key: string; label: string }>
      ) => void
    }
  ) => React.ReactNode
  getStatusIcon: (status: ExtractionJob['status']) => React.ReactNode
  renderStatusPill: (
    status: ExtractionJob['status'],
    opts?: { size?: 'default' | 'compact' }
  ) => React.ReactNode
}

/**
 * Standard results view component for displaying extraction results
 * in either grid (TanStackGridSheet) or gallery view mode
 */
export function StandardResultsView({
  activeSchemaId,
  activeSchema,
  displayColumns,
  jobs,
  viewMode,
  selectedJobId,
  expandedRowId,
  onSelectJob,
  onRowDoubleClick,
  onDeleteJob,
  onToggleRowExpansion,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onUpdateCell,
  onUpdateReviewStatus,
  onColumnRightClick,
  onOpenTableModal,
  renderCellValue,
  getStatusIcon,
  renderStatusPill,
}: StandardResultsViewProps) {
  // #region agent log
  // Track render count to detect loops
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  
  // Track prop changes
  const prevPropsRef = React.useRef<{
    activeSchemaId?: string;
    displayColumnsLength?: number;
    jobsLength?: number;
    viewMode?: 'grid' | 'gallery';
    selectedJobId?: string | null;
    expandedRowId?: string | null;
    callbacks?: string[];
  }>({});
  
  React.useEffect(() => {
    const changedProps: string[] = [];
    const currentProps = {
      activeSchemaId,
      displayColumnsLength: displayColumns.length,
      jobsLength: jobs.length,
      viewMode,
      selectedJobId,
      expandedRowId,
      callbacks: [
        onSelectJob.toString().substring(0, 50),
        onRowDoubleClick.toString().substring(0, 50),
        onDeleteJob.toString().substring(0, 50),
      ]
    };
    
    const prev = prevPropsRef.current;
    if (prev.activeSchemaId !== currentProps.activeSchemaId) changedProps.push('activeSchemaId');
    if (prev.displayColumnsLength !== currentProps.displayColumnsLength) changedProps.push('displayColumns');
    if (prev.jobsLength !== currentProps.jobsLength) changedProps.push('jobs');
    if (prev.viewMode !== currentProps.viewMode) changedProps.push('viewMode');
    if (prev.selectedJobId !== currentProps.selectedJobId) changedProps.push('selectedJobId');
    if (prev.expandedRowId !== currentProps.expandedRowId) changedProps.push('expandedRowId');
    if (JSON.stringify(prev.callbacks) !== JSON.stringify(currentProps.callbacks)) changedProps.push('callbacks');
    
    if (renderCountRef.current > 1) {
      fetch('http://127.0.0.1:7242/ingest/deb7f689-6230-4974-97b6-897e8c059ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StandardResultsView.tsx:97',message:'StandardResultsView render',data:{renderCount:renderCountRef.current,changedProps,currentProps},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'PARENT_LOOP'})}).catch(()=>{});
    }
    
    prevPropsRef.current = currentProps;
  });
  
  if (renderCountRef.current === 30) {
    console.warn('[StandardResultsView] Render loop detected!', {
      renderCount: renderCountRef.current,
      activeSchemaId,
      jobsLength: jobs.length,
      displayColumnsLength: displayColumns.length
    });
  }
  // #endregion
  
  // Sort jobs by creation date - memoized to prevent re-sorting on every render
  const sortedJobs = React.useMemo(() => {
    return [...jobs].sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0
      const bTime = b.createdAt?.getTime() ?? 0
      return aTime - bTime
    })
  }, [jobs])

  // Memoize onSelectRow callback to prevent unnecessary re-renders of TanStackGridSheet
  const handleSelectRow = React.useCallback((id: string) => {
    const job = sortedJobs.find((j) => j.id === id)
    onSelectJob(job ?? null)
  }, [sortedJobs, onSelectJob])

  return (
    <div className="flex-1 overflow-hidden min-h-0 relative">
      {viewMode === 'grid' ? (
        <TanStackGridSheet
          schemaId={activeSchemaId}
          columns={displayColumns}
          jobs={sortedJobs}
          selectedRowId={selectedJobId}
          onSelectRow={handleSelectRow}
          onRowDoubleClick={onRowDoubleClick}
          onAddColumn={onAddColumn}
          renderCellValue={renderCellValue}
          getStatusIcon={getStatusIcon}
          renderStatusPill={renderStatusPill}
          onEditColumn={onEditColumn}
          onDeleteColumn={onDeleteColumn}
          onUpdateCell={onUpdateCell}
          onUpdateReviewStatus={onUpdateReviewStatus}
          onColumnRightClick={onColumnRightClick}
          onOpenTableModal={onOpenTableModal}
          visualGroups={activeSchema.visualGroups}
          expandedRowId={expandedRowId}
          onToggleRowExpansion={onToggleRowExpansion}
        />
      ) : (
        <GalleryView
          jobs={sortedJobs}
          onSelectJob={onRowDoubleClick}
          onDeleteJob={onDeleteJob}
        />
      )}
    </div>
  )
}

