"use client";

import type { FlatLeaf } from "@/lib/schema";

interface EmptyNestedCellProps {
  column: FlatLeaf;
}

export function EmptyNestedCell({ column }: EmptyNestedCellProps) {
  return (
    <div className="flex h-full w-full items-center justify-center py-6 text-xs text-slate-400">
      No {column.name} data
    </div>
  );
}
