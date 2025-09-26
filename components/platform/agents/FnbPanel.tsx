"use client"

import { useState } from "react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ExtractionJob } from "@/lib/schema/types"
import { FileText } from "lucide-react"

interface FnbPanelProps {
  jobs: ExtractionJob[]
  selectedJobId: string | null
  onSelectJob: (jobId: string) => void
  getStatusIcon: (status: ExtractionJob["status"]) => ReactNode
}

export function FnbPanel({ jobs, selectedJobId, onSelectJob, getStatusIcon }: FnbPanelProps) {
  const [collapse, setCollapse] = useState<Record<string, { en: boolean; ar: boolean }>>({})

  const job = jobs.find((j) => j.id === selectedJobId) || jobs[jobs.length - 1]

  if (!job) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No results yet. Upload a label image to get started.</p>
      </div>
    )
  }

  const extraction = job.results?.fnb_extraction?.product_initial_language || job.results?.fnb_extraction
  const translation = job.results?.fnb_translation
  const collapseState = collapse[job.id] || { en: false, ar: false }

  const toggleEN = () => setCollapse((prev) => ({ ...prev, [job.id]: { ...collapseState, en: !collapseState.en } }))
  const toggleAR = () => setCollapse((prev) => ({ ...prev, [job.id]: { ...collapseState, ar: !collapseState.ar } }))

  const KV = (label: string, value: unknown) =>
    value != null && value !== "" && value !== undefined ? (
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-right break-words">{String(value)}</span>
      </div>
    ) : null

  const List = (label: string, values: unknown[]) =>
    Array.isArray(values) && values.length > 0 ? (
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <ul className="list-disc pl-5 text-sm space-y-0.5">
          {values.map((item, index) => (
            <li key={index}>{String(item)}</li>
          ))}
        </ul>
      </div>
    ) : null

  return (
    <div className="space-y-4">
      {jobs.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Jobs:</span>
          {jobs.map((row, index) => (
            <button
              key={row.id}
              onClick={() => onSelectJob(row.id)}
              className={`px-2 py-1 rounded border text-xs ${selectedJobId === row.id ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}
            >
              {index + 1}. {row.fileName}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {KV("Barcode", (extraction as any)?.barcode)}
                {KV("Product Name", (extraction as any)?.productName)}
                <div className="space-y-1">
                  <div className="text-sm font-medium">Manufacturer</div>
                  <div className="space-y-1 rounded border p-2">
                    {KV("Name", (extraction as any)?.manufacturer?.name)}
                    {KV("Location", (extraction as any)?.manufacturer?.location)}
                    {KV("Additional Info", (extraction as any)?.manufacturer?.additionalInfo)}
                    {KV("Country", (extraction as any)?.manufacturer?.country)}
                  </div>
                </div>
                {KV("Product Description", (extraction as any)?.productDescription)}
                {List("Ingredients", (extraction as any)?.ingredients || [])}
                <div className="space-y-1">
                  <div className="text-sm font-medium">Serving Size Information</div>
                  <div className="space-y-1 rounded border p-2">
                    {KV("Serving Size", (extraction as any)?.servingSizeInformation?.servingSize)}
                    {KV("Unit", (extraction as any)?.servingSizeInformation?.servingSizeUnit)}
                    {KV("Servings / Container", (extraction as any)?.servingSizeInformation?.servingsPerContainer)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Nutritional Information (per 100g)</div>
                  <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                    {KV("Energy (kJ)", (extraction as any)?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                    {KV("Energy (kcal)", (extraction as any)?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                    {KV("Fat", (extraction as any)?.nutritionalInformationPer100g?.fatPer100g)}
                    {KV("Saturates", (extraction as any)?.nutritionalInformationPer100g?.saturatesPer100g)}
                    {KV("Carbohydrate", (extraction as any)?.nutritionalInformationPer100g?.carbohydratePer100g)}
                    {KV("Sugars", (extraction as any)?.nutritionalInformationPer100g?.sugarsPer100g)}
                    {KV("Fibre", (extraction as any)?.nutritionalInformationPer100g?.fiberPer100g)}
                    {KV("Protein", (extraction as any)?.nutritionalInformationPer100g?.proteinPer100g)}
                    {KV("Salt", (extraction as any)?.nutritionalInformationPer100g?.saltPer100g)}
                    {KV("Sodium", (extraction as any)?.nutritionalInformationPer100g?.sodiumPer100g)}
                    {KV("Cholesterol", (extraction as any)?.nutritionalInformationPer100g?.cholesterolPer100g)}
                    {KV("Trans Fat", (extraction as any)?.nutritionalInformationPer100g?.transFatPer100g)}
                    {KV("Added Sugar", (extraction as any)?.nutritionalInformationPer100g?.includesAddedSugarPer100g)}
                  </div>
                </div>
                {KV("Storage Information", (extraction as any)?.storageInformation)}
                {KV("Usage Information", (extraction as any)?.usageInformation)}
                {List("Allergy Information", (extraction as any)?.allergyInformation || [])}
                <div className="space-y-1">
                  <div className="text-sm font-medium">Weight Information</div>
                  <div className="space-y-1 rounded border p-2">
                    {KV("Net Weight", (extraction as any)?.weightInformation?.netWeight)}
                    {KV("Packaging Weight", (extraction as any)?.weightInformation?.packagingWeight)}
                  </div>
                </div>
                {KV("Product Status", (extraction as any)?.productStatus)}
                {KV("Status Reason", (extraction as any)?.productStatusReason)}
              </div>
            )}
          </CardContent>
        </Card>

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
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">English</div>
                    <button className="text-xs text-muted-foreground underline" onClick={toggleEN}>
                      {collapseState.en ? "Expand" : "Collapse"}
                    </button>
                  </div>
                  {!collapseState.en && (
                    <div className="space-y-2 rounded border p-2">
                      {KV("Barcode", (translation as any)?.english_product_info?.barcode)}
                      {KV("Product Name", (translation as any)?.english_product_info?.productName)}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Manufacturer</div>
                        <div className="space-y-1 rounded border p-2">
                          {KV("Name", (translation as any)?.english_product_info?.manufacturer?.name)}
                          {KV("Location", (translation as any)?.english_product_info?.manufacturer?.location)}
                          {KV("Additional Info", (translation as any)?.english_product_info?.manufacturer?.additionalInfo)}
                          {KV("Country", (translation as any)?.english_product_info?.manufacturer?.country)}
                        </div>
                      </div>
                      {KV("Product Description", (translation as any)?.english_product_info?.productDescription)}
                      {List("Ingredients", (translation as any)?.english_product_info?.ingredients || [])}
                      <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                        {KV("Energy (kJ)", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                        {KV("Energy (kcal)", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                        {KV("Fat", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.fatPer100g)}
                        {KV("Saturates", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.saturatesPer100g)}
                        {KV("Carbohydrate", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.carbohydratePer100g)}
                        {KV("Sugars", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.sugarsPer100g)}
                        {KV("Fibre", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.fiberPer100g)}
                        {KV("Protein", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.proteinPer100g)}
                        {KV("Salt", (translation as any)?.english_product_info?.nutritionalInformationPer100g?.saltPer100g)}
                      </div>
                      {KV("Storage Information", (translation as any)?.english_product_info?.storageInformation)}
                      {KV("Usage Information", (translation as any)?.english_product_info?.usageInformation)}
                      {List("Allergy Information", (translation as any)?.english_product_info?.allergyInformation || [])}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Arabic</div>
                    <button className="text-xs text-muted-foreground underline" onClick={toggleAR}>
                      {collapseState.ar ? "Expand" : "Collapse"}
                    </button>
                  </div>
                  {!collapseState.ar && (
                    <div className="space-y-2 rounded border p-2">
                      {KV("Barcode", (translation as any)?.arabic_product_info?.barcode)}
                      {KV("Product Name", (translation as any)?.arabic_product_info?.productName)}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Manufacturer</div>
                        <div className="space-y-1 rounded border p-2">
                          {KV("Name", (translation as any)?.arabic_product_info?.manufacturer?.name)}
                          {KV("Location", (translation as any)?.arabic_product_info?.manufacturer?.location)}
                          {KV("Additional Info", (translation as any)?.arabic_product_info?.manufacturer?.additionalInfo)}
                          {KV("Country", (translation as any)?.arabic_product_info?.manufacturer?.country)}
                        </div>
                      </div>
                      {KV("Product Description", (translation as any)?.arabic_product_info?.productDescription)}
                      {List("Ingredients", (translation as any)?.arabic_product_info?.ingredients || [])}
                      <div className="grid grid-cols-2 gap-2 rounded border p-2 text-sm">
                        {KV("Energy (kJ)", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kj)}
                        {KV("Energy (kcal)", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.energyPer100g?.kcal)}
                        {KV("Fat", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.fatPer100g)}
                        {KV("Saturates", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.saturatesPer100g)}
                        {KV("Carbohydrate", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.carbohydratePer100g)}
                        {KV("Sugars", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.sugarsPer100g)}
                        {KV("Fibre", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.fiberPer100g)}
                        {KV("Protein", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.proteinPer100g)}
                        {KV("Salt", (translation as any)?.arabic_product_info?.nutritionalInformationPer100g?.saltPer100g)}
                      </div>
                      {KV("Storage Information", (translation as any)?.arabic_product_info?.storageInformation)}
                      {KV("Usage Information", (translation as any)?.arabic_product_info?.usageInformation)}
                      {List("Allergy Information", (translation as any)?.arabic_product_info?.allergyInformation || [])}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Ingredients Comparison</div>
                  {(() => {
                    const enSet = new Set<string>((translation as any)?.english_product_info?.ingredients || [])
                    const arSet = new Set<string>((translation as any)?.arabic_product_info?.ingredients || [])
                    const missing: string[] = []
                    enSet.forEach((item) => {
                      if (!arSet.has(item)) missing.push(item)
                    })
                    return missing.length > 0 ? (
                      <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                        Missing Arabic Ingredients: {missing.join(", ")}
                      </div>
                    ) : (
                      <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
                        ✅ Arabic translation includes all English ingredients
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
