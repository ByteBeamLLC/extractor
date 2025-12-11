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
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;
  
  // Track callback identities to detect when they change
  const callbackIdsRef = React.useRef<{
    onSelectJob?: Function;
    onRowDoubleClick?: Function;
    onDeleteJob?: Function;
    onAddColumn?: Function;
    onEditColumn?: Function;
    onDeleteColumn?: Function;
    renderCellValue?: Function;
    getStatusIcon?: Function;
    renderStatusPill?: Function;
  }>({});
  
  // Log render and detect which callbacks changed identity
  React.useEffect(() => {
    const changedCallbacks: string[] = [];
    if (callbackIdsRef.current.onSelectJob !== onSelectJob) changedCallbacks.push('onSelectJob');
    if (callbackIdsRef.current.onRowDoubleClick !== onRowDoubleClick) changedCallbacks.push('onRowDoubleClick');
    if (callbackIdsRef.current.onDeleteJob !== onDeleteJob) changedCallbacks.push('onDeleteJob');
    if (callbackIdsRef.current.onAddColumn !== onAddColumn) changedCallbacks.push('onAddColumn');
    if (callbackIdsRef.current.onEditColumn !== onEditColumn) changedCallbacks.push('onEditColumn');
    if (callbackIdsRef.current.onDeleteColumn !== onDeleteColumn) changedCallbacks.push('onDeleteColumn');
    if (callbackIdsRef.current.renderCellValue !== renderCellValue) changedCallbacks.push('renderCellValue');
    if (callbackIdsRef.current.getStatusIcon !== getStatusIcon) changedCallbacks.push('getStatusIcon');
    if (callbackIdsRef.current.renderStatusPill !== renderStatusPill) changedCallbacks.push('renderStatusPill');
    
    if (renderCountRef.current > 1) {
      console.error(`[H1/H3] StandardResultsView render #${renderCountRef.current}`, {
        changedCallbacks,
        hasChanges: changedCallbacks.length > 0,
        jobsLength: jobs.length,
        columnsLength: displayColumns.length,
      });
    }
    
    // Update refs
    callbackIdsRef.current = {
      onSelectJob, onRowDoubleClick, onDeleteJob, onAddColumn, onEditColumn,
      onDeleteColumn, renderCellValue, getStatusIcon, renderStatusPill
    };
  });
  
  if (renderCountRef.current >= 25) {
    console.error('[H1/H3] RENDER LOOP DETECTED!', {
      renderCount: renderCountRef.current,
      activeSchemaId
    });
  }
  // #endregion
  
  // #region agent log - track memoization
  const prevJobsRef = React.useRef<ExtractionJob[]>(jobs);
  const jobsIdentityChanged = prevJobsRef.current !== jobs;
  const prevSortedJobsRef = React.useRef<ExtractionJob[]>();
  // #endregion

  // Sort jobs by creation date - memoized to prevent re-sorting on every render
  const sortedJobs = React.useMemo(() => {
    // #region agent log
    console.error(`[H4] sortedJobs recomputed (render #${renderCountRef.current})`, {
      jobsIdentityChanged,
      jobsLength: jobs.length
    });
    // #endregion
    return [...jobs].sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0
      const bTime = b.createdAt?.getTime() ?? 0
      return aTime - bTime
    })
  }, [jobs])

  // #region agent log - track sortedJobs identity
  React.useEffect(() => {
    const sortedJobsIdentityChanged = prevSortedJobsRef.current !== sortedJobs;
    if (sortedJobsIdentityChanged && renderCountRef.current > 1) {
      console.error(`[H4] sortedJobs identity changed (render #${renderCountRef.current})`);
    }
    prevSortedJobsRef.current = sortedJobs;
    prevJobsRef.current = jobs;
  });
  
  const prevHandleSelectRowRef = React.useRef<Function>();
  // #endregion

  // Memoize onSelectRow callback to prevent unnecessary re-renders of TanStackGridSheet
  const handleSelectRow = React.useCallback((id: string) => {
    // #region agent log
    console.error(`[H2] handleSelectRow invoked (render #${renderCountRef.current})`, { id });
    // #endregion
    const job = sortedJobs.find((j) => j.id === id)
    onSelectJob(job ?? null)
  }, [sortedJobs, onSelectJob])

  // #region agent log - track handleSelectRow identity
  React.useEffect(() => {
    const handleSelectRowChanged = prevHandleSelectRowRef.current !== handleSelectRow;
    if (handleSelectRowChanged && renderCountRef.current > 1) {
      console.error(`[H2] handleSelectRow identity changed (render #${renderCountRef.current})`);
    }
    prevHandleSelectRowRef.current = handleSelectRow;
  });
  // #endregion

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

