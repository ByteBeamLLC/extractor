"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Search, Database, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { IngredientNutrition } from "./types"

// Types matching the API response
interface FoodSearchResult {
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
  score?: number
}

interface QuickSearchResult {
  id: string
  description: string
  source: string
}

interface FoodSearchAutocompleteProps {
  value?: string
  onSelect: (food: FoodSearchResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Source display names
const SOURCE_LABELS: Record<string, string> = {
  usda_sr: "USDA SR",
  usda_foundation: "USDA Foundation",
  usda_fndds: "USDA FNDDS",
  uk_cofid: "UK CoFID",
  canada_cnf: "Canada CNF",
  india_ifct: "India IFCT",
  fao_infoods: "FAO/INFOODS",
  anz_nuttab: "ANZ NUTTAB",
  custom: "Custom",
}

// Source badge colors
const SOURCE_COLORS: Record<string, string> = {
  usda_sr: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  usda_foundation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  usda_fndds: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  uk_cofid: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  canada_cnf: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  india_ifct: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  fao_infoods: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  anz_nuttab: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function FoodSearchAutocomplete({
  value,
  onSelect,
  placeholder = "Search ingredients...",
  className,
  disabled = false,
}: FoodSearchAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [results, setResults] = React.useState<QuickSearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedFood, setSelectedFood] = React.useState<FoodSearchResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  
  const debounceRef = React.useRef<NodeJS.Timeout>()

  // Quick search as user types
  const handleSearch = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(query)}&quick=true&limit=15`
      )
      
      if (!response.ok) {
        throw new Error("Search failed")
      }
      
      const data = await response.json()
      setResults(data as QuickSearchResult[])
    } catch (err) {
      console.error("Search error:", err)
      setError("Failed to search. Database may not be populated yet.")
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery, handleSearch])

  // Fetch full food details when selected
  const handleSelect = async (foodId: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(
        `/api/foods/search?action=get&id=${encodeURIComponent(foodId)}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to get food details")
      }
      
      const food = await response.json() as FoodSearchResult
      setSelectedFood(food)
      onSelect(food)
      setOpen(false)
    } catch (err) {
      console.error("Error fetching food details:", err)
      setError("Failed to load food details")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            <Database className="h-4 w-4 shrink-0 opacity-50" />
            {selectedFood ? (
              <span className="truncate">{selectedFood.description}</span>
            ) : value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search 45,000+ foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isLoading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
            )}
          </div>
          <CommandList>
            {error ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Run the ETL pipeline to populate the database
                </p>
              </div>
            ) : results.length === 0 && searchQuery.length >= 2 && !isLoading ? (
              <CommandEmpty>No foods found.</CommandEmpty>
            ) : results.length === 0 && searchQuery.length < 2 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {["chicken", "rice", "apple", "salmon", "bread"].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => setSearchQuery(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <CommandGroup heading={`Results (${results.length})`}>
                  {results.map((food) => (
                    <CommandItem
                      key={food.id}
                      value={food.id}
                      onSelect={() => handleSelect(food.id)}
                      className="flex items-start gap-2 py-3 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          selectedFood?.id === food.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {food.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              SOURCE_COLORS[food.source] || SOURCE_COLORS.custom
                            )}
                          >
                            {SOURCE_LABELS[food.source] || food.source}
                          </Badge>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            )}
          </CommandList>
          <div className="border-t p-2 bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Powered by USDA, UK CoFID, Canadian CNF &amp; more
            </p>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Simple inline food search for forms
 */
export function InlineFoodSearch({
  onSelect,
  className,
}: {
  onSelect: (food: FoodSearchResult) => void
  className?: string
}) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<QuickSearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<NodeJS.Timeout>()

  const handleSearch = React.useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(searchQuery)}&quick=true&limit=8`
      )
      
      if (response.ok) {
        const data = await response.json()
        setResults(data as QuickSearchResult[])
        setShowResults(true)
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, handleSearch])

  const handleSelect = async (foodId: string) => {
    try {
      const response = await fetch(
        `/api/foods/search?action=get&id=${encodeURIComponent(foodId)}`
      )
      
      if (response.ok) {
        const food = await response.json() as FoodSearchResult
        onSelect(food)
        setQuery("")
        setShowResults(false)
      }
    } catch (err) {
      console.error("Error fetching food:", err)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search nutrition database..."
          className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <ScrollArea className="max-h-[200px]">
            {results.map((food) => (
              <button
                key={food.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(food.id)
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{food.description}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {SOURCE_LABELS[food.source] || food.source}
                  </Badge>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export type { FoodSearchResult, QuickSearchResult }

