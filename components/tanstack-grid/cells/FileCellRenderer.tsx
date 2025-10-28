"use client";

import type { GridRow } from "../types";
import type { ReactNode } from "react";

interface FileCellRendererProps {
  row: GridRow;
  getStatusIcon: (status: GridRow["status"]) => ReactNode;
  renderStatusPill: (
    status: GridRow["status"],
    opts?: { size?: "default" | "compact" }
  ) => ReactNode;
}

export function FileCellRenderer({
  row,
  getStatusIcon,
  renderStatusPill,
}: FileCellRendererProps) {
  const job = row.__job;

  const pendingReviews = Object.values(job.review ?? {}).filter(
    (meta) => meta?.status === "needs_review"
  ).length;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-2">
        {getStatusIcon(job.status)}
        {renderStatusPill(job.status, { size: "compact" })}
      </div>
      <span
        className="truncate text-sm font-medium text-slate-700"
        title={job.fileName}
      >
        {job.fileName}
      </span>
      {pendingReviews > 0 ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
          Review {pendingReviews}
        </span>
      ) : null}
    </div>
  );
}

