"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
type ContentType = "object" | "list" | "table";

interface NestedGridModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  contentType?: ContentType;
  columnCount?: number; // For tables, to help determine width
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw]",
};

const contentTypeDefaults: Record<ContentType, ModalSize> = {
  object: "md",
  list: "lg",
  table: "xl",
};

export function NestedGridModal({ 
  open, 
  onOpenChange, 
  title, 
  children,
  size,
  contentType = "object",
  columnCount = 0,
}: NestedGridModalProps) {
  // Determine optimal size based on content type and column count
  const getOptimalSize = (): ModalSize => {
    if (size) return size;
    
    // For tables, adjust size based on column count
    if (contentType === "table") {
      if (columnCount >= 8) return "full";
      if (columnCount >= 6) return "xl";
      if (columnCount >= 4) return "lg";
      return "md";
    }
    
    return contentTypeDefaults[contentType];
  };

  const modalSize = getOptimalSize();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "w-full overflow-hidden flex flex-col",
          sizeClasses[modalSize],
          // Dynamic height based on content type
          contentType === "table" ? "max-h-[85vh]" : "max-h-[80vh]"
        )}
      >
        <DialogHeader className="border-b border-slate-200/60 pb-3 dark:border-slate-700">
          <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className={cn(
          "flex-1 overflow-auto px-2 py-4",
          // Add horizontal scroll for tables with many columns
          contentType === "table" && "overflow-x-auto"
        )}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
