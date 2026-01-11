"use client";

import { useRef, useEffect, useCallback } from "react";
import type { TanStackGridSheetProps } from "../types";

type RenderCellValueFn = NonNullable<TanStackGridSheetProps["renderCellValue"]>;
type GetStatusIconFn = NonNullable<TanStackGridSheetProps["getStatusIcon"]>;
type RenderStatusPillFn = NonNullable<TanStackGridSheetProps["renderStatusPill"]>;
type OnEditColumnFn = NonNullable<TanStackGridSheetProps["onEditColumn"]>;
type OnDeleteColumnFn = NonNullable<TanStackGridSheetProps["onDeleteColumn"]>;
type OnUpdateCellFn = NonNullable<TanStackGridSheetProps["onUpdateCell"]>;
type OnUpdateReviewStatusFn = NonNullable<TanStackGridSheetProps["onUpdateReviewStatus"]>;
type OnColumnRightClickFn = NonNullable<TanStackGridSheetProps["onColumnRightClick"]>;
type OnOpenTableModalFn = NonNullable<TanStackGridSheetProps["onOpenTableModal"]>;
type OnToggleRowExpansionFn = NonNullable<TanStackGridSheetProps["onToggleRowExpansion"]>;
type OnAddColumnFn = NonNullable<TanStackGridSheetProps["onAddColumn"]>;
type OnSelectRowFn = NonNullable<TanStackGridSheetProps["onSelectRow"]>;
type OnRowDoubleClickFn = NonNullable<TanStackGridSheetProps["onRowDoubleClick"]>;

export interface GridCallbacksInput {
  renderCellValue: RenderCellValueFn;
  getStatusIcon: GetStatusIconFn;
  renderStatusPill: RenderStatusPillFn;
  onEditColumn: OnEditColumnFn;
  onDeleteColumn: OnDeleteColumnFn;
  onUpdateCell: OnUpdateCellFn;
  onUpdateReviewStatus: OnUpdateReviewStatusFn;
  onColumnRightClick: OnColumnRightClickFn;
  onOpenTableModal: OnOpenTableModalFn;
  onToggleRowExpansion: OnToggleRowExpansionFn;
  onAddColumn: OnAddColumnFn;
  onSelectRow: OnSelectRowFn;
  onRowDoubleClick?: OnRowDoubleClickFn;
}

export interface StableGridCallbacks {
  stableRenderCellValue: RenderCellValueFn;
  stableGetStatusIcon: GetStatusIconFn;
  stableRenderStatusPill: RenderStatusPillFn;
  stableOnEditColumn: OnEditColumnFn;
  stableOnDeleteColumn: OnDeleteColumnFn;
  stableOnUpdateCell: OnUpdateCellFn;
  stableOnUpdateReviewStatus: OnUpdateReviewStatusFn;
  stableOnColumnRightClick: OnColumnRightClickFn;
  stableOnOpenTableModal: OnOpenTableModalFn;
  stableOnToggleRowExpansion: OnToggleRowExpansionFn;
  stableOnAddColumn: OnAddColumnFn;
  stableOnSelectRow: OnSelectRowFn;
  stableOnRowDoubleClick: (job: unknown) => void;
}

/**
 * Creates stable callback references that use refs internally.
 * This prevents column definitions from changing when callbacks change.
 */
