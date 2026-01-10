'use client'

import React, { useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { Recipe, NutrientValue } from '../types'

/**
 * Packaging Artwork Component
 *
 * Generates a product packaging label matching the Ben's Farmhouse style.
 * Displays recipe information, nutrition facts, QR code, and barcode.
 */

interface PackagingArtworkProps {
  recipe: Recipe
  logoUrl?: string | null
  websiteUrl?: string
  storageInstructions?: string
  disclaimerText?: string
}

// Helper to get nutrient value
function getNutrient(
  nutrition: Record<string, NutrientValue> | undefined,
  key: string
): number {
  return nutrition?.[key]?.quantity || 0
}

// Calculate per 100g values from recipe
function calculatePer100g(recipe: Recipe): Record<string, NutrientValue> {
  // Check if per_100g exists
  if (recipe.nutrition?.per_100g && Object.keys(recipe.nutrition.per_100g).length > 0) {
    return recipe.nutrition.per_100g
  }

  // Calculate from per_recipe_total
  if (!recipe.nutrition?.per_recipe_total || !recipe.nutrition?.total_yield_grams) {
    return recipe.nutrition?.per_serving || {}
  }

  const totalYield = recipe.nutrition.total_yield_grams
  const result: Record<string, NutrientValue> = {}

  Object.entries(recipe.nutrition.per_recipe_total).forEach(([key, value]) => {
    if (value && typeof value.quantity === 'number') {
      result[key] = {
        quantity: (value.quantity / totalYield) * 100,
        unit: value.unit,
      }
    }
  })
  return result
}

export function PackagingArtwork({
  recipe,
  logoUrl,
  websiteUrl,
  storageInstructions,
  disclaimerText,
}: PackagingArtworkProps) {
  const artworkRef = useRef<HTMLDivElement>(null)

  const per100g = calculatePer100g(recipe)
  const calories = Math.round(getNutrient(per100g, 'Energy'))
  const protein = Math.round(getNutrient(per100g, 'Protein'))
  const carbs = Math.round(getNutrient(per100g, 'Total Carbohydrates'))
  const fat = Math.round(getNutrient(per100g, 'Total Fat'))
  const netCarbs = Math.round(getNutrient(per100g, 'Net Carbohydrates'))

  // Get ingredient names
  const ingredientNames = recipe.ingredients?.map((ing) => ing.name).join(', ') || ''

  // Get composite ingredients (what the product contains)
  const containsList = recipe.ingredients
    ?.flatMap((ing) => ing.composite_ingredients || [])
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .join(', ') || ''

  // Get allergens
  const allergenList = recipe.allergens?.join(', ') || ''

  // Get diet types (suitable for)
  const suitableFor = recipe.diet_types?.join(', ') || ''

  // Weight
  const weight = recipe.serving?.total_cooked_weight_grams || recipe.nutrition?.total_yield_grams || ''

  // Nutrition page URL for QR code
  const nutritionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/nutrition/${recipe.id}`
    : `/nutrition/${recipe.id}`

  // Download as PNG
  const handleDownload = useCallback(async () => {
    if (!artworkRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(artworkRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `packaging-${recipe.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download artwork:', error)
    }
  }, [recipe.name])

  return (
    <div className="inline-block">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </Button>
      </div>

      {/* Artwork */}
      <div
        ref={artworkRef}
        className="bg-white border-2 border-black p-6 w-[700px] font-sans text-black"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header Row */}
        <div className="flex gap-6 mb-4">
          {/* Logo & QR Code Column */}
          <div className="flex flex-col items-center w-[160px] shrink-0">
            {/* Logo */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo"
                className="w-[140px] h-auto mb-3"
              />
            ) : (
              <div className="w-[140px] h-[80px] border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 mb-3">
                Logo
              </div>
            )}

            {/* QR Code */}
            <div className="bg-white p-1">
              <QRCodeSVG
                value={nutritionUrl}
                size={130}
                level="M"
              />
            </div>
          </div>

          {/* Recipe Info Column */}
          <div className="flex-1">
            {/* Recipe Name */}
            <h1 className="text-xl font-bold uppercase mb-2">
              {recipe.name}
              {weight && ` (${Math.round(Number(weight))}G)`}
            </h1>

            {/* Ingredients */}
            {ingredientNames && (
              <p className="text-sm mb-3">
                <span className="font-bold">INGREDIENTS: </span>
                {ingredientNames}
              </p>
            )}

            {/* Suitable For */}
            {suitableFor && (
              <p className="text-sm mb-1">
                <span className="font-bold">SUITABLE FOR: </span>
                {suitableFor}
              </p>
            )}

            {/* Contains */}
            {containsList && (
              <p className="text-sm mb-1">
                <span className="font-bold">CONTAINS:</span>
                {containsList}
              </p>
            )}

            {/* Allergens */}
            {allergenList && (
              <p className="text-sm mb-1">
                <span className="font-bold">ALLERGENS: </span>
                {allergenList}
              </p>
            )}
          </div>
        </div>

        {/* Nutrition Facts Section */}
        <div className="border-t-2 border-black pt-3 mb-4">
          <p className="font-bold text-base mb-3">Nutrition Facts per 100g:</p>

          <div className="flex items-end gap-4">
            {/* Barcode */}
            <div className="shrink-0">
              {recipe.barcode ? (
                <Barcode
                  value={recipe.barcode}
                  width={1.2}
                  height={50}
                  fontSize={12}
                  margin={0}
                />
              ) : (
                <div className="w-[120px] h-[65px] border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                  No Barcode
                </div>
              )}
            </div>

            {/* Nutrition Circles */}
            <div className="flex gap-3 flex-1 justify-center">
              {/* Calories */}
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-[60px] rounded-full border-2 border-black flex flex-col items-center justify-center">
                  <span className="text-lg font-bold leading-none">{calories || '--'}</span>
                  <span className="text-[10px] font-bold">KCAL</span>
                </div>
              </div>

              {/* Protein */}
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-[60px] rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-lg font-bold">{protein || '--'}g</span>
                </div>
                <span className="text-xs font-bold mt-1">PROTEIN</span>
              </div>

              {/* Carbs */}
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-[60px] rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-lg font-bold">{carbs || '--'}g</span>
                </div>
                <span className="text-xs font-bold mt-1">CARBS</span>
              </div>

              {/* Fat */}
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-[60px] rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-lg font-bold">{fat || '--'}g</span>
                </div>
                <span className="text-xs font-bold mt-1">FAT</span>
              </div>

              {/* Net Carbs */}
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-[60px] rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-lg font-bold">{netCarbs || '--'}g</span>
                </div>
                <span className="text-xs font-bold mt-1">NET CARBS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - only show if there's content */}
        {(websiteUrl || storageInstructions || disclaimerText) && (
          <div className="border-t border-black pt-2 text-sm">
            {(websiteUrl || storageInstructions) && (
              <div className="flex justify-between mb-1">
                {websiteUrl && <span className="font-bold">{websiteUrl}</span>}
                {storageInstructions && <span className="font-bold">{storageInstructions}</span>}
              </div>
            )}
            {disclaimerText && (
              <p className="text-xs">
                <span className="font-bold">DISCLAIMER: </span>
                {disclaimerText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
