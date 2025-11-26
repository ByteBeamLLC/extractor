import { useState, useMemo, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExtractionJob, SchemaDefinition } from '@/lib/schema'
import { ExtractionResultsView } from '@/components/document-viewer/ExtractionResultsView'
import { LabelMakerView, LabelData, DEFAULT_LABEL_DATA, NutritionRow } from '@/components/label-maker'
import { FileText, Tag, Image as ImageIcon } from 'lucide-react'

interface ExtractionDetailDialogProps {
    job: ExtractionJob | null
    schema: SchemaDefinition | null
    onClose: () => void
    /** If true, opens directly to Label Maker tab (for new records) */
    defaultToLabelMaker?: boolean
    /** Callback to save label data back to the job */
    onSaveLabelData?: (jobId: string, data: LabelData) => Promise<void>
}

export function ExtractionDetailDialog({ job, schema, onClose, defaultToLabelMaker, onSaveLabelData }: ExtractionDetailDialogProps) {
    const [activeTab, setActiveTab] = useState(defaultToLabelMaker ? "label-maker" : "data")
    
    // Reset tab when job changes
    useEffect(() => {
        if (job) {
            setActiveTab(defaultToLabelMaker ? "label-maker" : "data")
        }
    }, [job?.id, defaultToLabelMaker])

    const isGCCLabelSchema = schema?.templateId === "gcc-food-label" || schema?.name.toLowerCase().includes("gcc")

    // Map extraction results to LabelData
    const labelData = useMemo<LabelData>(() => {
        if (!job?.results || !isGCCLabelSchema) return DEFAULT_LABEL_DATA

        const r = job.results

        // Helper to safely get string/number
        const getStr = (key: string) => String(r[key] || "")
        const getNum = (key: string) => parseFloat(r[key]) || 0
        
        // Helper for nested objects (e.g., net_content.value)
        const getNested = (parent: string, key: string) => r[parent]?.[key]

        // Map Nutrition Facts
        // The schema uses "nutrition_per_100" object with specific keys like "energy_kcal_100"
        // LabelData uses an array of NutritionRow
        const nutritionMap: NutritionRow[] = []
        const n = r.nutrition_per_100 || {}

        // Energy
        if (n.energy_kcal_100) nutritionMap.push({ name: "Energy", per100g: parseFloat(n.energy_kcal_100) || 0, perServing: 0, unit: "kcal" })
        if (n.energy_kj_100) nutritionMap.push({ name: "Energy", per100g: parseFloat(n.energy_kj_100) || 0, perServing: 0, unit: "kJ" })
        
        // Macros
        if (n.total_fat_100) nutritionMap.push({ name: "Total Fat", per100g: parseFloat(n.total_fat_100) || 0, perServing: 0, unit: "g", dailyValue: 0 })
        if (n.saturated_fat_100) nutritionMap.push({ name: "Saturated Fat", per100g: parseFloat(n.saturated_fat_100) || 0, perServing: 0, unit: "g", isSubItem: true })
        if (n.trans_fat_100) nutritionMap.push({ name: "Trans Fat", per100g: parseFloat(n.trans_fat_100) || 0, perServing: 0, unit: "g", isSubItem: true })
        if (n.cholesterol_100) nutritionMap.push({ name: "Cholesterol", per100g: parseFloat(n.cholesterol_100) || 0, perServing: 0, unit: "mg" })
        if (n.sodium_100) nutritionMap.push({ name: "Sodium", per100g: parseFloat(n.sodium_100) || 0, perServing: 0, unit: "mg" })
        if (n.total_carbs_100) nutritionMap.push({ name: "Total Carbohydrate", per100g: parseFloat(n.total_carbs_100) || 0, perServing: 0, unit: "g" })
        if (n.fiber_100) nutritionMap.push({ name: "Dietary Fiber", per100g: parseFloat(n.fiber_100) || 0, perServing: 0, unit: "g", isSubItem: true })
        if (n.sugars_100) nutritionMap.push({ name: "Total Sugars", per100g: parseFloat(n.sugars_100) || 0, perServing: 0, unit: "g", isSubItem: true })
        if (n.added_sugars_100) nutritionMap.push({ name: "Added Sugars", per100g: parseFloat(n.added_sugars_100) || 0, perServing: 0, unit: "g", isSubItem: true })
        if (n.protein_100) nutritionMap.push({ name: "Protein", per100g: parseFloat(n.protein_100) || 0, perServing: 0, unit: "g" })

        return {
            ...DEFAULT_LABEL_DATA,
            barcode: getStr("barcode"),
            productName: getStr("product_name_en") || getStr("product_name"), // Fallback
            brandName: getStr("brand_name"),
            productDescription: getStr("product_description_en"),
            netWeight: parseFloat(getNested("net_content", "value")) || 0,
            netWeightUnit: getNested("net_content", "unit") || "g",
            
            // Manufacturer
            manufacturerName: getNested("manufacturer", "name_en") || getNested("manufacturer", "name"),
            manufacturerAddress: getNested("manufacturer", "address"),
            manufacturerCountry: getNested("manufacturer", "country"),
            
            // Origin
            countryOfOrigin: getStr("country_of_origin"),
            
            // Lists
            ingredients: Array.isArray(r.ingredients_en) ? r.ingredients_en : [],
            containsAllergens: r.allergens?.contains || [],
            mayContainAllergens: r.allergens?.may_contain || [],
            
            // Nutrition
            nutritionFacts: nutritionMap.length > 0 ? nutritionMap : DEFAULT_LABEL_DATA.nutritionFacts,
            
            // Instructions
            storageInstructions: getStr("storage_instructions_en"),
            usageInstructions: getStr("usage_instructions_en"),
            
            // Dates
            batchNumber: getStr("batch_number"),
            productionDate: getStr("production_date"),
            expiryDate: getStr("expiry_date"),
            
            // Certs
            halalCertified: getStr("halal_status") === "Halal Certified",
            halalCertifier: getStr("halal_certifier")
        }
    }, [job, isGCCLabelSchema])

    if (!job) return null

    return (
        <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="!w-[95vw] !max-w-[95vw] !h-[95vh] !max-h-[95vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>{job.fileName}</DialogTitle>
                            <DialogDescription className="mt-1">
                                Processed {new Date(job.createdAt).toLocaleDateString()} • {schema?.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 border-b shrink-0">
                        <TabsList className="bg-transparent h-12 p-0 space-x-2">
                            <TabsTrigger 
                                value="data" 
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Extraction Data
                            </TabsTrigger>
                            <TabsTrigger 
                                value="file" 
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                            >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Original File
                            </TabsTrigger>
                            {isGCCLabelSchema && (
                                <TabsTrigger 
                                    value="label-maker" 
                                    className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                                >
                                    <Tag className="w-4 h-4 mr-2" />
                                    Label Maker
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden bg-muted/10">
                        <TabsContent value="data" className="h-full m-0 p-0">
                            <ExtractionResultsView results={job.results || {}} />
                        </TabsContent>
                        
                        <TabsContent value="file" className="h-full m-0 p-0 flex items-center justify-center">
                            {job.ocrAnnotatedImageUrl ? (
                                <div className="h-full w-full overflow-auto flex items-center justify-center p-4">
                                    <img src={job.ocrAnnotatedImageUrl} alt="Original" className="max-w-full shadow-lg rounded-lg" />
                                </div>
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center">
                                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No preview available</p>
                                </div>
                            )}
                        </TabsContent>

                        {isGCCLabelSchema && (
                            <TabsContent value="label-maker" className="h-full m-0 p-0">
                                <LabelMakerView 
                                    initialData={labelData} 
                                    onSave={onSaveLabelData ? async (data) => {
                                        if (job) {
                                            await onSaveLabelData(job.id, data)
                                        }
                                    } : undefined}
                                />
                            </TabsContent>
                        )}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

