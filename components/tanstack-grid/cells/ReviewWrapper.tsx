"use client";

import type { GridRow, ColumnMeta } from "../types";
import { cn } from "@/lib/utils";

interface ReviewWrapperProps {
  job: GridRow["__job"];
  columnId: string;
  onUpdateReviewStatus?: ColumnMeta["onUpdateReviewStatus"];
  children: React.ReactNode;
  onDoubleClick?: () => void;
}

export function ReviewWrapper({
  job,
  columnId,
  onUpdateReviewStatus,
  children,
  onDoubleClick,
}: ReviewWrapperProps) {
  const review = job.review?.[columnId];
  const reviewStatus = review?.status ?? "auto_verified";
  const needsReview = reviewStatus === "needs_review";
  const isVerified = reviewStatus === "verified";

  const handleQuickVerify = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onUpdateReviewStatus?.(job.id, columnId, "verified", {
      reason: "Marked as verified in grid",
    });
  };

  const reviewBadge = () => {
    if (needsReview) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Needs Review
          </span>
          <button
            type="button"
            onClick={handleQuickVerify}
            className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 hover:underline"
          >
            Mark Verified
          </button>
        </div>
      );
    }
    if (isVerified) {
      return (
        <div className="inline-flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            Verified
          </span>
        </div>
      );
    }
    return null;
  };

  const reviewReason =
    needsReview && review?.reason ? (
      <div className="text-[11px] text-amber-700">{review.reason}</div>
    ) : null;

  const hasMetaInfo = Boolean(needsReview || isVerified || reviewReason);

  return (
    <div
      className={cn(
        "w-full",
        hasMetaInfo && "space-y-1",
        needsReview &&
          "rounded-md border border-amber-300/80 bg-amber-50/60 p-2"
      )}
      onDoubleClick={onDoubleClick}
    >
      {reviewBadge()}
      {reviewReason}
      <div className={cn(needsReview ? "text-sm text-slate-900" : undefined)}>
        {children}
      </div>
    </div>
  );
}

