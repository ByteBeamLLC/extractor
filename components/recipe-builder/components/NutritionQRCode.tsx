'use client'

import React, { useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Printer, QrCode, ExternalLink } from 'lucide-react'

/**
 * Nutrition QR Code Component
 *
 * Generates a QR code that links to the public nutrition label page.
 * Includes options to download and print the QR code.
 */

interface NutritionQRCodeProps {
  recipeId: string
  recipeName: string
  size?: number
}

export function NutritionQRCode({
  recipeId,
  recipeName,
  size = 200,
}: NutritionQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  // Generate the public URL for the nutrition page
  const nutritionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/nutrition/${recipeId}`
    : `/nutrition/${recipeId}`

  // Download QR code as PNG
  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    // Create canvas from SVG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with padding
    const padding = 20
    canvas.width = size + padding * 2
    canvas.height = size + padding * 2 + 40 // Extra space for text

    // Fill white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size)

      // Add recipe name below QR code
      ctx.fillStyle = 'black'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      const maxWidth = canvas.width - 20
      const text = recipeName.length > 30 ? recipeName.substring(0, 30) + '...' : recipeName
      ctx.fillText(text, canvas.width / 2, size + padding + 25)

      // Download
      const link = document.createElement('a')
      link.download = `nutrition-qr-${recipeName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [size, recipeName])

  // Print QR code
  const handlePrint = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nutrition QR Code - ${recipeName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 20px;
            }
            p {
              font-size: 12px;
              color: #666;
              margin-top: 15px;
            }
            .url {
              font-size: 10px;
              color: #999;
              word-break: break-all;
              max-width: 300px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${recipeName}</h1>
            ${svgData}
            <p>Scan to view nutrition information</p>
            <p class="url">${nutritionUrl}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }, [recipeName, nutritionUrl])

  // Open nutrition page in new tab
  const handleOpenPage = useCallback(() => {
    window.open(nutritionUrl, '_blank')
  }, [nutritionUrl])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Nutrition Label QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* QR Code */}
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-lg border"
          >
            <QRCodeSVG
              value={nutritionUrl}
              size={size}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to view nutrition information
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenPage}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>

          {/* URL Display */}
          <div className="w-full mt-2">
            <p className="text-xs text-muted-foreground text-center break-all">
              {nutritionUrl}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
