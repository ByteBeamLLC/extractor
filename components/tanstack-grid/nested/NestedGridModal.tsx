"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReactNode } from "react";

interface NestedGridModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function NestedGridModal({ open, onOpenChange, title, children }: NestedGridModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200/60 pb-4">
          <DialogTitle className="text-lg font-semibold text-slate-800">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-2 py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