export function useGridCallbacks(input: GridCallbacksInput): StableGridCallbacks {
  const renderCellValueRef = useRef(input.renderCellValue);
  const getStatusIconRef = useRef(input.getStatusIcon);
  const renderStatusPillRef = useRef(input.renderStatusPill);
  const onEditColumnRef = useRef(input.onEditColumn);
  const onDeleteColumnRef = useRef(input.onDeleteColumn);
  const onUpdateCellRef = useRef(input.onUpdateCell);
  const onUpdateReviewStatusRef = useRef(input.onUpdateReviewStatus);
  const onColumnRightClickRef = useRef(input.onColumnRightClick);
  const onOpenTableModalRef = useRef(input.onOpenTableModal);
  const onToggleRowExpansionRef = useRef(input.onToggleRowExpansion);
  const onAddColumnRef = useRef(input.onAddColumn);
  const onSelectRowRef = useRef(input.onSelectRow);
  const onRowDoubleClickRef = useRef(input.onRowDoubleClick);

  // Update refs when props change
  useEffect(() => {
    renderCellValueRef.current = input.renderCellValue;
    getStatusIconRef.current = input.getStatusIcon;
    renderStatusPillRef.current = input.renderStatusPill;
    onEditColumnRef.current = input.onEditColumn;
    onDeleteColumnRef.current = input.onDeleteColumn;
    onUpdateCellRef.current = input.onUpdateCell;
    onUpdateReviewStatusRef.current = input.onUpdateReviewStatus;
    onColumnRightClickRef.current = input.onColumnRightClick;
    onOpenTableModalRef.current = input.onOpenTableModal;
    onToggleRowExpansionRef.current = input.onToggleRowExpansion;
    onAddColumnRef.current = input.onAddColumn;
    onSelectRowRef.current = input.onSelectRow;
    onRowDoubleClickRef.current = input.onRowDoubleClick;
  }, [
    input.renderCellValue,
    input.getStatusIcon,
    input.renderStatusPill,
    input.onEditColumn,
    input.onDeleteColumn,
    input.onUpdateCell,
    input.onUpdateReviewStatus,
    input.onColumnRightClick,
    input.onOpenTableModal,
    input.onToggleRowExpansion,
    input.onAddColumn,
    input.onSelectRow,
    input.onRowDoubleClick,
  ]);

  // Create stable callbacks that use refs
  const stableRenderCellValue = useCallback<RenderCellValueFn>(
    (column, job, opts) => renderCellValueRef.current(column, job, opts),
    []
  );

  const stableGetStatusIcon = useCallback<GetStatusIconFn>(
    (status) => getStatusIconRef.current(status),
    []
  );

  const stableRenderStatusPill = useCallback<RenderStatusPillFn>(
    (status, opts) => renderStatusPillRef.current(status, opts),
    []
  );

  const stableOnEditColumn = useCallback<OnEditColumnFn>(
    (column) => onEditColumnRef.current(column),
    []
  );

  const stableOnDeleteColumn = useCallback<OnDeleteColumnFn>(
    (columnId) => onDeleteColumnRef.current(columnId),
    []
  );

  const stableOnUpdateCell = useCallback<OnUpdateCellFn>(
    (jobId, columnId, value) => onUpdateCellRef.current(jobId, columnId, value),
    []
  );

  const stableOnUpdateReviewStatus = useCallback<OnUpdateReviewStatusFn>(
    (jobId, columnId, status, payload) =>
      onUpdateReviewStatusRef.current(jobId, columnId, status, payload),
    []
  );

  const stableOnColumnRightClick = useCallback<OnColumnRightClickFn>(
    (columnId, event) => onColumnRightClickRef.current(columnId, event),
    []
  );

  const stableOnOpenTableModal = useCallback<OnOpenTableModalFn>(
    (column, job, rows, columnHeaders) =>
      onOpenTableModalRef.current(column, job, rows, columnHeaders),
    []
  );

  const stableOnToggleRowExpansion = useCallback<OnToggleRowExpansionFn>(
    (rowId) => onToggleRowExpansionRef.current(rowId),
    []
  );

  const stableOnAddColumn = useCallback<OnAddColumnFn>(
    () => onAddColumnRef.current(),
    []
  );

  const stableOnSelectRow = useCallback<OnSelectRowFn>(
    (id) => onSelectRowRef.current(id),
    []
  );

  const stableOnRowDoubleClick = useCallback(
    (job: unknown) => onRowDoubleClickRef.current?.(job),
    []
  );

  return {
    stableRenderCellValue,
    stableGetStatusIcon,
    stableRenderStatusPill,
    stableOnEditColumn,
    stableOnDeleteColumn,
    stableOnUpdateCell,
    stableOnUpdateReviewStatus,
    stableOnColumnRightClick,
    stableOnOpenTableModal,
    stableOnToggleRowExpansion,
    stableOnAddColumn,
    stableOnSelectRow,
    stableOnRowDoubleClick,
  };
}
