"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { GridRow } from "../types";
import { getOptionColor } from "../utils/colorGenerator";

interface SingleSelectCellProps {
  value: string | null;
  row: GridRow;
  columnId: string;
  options: string[];
  onUpdateCell: (jobId: string, columnId: string, value: unknown) => void;
}

export function SingleSelectCell({
  value,
  row,
  columnId,
  options,
  onUpdateCell,
}: SingleSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const job = row.__job;

  const handleSelect = (selectedValue: string) => {
    onUpdateCell(job.id, columnId, selectedValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateCell(job.id, columnId, null);
  };

  if (!value) {
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
                      onSelect={() => handleSelect(option)}
                      className="flex items-center gap-2"
                    >
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

  const selectedIndex = options.indexOf(value);
  const colorScheme = selectedIndex >= 0 ? getOptionColor(selectedIndex, value) : getOptionColor(0, value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="group flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              "hover:opacity-80 cursor-pointer"
            )}
            style={{
              backgroundColor: colorScheme.bg,
              color: colorScheme.text,
              borderColor: colorScheme.border,
            }}
          >
            {value}
          </span>
          <button
            onClick={handleClear}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option, index) => {
                const optionColorScheme = getOptionColor(index, option);
                const isSelected = option === value;
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: optionColorScheme.bg }}
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
