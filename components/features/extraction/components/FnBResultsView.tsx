"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, FileText } from "lucide-react"
import type { ExtractionJob } from "@/lib/schema"

// Types for F&B data
interface Manufacturer {
  name?: string
  location?: string
  additionalInfo?: string
  country?: string
}

interface ServingSizeInformation {
  servingSize?: string
  servingSizeUnit?: string
  servingsPerContainer?: string
}

interface EnergyInfo {
  kj?: string
  kcal?: string
}

interface NutritionalInformation {
  energyPer100g?: EnergyInfo
  fatPer100g?: string
  saturatesPer100g?: string
  carbohydratePer100g?: string
  sugarsPer100g?: string
  fiberPer100g?: string
  proteinPer100g?: string
  saltPer100g?: string
  sodiumPer100g?: string
  cholesterolPer100g?: string
  transFatPer100g?: string
  includesAddedSugarPer100g?: string
}

interface WeightInformation {
  netWeight?: string
  packagingWeight?: string
}

interface FnBExtraction {
  barcode?: string
  productName?: string
  manufacturer?: Manufacturer
  productDescription?: string
  ingredients?: string[]
  servingSizeInformation?: ServingSizeInformation
  nutritionalInformationPer100g?: NutritionalInformation
  storageInformation?: string
  usageInformation?: string
  allergyInformation?: string[]
  weightInformation?: WeightInformation
  productStatus?: string
  productStatusReason?: string
}

interface ProductInfo {
  barcode?: string
  productName?: string
  manufacturer?: Manufacturer
  productDescription?: string
  ingredients?: string[]
  nutritionalInformationPer100g?: NutritionalInformation
  storageInformation?: string
  usageInformation?: string
  allergyInformation?: string[]
  weightInformation?: WeightInformation
}

interface FnBTranslation {
  english_product_info?: ProductInfo
  arabic_product_info?: ProductInfo
}

export interface CollapseState {
  en: boolean
  ar: boolean
}

export interface FnBResultsViewProps {
  jobs: ExtractionJob[]
  selectedRowId: string | null
  onSelectRow: (rowId: string) => void
  collapseState: Record<string, CollapseState>
  onToggleEnglish: (jobId: string) => void
  onToggleArabic: (jobId: string) => void
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
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right break-words">{String(value)}</span>
    </div>
  )
}

/**
 * List display helper
 */
function List({ label, items }: { label: string; items: unknown[] | undefined }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <ul className="list-disc pl-5 text-sm space-y-0.5">
        {items.map((it, i) => (
          <li key={i}>{String(it)}</li>
        ))}
      </ul>
    </div>
  )
}

/**
 * F&B Label Compliance results view component
 */
