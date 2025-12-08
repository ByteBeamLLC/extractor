"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Upload,
  Download,
  Plus,
  LayoutGrid,
  Grid,
  Printer,
  Gauge,
} from "lucide-react"
import type { AgentType } from "@/lib/extraction/types"

export interface ExtractionToolbarProps {
  // View state
  viewMode: 'grid' | 'gallery'
  onViewModeChange: (mode: 'grid' | 'gallery') => void

  // Agent selection
  selectedAgent: AgentType
  onAgentChange: (agent: AgentType) => void
  showAgentSelector: boolean

  // Actions
  onUploadClick: () => void
  onExportCSV: () => void
  onAddColumn: () => void
  onPrintLabel?: () => void

  // Feature flags
  showAddColumn: boolean
  showPrintLabel: boolean
  hasJobs: boolean
  disabled?: boolean
}

export function ExtractionToolbar({
  viewMode,
  onViewModeChange,
  selectedAgent,
  onAgentChange,
  showAgentSelector,
  onUploadClick,
  onExportCSV,
  onAddColumn,
  onPrintLabel,
  showAddColumn,
  showPrintLabel,
  hasJobs,
  disabled = false,
}: ExtractionToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/70 bg-slate-50/50">
      <div className="flex items-center gap-2">
        {/* Agent selector */}
        {showAgentSelector && (
          <Select
            value={selectedAgent}
            onValueChange={(value: AgentType) => onAgentChange(value)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="pharma">Pharma</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Add column button */}
        {showAddColumn && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onAddColumn}
                disabled={disabled}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a new extraction field</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex items-center rounded-md border border-slate-200 p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                onClick={() => onViewModeChange('grid')}
                className="h-7 px-2"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
                onClick={() => onViewModeChange('gallery')}
                className="h-7 px-2"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gallery view</TooltipContent>
          </Tooltip>
        </div>

        {/* Print label (F&B specific) */}
        {showPrintLabel && onPrintLabel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onPrintLabel}
                disabled={disabled || !hasJobs}
                className="h-8"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print Label
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Print localized product label</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Export CSV */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={onExportCSV}
              disabled={disabled || !hasJobs}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export results to CSV</p>
          </TooltipContent>
        </Tooltip>

        {/* Upload button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onUploadClick}
              disabled={disabled}
              className="h-8"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upload documents for extraction</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

