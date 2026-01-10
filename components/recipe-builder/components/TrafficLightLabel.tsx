'use client'

import React from 'react'
import type { NutrientValue } from '../types'

/**
 * UK-style Traffic Light Nutrition Label
 *
 * Displays nutrition information with color-coded levels in a
 * cylindrical "can" design matching UK food labeling standards.
 */

interface TrafficLightLabelProps {
  servingSize: number
  nutrition: Record<string, NutrientValue>
  hideHeader?: boolean
}

// Traffic light thresholds per 100g (UK guidelines)
const THRESHOLDS = {
  fat: { low: 3, high: 17.5 },
  saturates: { low: 1.5, high: 5 },
  sugars: { low: 5, high: 22.5 },
  salt: { low: 0.75, high: 1.5 },
}

// Reference intakes (RI) for adults
// Note: Using values that match Nutrical app behavior
const REFERENCE_INTAKES = {
  energy: 2000, // kcal
  fat: 78, // g (FDA 2020 DV)
  saturates: 20, // g
  sugars: 50, // g (using FDA added sugar DV for consistency with Nutrical)
  salt: 6, // g
}

type TrafficLevel = 'LOW' | 'MEDIUM' | 'HIGH'

function getTrafficLevel(
  value: number,
  thresholds: { low: number; high: number }
): TrafficLevel {
  if (value <= thresholds.low) return 'LOW'
  if (value <= thresholds.high) return 'MEDIUM'
  return 'HIGH'
}

function getTrafficBgColor(level: TrafficLevel): string {
  switch (level) {
    case 'LOW':
      return 'bg-[#a8c686]' // muted green
    case 'MEDIUM':
      return 'bg-[#d4a84b]' // amber/golden
    case 'HIGH':
      return 'bg-[#d64545]' // red
  }
}

// Convert sodium (mg) to salt (g) - rounds UP to 1 decimal to match Nutrical behavior
function sodiumToSalt(sodiumMg: number): number {
  const rawSalt = (sodiumMg * 2.5) / 1000
  // Round UP to 1 decimal place (e.g., 0.444 -> 0.5)
  return Math.ceil(rawSalt * 10) / 10
}

// Convert kcal to kJ
function kcalToKj(kcal: number): number {
  return kcal * 4.184
}

// Calculate % Reference Intake
function calcRI(value: number, ri: number): number {
  return Math.round((value / ri) * 100)
}

// Get nutrient value or 0
function getNutrient(
  nutrition: Record<string, NutrientValue>,
  key: string
): number {
  return nutrition[key]?.quantity || 0
}

interface NutrientCanProps {
  label: string
  value: string
  unit: string
  secondaryValue?: string
  levelText?: string
  riPercent: number
  level?: TrafficLevel
  isEnergy?: boolean
}

function NutrientCan({
  label,
  value,
  unit,
  secondaryValue,
  levelText,
  riPercent,
  level,
  isEnergy = false,
}: NutrientCanProps) {
  const bottomBgColor = isEnergy ? 'bg-white' : level ? getTrafficBgColor(level) : 'bg-gray-100'
  const bottomTextColor = level === 'MEDIUM' ? 'text-black' : isEnergy ? 'text-gray-700' : 'text-white'

  return (
    <div className="flex flex-col w-[70px] min-w-[60px]">
      {/* Top section - white with rounded top (can shape) */}
      <div
        className="bg-white border border-gray-300 border-b-0 rounded-t-[30px] pt-3 pb-1.5 px-1 text-center"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <div className="text-[10px] font-bold text-gray-800 uppercase tracking-wide leading-tight">
          {label}
        </div>
        <div className="text-sm font-bold text-gray-900 mt-0.5">
          {value}{unit}
        </div>
        {secondaryValue && (
          <div className="text-xs text-gray-600">
            {secondaryValue}
          </div>
        )}
        {levelText && (
          <div className="text-[10px] font-medium text-gray-700 uppercase mt-0.5">
            {levelText}
          </div>
        )}
      </div>

      {/* Bottom section - colored percentage bar */}
      <div
        className={`${bottomBgColor} ${bottomTextColor} border border-gray-300 border-t-0 py-1.5 text-center font-bold text-xs`}
      >
        {riPercent}%
      </div>
    </div>
  )
}

export function TrafficLightLabel({
  servingSize,
  nutrition,
  hideHeader = false,
}: TrafficLightLabelProps) {
  const energy = getNutrient(nutrition, 'Energy')
  const fat = getNutrient(nutrition, 'Total Fat')
  const saturates = getNutrient(nutrition, 'Saturated Fat')
  const sugars = getNutrient(nutrition, 'Total Sugar')
  const sodium = getNutrient(nutrition, 'Sodium')
  const salt = sodiumToSalt(sodium)

  const fatLevel = getTrafficLevel(fat, THRESHOLDS.fat)
  const saturatesLevel = getTrafficLevel(saturates, THRESHOLDS.saturates)
  const sugarsLevel = getTrafficLevel(sugars, THRESHOLDS.sugars)
  const saltLevel = getTrafficLevel(salt, THRESHOLDS.salt)

  return (
    <div className="inline-block">
      {/* Header */}
      {!hideHeader && (
        <div className="text-center mb-4">
          <span className="text-sm text-gray-600">per serving ({servingSize}g)</span>
        </div>
      )}

      {/* Nutrient Cans Row */}
      <div className="flex gap-1">
        <NutrientCan
          label="ENERGY"
          value={energy.toFixed(1)}
          unit="kcal"
          secondaryValue={`${kcalToKj(energy).toFixed(1)}kj`}
          riPercent={calcRI(energy, REFERENCE_INTAKES.energy)}
          isEnergy={true}
        />

        <NutrientCan
          label="FAT"
          value={fat.toFixed(1)}
          unit="g"
          levelText={fatLevel}
          riPercent={calcRI(fat, REFERENCE_INTAKES.fat)}
          level={fatLevel}
        />

        <NutrientCan
          label="SATURATES"
          value={saturates.toFixed(1)}
          unit="g"
          levelText={saturatesLevel}
          riPercent={calcRI(saturates, REFERENCE_INTAKES.saturates)}
          level={saturatesLevel}
        />

        <NutrientCan
          label="SUGARS"
          value={sugars.toFixed(1)}
          unit="g"
          levelText={sugarsLevel}
          riPercent={calcRI(sugars, REFERENCE_INTAKES.sugars)}
          level={sugarsLevel}
        />

        <NutrientCan
          label="SALT"
          value={salt.toFixed(1)}
          unit="g"
          levelText={saltLevel}
          riPercent={calcRI(salt, REFERENCE_INTAKES.salt)}
          level={saltLevel}
        />
      </div>
    </div>
  )
}
