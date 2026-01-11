"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"

export function SetupBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if OpenRouter API key is available
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/check-setup")
        const data = await response.json()
        if (!data.isConfigured) {
          setShowBanner(true)
        }
      } catch (error) {
        setShowBanner(true)
      }
    }

    checkApiKey()
  }, [])

  if (!showBanner) return null

  return (
    <Card className="m-4 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900">Setup Required</h3>
            <p className="text-sm text-orange-800 mt-1">
              To use AI-powered data extraction, you need to add your OpenRouter API key to the environment variables.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open("https://openrouter.ai/keys", "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Get API Key
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowBanner(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
