'use client'

import React from 'react'
import type { NutrientValue } from '../types'

/**
 * FDA-style Nutrition Facts Label
 *
 * Displays nutrition information in the standard US FDA format
 * with Daily Value percentages.
 */

interface NutritionLabelProps {
  servingSize: number
  nutrition: Record<string, NutrientValue>
  servingDescription?: string
  servingsPerContainer?: number
}

// FDA Daily Values (based on 2000 calorie diet)
const DAILY_VALUES = {
  totalFat: 78,
  saturatedFat: 20,
  transFat: null, // No DV established
  cholesterol: 300,
  sodium: 2300,
  totalCarbs: 275,
  dietaryFiber: 28,
  totalSugar: null, // No DV for total sugar
  addedSugar: 50,
  protein: 50,
  vitaminD: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
}

// Calculate Daily Value percentage
function calcDV(value: number, dailyValue: number | null): string {
  if (dailyValue === null || dailyValue === 0) return ''
  return `${Math.round((value / dailyValue) * 100)}%`
}

// Get nutrient value or 0
function getNutrient(
  nutrition: Record<string, NutrientValue>,
  key: string
): number {
  return nutrition[key]?.quantity || 0
}

// Format number - show decimal only if non-zero decimal part
function formatValue(value: number, decimals: number = 1): string {
  const fixed = value.toFixed(decimals)
  // Remove trailing zeros after decimal point
  if (fixed.includes('.')) {
    const trimmed = fixed.replace(/\.?0+$/, '')
    return trimmed || '0'
  }
  return fixed
}

