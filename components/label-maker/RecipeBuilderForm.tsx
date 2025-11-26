"use client"

import * as React from "react"
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Package,
    Wheat,
    AlertTriangle,
    Apple,
    Upload,
    Edit2,
    FileText,
    Copy,
    DollarSign,
    Calculator,
    TrendingUp,
    Info,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    type RecipeIngredient,
    type IngredientNutrition,
    COMMON_ALLERGENS,
    UNIT_TO_GRAMS,
    DAILY_VALUES,
    createEmptyIngredient,
    calculateRecipeNutrition,
    calculateIngredientCost,
    calculateRecipeCost,
    aggregateAllergens,
    calculateDailyValuePercent,
    EMPTY_NUTRITION,
} from "./types"
import { InlineFoodSearch, type FoodSearchResult } from "./FoodSearchAutocomplete"
import { IngredientSearch } from "./IngredientSearch"

// Recipe state for the builder
interface RecipeBuilderState {
    name: string
    description: string
    
    // Yield
    recipeYield: number
    yieldUnit: string
    servingSize: number
    servingSizeUnit: string
    
    // Ingredients
    ingredients: RecipeIngredient[]
    
    // Costing
    laborHours: number
    hourlyRate: number
    packagingCost: number
    overheadPercent: number
    targetMarginPercent: number
    
    // Product info (for label)
    brandName: string
    barcode: string
    manufacturerName: string
    manufacturerAddress: string
    manufacturerCountry: string
    storageInstructions: string
    usageInstructions: string
    
    // May contain allergens
    mayContainAllergens: string[]
    
    // Category/tags
    category: string
    tags: string[]
}

const DEFAULT_RECIPE_STATE: RecipeBuilderState = {
    name: "",
    description: "",
    recipeYield: 0,
    yieldUnit: "g",
    servingSize: 0,
    servingSizeUnit: "g",
    ingredients: [],
    laborHours: 0,
    hourlyRate: 0,
    packagingCost: 0,
    overheadPercent: 15,
    targetMarginPercent: 30,
    brandName: "",
    barcode: "",
    manufacturerName: "",
    manufacturerAddress: "",
    manufacturerCountry: "",
    storageInstructions: "",
    usageInstructions: "",
    mayContainAllergens: [],
    category: "",
    tags: [],
}

interface RecipeBuilderFormProps {
    initialData?: Partial<RecipeBuilderState>
    onChange?: (data: RecipeBuilderState) => void
}

// Section wrapper component
function FormSection({ 
    title, 
    icon, 
    children, 
    defaultOpen = true,
    badge,
}: { 
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
    badge?: React.ReactNode
}) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="text-primary">{icon}</div>
                        <span className="font-medium text-sm">{title}</span>
                        {badge}
                    </div>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="p-4 space-y-4 border-x border-b rounded-b-lg bg-background">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

