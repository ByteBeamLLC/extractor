'use client'

import { ChefHat, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RecipeBuilderBlockedScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-full px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <ChefHat className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Your RecipeBuilder trial has ended</h2>
          <p className="text-muted-foreground">
            To continue building and managing recipes, subscribe to RecipeBuilder through the production app.
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <a href="https://app.recipebuilder.co" target="_blank" rel="noopener noreferrer">
            Open RecipeBuilder
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>

        <p className="text-xs text-muted-foreground">
          Your recipes and data are safe. Sign in at{' '}
          <a
            href="https://app.recipebuilder.co"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            app.recipebuilder.co
          </a>{' '}
          to continue.
        </p>
      </div>
    </div>
  )
}
