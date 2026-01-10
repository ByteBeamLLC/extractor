'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Search,
  Package,
  Loader2,
  Database,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

/**
 * USDA Ingredients View
 *
 * Displays ingredients from the USDA FoodData Central database.
 * Connects directly to the USDA API for Foundation Foods and SR Legacy data.
 */

interface NutrientValue {
  quantity: number
  unit: string
}

interface USDAIngredient {
  id: string
  fdcId: number
  name: string
  description: string
  dataType: string
  foodCategory: string
  scientificName?: string
  publicationDate?: string
  nutrients: Record<string, NutrientValue>
  source: string
}

// Nutrient display order (matching imported recipes)
const NUTRIENT_ORDER = [
  'Energy',
  'Total Carbohydrates',
  'Protein',
  'Total Fat',
  'Dietary Fiber',
  'Net Carbohydrates',
  'Total Sugar',
  'Added Sugar',
  'Saturated Fat',
  'Monounsaturated Fat',
  'Polyunsaturated Fat',
  'Trans Fat',
  'Cholesterol',
  'Calcium',
  'Sodium',
  'Iron',
  'Potassium',
  'Phosphorus',
  'Magnesium',
  'Zinc',
  'Copper',
  'Manganese',
  'Selenium',
  'Vitamin A',
  'Vitamin C',
  'Vitamin D',
  'Vitamin E',
  'Vitamin K',
  'Thiamin',
  'Riboflavin',
  'Niacin',
  'Pantothenic acid',
  'Vitamin B6',
  'Vitamin B12',
  'Folate',
]

export function USDAIngredientsView() {
  // State
  const [ingredients, setIngredients] = useState<USDAIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalHits, setTotalHits] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedIngredient, setSelectedIngredient] = useState<USDAIngredient | null>(null)

  const PAGE_SIZE = 25

  // Search USDA database
  const searchIngredients = useCallback(async (query: string, page: number) => {
    if (!query || query.length < 2) {
      setIngredients([])
      setTotalHits(0)
      setTotalPages(0)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        action: 'search',
        query,
        pageSize: PAGE_SIZE.toString(),
        pageNumber: page.toString(),
      })

      const res = await fetch(`/api/recipe-builder/usda?${params}`)
      if (res.ok) {
        const { data, totalHits: hits, totalPages: pages } = await res.json()
        setIngredients(data || [])
        setTotalHits(hits || 0)
        setTotalPages(pages || 0)
      }
    } catch (error) {
      console.error('Failed to search USDA:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      searchIngredients(searchQuery, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchIngredients])

  // Page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    searchIngredients(searchQuery, newPage)
  }

  // Format nutrient value
  const formatNutrient = (value: NutrientValue | undefined) => {
    if (!value) return '--'
    return `${value.quantity.toFixed(2)} ${value.unit}`
  }

  // Get data type badge color
  const getDataTypeBadge = (dataType: string) => {
    switch (dataType) {
      case 'Foundation':
        return 'bg-green-100 text-green-800'
      case 'SR Legacy':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6" />
            USDA Ingredients
          </h1>
          <p className="text-muted-foreground">
            Search the USDA FoodData Central database for ingredient nutrition data
          </p>
        </div>
        <a
          href="https://fdc.nal.usda.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          USDA FoodData Central
        </a>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">About USDA FoodData Central</p>
              <p>
                This database includes Foundation Foods and SR Legacy data from the USDA.
                All nutrition values are per 100g of the ingredient. Search for ingredients
                to view their complete nutritional profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search USDA ingredients (e.g., chicken breast, salmon, olive oil)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {searchQuery.length < 2
                ? 'Type at least 2 characters to search'
                : loading
                ? 'Searching...'
                : `${totalHits.toLocaleString()} results found`}
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">Ingredient Name</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Calories</TableHead>
              <TableHead className="text-right">Protein</TableHead>
              <TableHead className="text-right">Carbs</TableHead>
              <TableHead className="text-right">Fat</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Searching USDA database...</p>
                </TableCell>
              </TableRow>
            ) : ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="mt-2">
                    {searchQuery.length < 2
                      ? 'Enter a search term to find ingredients'
                      : 'No ingredients found'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try searching for common foods like "chicken", "rice", or "apple"
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ingredient) => (
                <TableRow
                  key={ingredient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedIngredient(ingredient)}
                >
                  <TableCell>
                    <div className="font-medium">{ingredient.name}</div>
                    {ingredient.scientificName && (
                      <div className="text-xs text-muted-foreground italic">
                        {ingredient.scientificName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getDataTypeBadge(ingredient.dataType)} variant="secondary">
                      {ingredient.dataType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ingredient.foodCategory}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNutrient(ingredient.nutrients['Energy'])}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNutrient(ingredient.nutrients['Protein'])}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNutrient(ingredient.nutrients['Total Carbohydrates'])}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNutrient(ingredient.nutrients['Total Fat'])}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center px-4 text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* Ingredient Detail Dialog */}
      <Dialog open={!!selectedIngredient} onOpenChange={() => setSelectedIngredient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedIngredient?.name}</DialogTitle>
            <DialogDescription>
              USDA FoodData Central - FDC ID: {selectedIngredient?.fdcId}
            </DialogDescription>
          </DialogHeader>

          {selectedIngredient && (
            <div className="flex-1 overflow-auto space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getDataTypeBadge(selectedIngredient.dataType)}>
                  {selectedIngredient.dataType}
                </Badge>
                <Badge variant="outline">{selectedIngredient.foodCategory}</Badge>
                {selectedIngredient.scientificName && (
                  <Badge variant="secondary" className="italic">
                    {selectedIngredient.scientificName}
                  </Badge>
                )}
              </div>

              {/* Nutrition Facts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Nutrition Facts (per 100g)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nutrient</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {NUTRIENT_ORDER.map((nutrientName) => {
                          const value = selectedIngredient.nutrients[nutrientName]
                          if (!value) return null
                          return (
                            <TableRow key={nutrientName}>
                              <TableCell className="font-medium">{nutrientName}</TableCell>
                              <TableCell className="text-right">
                                {value.quantity.toFixed(2)} {value.unit}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Note about allergens */}
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> USDA FoodData Central does not provide allergen information.
                  When using this ingredient in a recipe, you will need to manually specify any allergens.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedIngredient(null)}>
              Close
            </Button>
            <Button>
              Use in Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
