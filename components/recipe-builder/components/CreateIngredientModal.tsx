'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Database, Loader2, Check } from 'lucide-react'
import type { Ingredient, NutrientValue } from '../types'

/**
 * Create/Edit Ingredient Modal
 *
 * Modal for adding or editing ingredients with:
 * - Search USDA FoodData Central for ingredients
 * - Basic info (name, quantity, unit, yield, cost)
 * - Nutrients (40+ nutrients per 100g)
 * - Allergens (18 main + 45 may-contain)
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

// All nutrients with their default units
const NUTRIENTS: { name: string; unit: string }[] = [
  { name: 'Energy', unit: 'kcal' },
  { name: 'Total Carbohydrates', unit: 'g' },
  { name: 'Protein', unit: 'g' },
  { name: 'Total Fat', unit: 'g' },
  { name: 'Dietary Fiber', unit: 'g' },
  { name: 'Net Carbohydrates', unit: 'g' },
  { name: 'Calcium', unit: 'mg' },
  { name: 'Sodium', unit: 'mg' },
  { name: 'Iron', unit: 'mg' },
  { name: 'Potassium', unit: 'mg' },
  { name: 'Saturated Fat', unit: 'g' },
  { name: 'Trans Fat', unit: 'g' },
  { name: 'Total Sugar', unit: 'g' },
  { name: 'Cholesterol', unit: 'mg' },
  { name: 'Vitamin D', unit: 'mcg' },
  { name: 'Phosphorus', unit: 'mg' },
  { name: 'Sugar Alcohol', unit: 'g' },
  { name: 'Added Sugar', unit: 'g' },
  { name: 'Salt', unit: 'g' },
  { name: 'Magnesium', unit: 'mg' },
  { name: 'Pantothenic acid', unit: 'mg' },
  { name: 'Polyunsaturated Fat', unit: 'g' },
  { name: 'Manganese', unit: 'mg' },
  { name: 'Vitamin A', unit: 'mcg' },
  { name: 'Vitamin E', unit: 'mg' },
  { name: 'Vitamin C', unit: 'mg' },
  { name: 'Vitamin B6', unit: 'mg' },
  { name: 'Zinc', unit: 'mg' },
  { name: 'Thiamin', unit: 'mg' },
  { name: 'Niacin', unit: 'mg' },
  { name: 'Monounsaturated Fat', unit: 'g' },
  { name: 'Copper', unit: 'mg' },
  { name: 'Selenium', unit: 'mcg' },
  { name: 'Riboflavin', unit: 'mg' },
  { name: 'Folate', unit: 'mcg' },
  { name: 'Vitamin B12', unit: 'mcg' },
  { name: 'Vitamin K', unit: 'mcg' },
  { name: 'Caffeine', unit: 'mg' },
]

// Main allergens (18)
const ALLERGENS = [
  'Dairy',
  'Fish',
  'Gluten',
  'Treenut',
  'Sesame',
  'Oats',
  'Mustard',
  'Natural latex',
  'Lupin',
  'Lentil',
  'Peanut',
  'Soy',
  'Sulfur Dioxide or Sulphites',
  'Egg',
  'Celery',
  'Molluscs',
  'Crustacean',
  'Casein',
]

// May contain allergens (45)
const MAY_CONTAIN_ALLERGENS = [
  'Banana',
  'Monosodium Glutamate',
  'Red Chilli',
  'Litchee',
  'Papaya',
  'Food Color',
  'Apple',
  'Wine',
  'Sunflower Seed',
  'Cocoa',
  'Kiwi',
  'Cinnamon',
  'Citrus',
  'Poultry Meat',
  'Garlic',
  'Caffeine',
  'Cucumber',
  'Fig',
  'Sago',
  'Pumpkin',
  'Mutton',
  'Brinjal',
  'Chickpea',
  'Food Additive',
  'Corn',
  'Ladys Finger',
  'Poppy',
  'Coconut',
  'Yeast',
  'Red Meat',
  'Tomato',
  'Tamarind',
  'Mushroom',
  'Masoor Dal',
  'Strawberry',
  'Turmeric',
  'Green Peas',
  'Asafoetida',
  'Green Grapes',
  'White Meat',
  'Mango',
  'Pineapple',
  'Carrot',
  'Beetroot',
  'Ginger',
]

// Unit options
const UNITS = ['G', 'KG', 'ML', 'L', 'TBSP', 'TSP', 'CUP', 'PIECE']


interface CreateIngredientModalProps {
  isOpen: boolean
  ingredient: Ingredient
  isEditing: boolean
  onClose: () => void
  onSave: () => void
  onChange: (updates: Partial<Ingredient>) => void
}

export function CreateIngredientModal({
  isOpen,
  ingredient,
  isEditing,
  onClose,
  onSave,
  onChange,
}: CreateIngredientModalProps) {
  const [activeTab, setActiveTab] = useState('search')
  const [nutrientSearch, setNutrientSearch] = useState('')
  const [allergenSearch, setAllergenSearch] = useState('')
  const [allergenTab, setAllergenTab] = useState<'allergens' | 'maycontain'>('allergens')

  // Database search state
  const [dbSearchQuery, setDbSearchQuery] = useState('')
  const [dbSearchResults, setDbSearchResults] = useState<USDAIngredient[]>([])
  const [dbSearchLoading, setDbSearchLoading] = useState(false)
  const [selectedDbIngredient, setSelectedDbIngredient] = useState<USDAIngredient | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && !isEditing) {
      setActiveTab('search')
      setDbSearchQuery('')
      setDbSearchResults([])
      setSelectedDbIngredient(null)
    } else if (isOpen && isEditing) {
      setActiveTab('basic')
    }
  }, [isOpen, isEditing])

  // Search USDA database with debounce
  useEffect(() => {
    if (!dbSearchQuery || dbSearchQuery.length < 2) {
      setDbSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setDbSearchLoading(true)
      try {
        const params = new URLSearchParams({
          action: 'search',
          query: dbSearchQuery,
          pageSize: '20',
        })
        const res = await fetch(`/api/recipe-builder/usda?${params}`)
        if (res.ok) {
          const { data } = await res.json()
          setDbSearchResults(data || [])
        }
      } catch (error) {
        console.error('Failed to search USDA:', error)
      } finally {
        setDbSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [dbSearchQuery])

  // Handle selecting ingredient from USDA database
  const handleSelectDbIngredient = useCallback((food: USDAIngredient) => {
    setSelectedDbIngredient(food)

    // Convert USDA nutrients to Recipe Builder format (normalize units to lowercase)
    const nutrients: Record<string, NutrientValue> = {}
    Object.entries(food.nutrients).forEach(([name, value]) => {
      nutrients[name] = {
        quantity: value.quantity,
        unit: value.unit.toLowerCase(),
      }
    })

    onChange({
      name: food.name,
      source: 'USDA',
      ingredient_id: food.fdcId.toString(),
      nutrients,
      allergens: [], // USDA doesn't provide allergen data
      quantity: 100, // Default to 100g
      unit: 'G',
      yield_percent: 100,
    })

    // Switch to basic tab to let user adjust quantity
    setActiveTab('basic')
  }, [onChange])

  // Validation
  const canSave = ingredient.name.trim() !== '' && ingredient.quantity > 0

  // Nutrient handlers
  const handleNutrientChange = (nutrientName: string, quantity: number, unit: string) => {
    const updatedNutrients = { ...ingredient.nutrients }
    if (quantity > 0) {
      updatedNutrients[nutrientName] = { quantity, unit }
    } else {
      delete updatedNutrients[nutrientName]
    }
    onChange({ nutrients: updatedNutrients })
  }

  // Allergen handlers
  const handleAllergenToggle = (allergen: string) => {
    const currentAllergens = ingredient.allergens || []
    const updated = currentAllergens.includes(allergen)
      ? currentAllergens.filter((a) => a !== allergen)
      : [...currentAllergens, allergen]
    onChange({ allergens: updated })
  }

  const handleMayContainToggle = (allergen: string) => {
    const current = ingredient.may_contain_allergens || []
    const updated = current.includes(allergen)
      ? current.filter((a) => a !== allergen)
      : [...current, allergen]
    onChange({ may_contain_allergens: updated })
  }

  // Filter nutrients and allergens by search
  const filteredNutrients = NUTRIENTS.filter((n) =>
    n.name.toLowerCase().includes(nutrientSearch.toLowerCase())
  )

  const filteredAllergens = ALLERGENS.filter((a) =>
    a.toLowerCase().includes(allergenSearch.toLowerCase())
  )

  const filteredMayContain = MAY_CONTAIN_ALLERGENS.filter((a) =>
    a.toLowerCase().includes(allergenSearch.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" disabled={isEditing}>
              <Database className="w-4 h-4 mr-1" />
              Search
            </TabsTrigger>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
            <TabsTrigger value="allergens">Allergens</TabsTrigger>
          </TabsList>

          {/* Search Database Tab */}
          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search USDA ingredients (e.g., chicken breast, olive oil)..."
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {selectedDbIngredient && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Selected: <strong>{selectedDbIngredient.name}</strong>
                  </span>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                {dbSearchQuery.length < 2
                  ? 'Type at least 2 characters to search'
                  : dbSearchLoading
                  ? 'Searching...'
                  : `${dbSearchResults.length} results found`}
              </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg mt-4">
              {dbSearchLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : dbSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Database className="w-8 h-8 mb-2" />
                  <p>Search for ingredients in the USDA FoodData Central database</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="w-20">Type</TableHead>
                      <TableHead className="w-24 text-right">Calories</TableHead>
                      <TableHead className="w-24 text-right">Protein</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbSearchResults.map((food) => (
                      <TableRow
                        key={food.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedDbIngredient?.id === food.id ? 'bg-green-50 dark:bg-green-950' : ''
                        }`}
                        onClick={() => handleSelectDbIngredient(food)}
                      >
                        <TableCell>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {food.foodCategory || 'Unknown category'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {food.dataType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {food.nutrients['Energy']?.quantity?.toFixed(0) || '--'} kcal
                        </TableCell>
                        <TableCell className="text-right">
                          {food.nutrients['Protein']?.quantity?.toFixed(1) || '--'} g
                        </TableCell>
                        <TableCell>
                          {selectedDbIngredient?.id === food.id ? (
                            <Badge variant="default" className="bg-green-600">
                              <Check className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          ) : (
                            <Button variant="ghost" size="sm">
                              Select
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="text-muted-foreground">All nutrition values are per 100g. After selecting, adjust the quantity in Basic Info.</p>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-2 rounded-lg text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> USDA does not provide allergen data. Please add allergens manually in the Allergens tab.
              </div>
            </div>
          </TabsContent>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ing-name">Ingredient Name *</Label>
              <Input
                id="ing-name"
                value={ingredient.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Enter ingredient name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ing-quantity">Quantity *</Label>
                <Input
                  id="ing-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ingredient.quantity || ''}
                  onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ing-unit">Unit</Label>
                <Select
                  value={ingredient.unit}
                  onValueChange={(v) => onChange({ unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ing-yield">Yield Percent</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ing-yield"
                    type="number"
                    min="0"
                    max="100"
                    value={ingredient.yield_percent}
                    onChange={(e) => onChange({ yield_percent: parseFloat(e.target.value) || 100 })}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage retained after cooking
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ing-cost">Cost per Unit (AED)</Label>
                <Input
                  id="ing-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ingredient.cost || ''}
                  onChange={(e) => onChange({ cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Nutrient values should be entered per 100g of ingredient in the Nutrients tab.
              </p>
            </div>
          </TabsContent>

          {/* Nutrients Tab */}
          <TabsContent value="nutrients" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search nutrients..."
                value={nutrientSearch}
                onChange={(e) => setNutrientSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Nutrient</TableHead>
                    <TableHead className="sticky top-0 bg-background w-32">Per 100g</TableHead>
                    <TableHead className="sticky top-0 bg-background w-20">Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNutrients.map((nutrient) => {
                    const value = ingredient.nutrients?.[nutrient.name]
                    return (
                      <TableRow key={nutrient.name}>
                        <TableCell className="py-2">{nutrient.name}</TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={value?.quantity || ''}
                            onChange={(e) =>
                              handleNutrientChange(
                                nutrient.name,
                                parseFloat(e.target.value) || 0,
                                nutrient.unit
                              )
                            }
                            className="h-8"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {nutrient.unit}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Allergens Tab */}
          <TabsContent value="allergens" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={allergenTab === 'allergens' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllergenTab('allergens')}
              >
                Allergens ({(ingredient.allergens || []).length})
              </Button>
              <Button
                variant={allergenTab === 'maycontain' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAllergenTab('maycontain')}
              >
                May Contain ({(ingredient.may_contain_allergens || []).length})
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search allergens..."
                value={allergenSearch}
                onChange={(e) => setAllergenSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex-1 overflow-auto border rounded-lg p-4">
              {allergenTab === 'allergens' ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredAllergens.map((allergen) => (
                    <div key={allergen} className="flex items-center space-x-2">
                      <Checkbox
                        id={`allergen-${allergen}`}
                        checked={(ingredient.allergens || []).includes(allergen)}
                        onCheckedChange={() => handleAllergenToggle(allergen)}
                      />
                      <Label
                        htmlFor={`allergen-${allergen}`}
                        className="text-sm cursor-pointer"
                      >
                        {allergen}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredMayContain.map((allergen) => (
                    <div key={allergen} className="flex items-center space-x-2">
                      <Checkbox
                        id={`maycontain-${allergen}`}
                        checked={(ingredient.may_contain_allergens || []).includes(allergen)}
                        onCheckedChange={() => handleMayContainToggle(allergen)}
                      />
                      <Label
                        htmlFor={`maycontain-${allergen}`}
                        className="text-sm cursor-pointer"
                      >
                        {allergen}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!canSave}>
            {isEditing ? 'Update Ingredient' : 'Add Ingredient'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
