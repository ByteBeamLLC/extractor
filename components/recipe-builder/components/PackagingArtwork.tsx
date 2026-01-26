'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Loader2, FileImage, FileText } from 'lucide-react'
import type { Recipe, NutrientValue } from '../types'

/**
 * Packaging Artwork Component
 *
 * Generates a product packaging label matching the Ben's Farmhouse style.
 * Two-column layout with all-white background
 * Size: 7cm x 5cm
 *
 * Arabic translations are loaded from recipe data (stored in database).
 * If translations don't exist, they are fetched via API and stored.
 */

interface PackagingArtworkProps {
  recipe: Recipe
  logoUrl?: string | null
  companyName?: string
  companyWebsite?: string
}

// Fixed text as per requirements
const STORAGE_TEXT = "Keep refrigerated : 0\u00B0C to 5\u00B0C // Do not exceed expiry date"
const DISCLAIMER_TEXT = "Disclaimer: This product has been made in the kitchen where other allergens are present"
const ARABIC_FONT_FAMILY = "'Noto Naskh Arabic', 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif"
const ARABIC_TEXT_STYLE: React.CSSProperties = {
  fontFamily: ARABIC_FONT_FAMILY,
  direction: 'rtl',
  textAlign: 'right',
  unicodeBidi: 'plaintext',
  fontWeight: 400,
}
const ARABIC_INLINE_STYLE: React.CSSProperties = {
  fontFamily: ARABIC_FONT_FAMILY,
  direction: 'rtl',
  unicodeBidi: 'isolate',
  fontWeight: 400,
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

// Helper to convert text to Title Case
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s,]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(', ')
    .replace(/, ,/g, ',')
}

