"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Globe,
  FileText,
  Save,
  Edit,
} from "lucide-react"
import type { ExtractionJob } from "@/lib/schema"

// Types for pharma data
interface DrugInfo {
  drugName?: string
  genericName?: string
  manufacturer?: string
  activeIngredients?: string
  dosage?: string
  dosageForm?: string
  packSize?: string
  batchNumber?: string
  expiryDate?: string
  otherIdentifiers?: string
  tradeName?: string
  drugType?: string
  registrationNumber?: string
}

interface DetailedInfo {
  description?: string
  composition?: string
  howToUse?: string
  indication?: string
  possibleSideEffects?: string
  properties?: string
  storage?: string
}

interface PharmaData {
  drugInfo?: DrugInfo
  detailedInfo?: DetailedInfo
  matchedDrugUrl?: string
  matchedDrugId?: string
  searchUrl?: string
  searchQuery?: string
  message?: string
  error?: string
}

export interface PharmaResultsViewProps {
  jobs: ExtractionJob[]
  selectedRowId: string | null
  onSelectRow: (rowId: string) => void
  onUpdateJobs: (jobs: ExtractionJob[]) => void
  // Editing state
  editingSection: string | null
  editedValues: Record<string, string>
  onSetEditingSection: (section: string | null) => void
  onSetEditedValues: (values: Record<string, string>) => void
}

/**
 * Get status icon for a job
 */
function getStatusIcon(status: ExtractionJob["status"]) {
  const iconSizing = "h-3.5 w-3.5"
  switch (status) {
    case "completed":
      return <CheckCircle className={`${iconSizing} text-accent`} />
    case "processing":
      return <Clock className={`${iconSizing} text-primary animate-spin`} />
    case "error":
      return <AlertCircle className={`${iconSizing} text-destructive`} />
    default:
      return <Clock className={`${iconSizing} text-muted-foreground`} />
  }
}

/**
 * Key-Value display helper
 */
function KV({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === '' || value === undefined) return null
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground font-medium">{label}:</span>
      <span className="text-right break-words">{String(value)}</span>
    </div>
  )
}

/**
 * Pharma results view component for displaying drug extraction results
 */
