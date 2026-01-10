'use client'

import React, { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import type { NutrientValue } from '../types'

/**
 * Macro Nutrients Pie Chart
 *
 * Displays a donut chart showing the breakdown of macronutrients:
 * - Carbohydrates (purple)
 * - Protein (orange)
 * - Fat (gray)
 * - Net Carbs (blue)
 */

interface MacroChartProps {
  nutrition: Record<string, NutrientValue>
}

const MACRO_COLORS = {
  'Total Carbohydrates': '#8b5cf6', // purple
  'Protein': '#f97316', // orange
  'Total Fat': '#6b7280', // gray
  'Net Carbohydrates': '#3b82f6', // blue
}

const MACRO_KEYS = [
  'Total Carbohydrates',
  'Protein',
  'Total Fat',
  'Net Carbohydrates',
]

export function MacroChart({ nutrition }: MacroChartProps) {
  const macroData = useMemo(() => {
    return MACRO_KEYS.map((name) => ({
      name,
      value: nutrition[name]?.quantity || 0,
      unit: nutrition[name]?.unit || 'g',
    })).filter((d) => d.value > 0)
  }, [nutrition])

  const totalMacros = useMemo(() => {
    return macroData.reduce((sum, d) => sum + d.value, 0)
  }, [macroData])

  if (macroData.length === 0 || totalMacros === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No macro data available
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={macroData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {macroData.map((entry) => (
              <Cell
                key={entry.name}
                fill={MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS] || '#ccc'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} G | ${((value / totalMacros) * 100).toFixed(2)}%`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with values */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {macroData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS] || '#ccc',
              }}
            />
            <span className="text-sm">
              {entry.name}: {entry.value.toFixed(2)} G | {((entry.value / totalMacros) * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
