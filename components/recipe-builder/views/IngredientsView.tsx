'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Plus,
  ChevronLeft,
  Edit,
  Package,
} from 'lucide-react'
import {
  useRecipes,
  useCustomIngredients,
  useRecipeBuilderNavigation,
} from '../context/RecipeBuilderContext'
import { INGREDIENT_CATEGORIES } from '../types'
import type { Ingredient, CustomIngredient } from '../types'

/**
 * Ingredients View
 *
 * Displays ingredient management with tabs for standard and custom ingredients.
 */

export function IngredientsView() {
  const { recipes } = useRecipes()
  const { customIngredients } = useCustomIngredients()
  const { currentView, navigateTo, goBack } = useRecipeBuilderNavigation()

  const [activeTab, setActiveTab] = useState<'manage' | 'custom'>('manage')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Extract all unique ingredients from recipes
  const allIngredients = useMemo(() => {
    const ingredientMap = new Map<string, Ingredient>()
    recipes.forEach((recipe) => {
      recipe.ingredients?.forEach((ingredient) => {
        if (!ingredientMap.has(ingredient.ingredient_id)) {
          ingredientMap.set(ingredient.ingredient_id, ingredient)
        }
      })
    })
    return Array.from(ingredientMap.values())
  }, [recipes])

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    return allIngredients.filter((ingredient) => {
      const matchesSearch =
        !searchQuery ||
        ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
      // Note: Standard ingredients don't have a category field in current schema
      // This filter will work when categories are added
      return matchesSearch
    })
  }, [allIngredients, searchQuery])

  // Filter custom ingredients
  const filteredCustomIngredients = useMemo(() => {
    return customIngredients.filter((ingredient) => {
      const matchesSearch =
        !searchQuery ||
        ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ingredient.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        categoryFilter === 'all' || ingredient.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [customIngredients, searchQuery, categoryFilter])

  // Handle tab change based on currentView
  React.useEffect(() => {
    if (currentView === 'ingredients-custom') {
      setActiveTab('custom')
    } else if (currentView === 'ingredients-manage' || currentView === 'ingredients') {
      setActiveTab('manage')
    }
  }, [currentView])

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'manage' | 'custom')
    if (value === 'custom') {
      navigateTo('ingredients-custom')
    } else {
      navigateTo('ingredients-manage')
    }
  }

  const getSourceBadgeVariant = (source: string) => {
    switch (source?.toUpperCase()) {
      case 'USDA':
        return 'default'
      case 'MANUAL':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatAllergens = (allergens: string[]) => {
    if (!allergens || allergens.length === 0) return '--'
    if (allergens.length <= 2) return allergens.join(', ')
    return `${allergens.slice(0, 2).join(', ')} +${allergens.length - 2}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ingredients</h1>
          <p className="text-muted-foreground">
            Manage your ingredient database and custom ingredients
          </p>
        </div>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="manage">Manage Ingredients</TabsTrigger>
          <TabsTrigger value="custom">Custom Ingredients</TabsTrigger>
        </TabsList>

        {/* Manage Ingredients Tab */}
        <TabsContent value="manage" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {INGREDIENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                {filteredIngredients.length} ingredients found
              </div>
            </CardContent>
          </Card>

          {/* Ingredients Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Weight (g)</TableHead>
                  <TableHead>Cost (AED)</TableHead>
                  <TableHead>Allergens</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIngredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-muted-foreground" />
                        <p>No ingredients found</p>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ingredient
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIngredients.map((ingredient) => (
                    <TableRow key={ingredient.ingredient_id}>
                      <TableCell>
                        <div className="font-medium">{ingredient.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSourceBadgeVariant(ingredient.source)}>
                          {ingredient.source || 'UNKNOWN'}
                        </Badge>
                      </TableCell>
                      <TableCell>{ingredient.quantity_in_grams || '--'}</TableCell>
                      <TableCell>{ingredient.cost || 0}</TableCell>
                      <TableCell>
                        {formatAllergens(ingredient.allergens)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Custom Ingredients Tab */}
        <TabsContent value="custom" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search custom ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {INGREDIENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                {filteredCustomIngredients.length} custom ingredients found
              </div>
            </CardContent>
          </Card>

          {/* Custom Ingredients Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Cost (AED)</TableHead>
                  <TableHead>Allergens</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomIngredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-muted-foreground" />
                        <p>No custom ingredients yet</p>
                        <p className="text-sm text-muted-foreground">
                          Create custom ingredients with your own nutrition data
                        </p>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Custom Ingredient
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomIngredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ingredient.name}</div>
                          {ingredient.display_name && (
                            <div className="text-sm text-muted-foreground">
                              {ingredient.display_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ingredient.category}</TableCell>
                      <TableCell>
                        {ingredient.weight} {ingredient.weight_unit}
                      </TableCell>
                      <TableCell>{ingredient.cost}</TableCell>
                      <TableCell>
                        {formatAllergens(ingredient.allergens)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
