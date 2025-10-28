"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import type { GridRow } from "../types";
import { getOptionColor } from "../utils/colorGenerator";

interface MultiSelectCellProps {
  value: string[] | null;
  row: GridRow;
  columnId: string;
  options: string[];
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
}

export function MultiSelectCell({
  value,
  row,
  columnId,
  options,
  onUpdateCell,
}: MultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const job = row.__job;
  const selectedValues = value || [];

  const handleToggle = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onUpdateCell(job.id, columnId, newValues.length > 0 ? newValues : null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateCell(job.id, columnId, null);
  };

  const handleRemoveValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(v => v !== valueToRemove);
    onUpdateCell(job.id, columnId, newValues.length > 0 ? newValues : null);
  };

  if (selectedValues.length === 0) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <span className="text-sm">Select...</span>
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {options.map((option, index) => {
                  const colorScheme = getOptionColor(index, option);
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleToggle(option)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={false}
                        onChange={() => handleToggle(option)}
                        className="pointer-events-none"
                      />
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colorScheme.bg }}
                      />
                      {option}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Show badges for selected values
  const maxVisible = 3;
  const visibleValues = selectedValues.slice(0, maxVisible);
  const remainingCount = selectedValues.length - maxVisible;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="group flex flex-wrap items-center gap-1">
          {visibleValues.map((selectedValue, index) => {
            const optionIndex = options.indexOf(selectedValue);
            const colorScheme = optionIndex >= 0 ? getOptionColor(optionIndex, selectedValue) : getOptionColor(index, selectedValue);
            
            return (
              <div key={selectedValue} className="flex items-center gap-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                    "hover:opacity-80"
                  )}
                  style={{
                    backgroundColor: colorScheme.bg,
                    color: colorScheme.text,
                    borderColor: colorScheme.border,
                  }}
                >
                  {selectedValue}
                </span>
                <button
                  onClick={(e) => handleRemoveValue(selectedValue, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            );
          })}
          {remainingCount > 0 && (
            <span className="text-xs text-muted-foreground">
              +{remainingCount} more
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option, index) => {
                const colorScheme = getOptionColor(index, option);
                const isSelected = selectedValues.includes(option);
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleToggle(option)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggle(option)}
                      className="pointer-events-none"
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: colorScheme.bg }}
                    />
                    {option}
                    {isSelected && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
