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
  Search,
  Plus,
  Package,
  Loader2,
  Database,
  Info,
  ChevronLeft,
  ChevronRight,
  Edit,
} from 'lucide-react'
import { CreateIngredientModal } from '../components/CreateIngredientModal'
import type { Ingredient, NutrientValue } from '../types'

/**
 * Ingredients View
 *
 * Single page for managing ingredients with:
 * - USDA database search
 * - User-created ingredients list
 * - Create new ingredient functionality
 */

// USDA ingredient type from our API
interface USDAIngredient {
  id: string
  fdcId: number
  name: string
  description: string
  dataType: string
  foodCategory: string
  scientificName?: string
  nutrients: Record<string, { quantity: number; unit: string }>
  source: string
}

// Unit conversions for calculating quantity in grams
const UNIT_CONVERSIONS: Record<string, number> = {
  'G': 1,
  'KG': 1000,
  'ML': 1,
  'L': 1000,
  'TBSP': 15,
  'TSP': 5,
  'CUP': 240,
  'PIECE': 1,
}

// Generate unique ID for manual ingredients
const generateId = () => `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Create empty ingredient template
const createEmptyIngredient = (): Ingredient => ({
  name: '',
  ingredient_id: generateId(),
  entity_ingredient_id: generateId(),
  quantity: 0,
  quantity_in_grams: 0,
  unit: 'G',
  source: 'MANUAL',
  yield_percent: 100,
  yield_quantity_in_grams: 0,
  cost: 0,
  is_starred: false,
  composite_ingredients: [],
  allergens: [],
  user_allergens: [],
  may_contain_allergens: [],
  user_may_contain_allergens: [],
  nutrients: {},
})

const PAGE_SIZE = 25

export function IngredientsView() {
  // USDA Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<USDAIngredient[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalHits, setTotalHits] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // User Ingredients State (stored in localStorage for now)
  const [userIngredients, setUserIngredients] = useState<Ingredient[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient>(createEmptyIngredient())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Load user ingredients from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recipe_builder_user_ingredients')
    if (saved) {
      try {
        setUserIngredients(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load user ingredients:', e)
      }
    }
  }, [])

  // Save user ingredients to localStorage
  useEffect(() => {
    localStorage.setItem('recipe_builder_user_ingredients', JSON.stringify(userIngredients))
  }, [userIngredients])

  // Search USDA database
  const searchUSDA = useCallback(async (query: string, page: number) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setTotalHits(0)
      setTotalPages(0)
      return
    }

    setSearchLoading(true)
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
        setSearchResults(data || [])
        setTotalHits(hits || 0)
        setTotalPages(pages || 0)
      }
    } catch (error) {
      console.error('Failed to search USDA:', error)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      searchUSDA(searchQuery, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchUSDA])

  // Page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    searchUSDA(searchQuery, newPage)
  }

  // Open modal for new ingredient
  const handleAddIngredient = () => {
    setEditingIngredient(createEmptyIngredient())
    setEditingIndex(null)
    setIsModalOpen(true)
  }

  // Open modal to add USDA ingredient
  const handleAddUSDAIngredient = (usdaIngredient: USDAIngredient) => {
    // Convert USDA nutrients to Recipe Builder format
    const nutrients: Record<string, NutrientValue> = {}
    Object.entries(usdaIngredient.nutrients).forEach(([name, value]) => {
      nutrients[name] = {
        quantity: value.quantity,
        unit: value.unit.toLowerCase(),
      }
    })

    const ingredient: Ingredient = {
      ...createEmptyIngredient(),
      name: usdaIngredient.name,
      source: 'USDA',
      ingredient_id: usdaIngredient.fdcId.toString(),
      nutrients,
      quantity: 100,
      unit: 'G',
    }

    setEditingIngredient(ingredient)
    setEditingIndex(null)
    setIsModalOpen(true)
  }

  // Open modal to edit existing ingredient
  const handleEditIngredient = (index: number) => {
    setEditingIngredient({ ...userIngredients[index] })
    setEditingIndex(index)
    setIsModalOpen(true)
  }

  // Save ingredient
  const handleSaveIngredient = () => {
    // Calculate quantity in grams based on unit conversion
    const unitMultiplier = UNIT_CONVERSIONS[editingIngredient.unit] || 1
    const quantityInGrams = editingIngredient.quantity * unitMultiplier
    const yieldQuantity = quantityInGrams * (editingIngredient.yield_percent / 100)

    const ingredientToSave: Ingredient = {
      ...editingIngredient,
      quantity_in_grams: quantityInGrams,
      yield_quantity_in_grams: yieldQuantity,
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...userIngredients]
      updated[editingIndex] = ingredientToSave
      setUserIngredients(updated)
    } else {
      // Add new
      setUserIngredients([...userIngredients, ingredientToSave])
    }

    setIsModalOpen(false)
    setEditingIngredient(createEmptyIngredient())
    setEditingIndex(null)
  }

  // Handle ingredient change in modal
  const handleIngredientChange = (updates: Partial<Ingredient>) => {
    setEditingIngredient((prev) => ({ ...prev, ...updates }))
  }

  // Format nutrient value
  const formatNutrient = (value: { quantity: number; unit: string } | undefined) => {
    if (!value) return '--'
    return `${value.quantity.toFixed(1)} ${value.unit}`
  }

  // Get data type badge color
  const getDataTypeBadge = (dataType: string) => {
    switch (dataType) {
      case 'Foundation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'SR Legacy':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAllergens = (allergens: string[] | undefined) => {
    if (!allergens || allergens.length === 0) return '--'
    if (allergens.length <= 2) return allergens.join(', ')
    return `${allergens.slice(0, 2).join(', ')} +${allergens.length - 2}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Ingredients
          </h1>
          <p className="text-muted-foreground">
            Search USDA database or create custom ingredients
          </p>
        </div>
        <Button onClick={handleAddIngredient}>
          <Plus className="w-4 h-4 mr-2" />
          Create Ingredient
        </Button>
      </div>

      {/* User Created Ingredients */}
      {userIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Ingredients ({userIngredients.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Calories</TableHead>
                  <TableHead className="text-right">Protein</TableHead>
                  <TableHead>Allergens</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userIngredients.map((ingredient, index) => (
                  <TableRow key={ingredient.ingredient_id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>
                      <Badge variant={ingredient.source === 'USDA' ? 'default' : 'secondary'}>
                        {ingredient.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNutrient(ingredient.nutrients?.['Energy'])}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNutrient(ingredient.nutrients?.['Protein'])}
                    </TableCell>
                    <TableCell>{formatAllergens(ingredient.allergens)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditIngredient(index)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* USDA Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            Search USDA Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search USDA ingredients (e.g., chicken breast, salmon, olive oil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {searchQuery.length < 2
                ? 'Type at least 2 characters to search'
                : searchLoading
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

      {/* USDA Results Table */}
      {(searchResults.length > 0 || searchLoading) && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Ingredient Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Calories</TableHead>
                <TableHead className="text-right">Protein</TableHead>
                <TableHead className="text-right">Carbs</TableHead>
                <TableHead className="text-right">Fat</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchLoading && searchResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="mt-2 text-muted-foreground">Searching USDA database...</p>
                  </TableCell>
                </TableRow>
              ) : (
                searchResults.map((ingredient) => (
                  <TableRow key={ingredient.id}>
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
                    <TableCell className="text-sm text-muted-foreground">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddUSDAIngredient(ingredient)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
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
                disabled={currentPage === 1 || searchLoading}
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
                disabled={currentPage === totalPages || searchLoading}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Empty state when no search */}
      {searchQuery.length < 2 && userIngredients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Get Started with Ingredients</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Search the USDA FoodData Central database to find ingredients with complete
              nutritional data, or create your own custom ingredients.
            </p>
            <Button onClick={handleAddIngredient}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Ingredient
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Ingredient Modal */}
      <CreateIngredientModal
        isOpen={isModalOpen}
        ingredient={editingIngredient}
        isEditing={editingIndex !== null}
        onClose={() => {
          setIsModalOpen(false)
          setEditingIngredient(createEmptyIngredient())
          setEditingIndex(null)
        }}
        onSave={handleSaveIngredient}
        onChange={handleIngredientChange}
      />

      {/* Hidden: Imported Ingredients Section (kept for future use) */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Imported Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          ... imported ingredients table ...
        </CardContent>
      </Card>
      */}
    </div>
  )
}
