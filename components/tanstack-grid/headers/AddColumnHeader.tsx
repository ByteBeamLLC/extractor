"use client";

import { Plus } from "lucide-react";

interface AddColumnHeaderProps {
  onAddColumn: () => void;
}

export function AddColumnHeader({ onAddColumn }: AddColumnHeaderProps) {
  return (
    <div className="flex w-full items-center justify-center">
      <button
        type="button"
        title="Add Field"
        onClick={(e) => {
          e.preventDefault();
          onAddColumn();
        }}
        className="p-2 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 bg-gray-100"
        aria-label="Add Field"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

