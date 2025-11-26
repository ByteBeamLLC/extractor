"use client"

import * as React from "react"
import Barcode from "react-barcode"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { LabelData, NutritionRow } from "./LabelDataForm"

interface LabelPreviewProps {
    data: LabelData
}

function formatDate(dateStr: string): string {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
}

export function LabelPreview({ data }: LabelPreviewProps) {
    const hasIngredients = data.ingredients.length > 0 && data.ingredients.some(i => i.name?.trim())
    const hasAllergens = data.containsAllergens.length > 0
    const hasMayContain = data.mayContainAllergens.length > 0
    const hasNutrition = data.nutritionFacts.some(r => r.per100g > 0 || r.perServing > 0)

    return (
        <div className="bg-white border border-neutral-300 shadow-sm w-[420px] shrink-0 origin-top-left">
            {/* Product Header */}
            <div className="p-4 border-b border-neutral-200">
                        {data.brandName && (
                            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">
                                {data.brandName}
                            </p>
                        )}
                        <h1 className="text-lg font-bold text-neutral-900 leading-tight">
                            {data.productName || "Product Name"}
                        </h1>
                        {data.productDescription && (
                            <p className="text-xs text-neutral-600 mt-1">{data.productDescription}</p>
                        )}
                    </div>

                    {/* Net Weight Badge */}
                    {data.netWeight > 0 && (
                        <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                            <span className="text-sm font-semibold">
                                Net Wt. {data.netWeight}{data.netWeightUnit}
                            </span>
                            {data.servingsPerContainer > 0 && (
                                <span className="text-xs text-neutral-500 ml-2">
                                    ({data.servingsPerContainer} servings)
                                </span>
                            )}
                        </div>
                    )}

                    {/* Nutrition Facts Panel - FDA Style */}
                    {hasNutrition && (
                        <div className="m-4 border-2 border-black">
                            {/* Header */}
                            <div className="bg-black text-white px-2 py-1">
                                <h2 className="text-2xl font-black tracking-tight">Nutrition Facts</h2>
                            </div>
                            
                            {/* Serving Info */}
                            <div className="px-2 py-1 border-b-8 border-black">
                                {data.servingsPerContainer > 0 && (
                                    <p className="text-xs">
                                        <span className="font-bold">{data.servingsPerContainer}</span> servings per container
                                    </p>
                                )}
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-bold">Serving size</span>
                                    <span className="text-sm font-bold">
                                        {data.servingSize > 0 ? `${data.servingSize}${data.servingSizeUnit}` : "—"}
                                    </span>
                                </div>
                            </div>

                            {/* Column Headers */}
                            <div className="px-2 py-1 border-b border-black bg-neutral-100">
                                <div className="flex text-[10px] font-bold">
                                    <div className="flex-1"></div>
                                    <div className="w-16 text-right">Per 100g</div>
                                    <div className="w-16 text-right">Per Serving</div>
                                    <div className="w-10 text-right">%DV*</div>
                                </div>
                            </div>

                            {/* Nutrition Rows */}
                            <div className="divide-y divide-neutral-300">
                                {data.nutritionFacts.map((row, index) => (
                                    <NutritionFactRow key={index} row={row} />
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="px-2 py-1 border-t border-black text-[8px] text-neutral-600">
                                * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
                            </div>
                        </div>
                    )}

                    {/* Ingredients Section */}
                    {hasIngredients && (
                        <div className="px-4 py-3 border-t border-neutral-200">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1">Ingredients</h3>
                            <p className="text-[11px] leading-relaxed text-neutral-700">
                                {data.ingredients.filter(i => i.name?.trim()).map(i => i.name).join(", ")}.
                            </p>
                        </div>
                    )}

                    {/* Allergen Section */}
                    {(hasAllergens || hasMayContain) && (
                        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1">Allergen Information</h3>
                            {hasAllergens && (
                                <p className="text-[11px] text-neutral-800">
                                    <span className="font-bold">Contains: </span>
                                    <span className="font-bold uppercase">{data.containsAllergens.join(", ")}</span>
                                </p>
                            )}
                            {hasMayContain && (
                                <p className="text-[11px] text-neutral-800 mt-0.5">
                                    <span className="font-bold">May contain traces of: </span>
                                    {data.mayContainAllergens.join(", ")}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Storage & Usage */}
                    {(data.storageInstructions || data.usageInstructions) && (
                        <div className="px-4 py-3 border-t border-neutral-200 space-y-1">
                            {data.storageInstructions && (
                                <p className="text-[10px] text-neutral-700">
                                    <span className="font-bold uppercase">Storage: </span>
                                    {data.storageInstructions}
                                </p>
                            )}
                            {data.usageInstructions && (
                                <p className="text-[10px] text-neutral-700">
                                    <span className="font-bold uppercase">Preparation: </span>
                                    {data.usageInstructions}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Dates & Batch */}
                    <div className="px-4 py-3 border-t border-neutral-200 grid grid-cols-2 gap-2 text-[10px]">
                        {data.batchNumber && (
                            <div>
                                <span className="font-bold uppercase">Batch: </span>
                                <span className="font-mono">{data.batchNumber}</span>
                            </div>
                        )}
                        {data.productionDate && (
                            <div>
                                <span className="font-bold uppercase">Mfg: </span>
                                {formatDate(data.productionDate)}
                            </div>
                        )}
                        {data.expiryDate && (
                            <div className="col-span-2">
                                <span className="font-bold uppercase">Best Before: </span>
                                <span className="font-bold">{formatDate(data.expiryDate)}</span>
                            </div>
                        )}
                    </div>

                    {/* Manufacturer / Importer Info */}
                    <div className="px-4 py-3 border-t border-neutral-200 text-[9px] text-neutral-600 space-y-1">
                        {data.manufacturerName && (
                            <div>
                                <span className="font-bold uppercase">Manufactured by: </span>
                                {data.manufacturerName}
                                {data.manufacturerAddress && `, ${data.manufacturerAddress}`}
                                {data.manufacturerCountry && `, ${data.manufacturerCountry}`}
                            </div>
                        )}
                        {data.importerName && (
                            <div>
                                <span className="font-bold uppercase">Imported by: </span>
                                {data.importerName}
                                {data.importerAddress && `, ${data.importerAddress}`}
                            </div>
                        )}
                        {data.countryOfOrigin && (
                            <div>
                                <span className="font-bold uppercase">Country of Origin: </span>
                                {data.countryOfOrigin}
                            </div>
                        )}
                    </div>

                    {/* Halal Certification */}
                    {data.halalCertified && (
                        <div className="px-4 py-2 border-t border-neutral-200 flex items-center gap-3">
                            <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold">حلال</span>
                            </div>
                            <div className="text-[9px]">
                                <p className="font-bold uppercase">Halal Certified</p>
                                {data.halalCertifier && (
                                    <p className="text-neutral-500">Certified by: {data.halalCertifier}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Barcode */}
                    {data.barcode && data.barcode.length >= 8 && (
                        <div className="px-4 py-3 border-t border-neutral-200 flex justify-center">
                            <Barcode
                                value={data.barcode}
                                format="EAN13"
                                width={1.5}
                                height={45}
                                fontSize={10}
                                margin={0}
                                background="#ffffff"
                                lineColor="#000000"
                                displayValue={true}
                                font="monospace"
                            />
                        </div>
                    )}

            {/* Regulatory Footer */}
            <div className="px-4 py-2 bg-neutral-100 border-t border-neutral-200">
                <p className="text-[8px] text-neutral-500 text-center">
                    Compliant with GSO 9 / SFDA Regulations • GCC Standard
                </p>
            </div>
        </div>
    )
}

interface NutritionFactRowProps {
    row: NutritionRow
}

function NutritionFactRow({ row }: NutritionFactRowProps) {
    if (!row.name) return null
    
    const showDV = row.dailyValue !== undefined && row.dailyValue > 0

    return (
        <div className={cn(
            "flex items-center px-2 py-0.5 text-[11px]",
            row.isSubItem ? "pl-4" : ""
        )}>
            <div className={cn(
                "flex-1",
                !row.isSubItem && "font-bold"
            )}>
                {row.name}
            </div>
            <div className="w-16 text-right tabular-nums">
                {row.per100g > 0 ? `${row.per100g}${row.unit}` : "—"}
            </div>
            <div className="w-16 text-right tabular-nums">
                {row.perServing > 0 ? `${row.perServing}${row.unit}` : "—"}
            </div>
            <div className="w-10 text-right tabular-nums font-bold">
                {showDV ? `${row.dailyValue}%` : ""}
            </div>
        </div>
    )
}

export default LabelPreview