export function PharmaResultsView({
  jobs,
  selectedRowId,
  onSelectRow,
  onUpdateJobs,
  editingSection,
  editedValues,
  onSetEditingSection,
  onSetEditedValues,
}: PharmaResultsViewProps) {
  // Sort jobs by creation date
  const sortedJobs = [...jobs].sort((a, b) => {
    const aTime = a.createdAt?.getTime() ?? 0
    const bTime = b.createdAt?.getTime() ?? 0
    return aTime - bTime
  })

  return (
    <div className="p-4 space-y-4">
      {/* Job selector */}
      {sortedJobs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Jobs:</span>
          {sortedJobs.map((job, idx) => (
            <button
              key={job.id}
              onClick={() => onSelectRow(job.id)}
              className={`px-2 py-1 rounded border text-xs ${
                selectedRowId === job.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {idx + 1}. {job.fileName}
            </button>
          ))}
        </div>
      )}

      {/* Selected job panels */}
      {(() => {
        const job = sortedJobs.find((j) => j.id === selectedRowId) || sortedJobs[sortedJobs.length - 1]
        
        if (!job) {
          return (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results yet. Upload a drug label image or document to get started.</p>
            </div>
          )
        }

        const pharmaData = job.results?.pharma_data as PharmaData | undefined
        const drugInfo = pharmaData?.drugInfo
        const detailedInfo = pharmaData?.detailedInfo
        const matchedDrugUrl = pharmaData?.matchedDrugUrl
        const searchUrl = pharmaData?.searchUrl

        return (
          <div className="space-y-4">
            {/* Drug Information Card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Drug Information Extracted from File</h3>
                  {getStatusIcon(job.status)}
                </div>
                {!drugInfo ? (
                  <div className="text-sm text-muted-foreground">No drug information extracted</div>
                ) : (
                  <div className="space-y-2">
                    <KV label="Drug Name" value={drugInfo?.drugName} />
                    <KV label="Generic Name" value={drugInfo?.genericName} />
                    <KV label="Manufacturer" value={drugInfo?.manufacturer} />
                    <KV label="Active Ingredients" value={drugInfo?.activeIngredients} />
                    <KV label="Dosage" value={drugInfo?.dosage} />
                    <KV label="Dosage Form" value={drugInfo?.dosageForm} />
                    <KV label="Pack Size" value={drugInfo?.packSize} />
                    <KV label="Batch Number" value={drugInfo?.batchNumber} />
                    <KV label="Expiry Date" value={drugInfo?.expiryDate} />
                    <KV label="Other Identifiers" value={drugInfo?.otherIdentifiers} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saudi FDA Search Card */}
            {searchUrl && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">Saudi FDA Database Search</h3>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Search Query: </span>
                    <span className="font-medium">{pharmaData?.searchQuery || 'N/A'}</span>
                  </div>
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    View Search Results
                    <Globe className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Matched Drug Card */}
            {matchedDrugUrl && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">Matched Drug</h3>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Drug ID: </span>
                    <span className="font-medium">{pharmaData?.matchedDrugId || 'N/A'}</span>
                  </div>
                  <a
                    href={matchedDrugUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    View Drug Details on Saudi FDA
                    <Globe className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information Accordion */}
            {detailedInfo && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Detailed Drug Information</h3>
                  <Accordion type="multiple" className="w-full">
                    {[
                      { key: 'description', label: 'Description', value: detailedInfo?.description },
                      { key: 'composition', label: 'Composition', value: detailedInfo?.composition },
                      { key: 'howToUse', label: 'How To Use', value: detailedInfo?.howToUse },
                      { key: 'indication', label: 'Indication', value: detailedInfo?.indication },
                      { key: 'possibleSideEffects', label: 'Possible Side Effects', value: detailedInfo?.possibleSideEffects },
                      { key: 'properties', label: 'Properties', value: detailedInfo?.properties },
                      { key: 'storage', label: 'Storage', value: detailedInfo?.storage },
                    ].map((section) => {
                      if (!section.value || section.value === null) return null

                      const isEditing = editingSection === section.key
                      const currentValue = editedValues[section.key] ?? section.value

                      const handleSave = () => {
                        // Update the job results with the edited value
                        const updatedJobs = jobs.map((j) => {
                          if (j.id === job.id && j.results) {
                            return {
                              ...j,
                              results: {
                                ...j.results,
                                pharma_data: {
                                  ...(j.results.pharma_data as PharmaData),
                                  detailedInfo: {
                                    ...((j.results.pharma_data as PharmaData)?.detailedInfo || {}),
                                    [section.key]: currentValue,
                                  },
                                },
                              },
                            }
                          }
                          return j
                        })
                        onUpdateJobs(updatedJobs)
                        onSetEditingSection(null)
                      }

                      const handleEdit = () => {
                        onSetEditedValues({ ...editedValues, [section.key]: section.value || '' })
                        onSetEditingSection(section.key)
                      }

                      const handleCancel = () => {
                        onSetEditingSection(null)
                        const newValues = { ...editedValues }
                        delete newValues[section.key]
                        onSetEditedValues(newValues)
                      }

                      return (
                        <AccordionItem key={section.key} value={section.key}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-semibold">{section.label}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-2">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={currentValue}
                                    onChange={(e) =>
                                      onSetEditedValues({
                                        ...editedValues,
                                        [section.key]: e.target.value,
                                      })
                                    }
                                    className="min-h-[200px] font-normal"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSave}>
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleCancel}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-sm whitespace-pre-wrap">{currentValue}</div>
                                  <Button size="sm" variant="outline" onClick={handleEdit}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Message Card */}
            {pharmaData?.message && (
              <Card>
                <CardContent>
                  <div className="text-sm text-muted-foreground">{pharmaData.message}</div>
                </CardContent>
              </Card>
            )}

            {/* Error Card */}
            {job.status === 'error' && (
              <Card className="border-destructive">
                <CardContent className="p-4 space-y-2">
                  <div className="font-semibold text-destructive">Error</div>
                  <div className="text-sm text-destructive">
                    {pharmaData?.error ||
                      'An error occurred during drug information extraction. Please try again with a clearer image or document.'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Card */}
            {job.status === 'processing' && !pharmaData && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground animate-pulse">
                    Processing drug information extraction and Saudi FDA database search...
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      })()}
    </div>
  )
}

