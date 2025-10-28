"use client";

import { useLayoutEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DataType } from "@/lib/schema";

interface EditableValueInputProps {
  value: unknown;
  fieldType?: DataType;
  onChange: (value: unknown) => void;
}

const NUMERIC_TYPES: DataType[] = ["number", "decimal"];
const BOOLEAN_TYPES: DataType[] = ["boolean"];

export function EditableValueInput({ value, fieldType = "string", onChange }: EditableValueInputProps) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  const isNumericValue = !isNaN(Number(value)) && value !== null && value !== undefined && value !== "";
  const isMultiline = stringValue.includes("\n") || stringValue.length > 30;

  if (BOOLEAN_TYPES.includes(fieldType)) {
    return (
      <select
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={String(Boolean(value))}
        onChange={(event) => onChange(event.target.value === "true")}
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (NUMERIC_TYPES.includes(fieldType) || isNumericValue) {
    return (
      <Input
        type="number"
        value={stringValue}
        className="h-8 w-full min-w-[100px]"
        style={{ textAlign: 'right' }}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") {
            onChange(null);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isNaN(parsed) ? raw : parsed);
        }}
      />
    );
  }

  if (isMultiline) {
    return <AutoResizeTextarea value={stringValue} onChange={(event) => onChange(event.target.value)} />;
  }

  return (
    <Input
      value={stringValue}
      className="h-8 w-full"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface AutoResizeTextareaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function AutoResizeTextarea({ value, onChange }: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = "auto";
    // Set height based on content, with min/max limits
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 80), 300);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      rows={3}
      className="w-full resize-none text-sm leading-relaxed"
      style={{ minHeight: "80px" }}
    />
  );
}
