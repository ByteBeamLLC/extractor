"use client"

import * as React from "react"
import { 
  Search, 
  Loader2, 
  Plus, 
  X, 
  Zap, 
  Database,
  ChevronRight,
  Apple,
  Beef,
  Milk,
  Wheat,
  Fish,
  Carrot,
  Cookie,
  Coffee,
  Flame
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { IngredientNutrition, RecipeIngredient } from "./types"
import { createEmptyIngredient, UNIT_TO_GRAMS } from "./types"

// Search result from API
export interface FoodResult {
  id: string
  source: string
  sourceId: string
  description: string
  descriptionAr?: string
  foodGroup?: string
  nutrition: IngredientNutrition
  allergens: string[]
  halalStatus?: string
  sourceAttribution: string
}

interface QuickResult {
  id: string
  description: string
  source: string
  foodGroup?: string
}

interface IngredientSearchProps {
  onAdd: (ingredient: RecipeIngredient) => void
  className?: string
  placeholder?: string
}

// Food group icons
const FOOD_GROUP_ICONS: Record<string, React.ReactNode> = {
  "Fruits": <Apple className="h-3.5 w-3.5" />,
  "Vegetables": <Carrot className="h-3.5 w-3.5" />,
  "Beef": <Beef className="h-3.5 w-3.5" />,
  "Pork": <Beef className="h-3.5 w-3.5" />,
  "Lamb & Game": <Beef className="h-3.5 w-3.5" />,
  "Poultry": <Beef className="h-3.5 w-3.5" />,
  "Seafood": <Fish className="h-3.5 w-3.5" />,
  "Dairy & Eggs": <Milk className="h-3.5 w-3.5" />,
  "Cereals & Grains": <Wheat className="h-3.5 w-3.5" />,
  "Baked Goods": <Cookie className="h-3.5 w-3.5" />,
  "Beverages": <Coffee className="h-3.5 w-3.5" />,
}

// Source colors
const SOURCE_COLORS: Record<string, string> = {
  usda_sr: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  usda_foundation: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  uk_cofid: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  canada_cnf: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const SOURCE_LABELS: Record<string, string> = {
  usda_sr: "USDA",
  usda_foundation: "USDA",
  uk_cofid: "UK",
  canada_cnf: "Canada",
}

// Popular/suggested ingredients
const SUGGESTED_INGREDIENTS = [
  "chicken breast", "olive oil", "butter", "salt", "sugar",
  "all-purpose flour", "eggs", "milk", "rice", "onion"
]

export function IngredientSearch({ 
  onAdd, 
  className,
  placeholder = "Search 19,000+ ingredients..."
}: IngredientSearchProps) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<QuickResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [selectedFood, setSelectedFood] = React.useState<FoodResult | null>(null)
  const [amount, setAmount] = React.useState<string>("100")
  const [unit, setUnit] = React.useState<string>("g")
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceRef = React.useRef<NodeJS.Timeout>()

  // Search function
  const handleSearch = React.useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(searchQuery)}&quick=true&limit=12`
      )
      
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setSelectedIndex(0)
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      handleSearch(query)
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, handleSearch])

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSelectedFood(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && query.length >= 2) {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelectFood(results[selectedIndex].id)
        }
        break
      case "Escape":
        setIsOpen(false)
        setSelectedFood(null)
        break
    }
  }

  // Select a food and load full details
  const handleSelectFood = async (foodId: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(
        `/api/foods/search?action=get&id=${encodeURIComponent(foodId)}`
      )
      
      if (response.ok) {
        const food = await response.json() as FoodResult
        setSelectedFood(food)
        setAmount("100")
        setUnit("g")
      }
    } catch (err) {
      console.error("Error fetching food:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Add ingredient to recipe
  const handleAddIngredient = () => {
    if (!selectedFood) return

    const amountNum = parseFloat(amount) || 100
    const gramsEquivalent = amountNum * (UNIT_TO_GRAMS[unit] || 1)

    const ingredient: RecipeIngredient = {
      ...createEmptyIngredient(),
      name: selectedFood.description,
      amount: amountNum,
      unit: unit as any,
      gramsEquivalent,
      nutrition: selectedFood.nutrition,
      allergens: selectedFood.allergens,
      notes: `Source: ${selectedFood.sourceAttribution}`,
    }

    onAdd(ingredient)
    
    // Reset state
    setQuery("")
    setResults([])
    setSelectedFood(null)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Quick add with default 100g
  const handleQuickAdd = async (foodId: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(
        `/api/foods/search?action=get&id=${encodeURIComponent(foodId)}`
      )
      
      if (response.ok) {
        const food = await response.json() as FoodResult
        
        const ingredient: RecipeIngredient = {
          ...createEmptyIngredient(),
          name: food.description,
          amount: 100,
          unit: "g",
          gramsEquivalent: 100,
          nutrition: food.nutrition,
          allergens: food.allergens,
          notes: `Source: ${food.sourceAttribution}`,
        }

        onAdd(ingredient)
        setQuery("")
        setResults([])
        setIsOpen(false)
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate nutrition for current amount
  const getScaledNutrition = (nutrition: IngredientNutrition, grams: number) => {
    const scale = grams / 100
    return {
      calories: Math.round(nutrition.calories * scale),
      protein: Math.round(nutrition.protein * scale * 10) / 10,
      fat: Math.round(nutrition.totalFat * scale * 10) / 10,
      carbs: Math.round(nutrition.totalCarbohydrates * scale * 10) / 10,
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedFood(null)
          }}
          onFocus={() => {
            if (query.length >= 2 || results.length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-lg border-2 border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              setSelectedFood(null)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-popover border-2 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Selected Food Detail View */}
          {selectedFood ? (
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-sm leading-tight">
                    {selectedFood.description}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedFood.foodGroup && (
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedFood.foodGroup}
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px]", SOURCE_COLORS[selectedFood.source])}
                    >
                      {SOURCE_LABELS[selectedFood.source] || selectedFood.source}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                    min="0"
                    step="1"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-9 px-2 rounded-md border bg-background text-sm"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="cups">cups</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                  </select>
                </div>
              </div>

              {/* Nutrition Preview */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Nutrition for {amount}{unit}
                  </span>
                </div>
                {(() => {
                  const grams = (parseFloat(amount) || 100) * (UNIT_TO_GRAMS[unit] || 1)
                  const scaled = getScaledNutrition(selectedFood.nutrition, grams)
                  return (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-orange-600">{scaled.calories}</div>
                        <div className="text-[10px] text-muted-foreground">Calories</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{scaled.protein}g</div>
                        <div className="text-[10px] text-muted-foreground">Protein</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">{scaled.fat}g</div>
                        <div className="text-[10px] text-muted-foreground">Fat</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{scaled.carbs}g</div>
                        <div className="text-[10px] text-muted-foreground">Carbs</div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Allergens */}
              {selectedFood.allergens.length > 0 && (
                <div className="mb-4">
                  <span className="text-xs text-muted-foreground">Contains: </span>
                  {selectedFood.allergens.map(a => (
                    <Badge key={a} variant="destructive" className="text-[10px] mr-1">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Button */}
              <Button onClick={handleAddIngredient} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add to Recipe
              </Button>
            </div>
          ) : query.length < 2 ? (
            /* Suggestions when no query */
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">19,388 foods available</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Popular ingredients:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_INGREDIENTS.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      setQuery(suggestion)
                      handleSearch(suggestion)
                    }}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !isLoading ? (
            /* No results */
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No foods found for "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            /* Results list */
            <ScrollArea className="max-h-[400px]">
              <div className="p-2">
                {results.map((food, index) => (
                  <div
                    key={food.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
                      selectedIndex === index 
                        ? "bg-primary/10" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleSelectFood(food.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {/* Food Group Icon */}
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {FOOD_GROUP_ICONS[food.foodGroup || ""] || <Apple className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {/* Food Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {food.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {food.foodGroup && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {food.foodGroup}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1 py-0 h-4",
                            SOURCE_COLORS[food.source]
                          )}
                        >
                          {SOURCE_LABELS[food.source] || food.source}
                        </Badge>
                      </div>
                    </div>

                    {/* Quick Add Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-8 px-2 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickAdd(food.id)
                      }}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">100g</span>
                    </Button>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="border-t px-3 py-2 bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Data from USDA, UK CoFID, Canada CNF
            </span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>↑↓</span> Navigate
              <span className="mx-1">•</span>
              <span>Enter</span> Select
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export type { FoodResult, QuickResult }