export function FnBResultsView({
  jobs,
  selectedRowId,
  onSelectRow,
  collapseState,
  onToggleEnglish,
  onToggleArabic,
}: FnBResultsViewProps) {
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
              <p>No results yet. Upload a label image to get started.</p>
            </div>
          )
        }

        const fnbExtraction = job.results?.fnb_extraction as { product_initial_language?: FnBExtraction } | FnBExtraction | undefined
        const extraction = (fnbExtraction && 'product_initial_language' in fnbExtraction 
          ? fnbExtraction.product_initial_language 
          : fnbExtraction) as FnBExtraction | undefined
        const translation = job.results?.fnb_translation as FnBTranslation | undefined
        const jobCollapseState = collapseState[job.id] || { en: false, ar: false }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extraction Result Card */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Extraction Result (Primary Language)</h3>
                  {getStatusIcon(job.status)}
                </div>
                {!extraction ? (
                  <div className="text-sm text-muted-foreground">No extraction data</div>
                ) : (
                  <div className="space-y-3">
                    <KV label="Barcode" value={extraction?.barcode} />
                    <KV label="Product Name" value={extraction?.productName} />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Manufacturer</div>
                      <div className="space-y-1 rounded border p-2">
                        <KV label="Name" value={extraction?.manufacturer?.name} />
                        <KV label="Location" value={extraction?.manufacturer?.location} />
                        <KV label="Additional Info" value={extraction?.manufacturer?.additionalInfo} />
                        <KV label="Country" value={extraction?.manufacturer?.country} />
                      </div>
                    </div>
                    <KV label="Product Description" value={extraction?.productDescription} />
                    <List label="Ingredients" items={extraction?.ingredients} />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Serving Size Information</div>
                      <div className="space-y-1 rounded border p-2">
                        <KV label="Serving Size" value={extraction?.servingSizeInformation?.servingSize} />
                        <KV label="Unit" value={extraction?.servingSizeInformation?.servingSizeUnit} />
                        <KV label="Servings / Container" value={extraction?.servingSizeInformation?.servingsPerContainer} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Nutritional Information (per 100g)</div>
                      <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                        <KV label="Energy (kJ)" value={extraction?.nutritionalInformationPer100g?.energyPer100g?.kj} />
                        <KV label="Energy (kcal)" value={extraction?.nutritionalInformationPer100g?.energyPer100g?.kcal} />
                        <KV label="Fat" value={extraction?.nutritionalInformationPer100g?.fatPer100g} />
                        <KV label="Saturates" value={extraction?.nutritionalInformationPer100g?.saturatesPer100g} />
                        <KV label="Carbohydrate" value={extraction?.nutritionalInformationPer100g?.carbohydratePer100g} />
                        <KV label="Sugars" value={extraction?.nutritionalInformationPer100g?.sugarsPer100g} />
                        <KV label="Fibre" value={extraction?.nutritionalInformationPer100g?.fiberPer100g} />
                        <KV label="Protein" value={extraction?.nutritionalInformationPer100g?.proteinPer100g} />
                        <KV label="Salt" value={extraction?.nutritionalInformationPer100g?.saltPer100g} />
                        <KV label="Sodium" value={extraction?.nutritionalInformationPer100g?.sodiumPer100g} />
                        <KV label="Cholesterol" value={extraction?.nutritionalInformationPer100g?.cholesterolPer100g} />
                        <KV label="Trans Fat" value={extraction?.nutritionalInformationPer100g?.transFatPer100g} />
                        <KV label="Added Sugar" value={extraction?.nutritionalInformationPer100g?.includesAddedSugarPer100g} />
                      </div>
                    </div>
                    <KV label="Storage Information" value={extraction?.storageInformation} />
                    <KV label="Usage Information" value={extraction?.usageInformation} />
                    <List label="Allergy Information" items={extraction?.allergyInformation} />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Weight Information</div>
                      <div className="space-y-1 rounded border p-2">
                        <KV label="Net Weight" value={extraction?.weightInformation?.netWeight} />
                        <KV label="Packaging Weight" value={extraction?.weightInformation?.packagingWeight} />
                      </div>
                    </div>
                    <KV label="Product Status" value={extraction?.productStatus} />
                    <KV label="Status Reason" value={extraction?.productStatusReason} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translations Card */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Translations (EN / AR)</h3>
                  {getStatusIcon(job.status)}
                </div>
                {!translation ? (
                  <div className="text-sm text-muted-foreground">No translation data</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {/* English */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">English</div>
                        <button
                          className="text-xs text-muted-foreground underline"
                          onClick={() => onToggleEnglish(job.id)}
                        >
                          {jobCollapseState.en ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                      {!jobCollapseState.en && (
                        <div className="space-y-2 rounded border p-2">
                          <KV label="Barcode" value={translation?.english_product_info?.barcode} />
                          <KV label="Product Name" value={translation?.english_product_info?.productName} />
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Manufacturer</div>
                            <div className="space-y-1 rounded border p-2">
                              <KV label="Name" value={translation?.english_product_info?.manufacturer?.name} />
                              <KV label="Location" value={translation?.english_product_info?.manufacturer?.location} />
                              <KV label="Additional Info" value={translation?.english_product_info?.manufacturer?.additionalInfo} />
                              <KV label="Country" value={translation?.english_product_info?.manufacturer?.country} />
                            </div>
                          </div>
                          <KV label="Product Description" value={translation?.english_product_info?.productDescription} />
                          <List label="Ingredients" items={translation?.english_product_info?.ingredients} />
                          <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                            <KV label="Energy (kJ)" value={translation?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj} />
                            <KV label="Energy (kcal)" value={translation?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal} />
                            <KV label="Fat" value={translation?.english_product_info?.nutritionalInformationPer100g?.fatPer100g} />
                            <KV label="Saturates" value={translation?.english_product_info?.nutritionalInformationPer100g?.saturatesPer100g} />
                            <KV label="Carbohydrate" value={translation?.english_product_info?.nutritionalInformationPer100g?.carbohydratePer100g} />
                            <KV label="Sugars" value={translation?.english_product_info?.nutritionalInformationPer100g?.sugarsPer100g} />
                            <KV label="Fibre" value={translation?.english_product_info?.nutritionalInformationPer100g?.fiberPer100g} />
                            <KV label="Protein" value={translation?.english_product_info?.nutritionalInformationPer100g?.proteinPer100g} />
                            <KV label="Salt" value={translation?.english_product_info?.nutritionalInformationPer100g?.saltPer100g} />
                          </div>
                          <KV label="Storage Information" value={translation?.english_product_info?.storageInformation} />
                          <KV label="Usage Information" value={translation?.english_product_info?.usageInformation} />
                          <List label="Allergy Information" items={translation?.english_product_info?.allergyInformation} />
                          <div className="space-y-1 rounded border p-2">
                            <KV label="Net Weight" value={translation?.english_product_info?.weightInformation?.netWeight} />
                            <KV label="Packaging Weight" value={translation?.english_product_info?.weightInformation?.packagingWeight} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Arabic */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Arabic</div>
                        <button
                          className="text-xs text-muted-foreground underline"
                          onClick={() => onToggleArabic(job.id)}
                        >
                          {jobCollapseState.ar ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                      {!jobCollapseState.ar && (
                        <div className="space-y-2 rounded border p-2">
                          <KV label="Barcode" value={translation?.arabic_product_info?.barcode} />
                          <KV label="Product Name" value={translation?.arabic_product_info?.productName} />
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Manufacturer</div>
                            <div className="space-y-1 rounded border p-2">
                              <KV label="Name" value={translation?.arabic_product_info?.manufacturer?.name} />
                              <KV label="Location" value={translation?.arabic_product_info?.manufacturer?.location} />
                              <KV label="Additional Info" value={translation?.arabic_product_info?.manufacturer?.additionalInfo} />
                              <KV label="Country" value={translation?.arabic_product_info?.manufacturer?.country} />
                            </div>
                          </div>
                          <KV label="Product Description" value={translation?.arabic_product_info?.productDescription} />
                          <List label="Ingredients" items={translation?.arabic_product_info?.ingredients} />
                          <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                            <KV label="Energy (kJ)" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj} />
                            <KV label="Energy (kcal)" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal} />
                            <KV label="Fat" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.fatPer100g} />
                            <KV label="Saturates" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.saturatesPer100g} />
                            <KV label="Carbohydrate" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.carbohydratePer100g} />
                            <KV label="Sugars" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.sugarsPer100g} />
                            <KV label="Fibre" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.fiberPer100g} />
                            <KV label="Protein" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.proteinPer100g} />
                            <KV label="Salt" value={translation?.arabic_product_info?.nutritionalInformationPer100g?.saltPer100g} />
                          </div>
                          <KV label="Storage Information" value={translation?.arabic_product_info?.storageInformation} />
                          <KV label="Usage Information" value={translation?.arabic_product_info?.usageInformation} />
                          <List label="Allergy Information" items={translation?.arabic_product_info?.allergyInformation} />
                          <div className="space-y-1 rounded border p-2">
                            <KV label="Net Weight" value={translation?.arabic_product_info?.weightInformation?.netWeight} />
                            <KV label="Packaging Weight" value={translation?.arabic_product_info?.weightInformation?.packagingWeight} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}

