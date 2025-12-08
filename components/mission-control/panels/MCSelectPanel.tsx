"use client"

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MCSelectPanelProps {
    value: string
    options: string[]
    onChange: (value: string) => void
    multiple?: boolean
}

export function MCSelectPanel({ value, options, onChange, multiple = false }: MCSelectPanelProps) {
    const [search, setSearch] = useState('')

    // Parse value for multiple select
    const selectedValues = useMemo(() => {
        if (multiple) {
            return Array.isArray(value) ? value : [value].filter(Boolean)
        }
        return [value].filter(Boolean)
    }, [value, multiple])

    const filteredOptions = useMemo(() => {
        if (!search) return options
        return options.filter(opt =>
            opt.toLowerCase().includes(search.toLowerCase())
        )
    }, [options, search])

    const handleSelect = (option: string) => {
        if (multiple) {
            const current = selectedValues
            const newValue = current.includes(option)
                ? current.filter(v => v !== option)
                : [...current, option]
            onChange(newValue as any)
        } else {
            onChange(option)
        }
    }

    return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {/* Search */}
            <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs"
            />

            {/* Options */}
            <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option)

                    return (
                        <div
                            key={option}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm",
                                "hover:bg-slate-100 transition-colors",
                                isSelected && "text-orange-600"
                            )}
                            onClick={() => handleSelect(option)}
                        >
                            {multiple ? (
                                // Checkbox style
                                <div className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                                    isSelected
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "border-slate-300"
                                )}>
                                    {isSelected && (
                                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            ) : (
                                // Radio style
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                    isSelected
                                        ? "border-orange-500"
                                        : "border-slate-300"
                                )}>
                                    {isSelected && (
                                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    )}
                                </div>
                            )}
                            <span className={cn(
                                isSelected && !multiple && "text-orange-600",
                                isSelected && multiple && "text-green-700"
                            )}>
                                {option}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