export function NutritionLabel({
  servingSize,
  nutrition,
  servingDescription = 'per serving',
  servingsPerContainer,
}: NutritionLabelProps) {
  const calories = getNutrient(nutrition, 'Energy')
  const totalFat = getNutrient(nutrition, 'Total Fat')
  const saturatedFat = getNutrient(nutrition, 'Saturated Fat')
  const transFat = getNutrient(nutrition, 'Trans Fat')
  const cholesterol = getNutrient(nutrition, 'Cholesterol')
  const sodium = getNutrient(nutrition, 'Sodium')
  const totalCarbs = getNutrient(nutrition, 'Total Carbohydrates')
  const dietaryFiber = getNutrient(nutrition, 'Dietary Fiber')
  const totalSugar = getNutrient(nutrition, 'Total Sugar')
  const addedSugar = getNutrient(nutrition, 'Added Sugar')
  const sugarAlcohol = getNutrient(nutrition, 'Sugar Alcohol')
  const protein = getNutrient(nutrition, 'Protein')
  const vitaminD = getNutrient(nutrition, 'Vitamin D')
  const calcium = getNutrient(nutrition, 'Calcium')
  const iron = getNutrient(nutrition, 'Iron')
  const potassium = getNutrient(nutrition, 'Potassium')

  return (
    <div className="w-[280px] border-2 border-black p-2 bg-white text-black font-sans text-sm">
      {/* Header */}
      <div className="text-3xl font-extrabold leading-none">Nutrition Facts</div>
      <div className="border-b border-black pb-1">
        {servingsPerContainer && (
          <div className="text-sm">{servingsPerContainer} servings per container</div>
        )}
        <div className="flex justify-between font-bold">
          <span>Serving size</span>
          <span>{servingSize}g ({servingDescription})</span>
        </div>
      </div>

      {/* Calories */}
      <div className="border-b-8 border-black py-1">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-sm font-bold">Amount per serving</div>
            <div className="text-3xl font-extrabold">Calories</div>
          </div>
          <div className="text-4xl font-extrabold">{Math.round(calories)}</div>
        </div>
      </div>

      {/* Daily Value Header */}
      <div className="text-right text-xs border-b border-black py-1">
        <span className="font-bold">% Daily Value*</span>
      </div>

      {/* Nutrients */}
      <div className="text-sm">
        {/* Total Fat */}
        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>
            <span className="font-bold">Total Fat</span> {formatValue(totalFat)}g
          </span>
          <span className="font-bold">{calcDV(totalFat, DAILY_VALUES.totalFat)}</span>
        </div>

        {/* Saturated Fat */}
        <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
          <span>Saturated Fat {formatValue(saturatedFat)}g</span>
          <span className="font-bold">{calcDV(saturatedFat, DAILY_VALUES.saturatedFat)}</span>
        </div>

        {/* Trans Fat */}
        <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
          <span><i>Trans</i> Fat {formatValue(transFat, 0)}g</span>
          <span></span>
        </div>

        {/* Cholesterol */}
        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>
            <span className="font-bold">Cholesterol</span> {formatValue(cholesterol, 0)}mg
          </span>
          <span className="font-bold">{calcDV(cholesterol, DAILY_VALUES.cholesterol)}</span>
        </div>

        {/* Sodium */}
        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>
            <span className="font-bold">Sodium</span> {formatValue(sodium)}mg
          </span>
          <span className="font-bold">{calcDV(sodium, DAILY_VALUES.sodium)}</span>
        </div>

        {/* Total Carbohydrates */}
        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>
            <span className="font-bold">Total Carbohydrate</span> {formatValue(totalCarbs)}g
          </span>
          <span className="font-bold">{calcDV(totalCarbs, DAILY_VALUES.totalCarbs)}</span>
        </div>

        {/* Dietary Fiber */}
        <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
          <span>Dietary Fiber {formatValue(dietaryFiber)}g</span>
          <span className="font-bold">{calcDV(dietaryFiber, DAILY_VALUES.dietaryFiber)}</span>
        </div>

        {/* Total Sugars */}
        <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
          <span>Total Sugars {formatValue(totalSugar)}g</span>
          <span></span>
        </div>

        {/* Added Sugars */}
        <div className="flex justify-between border-b border-gray-300 py-0.5 pl-8">
          <span>Includes {formatValue(addedSugar)}g Added Sugars</span>
          <span className="font-bold">{calcDV(addedSugar, DAILY_VALUES.addedSugar)}</span>
        </div>

        {/* Sugar Alcohol */}
        <div className="flex justify-between border-b border-gray-300 py-0.5 pl-4">
          <span>Sugar Alcohol {formatValue(sugarAlcohol, 0)}g</span>
          <span className="font-bold">{sugarAlcohol > 0 ? `${Math.round((sugarAlcohol / 10) * 100)}%` : '0%'}</span>
        </div>

        {/* Protein - No % DV per FDA guidelines */}
        <div className="flex justify-between border-b-8 border-black py-0.5">
          <span>
            <span className="font-bold">Protein</span> {formatValue(protein)}g
          </span>
          <span></span>
        </div>

        {/* Vitamins and Minerals */}
        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>Vitamin D {formatValue(vitaminD, 0)}mcg</span>
          <span className="font-bold">{calcDV(vitaminD, DAILY_VALUES.vitaminD)}</span>
        </div>

        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>Calcium {formatValue(calcium)}mg</span>
          <span className="font-bold">{calcDV(calcium, DAILY_VALUES.calcium)}</span>
        </div>

        <div className="flex justify-between border-b border-gray-300 py-0.5">
          <span>Iron {formatValue(iron)}mg</span>
          <span className="font-bold">{calcDV(iron, DAILY_VALUES.iron)}</span>
        </div>

        <div className="flex justify-between border-b border-black py-0.5">
          <span>Potassium {formatValue(potassium)}mg</span>
          <span className="font-bold">{calcDV(potassium, DAILY_VALUES.potassium)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs pt-1">
        <p>
          * The % Daily Value (DV) tells you how much a nutrient in a serving of
          food contributes to a daily diet. 2,000 calories a day is used for
          general nutrition advice.
        </p>
      </div>
    </div>
  )
}
