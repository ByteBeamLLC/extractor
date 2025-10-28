"use client";

interface RowIndexCellProps {
  rowIndex: number;
}

export function RowIndexCell({ rowIndex }: RowIndexCellProps) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {rowIndex + 1}
    </span>
  );
}