export function PackagingArtwork({
  recipe,
  logoUrl,
  companyName = "BEN'S FARMHOUSE",
  companyWebsite = "www.bensfarmhouse.com",
}: PackagingArtworkProps) {
  const artworkRef = useRef<HTMLDivElement>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)

  // Local state for translations (initialized from recipe, updated via API)
  const [translations, setTranslations] = useState({
    nameAr: recipe.name_ar || null,
    ingredientsAr: recipe.ingredients_ar || null,
    allergensAr: recipe.allergens_ar || null,
    dietTypesAr: recipe.diet_types_ar || null,
  })

  const per100g = calculatePer100g(recipe)
  const calories = Math.round(getNutrient(per100g, 'Energy'))
  const protein = Math.round(getNutrient(per100g, 'Protein'))
  const carbs = Math.round(getNutrient(per100g, 'Total Carbohydrates'))
  const fat = Math.round(getNutrient(per100g, 'Total Fat'))
  const netCarbs = Math.round(getNutrient(per100g, 'Net Carbohydrates'))

  // Get ingredient names
  const ingredientNames = recipe.ingredients?.map((ing) => ing.name) || []
  const ingredientText = ingredientNames.join(', ')

  // Get allergens
  const allergenList = recipe.allergens || []
  const allergenText = allergenList.join(', ')

  // Get diet types (suitable for) - Title Case as per requirement
  const suitableFor = recipe.diet_types || []
  const suitableForText = toTitleCase(suitableFor.join(', '))

  // Weight
  const weight = recipe.serving?.total_cooked_weight_grams || recipe.nutrition?.total_yield_grams || 0

  // Calories per serving
  const perServing = recipe.nutrition?.per_serving || {}
  const caloriesPerServing = getNutrient(perServing, 'Energy')

  // Generate nutrition label QR URL
  const nutritionQRUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/nutrition/${recipe.id}`
    : `/nutrition/${recipe.id}`

  // Check if translations exist
  const hasTranslations = translations.nameAr &&
    translations.ingredientsAr &&
    translations.ingredientsAr.length > 0

  // Fetch translations from API (only called if translations don't exist)
  const fetchTranslations = useCallback(async (force: boolean = false) => {
    if (!recipe.id) return

    setIsTranslating(true)
    setTranslationError(null)

    try {
      const response = await fetch('/api/recipe/translate-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          force,
        }),
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const data = await response.json()
      if (data.success && data.data) {
        setTranslations({
          nameAr: data.data.productNameArabic,
          ingredientsAr: data.data.ingredientsArabic,
          allergensAr: data.data.containsAllergensArabic,
          dietTypesAr: data.data.suitableForArabic,
        })
      } else {
        throw new Error(data.error || 'Translation failed')
      }
    } catch (error) {
      console.error('Translation error:', error)
      setTranslationError(error instanceof Error ? error.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }, [recipe.id])

  // Auto-fetch translations if they don't exist (only on mount)
  useEffect(() => {
    // Update local state when recipe prop changes
    setTranslations({
      nameAr: recipe.name_ar || null,
      ingredientsAr: recipe.ingredients_ar || null,
      allergensAr: recipe.allergens_ar || null,
      dietTypesAr: recipe.diet_types_ar || null,
    })
  }, [recipe.name_ar, recipe.ingredients_ar, recipe.allergens_ar, recipe.diet_types_ar])

  // Fetch translations if they don't exist when component mounts
  useEffect(() => {
    const shouldFetch = !recipe.name_ar &&
      (!recipe.ingredients_ar || recipe.ingredients_ar.length === 0) &&
      (ingredientNames.length > 0 || recipe.name)

    if (shouldFetch) {
      fetchTranslations()
    }
  }, []) // Only on mount

  // Download states
  const [isDownloadingPng, setIsDownloadingPng] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  // Download as PNG
  const handleDownloadPng = useCallback(async () => {
    if (!artworkRef.current) {
      console.error('Artwork ref not available')
      alert('Unable to download: artwork not ready')
      return
    }

    setIsDownloadingPng(true)

    try {
      // Dynamic import of html2canvas
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default

      if (!html2canvas) {
        throw new Error('html2canvas not loaded')
      }

      const canvas = await html2canvas(artworkRef.current, {
        scale: 3, // Higher resolution for print
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob')
          alert('Failed to generate image')
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `packaging-${recipe.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (error) {
      console.error('Failed to download artwork:', error)
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloadingPng(false)
    }
  }, [recipe.name])

  // Download as PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!artworkRef.current) {
      console.error('Artwork ref not available')
      alert('Unable to download: artwork not ready')
      return
    }

    setIsDownloadingPdf(true)

    try {
      // Dynamic imports
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const html2canvas = html2canvasModule.default
      const { jsPDF } = jsPDFModule

      if (!html2canvas || !jsPDF) {
        throw new Error('Required libraries not loaded')
      }

      const canvas = await html2canvas(artworkRef.current, {
        scale: 3, // Higher resolution for print
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
      })

      // Label dimensions: 7cm x 5cm
      const pdfWidth = 70 // mm
      const pdfHeight = 50 // mm

      // Create PDF with exact label dimensions (landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      // Add the canvas as an image fitting the full page
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      // Download
      pdf.save(`packaging-${recipe.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      alert(`PDF download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloadingPdf(false)
    }
  }, [recipe.name])

  // Force refresh translations
  const handleRefreshTranslation = useCallback(() => {
    fetchTranslations(true)
  }, [fetchTranslations])

  // Arabic text helpers - using Arabic comma
  const ingredientsArabicText = translations.ingredientsAr?.join(' \u060C ') || ''
  const suitableForArabicText = translations.dietTypesAr?.join(' \u060C ') || ''
  const allergensArabicText = translations.allergensAr?.join(' \u060C ') || ''

  return (
    <div className="inline-block">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshTranslation}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isTranslating ? 'Translating...' : 'Refresh Arabic'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPng} disabled={isDownloadingPng}>
          {isDownloadingPng ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileImage className="w-4 h-4 mr-2" />
          )}
          {isDownloadingPng ? 'Downloading...' : 'Download PNG'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
          {isDownloadingPdf ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
        </Button>
      </div>

      {translationError && (
        <div className="text-sm text-amber-600 mb-2">
          Arabic translation unavailable: {translationError}
        </div>
      )}

      {!hasTranslations && !isTranslating && !translationError && (
        <div className="text-sm text-muted-foreground mb-2">
          Arabic translations will be generated automatically...
        </div>
      )}

      {/* Artwork - 7cm x 5cm scaled up for display - NO OUTER BORDER */}
      <div
        ref={artworkRef}
        style={{
          display: 'flex',
          overflow: 'hidden',
          width: '680px',
          height: '480px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '13px',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        {/* LEFT PANEL - White background with vertical separator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '47%',
            backgroundColor: '#ffffff',
            padding: '12px 14px',
            color: '#000000',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          {/* Product Name - LARGER, EXTRA BOLD */}
          <h1
            style={{
              fontSize: '23px',
              marginBottom: '8px',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              color: '#000000',
              letterSpacing: '-0.3px',
            }}
          >
            {recipe.name || 'PRODUCT NAME'}
          </h1>

          {/* Ingredients Section - TIGHTER SPACING */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '13px', marginBottom: '2px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>
              INGREDIENTS:
            </p>
            <p style={{ fontSize: '12px', lineHeight: 1.35, color: '#000000' }}>
              {ingredientText || 'No ingredients listed'}
            </p>
            {ingredientsArabicText && (
              <p
                style={{
                  ...ARABIC_TEXT_STYLE,
                  fontSize: '12px',
                  marginTop: '4px',
                  lineHeight: 1.4,
                  color: '#000000',
                }}
              >
                {ingredientsArabicText}
              </p>
            )}
          </div>

          {/* Suitable For Section - TITLE CASE */}
          {suitableFor.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                <span style={{ textTransform: 'uppercase' }}>SUITABLE FOR:</span>{' '}
                <span style={{ fontWeight: 'normal' }}>{suitableForText}</span>
              </p>
              {suitableForArabicText && (
                <p
                  style={{
                    ...ARABIC_TEXT_STYLE,
                    fontSize: '12px',
                    marginTop: '2px',
                    color: '#000000',
                  }}
                >
                  {suitableForArabicText}
                </p>
              )}
            </div>
          )}

          {/* Contains Allergens Section */}
          {allergenList.length > 0 && (
            <div style={{ marginBottom: '2px' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>
                CONTAINS:
              </p>
              <p style={{ fontSize: '12px', color: '#000000' }}>
                {allergenText}
              </p>
              {allergensArabicText && (
                <p
                  style={{
                    ...ARABIC_TEXT_STYLE,
                    fontSize: '12px',
                    marginTop: '2px',
                    color: '#000000',
                  }}
                >
                  {allergensArabicText}
                </p>
              )}
            </div>
          )}

          {/* Barcode - LEFT ALIGNED, pushed to bottom */}
          <div style={{ marginTop: 'auto', paddingTop: '0px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            {recipe.barcode ? (
              <Barcode
                value={recipe.barcode}
                format="EAN13"
                width={3.5}
                height={50}
                fontSize={18}
                margin={0}
                background="#ffffff"
                lineColor="#000000"
                displayValue={true}
                font="monospace"
                textMargin={0}
                flat={true}
              />
            ) : (
              <div
                style={{
                  width: '160px',
                  height: '55px',
                  fontSize: '12px',
                  border: '1px dashed #9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                }}
              >
                No Barcode
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - White background */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '53%',
            backgroundColor: '#ffffff',
            padding: '12px 14px',
            color: '#000000',
          }}
        >
          {/* Company Branding - LARGER, EXTRA BOLD */}
          <div style={{ marginBottom: '4px', textAlign: 'center' }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo"
                style={{ maxHeight: '40px', maxWidth: '180px', margin: '0 auto 4px' }}
              />
            ) : (
              <h2
                style={{
                  fontSize: '31px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#000000',
                  letterSpacing: '0.5px',
                }}
              >
                {companyName}
              </h2>
            )}
          </div>

          {/* QR Code and Weight/Calories Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0px',
              borderBottom: '3px solid #000000',
              paddingBottom: '8px',
            }}
          >
            {/* QR Code - Links to Nutrition Label Page */}
            {recipe.id && (
              <div>
                <QRCodeSVG
                  value={nutritionQRUrl}
                  size={95}
                  level="L"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            )}

            {/* Net Weight + Calories per Serving - Stacked on right */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#000000', lineHeight: 1, marginBottom: '8px' }}>
                NET WEIGHT: {Math.round(weight)}G
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', lineHeight: 1.3 }}>
                    Calories/السعرات الحرارية
                  </p>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', lineHeight: 1.3 }}>
                    per serving/لكل حصة
                  </p>
                </div>
                <p style={{ fontSize: '26px', fontWeight: 'bold', color: '#000000' }}>
                  {caloriesPerServing ? caloriesPerServing.toFixed(2) : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Nutrition Facts per 100g - CIRCLES like client sample */}
          <div style={{ marginBottom: '0px', borderBottom: '3px solid #000000', paddingBottom: '8px' }}>
            <p style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold', color: '#000000' }}>
              Nutrition Facts per 100g:
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
              {/* KCAL Circle */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    border: '2px solid #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={{ fontSize: '18px', lineHeight: 1, fontWeight: 'bold', color: '#000000' }}>
                    {calories || '--'}
                  </p>
                  <p style={{ fontSize: '9px', color: '#000000', marginTop: '1px' }}>KCAL</p>
                </div>
              </div>

              {/* Protein Circle */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    border: '1px solid #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={{ fontSize: '16px', lineHeight: 1, fontWeight: 'bold', color: '#000000' }}>
                    {protein || '--'}g
                  </p>
                  <p style={{ fontSize: '8px', color: '#000000', marginTop: '2px' }}>PROTEIN</p>
                </div>
              </div>

              {/* Carbs Circle */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    border: '1px solid #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={{ fontSize: '16px', lineHeight: 1, fontWeight: 'bold', color: '#000000' }}>
                    {carbs || '--'}g
                  </p>
                  <p style={{ fontSize: '8px', color: '#000000', marginTop: '2px' }}>CARBS</p>
                </div>
              </div>

              {/* Fat Circle */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    border: '1px solid #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={{ fontSize: '16px', lineHeight: 1, fontWeight: 'bold', color: '#000000' }}>
                    {fat || '--'}g
                  </p>
                  <p style={{ fontSize: '8px', color: '#000000', marginTop: '2px' }}>FAT</p>
                </div>
              </div>

              {/* Net Carbs Circle */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    border: '1px solid #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <p style={{ fontSize: '16px', lineHeight: 1, fontWeight: 'bold', color: '#000000' }}>
                    {netCarbs || '--'}g
                  </p>
                  <p style={{ fontSize: '7px', color: '#000000', marginTop: '2px' }}>NET CARBS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Storage Instructions & Disclaimer, left-aligned like client */}
          <div style={{ paddingTop: '0px' }}>
            <p style={{ fontSize: '14px', marginBottom: '0px', paddingBottom: '8px', borderBottom: '3px solid #000000', textAlign: 'left', color: '#000000', fontWeight: 500 }}>
              <span style={{ fontWeight: 'bold' }}>Keep refrigerated</span> : 0°C to 5°C // Do not exceed expiry date
            </p>
            <p style={{ fontSize: '14px', marginBottom: '0px', paddingBottom: '8px', borderBottom: '3px solid #000000', textAlign: 'left', color: '#000000' }}>
              {DISCLAIMER_TEXT}
            </p>
            {companyWebsite && (
              <p style={{ fontSize: '14px', textAlign: 'left', color: '#000000', marginTop: '0px' }}>{companyWebsite}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
