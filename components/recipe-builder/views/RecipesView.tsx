'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Search,
  Plus,
  Upload,
  Download,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Package,
  Minus,
} from 'lucide-react'
import { useRecipes, useRecipeBuilderNavigation } from '../context/RecipeBuilderContext'
import { RecipeDetailView } from './RecipeDetailView'
import { RecipeBuilderView } from './RecipeBuilderView'
import type { Recipe, RecipeInventory } from '../types'

/**
 * Recipes View
 *
 * Displays recipe list with search, filtering, and pagination.
 */

const RECIPES_PER_PAGE = 10

export function RecipesView() {
  const { recipes, loading, createRecipe, updateRecipe } = useRecipes()
  const { navigateTo, currentView, selectedRecipeId, goBack } = useRecipeBuilderNavigation()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Local state for create/edit mode
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Stock update modal state
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockRecipe, setStockRecipe] = useState<Recipe | null>(null)
  const [stockQuantity, setStockQuantity] = useState(0)
  const [stockUnit, setStockUnit] = useState('portions')
  const [stockAdjustment, setStockAdjustment] = useState(0)
  const [isUpdatingStock, setIsUpdatingStock] = useState(false)

  // Handle create new recipe
  const handleCreateRecipe = () => {
    setEditingRecipeId(null)
    setIsBuilderOpen(true)
  }

  // Handle edit recipe
  const handleEditRecipe = (recipeId: string) => {
    setEditingRecipeId(recipeId)
    setIsBuilderOpen(true)
  }

  // Handle close builder
  const handleCloseBuilder = () => {
    setIsBuilderOpen(false)
    setEditingRecipeId(null)
  }

  // Handle save recipe
  const handleSaveRecipe = async (recipe: Partial<Recipe>) => {
    setIsSaving(true)
    try {
      if (editingRecipeId) {
        // Update existing recipe
        await updateRecipe(editingRecipeId, recipe)
      } else {
        // Create new recipe
        await createRecipe(recipe)
      }
      // Close builder after successful save
      handleCloseBuilder()
    } catch (error) {
      console.error('Failed to save recipe:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle open stock modal
  const handleOpenStockModal = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation()
    setStockRecipe(recipe)
    setStockQuantity(recipe.inventory?.stock_quantity || 0)
    setStockUnit(recipe.inventory?.stock_unit || 'portions')
    setStockAdjustment(0)
    setStockModalOpen(true)
  }

  // Handle stock update
  const handleUpdateStock = async () => {
    if (!stockRecipe) return

    setIsUpdatingStock(true)
    try {
      const newQuantity = stockQuantity + stockAdjustment
      const updatedInventory: RecipeInventory = {
        stock_quantity: Math.max(0, newQuantity),
        stock_unit: stockUnit,
        min_stock_alert: stockRecipe.inventory?.min_stock_alert || null,
        last_stock_update: new Date().toISOString(),
      }

      await updateRecipe(stockRecipe.id, { inventory: updatedInventory })
      setStockModalOpen(false)
      setStockRecipe(null)
    } catch (error) {
      console.error('Failed to update stock:', error)
    } finally {
      setIsUpdatingStock(false)
    }
  }

  // Quick stock adjustment
  const handleQuickAdjust = (amount: number) => {
    setStockAdjustment((prev) => prev + amount)
  }

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(recipes.map((r) => r.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [recipes])

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        !searchQuery ||
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' || recipe.status === statusFilter
      const matchesCategory =
        categoryFilter === 'all' || recipe.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [recipes, searchQuery, statusFilter, categoryFilter])

  // Pagination
  const totalPages = Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE)
  const startIndex = (currentPage - 1) * RECIPES_PER_PAGE
  const endIndex = startIndex + RECIPES_PER_PAGE
  const paginatedRecipes = filteredRecipes.slice(startIndex, endIndex)

  // Reset page when filters change
  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value)
    setCurrentPage(1)
  }

  // Generate page numbers
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  const handleRowClick = (recipe: Recipe) => {
    navigateTo('recipe-detail', { recipeId: recipe.id })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'default'
      case 'DRAFT':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // If in recipe builder mode (create or edit)
  if (isBuilderOpen) {
    return (
      <RecipeBuilderView
        recipeId={editingRecipeId}
        onBack={handleCloseBuilder}
        onSave={handleSaveRecipe}
      />
    )
  }

  // If viewing a specific recipe detail
  if (currentView === 'recipe-detail' && selectedRecipeId) {
    return (
      <RecipeDetailView
        recipeId={selectedRecipeId}
        onBack={goBack}
        onEdit={() => handleEditRecipe(selectedRecipeId)}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recipes</h1>
          <p className="text-muted-foreground">
            Manage your recipes and nutrition labels
          </p>
        </div>
        <div className="flex gap-2">
        
          <Button size="sm" onClick={handleCreateRecipe}>
            <Plus className="w-4 h-4 mr-2" />
            Add Recipe
          </Button>
        </div>
      </div>

 

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange(setStatusFilter, value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value) => handleFilterChange(setCategoryFilter, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredRecipes.length)} of{' '}
            {filteredRecipes.length} recipes
          </div>
        </CardContent>
      </Card>

      {/* Recipe Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sub Category</TableHead>
              <TableHead>Serving Size</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated On</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading recipes...
                </TableCell>
              </TableRow>
            ) : paginatedRecipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <p>No recipes found</p>
                    <p className="text-sm text-muted-foreground">
                      {filteredRecipes.length === 0 && recipes.length === 0
                        ? 'Recipes will appear here once loaded from the database.'
                        : 'Try adjusting your search or filters.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecipes.map((recipe) => (
                <TableRow
                  key={recipe.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(recipe)}
                >
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>{recipe.category || '--'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {recipe.sub_category || '--'}
                  </TableCell>
                  <TableCell>
                    {recipe.serving?.serving_size_grams || 100} G
                  </TableCell>
                  <TableCell>
                    {recipe.nutrition?.per_serving?.['Energy']
                      ? `${recipe.nutrition.per_serving['Energy'].quantity.toFixed(1)} Kcal`
                      : '--'}
                  </TableCell>
                  <TableCell>{recipe.costs?.total_cost || 0} AED</TableCell>
                  <TableCell>
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer"
                      onClick={(e) => handleOpenStockModal(recipe, e)}
                    >
                      {recipe.inventory ? (
                        <>
                          {recipe.inventory.min_stock_alert &&
                          recipe.inventory.stock_quantity <= recipe.inventory.min_stock_alert ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span
                            className={
                              recipe.inventory.min_stock_alert &&
                              recipe.inventory.stock_quantity <= recipe.inventory.min_stock_alert
                                ? 'text-amber-600 font-medium'
                                : ''
                            }
                          >
                            {recipe.inventory.stock_quantity} {recipe.inventory.stock_unit}
                          </span>
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Set stock</span>
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(recipe.status)}>
                      {recipe.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(recipe.updated_at)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Open action menu
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {getPageNumbers().map((page, idx) =>
                typeof page === 'number' ? (
                  <Button
                    key={idx}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={idx} className="px-2 text-muted-foreground">
                    {page}
                  </span>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Stock Update Modal */}
      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Update Stock
            </DialogTitle>
            <DialogDescription>
              {stockRecipe?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Stock Display */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Stock</span>
              <span className="text-lg font-semibold">
                {stockQuantity} {stockUnit}
              </span>
            </div>

            {/* Quick Adjustment Buttons */}
            <div className="space-y-2">
              <Label>Quick Adjust</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(-10)}
                  className="flex-1"
                >
                  -10
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(-5)}
                  className="flex-1"
                >
                  -5
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(-1)}
                  className="flex-1"
                >
                  -1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(1)}
                  className="flex-1"
                >
                  +1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(5)}
                  className="flex-1"
                >
                  +5
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(10)}
                  className="flex-1"
                >
                  +10
                </Button>
              </div>
            </div>

            {/* Adjustment Display */}
            {stockAdjustment !== 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <span className="text-sm">Adjustment</span>
                <span className={`text-lg font-semibold ${stockAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockAdjustment > 0 ? '+' : ''}{stockAdjustment}
                </span>
              </div>
            )}

            {/* New Stock Total */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-sm font-medium">New Stock</span>
              <span className="text-xl font-bold">
                {Math.max(0, stockQuantity + stockAdjustment)} {stockUnit}
              </span>
            </div>

            {/* Manual Input */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-quantity">Set Quantity</Label>
                <Input
                  id="manual-quantity"
                  type="number"
                  min="0"
                  value={stockQuantity + stockAdjustment}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0
                    setStockAdjustment(newValue - stockQuantity)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-unit">Unit</Label>
                <Select value={stockUnit} onValueChange={setStockUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portions">Portions</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="l">Liters</SelectItem>
                    <SelectItem value="ml">Milliliters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStock} disabled={isUpdatingStock}>
              {isUpdatingStock ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