export function RecipeBuilderForm({ initialData, onChange }: RecipeBuilderFormProps) {
    const [recipe, setRecipe] = React.useState<RecipeBuilderState>(() => ({
        ...DEFAULT_RECIPE_STATE,
        ...initialData,
    }))
    
    // Ingredient editing dialog
    const [editingIngredient, setEditingIngredient] = React.useState<RecipeIngredient | null>(null)
    const [isIngredientDialogOpen, setIsIngredientDialogOpen] = React.useState(false)

    // Update recipe and notify parent
    const updateRecipe = (updates: Partial<RecipeBuilderState>) => {
        const newRecipe = { ...recipe, ...updates }
        setRecipe(newRecipe)
        onChange?.(newRecipe)
    }

    // Calculate servings per recipe
    const servingsPerRecipe = React.useMemo(() => {
        if (recipe.servingSize <= 0) return 0
        // If yield and serving are same unit, just divide
        if (recipe.yieldUnit === recipe.servingSizeUnit) {
            return Math.floor(recipe.recipeYield / recipe.servingSize)
        }
        // Convert to grams
        const yieldGrams = recipe.recipeYield * (UNIT_TO_GRAMS[recipe.yieldUnit] || 1)
        const servingGrams = recipe.servingSize * (UNIT_TO_GRAMS[recipe.servingSizeUnit] || 1)
        return Math.floor(yieldGrams / servingGrams)
    }, [recipe.recipeYield, recipe.yieldUnit, recipe.servingSize, recipe.servingSizeUnit])

    // Calculate nutrition
    const calculatedNutrition = React.useMemo(() => {
        return calculateRecipeNutrition(recipe.ingredients, servingsPerRecipe)
    }, [recipe.ingredients, servingsPerRecipe])

    // Calculate total recipe weight (sum of ingredient grams)
    const totalRecipeWeight = React.useMemo(() => {
        return recipe.ingredients.reduce((sum, ing) => {
            const usableGrams = ing.gramsEquivalent * (1 - ing.wastePercent / 100)
            return sum + usableGrams
        }, 0)
    }, [recipe.ingredients])

    // Aggregate allergens
    const aggregatedAllergens = React.useMemo(() => {
        return aggregateAllergens(recipe.ingredients)
    }, [recipe.ingredients])

    // Calculate costs
    const costs = React.useMemo(() => {
        const result = calculateRecipeCost(
            recipe.ingredients,
            recipe.laborHours,
            recipe.hourlyRate,
            recipe.packagingCost,
            recipe.overheadPercent
        )
        const costPerServing = servingsPerRecipe > 0 ? result.totalCost / servingsPerRecipe : 0
        const suggestedPrice = costPerServing > 0 
            ? costPerServing / (1 - recipe.targetMarginPercent / 100)
            : 0
        const grossProfit = suggestedPrice - costPerServing
        
        return {
            ...result,
            costPerServing,
            suggestedPrice,
            grossProfit,
        }
    }, [recipe.ingredients, recipe.laborHours, recipe.hourlyRate, recipe.packagingCost, recipe.overheadPercent, recipe.targetMarginPercent, servingsPerRecipe])

    // Add new ingredient
    const addIngredient = () => {
        const newIngredient = createEmptyIngredient()
        setEditingIngredient(newIngredient)
        setIsIngredientDialogOpen(true)
    }

    // Save ingredient (new or edited)
    const saveIngredient = (ingredient: RecipeIngredient) => {
        const existingIndex = recipe.ingredients.findIndex(ing => ing.id === ingredient.id)
        let newIngredients: RecipeIngredient[]
        
        if (existingIndex >= 0) {
            newIngredients = [...recipe.ingredients]
            newIngredients[existingIndex] = ingredient
        } else {
            newIngredients = [...recipe.ingredients, ingredient]
        }
        
        updateRecipe({ ingredients: newIngredients })
        setIsIngredientDialogOpen(false)
        setEditingIngredient(null)
    }

    // Remove ingredient
    const removeIngredient = (id: string) => {
        updateRecipe({
            ingredients: recipe.ingredients.filter(ing => ing.id !== id)
        })
    }

    // Edit ingredient
    const editIngredient = (ingredient: RecipeIngredient) => {
        setEditingIngredient({ ...ingredient })
        setIsIngredientDialogOpen(true)
    }

    // Duplicate ingredient
    const duplicateIngredient = (ingredient: RecipeIngredient) => {
        const newIngredient = {
            ...ingredient,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${ingredient.name} (Copy)`,
        }
        updateRecipe({
            ingredients: [...recipe.ingredients, newIngredient]
        })
    }

    return (
        <TooltipProvider>
            <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold">Recipe Builder</h2>
                        <p className="text-sm text-muted-foreground">
                            Build your recipe from ingredients to auto-calculate nutrition facts
                        </p>
                    </div>

                    {/* Recipe Setup */}
                    <FormSection title="Recipe Setup" icon={<Package className="h-4 w-4" />}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="recipeName">Recipe Name *</Label>
                                <Input
                                    id="recipeName"
                                    value={recipe.name}
                                    onChange={(e) => updateRecipe({ name: e.target.value })}
                                    placeholder="e.g., Traditional Roasted Turkey"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={recipe.description}
                                    onChange={(e) => updateRecipe({ description: e.target.value })}
                                    placeholder="Brief description of the recipe..."
                                    className="min-h-[60px]"
                                />
                            </div>

                            <Separator />
                            <p className="text-xs text-muted-foreground font-medium">Recipe Yield</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="recipeYield">Total Yield *</Label>
                                    <Input
                                        id="recipeYield"
                                        type="number"
                                        value={recipe.recipeYield || ""}
                                        onChange={(e) => updateRecipe({ recipeYield: parseFloat(e.target.value) || 0 })}
                                        placeholder="1000"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="yieldUnit">Unit</Label>
                                    <Select
                                        value={recipe.yieldUnit}
                                        onValueChange={(v) => updateRecipe({ yieldUnit: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="g">Grams (g)</SelectItem>
                                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                            <SelectItem value="ml">Milliliters (ml)</SelectItem>
                                            <SelectItem value="L">Liters (L)</SelectItem>
                                            <SelectItem value="servings">Servings</SelectItem>
                                            <SelectItem value="pieces">Pieces</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="servingSize">Serving Size *</Label>
                                    <Input
                                        id="servingSize"
                                        type="number"
                                        value={recipe.servingSize || ""}
                                        onChange={(e) => updateRecipe({ servingSize: parseFloat(e.target.value) || 0 })}
                                        placeholder="200"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="servingSizeUnit">Unit</Label>
                                    <Select
                                        value={recipe.servingSizeUnit}
                                        onValueChange={(v) => updateRecipe({ servingSizeUnit: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="g">Grams (g)</SelectItem>
                                            <SelectItem value="ml">Milliliters (ml)</SelectItem>
                                            <SelectItem value="pieces">Pieces</SelectItem>
                                            <SelectItem value="cups">Cups</SelectItem>
                                            <SelectItem value="tbsp">Tablespoons</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Calculated info */}
                            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Servings per Recipe</span>
                                    <span className="font-semibold">{servingsPerRecipe || "—"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Recipe Weight</span>
                                    <span className="font-semibold">{totalRecipeWeight.toFixed(0)}g</span>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Ingredients */}
                    <FormSection 
                        title="Ingredients" 
                        icon={<Wheat className="h-4 w-4" />}
                        badge={
                            recipe.ingredients.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {recipe.ingredients.length}
                                </Badge>
                            )
                        }
                    >
                        <div className="space-y-4">
                            {/* Primary Ingredient Search */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                        Search 19,388 ingredients
                                    </span>
                                </div>
                                <IngredientSearch 
                                    onAdd={(ingredient) => {
                                        updateRecipe({
                                            ingredients: [...recipe.ingredients, ingredient]
                                        })
                                    }}
                                    placeholder="Type to search... (chicken, flour, olive oil...)"
                                />
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    Nutrition data auto-fills from USDA, UK CoFID & Canada CNF databases
                                </p>
                            </div>

                            {recipe.ingredients.length > 0 && (
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[30%]">Ingredient</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Grams</TableHead>
                                                <TableHead className="text-right">Waste%</TableHead>
                                                <TableHead className="text-right">Cal</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="w-[100px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recipe.ingredients.map((ing) => (
                                                <TableRow key={ing.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <span className="truncate max-w-[150px]">{ing.name || "Unnamed"}</span>
                                                            {ing.allergens.length > 0 && (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Contains: {ing.allergens.join(", ")}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {ing.amount} {ing.unit}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {ing.gramsEquivalent.toFixed(0)}g
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {ing.wastePercent}%
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums text-muted-foreground">
                                                        {ing.nutrition.calories}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {calculateIngredientCost(ing).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => editIngredient(ing)}
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => duplicateIngredient(ing)}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 hover:text-destructive"
                                                                onClick={() => removeIngredient(ing.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {recipe.ingredients.length > 0 && (
                                <div className="flex justify-between items-center text-sm pt-2 border-t">
                                    <span className="text-muted-foreground">Total Ingredients Cost:</span>
                                    <span className="font-semibold tabular-nums text-primary">AED {costs.ingredientsCost.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Manual entry option */}
                            <div className="flex items-center gap-2 pt-2">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">or</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addIngredient}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Ingredient (Manual Entry)
                            </Button>
                        </div>
                    </FormSection>

                    {/* Calculated Nutrition Facts */}
                    <FormSection 
                        title="Nutrition Facts (Calculated)" 
                        icon={<Apple className="h-4 w-4" />}
                        badge={
                            recipe.ingredients.length > 0 && (
                                <Badge variant="outline" className="ml-2 text-emerald-600">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Auto
                                </Badge>
                            )
                        }
                    >
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Nutrition per serving, calculated from ingredients.
                            </p>

                            {recipe.ingredients.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Apple className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Add ingredients to calculate nutrition</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-neutral-950 border rounded-lg p-4 max-w-[280px] mx-auto">
                                    <div className="text-2xl font-black border-b-8 border-black pb-1">
                                        Nutrition Facts
                                    </div>
                                    <div className="text-sm">
                                        {servingsPerRecipe > 0 && (
                                            <p>{servingsPerRecipe} servings per container</p>
                                        )}
                                        <div className="border-b border-black">
                                            <span className="font-bold">Serving size</span> {recipe.servingSize}{recipe.servingSizeUnit}
                                        </div>
                                    </div>
                                    <div className="border-b-8 border-black py-1">
                                        <div className="text-sm font-bold">Amount per serving</div>
                                        <div className="flex justify-between">
                                            <span className="text-2xl font-black">Calories</span>
                                            <span className="text-2xl font-black">{calculatedNutrition.calories}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-right py-0.5 border-b border-black">
                                        % Daily Value *
                                    </div>
                                    
                                    <NutritionLine 
                                        name="Total Fat" 
                                        value={calculatedNutrition.totalFat} 
                                        unit="g" 
                                        dv={calculateDailyValuePercent("totalFat", calculatedNutrition.totalFat)} 
                                        bold 
                                    />
                                    <NutritionLine 
                                        name="Saturated Fat" 
                                        value={calculatedNutrition.saturatedFat} 
                                        unit="g" 
                                        dv={calculateDailyValuePercent("saturatedFat", calculatedNutrition.saturatedFat)} 
                                        indent 
                                    />
                                    <NutritionLine 
                                        name="Trans Fat" 
                                        value={calculatedNutrition.transFat} 
                                        unit="g" 
                                        indent 
                                    />
                                    <NutritionLine 
                                        name="Cholesterol" 
                                        value={calculatedNutrition.cholesterol} 
                                        unit="mg" 
                                        dv={calculateDailyValuePercent("cholesterol", calculatedNutrition.cholesterol)} 
                                        bold 
                                    />
                                    <NutritionLine 
                                        name="Sodium" 
                                        value={calculatedNutrition.sodium} 
                                        unit="mg" 
                                        dv={calculateDailyValuePercent("sodium", calculatedNutrition.sodium)} 
                                        bold 
                                    />
                                    <NutritionLine 
                                        name="Total Carbohydrate" 
                                        value={calculatedNutrition.totalCarbohydrates} 
                                        unit="g" 
                                        dv={calculateDailyValuePercent("totalCarbohydrates", calculatedNutrition.totalCarbohydrates)} 
                                        bold 
                                    />
                                    <NutritionLine 
                                        name="Dietary Fiber" 
                                        value={calculatedNutrition.dietaryFiber} 
                                        unit="g" 
                                        dv={calculateDailyValuePercent("dietaryFiber", calculatedNutrition.dietaryFiber)} 
                                        indent 
                                    />
                                    <NutritionLine 
                                        name="Total Sugars" 
                                        value={calculatedNutrition.totalSugars} 
                                        unit="g" 
                                        indent 
                                    />
                                    <NutritionLine 
                                        name="Incl. Added Sugars" 
                                        value={calculatedNutrition.addedSugars} 
                                        unit="g" 
                                        dv={calculateDailyValuePercent("addedSugars", calculatedNutrition.addedSugars)} 
                                        indent 
                                        doubleIndent 
                                    />
                                    <NutritionLine 
                                        name="Protein" 
                                        value={calculatedNutrition.protein} 
                                        unit="g" 
                                        bold 
                                        thickBorder 
                                    />

                                    {/* Vitamins & Minerals */}
                                    {calculatedNutrition.vitaminD && (
                                        <NutritionLine 
                                            name="Vitamin D" 
                                            value={calculatedNutrition.vitaminD} 
                                            unit="mcg" 
                                            dv={calculateDailyValuePercent("vitaminD", calculatedNutrition.vitaminD)} 
                                        />
                                    )}
                                    {calculatedNutrition.calcium && (
                                        <NutritionLine 
                                            name="Calcium" 
                                            value={calculatedNutrition.calcium} 
                                            unit="mg" 
                                            dv={calculateDailyValuePercent("calcium", calculatedNutrition.calcium)} 
                                        />
                                    )}
                                    {calculatedNutrition.iron && (
                                        <NutritionLine 
                                            name="Iron" 
                                            value={calculatedNutrition.iron} 
                                            unit="mg" 
                                            dv={calculateDailyValuePercent("iron", calculatedNutrition.iron)} 
                                        />
                                    )}
                                    {calculatedNutrition.potassium && (
                                        <NutritionLine 
                                            name="Potassium" 
                                            value={calculatedNutrition.potassium} 
                                            unit="mg" 
                                            dv={calculateDailyValuePercent("potassium", calculatedNutrition.potassium)} 
                                        />
                                    )}

                                    <div className="text-[10px] pt-2 border-t-4 border-black">
                                        * The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. 2,000 calories a day is used.
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSection>

                    {/* Allergens (Auto-aggregated) */}
                    <FormSection 
                        title="Allergens" 
                        icon={<AlertTriangle className="h-4 w-4" />}
                        badge={
                            aggregatedAllergens.length > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {aggregatedAllergens.length}
                                </Badge>
                            )
                        }
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Contains (from ingredients):</p>
                                {aggregatedAllergens.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {aggregatedAllergens.map((allergen) => (
                                            <Badge key={allergen} variant="destructive">
                                                {allergen}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No allergens declared in ingredients</p>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm font-medium mb-2">May contain traces of:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {COMMON_ALLERGENS.map((allergen) => (
                                        <label
                                            key={allergen}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={recipe.mayContainAllergens.includes(allergen)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        updateRecipe({ mayContainAllergens: [...recipe.mayContainAllergens, allergen] })
                                                    } else {
                                                        updateRecipe({ mayContainAllergens: recipe.mayContainAllergens.filter(a => a !== allergen) })
                                                    }
                                                }}
                                            />
                                            {allergen}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Recipe Costing */}
                    <FormSection title="Recipe Costing" icon={<DollarSign className="h-4 w-4" />}>
                        <div className="space-y-6">
                            {/* Labor Cost */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">Labor Cost</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Hours</Label>
                                        <Input
                                            type="number"
                                            step="0.25"
                                            value={recipe.laborHours || ""}
                                            onChange={(e) => updateRecipe({ laborHours: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Hourly Rate (AED)</Label>
                                        <Input
                                            type="number"
                                            value={recipe.hourlyRate || ""}
                                            onChange={(e) => updateRecipe({ hourlyRate: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Labor Total</Label>
                                        <div className="h-10 px-3 py-2 border rounded-md bg-muted/50 flex items-center">
                                            <span className="text-sm font-medium tabular-nums">AED {costs.laborCost.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Additional Costs */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs">Packaging Cost (AED)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={recipe.packagingCost || ""}
                                        onChange={(e) => updateRecipe({ packagingCost: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">Overhead (%)</Label>
                                    <Input
                                        type="number"
                                        value={recipe.overheadPercent || ""}
                                        onChange={(e) => updateRecipe({ overheadPercent: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Cost Summary */}
                            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ingredients Cost</span>
                                    <span className="tabular-nums">AED {costs.ingredientsCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Labor Cost</span>
                                    <span className="tabular-nums">AED {costs.laborCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Packaging Cost</span>
                                    <span className="tabular-nums">AED {costs.packagingCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Overhead ({recipe.overheadPercent}%)</span>
                                    <span className="tabular-nums">AED {costs.overheadCost.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Total Recipe Cost</span>
                                    <span className="tabular-nums text-primary">AED {costs.totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Cost Per Serving</span>
                                    <span className="tabular-nums text-primary">
                                        {servingsPerRecipe > 0 
                                            ? `AED ${costs.costPerServing.toFixed(2)}`
                                            : "Set servings above"
                                        }
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            {/* Pricing Calculator */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">Pricing Calculator</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">Target Profit Margin (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={recipe.targetMarginPercent || ""}
                                        onChange={(e) => updateRecipe({ targetMarginPercent: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Suggested Selling Price</span>
                                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                            {costs.costPerServing > 0 ? `AED ${costs.suggestedPrice.toFixed(2)}` : "—"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Gross Profit Per Unit</span>
                                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-500 tabular-nums">
                                            {costs.costPerServing > 0 ? `AED ${costs.grossProfit.toFixed(2)}` : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    <div className="h-8" />
                </div>
            </ScrollArea>

            {/* Ingredient Edit Dialog */}
            <IngredientDialog
                ingredient={editingIngredient}
                isOpen={isIngredientDialogOpen}
                onClose={() => {
                    setIsIngredientDialogOpen(false)
                    setEditingIngredient(null)
                }}
                onSave={saveIngredient}
            />
        </TooltipProvider>
    )
}

// Nutrition line component for the label
function NutritionLine({
    name,
    value,
    unit,
    dv,
    bold,
    indent,
    doubleIndent,
    thickBorder,
}: {
    name: string
    value: number
    unit: string
    dv?: number
    bold?: boolean
    indent?: boolean
    doubleIndent?: boolean
    thickBorder?: boolean
}) {
    return (
        <div className={cn(
            "flex justify-between text-sm py-0.5 border-b border-black",
            indent && "pl-4",
            doubleIndent && "pl-8",
            thickBorder && "border-b-4"
        )}>
            <span className={cn(bold && "font-bold")}>
                {name} {value}{unit}
            </span>
            {dv !== undefined && (
                <span className="font-bold">{dv}%</span>
            )}
        </div>
    )
}

// Ingredient dialog component
interface IngredientDialogProps {
    ingredient: RecipeIngredient | null
    isOpen: boolean
    onClose: () => void
    onSave: (ingredient: RecipeIngredient) => void
}

function IngredientDialog({ ingredient, isOpen, onClose, onSave }: IngredientDialogProps) {
    const [data, setData] = React.useState<RecipeIngredient | null>(null)
    const [activeTab, setActiveTab] = React.useState("basics")

    React.useEffect(() => {
        if (ingredient) {
            setData({ ...ingredient })
        }
    }, [ingredient])

    if (!data) return null

    const updateData = (updates: Partial<RecipeIngredient>) => {
        setData({ ...data, ...updates })
    }

    const updateNutrition = (field: keyof IngredientNutrition, value: number) => {
        setData({
            ...data,
            nutrition: { ...data.nutrition, [field]: value }
        })
    }

    // Update grams equivalent when amount/unit changes
    const updateAmount = (amount: number, unit: string) => {
        const gramsEquivalent = amount * (UNIT_TO_GRAMS[unit] || 1)
        setData({ ...data, amount, unit: unit as any, gramsEquivalent })
    }

    const toggleAllergen = (allergen: string) => {
        if (data.allergens.includes(allergen)) {
            setData({ ...data, allergens: data.allergens.filter(a => a !== allergen) })
        } else {
            setData({ ...data, allergens: [...data.allergens, allergen] })
        }
    }

    // Handle food selection from database search
    const handleFoodSelect = (food: FoodSearchResult) => {
        setData({
            ...data,
            name: food.description,
            nutrition: food.nutrition,
            allergens: food.allergens,
            notes: `Source: ${food.sourceAttribution}`,
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {ingredient?.name ? `Edit: ${ingredient.name}` : "Add Ingredient"}
                    </DialogTitle>
                    <DialogDescription>
                        Enter ingredient details and nutritional information per 100g
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger value="basics">Basics</TabsTrigger>
                        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                        <TabsTrigger value="vitamins">Vitamins</TabsTrigger>
                        <TabsTrigger value="allergens">Allergens</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 mt-4">
                        <TabsContent value="basics" className="space-y-4 pr-4">
                            {/* Database Search */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                    🔍 Search 45,000+ Foods from USDA, UK, Canada & more
                                </p>
                                <InlineFoodSearch onSelect={handleFoodSelect} />
                                <p className="text-[10px] text-muted-foreground">
                                    Select a food to auto-fill nutrition data, or enter manually below
                                </p>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <Label>Ingredient Name *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => updateData({ name: e.target.value })}
                                    placeholder="e.g., Chicken breast, boneless"
                                />
                            </div>

                            <Separator />
                            <p className="text-xs font-medium text-muted-foreground">Amount in Recipe</p>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Amount *</Label>
                                    <Input
                                        type="number"
                                        value={data.amount || ""}
                                        onChange={(e) => updateAmount(parseFloat(e.target.value) || 0, data.unit)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Unit</Label>
                                    <Select
                                        value={data.unit}
                                        onValueChange={(v) => updateAmount(data.amount, v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="g">g</SelectItem>
                                            <SelectItem value="kg">kg</SelectItem>
                                            <SelectItem value="ml">ml</SelectItem>
                                            <SelectItem value="L">L</SelectItem>
                                            <SelectItem value="oz">oz</SelectItem>
                                            <SelectItem value="lb">lb</SelectItem>
                                            <SelectItem value="pieces">pieces</SelectItem>
                                            <SelectItem value="tbsp">tbsp</SelectItem>
                                            <SelectItem value="tsp">tsp</SelectItem>
                                            <SelectItem value="cups">cups</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Grams Equiv.</Label>
                                    <Input
                                        type="number"
                                        value={data.gramsEquivalent || ""}
                                        onChange={(e) => updateData({ gramsEquivalent: parseFloat(e.target.value) || 0 })}
                                        className="bg-muted/50"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Waste % (inedible portion)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={data.wastePercent || ""}
                                    onChange={(e) => updateData({ wastePercent: parseFloat(e.target.value) || 0 })}
                                    placeholder="e.g., 10 for bone-in chicken"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Percentage discarded (bones, peels, etc.)
                                </p>
                            </div>

                            <Separator />
                            <p className="text-xs font-medium text-muted-foreground">Costing</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Cost per Unit (AED)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.costPerUnit || ""}
                                        onChange={(e) => updateData({ costPerUnit: parseFloat(e.target.value) || 0 })}
                                        placeholder="e.g., 45"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cost Unit</Label>
                                    <Select
                                        value={data.costUnit}
                                        onValueChange={(v) => updateData({ costUnit: v as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kg">per kg</SelectItem>
                                            <SelectItem value="g">per g</SelectItem>
                                            <SelectItem value="L">per L</SelectItem>
                                            <SelectItem value="ml">per ml</SelectItem>
                                            <SelectItem value="piece">per piece</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={data.notes || ""}
                                    onChange={(e) => updateData({ notes: e.target.value })}
                                    placeholder="Supplier info, spec sheet reference, etc."
                                    className="min-h-[60px]"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="nutrition" className="space-y-4 pr-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="h-4 w-4 text-blue-500" />
                                <p className="text-xs text-muted-foreground">
                                    Enter all values per 100g of this ingredient
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <NutritionInput label="Calories *" value={data.nutrition.calories} unit="kcal" onChange={(v) => updateNutrition("calories", v)} />
                                <NutritionInput label="Total Fat *" value={data.nutrition.totalFat} unit="g" onChange={(v) => updateNutrition("totalFat", v)} />
                                <NutritionInput label="Saturated Fat *" value={data.nutrition.saturatedFat} unit="g" onChange={(v) => updateNutrition("saturatedFat", v)} indent />
                                <NutritionInput label="Trans Fat *" value={data.nutrition.transFat} unit="g" onChange={(v) => updateNutrition("transFat", v)} indent />
                                <NutritionInput label="Cholesterol *" value={data.nutrition.cholesterol} unit="mg" onChange={(v) => updateNutrition("cholesterol", v)} />
                                <NutritionInput label="Sodium *" value={data.nutrition.sodium} unit="mg" onChange={(v) => updateNutrition("sodium", v)} />
                                <NutritionInput label="Total Carbohydrates *" value={data.nutrition.totalCarbohydrates} unit="g" onChange={(v) => updateNutrition("totalCarbohydrates", v)} />
                                <NutritionInput label="Dietary Fiber *" value={data.nutrition.dietaryFiber} unit="g" onChange={(v) => updateNutrition("dietaryFiber", v)} indent />
                                <NutritionInput label="Total Sugars *" value={data.nutrition.totalSugars} unit="g" onChange={(v) => updateNutrition("totalSugars", v)} indent />
                                <NutritionInput label="Added Sugars *" value={data.nutrition.addedSugars} unit="g" onChange={(v) => updateNutrition("addedSugars", v)} indent />
                                <NutritionInput label="Protein *" value={data.nutrition.protein} unit="g" onChange={(v) => updateNutrition("protein", v)} />
                            </div>
                        </TabsContent>

                        <TabsContent value="vitamins" className="space-y-4 pr-4">
                            <p className="text-xs text-muted-foreground mb-4">
                                Optional: Enter vitamin and mineral content per 100g
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <NutritionInput label="Vitamin A" value={data.nutrition.vitaminA || 0} unit="mcg RAE" onChange={(v) => updateNutrition("vitaminA", v)} />
                                <NutritionInput label="Vitamin C" value={data.nutrition.vitaminC || 0} unit="mg" onChange={(v) => updateNutrition("vitaminC", v)} />
                                <NutritionInput label="Vitamin D" value={data.nutrition.vitaminD || 0} unit="mcg" onChange={(v) => updateNutrition("vitaminD", v)} />
                                <NutritionInput label="Vitamin E" value={data.nutrition.vitaminE || 0} unit="mg" onChange={(v) => updateNutrition("vitaminE", v)} />
                                <NutritionInput label="Vitamin K" value={data.nutrition.vitaminK || 0} unit="mcg" onChange={(v) => updateNutrition("vitaminK", v)} />
                                <NutritionInput label="Calcium" value={data.nutrition.calcium || 0} unit="mg" onChange={(v) => updateNutrition("calcium", v)} />
                                <NutritionInput label="Iron" value={data.nutrition.iron || 0} unit="mg" onChange={(v) => updateNutrition("iron", v)} />
                                <NutritionInput label="Potassium" value={data.nutrition.potassium || 0} unit="mg" onChange={(v) => updateNutrition("potassium", v)} />
                                <NutritionInput label="Magnesium" value={data.nutrition.magnesium || 0} unit="mg" onChange={(v) => updateNutrition("magnesium", v)} />
                                <NutritionInput label="Zinc" value={data.nutrition.zinc || 0} unit="mg" onChange={(v) => updateNutrition("zinc", v)} />
                            </div>
                        </TabsContent>

                        <TabsContent value="allergens" className="space-y-4 pr-4">
                            <p className="text-xs text-muted-foreground mb-4">
                                Select allergens present in this ingredient
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                {COMMON_ALLERGENS.map((allergen) => (
                                    <label
                                        key={allergen}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={data.allergens.includes(allergen)}
                                            onCheckedChange={() => toggleAllergen(allergen)}
                                        />
                                        {allergen}
                                    </label>
                                ))}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSave(data)}>
                        {ingredient?.name ? "Update Ingredient" : "Add Ingredient"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Nutrition input helper component
function NutritionInput({
    label,
    value,
    unit,
    onChange,
    indent,
}: {
    label: string
    value: number
    unit: string
    onChange: (value: number) => void
    indent?: boolean
}) {
    return (
        <div className={cn("grid gap-1", indent && "pl-4")}>
            <Label className="text-xs">
                {label} <span className="text-muted-foreground">({unit})</span>
            </Label>
            <Input
                type="number"
                step="0.1"
                value={value || ""}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="h-9"
            />
        </div>
    )
}

export { DEFAULT_RECIPE_STATE }
export type { RecipeBuilderState }

