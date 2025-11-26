"use client"

import * as React from "react"
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Package,
    Factory,
    Wheat,
    AlertTriangle,
    Apple,
    Thermometer,
    Calendar,
    Award,
    RefreshCw,
    DollarSign,
    Calculator,
    TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Type definitions for label data
export interface NutritionRow {
    name: string
    per100g: number
    perServing: number
    unit: string
    dailyValue?: number // % Daily Value
    isSubItem?: boolean // For indented items like "Saturated Fat" under "Total Fat"
}

// Ingredient with cost tracking
export interface IngredientItem {
    name: string
    quantity: number
    unit: string
    costPerUnit: number // Cost per unit (e.g., AED per kg)
    costUnit: string // The unit for cost (e.g., "kg", "L", "piece")
}

// Recipe costing data
export interface CostingData {
    laborCost: number // Total labor cost for this recipe
    laborHours: number // Hours of labor
    hourlyRate: number // Hourly rate
    packagingCost: number // Packaging cost per unit
    overheadPercent: number // Overhead percentage (e.g., 15 for 15%)
    targetMarginPercent: number // Target profit margin (e.g., 30 for 30%)
}

export interface LabelData {
    // Product Identity
    barcode: string
    productName: string
    brandName: string
    productDescription: string
    netWeight: number
    netWeightUnit: string

    // Serving Information
    servingSize: number
    servingSizeUnit: string
    servingsPerContainer: number

    // Manufacturer
    manufacturerName: string
    manufacturerAddress: string
    manufacturerCountry: string

    // Importer (optional)
    importerName: string
    importerAddress: string
    importerCountry: string

    // Country of Origin
    countryOfOrigin: string

    // Ingredients with costing
    ingredients: IngredientItem[]

    // Allergens
    containsAllergens: string[]
    mayContainAllergens: string[]

    // Nutrition Facts - Flexible rows
    nutritionFacts: NutritionRow[]

    // Storage & Usage
    storageInstructions: string
    usageInstructions: string

    // Dates
    productionDate: string
    expiryDate: string
    batchNumber: string

    // Certifications
    halalCertified: boolean
    halalCertifier: string

    // Recipe Costing
    costing: CostingData
}

const DEFAULT_NUTRITION_FACTS: NutritionRow[] = [
    { name: "Energy", per100g: 0, perServing: 0, unit: "kcal", dailyValue: 0 },
    { name: "Energy", per100g: 0, perServing: 0, unit: "kJ" },
    { name: "Total Fat", per100g: 0, perServing: 0, unit: "g", dailyValue: 0 },
    { name: "Saturated Fat", per100g: 0, perServing: 0, unit: "g", dailyValue: 0, isSubItem: true },
    { name: "Trans Fat", per100g: 0, perServing: 0, unit: "g", isSubItem: true },
    { name: "Cholesterol", per100g: 0, perServing: 0, unit: "mg", dailyValue: 0 },
    { name: "Sodium", per100g: 0, perServing: 0, unit: "mg", dailyValue: 0 },
    { name: "Total Carbohydrate", per100g: 0, perServing: 0, unit: "g", dailyValue: 0 },
    { name: "Dietary Fiber", per100g: 0, perServing: 0, unit: "g", dailyValue: 0, isSubItem: true },
    { name: "Total Sugars", per100g: 0, perServing: 0, unit: "g", isSubItem: true },
    { name: "Added Sugars", per100g: 0, perServing: 0, unit: "g", dailyValue: 0, isSubItem: true },
    { name: "Protein", per100g: 0, perServing: 0, unit: "g", dailyValue: 0 },
]

const DEFAULT_COSTING_DATA: CostingData = {
    laborCost: 0,
    laborHours: 0,
    hourlyRate: 0,
    packagingCost: 0,
    overheadPercent: 15,
    targetMarginPercent: 30,
}

const DEFAULT_LABEL_DATA: LabelData = {
    barcode: "",
    productName: "",
    brandName: "",
    productDescription: "",
    netWeight: 0,
    netWeightUnit: "g",
    servingSize: 0,
    servingSizeUnit: "g",
    servingsPerContainer: 0,
    manufacturerName: "",
    manufacturerAddress: "",
    manufacturerCountry: "",
    importerName: "",
    importerAddress: "",
    importerCountry: "",
    countryOfOrigin: "",
    ingredients: [],
    containsAllergens: [],
    mayContainAllergens: [],
    nutritionFacts: DEFAULT_NUTRITION_FACTS,
    storageInstructions: "",
    usageInstructions: "",
    productionDate: "",
    expiryDate: "",
    batchNumber: "",
    halalCertified: false,
    halalCertifier: "",
    costing: DEFAULT_COSTING_DATA,
}

const ALLERGEN_OPTIONS = [
    "Cereals containing gluten",
    "Crustaceans",
    "Eggs",
    "Fish",
    "Peanuts",
    "Soybeans",
    "Milk",
    "Tree nuts",
    "Celery",
    "Mustard",
    "Sesame seeds",
    "Sulphites",
    "Lupin",
    "Molluscs"
]

const COUNTRY_OPTIONS = [
    "Saudi Arabia",
    "United Arab Emirates",
    "Kuwait",
    "Qatar",
    "Bahrain",
    "Oman",
    "Egypt",
    "Jordan",
    "Lebanon",
    "Turkey",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "United Kingdom",
    "United States",
    "China",
    "India",
    "Japan",
    "South Korea",
    "Australia",
    "New Zealand",
    "Brazil",
    "Argentina",
    "Other"
]

// Generate valid EAN-13 barcode with check digit
function generateEAN13(): string {
    // Generate 12 random digits
    const digits: number[] = []
    for (let i = 0; i < 12; i++) {
        digits.push(Math.floor(Math.random() * 10))
    }
    
    // Calculate check digit
    let sum = 0
    for (let i = 0; i < 12; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    digits.push(checkDigit)
    
    return digits.join("")
}

interface LabelDataFormProps {
    data: LabelData
    onChange: (data: LabelData) => void
}

interface FormSectionProps {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
}

function FormSection({ title, icon, children, defaultOpen = true }: FormSectionProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="text-primary">{icon}</div>
                        <span className="font-medium text-sm">{title}</span>
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

export function LabelDataForm({ data, onChange }: LabelDataFormProps) {
    const updateField = <K extends keyof LabelData>(field: K, value: LabelData[K]) => {
        onChange({ ...data, [field]: value })
    }

    const generateBarcode = () => {
        updateField("barcode", generateEAN13())
    }

    const addIngredient = () => {
        const newIngredient: IngredientItem = {
            name: "",
            quantity: 0,
            unit: "g",
            costPerUnit: 0,
            costUnit: "kg"
        }
        updateField("ingredients", [...data.ingredients, newIngredient])
    }

    const updateIngredient = (index: number, field: keyof IngredientItem, value: any) => {
        const newIngredients = [...data.ingredients]
        newIngredients[index] = { ...newIngredients[index], [field]: value }
        updateField("ingredients", newIngredients)
    }

    const removeIngredient = (index: number) => {
        updateField("ingredients", data.ingredients.filter((_, i) => i !== index))
    }

    // Update costing field
    const updateCostingField = <K extends keyof CostingData>(field: K, value: CostingData[K]) => {
        updateField("costing", { ...data.costing, [field]: value })
    }

    // Calculate ingredient cost contribution
    const calculateIngredientCost = (ingredient: IngredientItem): number => {
        if (!ingredient.quantity || !ingredient.costPerUnit) return 0
        // Convert units if necessary (simplified - assumes same unit type)
        const conversionFactor = getConversionFactor(ingredient.unit, ingredient.costUnit)
        return (ingredient.quantity * conversionFactor * ingredient.costPerUnit)
    }

    // Simple unit conversion (can be expanded)
    const getConversionFactor = (fromUnit: string, toUnit: string): number => {
        const conversions: Record<string, Record<string, number>> = {
            'g': { 'kg': 0.001, 'g': 1 },
            'kg': { 'kg': 1, 'g': 1000 },
            'ml': { 'L': 0.001, 'ml': 1 },
            'L': { 'L': 1, 'ml': 1000 },
        }
        return conversions[fromUnit]?.[toUnit] ?? 1
    }

    // Calculate total ingredients cost
    const totalIngredientsCost = data.ingredients.reduce((sum, ing) => sum + calculateIngredientCost(ing), 0)

    // Calculate labor cost
    const calculatedLaborCost = data.costing.laborHours * data.costing.hourlyRate

    // Calculate total recipe cost
    const subtotalCost = totalIngredientsCost + calculatedLaborCost + data.costing.packagingCost
    const overheadAmount = subtotalCost * (data.costing.overheadPercent / 100)
    const totalRecipeCost = subtotalCost + overheadAmount

    // Calculate cost per serving
    const costPerServing = data.servingsPerContainer > 0 ? totalRecipeCost / data.servingsPerContainer : 0

    // Calculate pricing
    const suggestedSellingPrice = costPerServing > 0 
        ? costPerServing / (1 - data.costing.targetMarginPercent / 100)
        : 0
    const grossProfitPerUnit = suggestedSellingPrice - costPerServing

    const toggleAllergen = (allergen: string, type: "contains" | "mayContain") => {
        const field = type === "contains" ? "containsAllergens" : "mayContainAllergens"
        const current = data[field]
        if (current.includes(allergen)) {
            updateField(field, current.filter(a => a !== allergen))
        } else {
            updateField(field, [...current, allergen])
        }
    }

    const updateNutritionRow = (index: number, field: keyof NutritionRow, value: any) => {
        const newFacts = [...data.nutritionFacts]
        newFacts[index] = { ...newFacts[index], [field]: value }
        updateField("nutritionFacts", newFacts)
    }

    const addNutritionRow = () => {
        updateField("nutritionFacts", [
            ...data.nutritionFacts,
            { name: "", per100g: 0, perServing: 0, unit: "g", dailyValue: 0 }
        ])
    }

    const removeNutritionRow = (index: number) => {
        updateField("nutritionFacts", data.nutritionFacts.filter((_, i) => i !== index))
    }

    // Auto-calculate per serving values when serving size changes
    const recalculatePerServing = () => {
        if (data.servingSize <= 0) return
        
        const factor = data.servingSize / 100
        const newFacts = data.nutritionFacts.map(row => ({
            ...row,
            perServing: Math.round(row.per100g * factor * 100) / 100
        }))
        updateField("nutritionFacts", newFacts)
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold">GCC Food Label Generator</h2>
                    <p className="text-sm text-muted-foreground">
                        Fill in the product details to generate a compliant food label
                    </p>
                </div>

                {/* Product Identity */}
                <FormSection title="Product Identity" icon={<Package className="h-4 w-4" />}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="barcode">Barcode (EAN-13) *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="barcode"
                                    value={data.barcode}
                                    onChange={(e) => updateField("barcode", e.target.value.replace(/\D/g, "").slice(0, 13))}
                                    placeholder="5901234123457"
                                    maxLength={13}
                                    className="font-mono"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={generateBarcode}
                                    title="Auto-generate barcode"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">13-digit EAN barcode (click refresh to auto-generate)</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="brandName">Brand Name *</Label>
                            <Input
                                id="brandName"
                                value={data.brandName}
                                onChange={(e) => updateField("brandName", e.target.value)}
                                placeholder="e.g., Nestlé"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="productName">Product Name *</Label>
                            <Input
                                id="productName"
                                value={data.productName}
                                onChange={(e) => updateField("productName", e.target.value)}
                                placeholder="e.g., Chocolate Chip Cookies"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="productDescription">Product Description</Label>
                            <Textarea
                                id="productDescription"
                                value={data.productDescription}
                                onChange={(e) => updateField("productDescription", e.target.value)}
                                placeholder="Brief description of the product..."
                                className="min-h-[60px]"
                            />
                        </div>

                        <Separator />
                        <p className="text-xs text-muted-foreground font-medium">Package Information</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="netWeight">Net Weight/Volume *</Label>
                                <Input
                                    id="netWeight"
                                    type="number"
                                    value={data.netWeight || ""}
                                    onChange={(e) => updateField("netWeight", parseFloat(e.target.value) || 0)}
                                    placeholder="100"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="netWeightUnit">Unit</Label>
                                <Select
                                    value={data.netWeightUnit}
                                    onValueChange={(v) => updateField("netWeightUnit", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="g">Grams (g)</SelectItem>
                                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                        <SelectItem value="ml">Milliliters (ml)</SelectItem>
                                        <SelectItem value="L">Liters (L)</SelectItem>
                                        <SelectItem value="oz">Ounces (oz)</SelectItem>
                                        <SelectItem value="lb">Pounds (lb)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />
                        <p className="text-xs text-muted-foreground font-medium">Serving Information</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="servingSize">Serving Size *</Label>
                                <Input
                                    id="servingSize"
                                    type="number"
                                    value={data.servingSize || ""}
                                    onChange={(e) => updateField("servingSize", parseFloat(e.target.value) || 0)}
                                    placeholder="30"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="servingSizeUnit">Unit</Label>
                                <Select
                                    value={data.servingSizeUnit}
                                    onValueChange={(v) => updateField("servingSizeUnit", v)}
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

                        <div className="grid gap-2">
                            <Label htmlFor="servingsPerContainer">Servings Per Container *</Label>
                            <Input
                                id="servingsPerContainer"
                                type="number"
                                value={data.servingsPerContainer || ""}
                                onChange={(e) => updateField("servingsPerContainer", parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 8"
                            />
                        </div>
                    </div>
                </FormSection>

                {/* Manufacturer Details */}
                <FormSection title="Manufacturer" icon={<Factory className="h-4 w-4" />}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="manufacturerName">Company Name *</Label>
                            <Input
                                id="manufacturerName"
                                value={data.manufacturerName}
                                onChange={(e) => updateField("manufacturerName", e.target.value)}
                                placeholder="e.g., ABC Foods Co."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="manufacturerAddress">Address</Label>
                            <Textarea
                                id="manufacturerAddress"
                                value={data.manufacturerAddress}
                                onChange={(e) => updateField("manufacturerAddress", e.target.value)}
                                placeholder="Full address..."
                                className="min-h-[60px]"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="manufacturerCountry">Country *</Label>
                            <Select
                                value={data.manufacturerCountry}
                                onValueChange={(v) => updateField("manufacturerCountry", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRY_OPTIONS.map((country) => (
                                        <SelectItem key={country} value={country}>
                                            {country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <p className="text-xs text-muted-foreground font-medium">Importer (if applicable)</p>

                        <div className="grid gap-2">
                            <Label htmlFor="importerName">Importer Name</Label>
                            <Input
                                id="importerName"
                                value={data.importerName}
                                onChange={(e) => updateField("importerName", e.target.value)}
                                placeholder="e.g., Saudi Distribution Co."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="importerAddress">Importer Address</Label>
                            <Input
                                id="importerAddress"
                                value={data.importerAddress}
                                onChange={(e) => updateField("importerAddress", e.target.value)}
                                placeholder="Address in Saudi Arabia"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="countryOfOrigin">Country of Origin *</Label>
                            <Select
                                value={data.countryOfOrigin}
                                onValueChange={(v) => updateField("countryOfOrigin", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRY_OPTIONS.map((country) => (
                                        <SelectItem key={country} value={country}>
                                            {country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FormSection>

                {/* Ingredients with Costing */}
                <FormSection title="Ingredients" icon={<Wheat className="h-4 w-4" />}>
                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                            List ingredients in descending order by weight. Add cost information for recipe costing.
                        </p>

                        {data.ingredients.length > 0 && (
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[35%]">Ingredient</TableHead>
                                            <TableHead className="w-[15%]">Qty</TableHead>
                                            <TableHead className="w-[12%]">Unit</TableHead>
                                            <TableHead className="w-[15%]">Cost/Unit</TableHead>
                                            <TableHead className="w-[12%]">Cost Unit</TableHead>
                                            <TableHead className="w-[10%] text-right">Total</TableHead>
                                            <TableHead className="w-[40px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                        {data.ingredients.map((ingredient, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="p-2">
                                <Input
                                                        value={ingredient.name}
                                                        onChange={(e) => updateIngredient(index, "name", e.target.value)}
                                                        placeholder="Ingredient name"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        value={ingredient.quantity || ""}
                                                        onChange={(e) => updateIngredient(index, "quantity", parseFloat(e.target.value) || 0)}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Select
                                                        value={ingredient.unit}
                                                        onValueChange={(v) => updateIngredient(index, "unit", v)}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="g">g</SelectItem>
                                                            <SelectItem value="kg">kg</SelectItem>
                                                            <SelectItem value="ml">ml</SelectItem>
                                                            <SelectItem value="L">L</SelectItem>
                                                            <SelectItem value="pieces">pcs</SelectItem>
                                                            <SelectItem value="tbsp">tbsp</SelectItem>
                                                            <SelectItem value="tsp">tsp</SelectItem>
                                                            <SelectItem value="cups">cups</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={ingredient.costPerUnit || ""}
                                                        onChange={(e) => updateIngredient(index, "costPerUnit", parseFloat(e.target.value) || 0)}
                                                        placeholder="0.00"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Select
                                                        value={ingredient.costUnit}
                                                        onValueChange={(v) => updateIngredient(index, "costUnit", v)}
                                                    >
                                                        <SelectTrigger className="h-8">
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
                                                </TableCell>
                                                <TableCell className="p-2 text-right text-sm font-medium tabular-nums">
                                                    {calculateIngredientCost(ingredient).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="p-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                                        className="h-8 w-8 hover:text-destructive"
                                    onClick={() => removeIngredient(index)}
                                >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {data.ingredients.length > 0 && (
                            <div className="flex justify-end text-sm">
                                <span className="text-muted-foreground mr-2">Total Ingredients Cost:</span>
                                <span className="font-semibold tabular-nums">AED {totalIngredientsCost.toFixed(2)}</span>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addIngredient}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Ingredient
                        </Button>
                    </div>
                </FormSection>

                {/* Allergens */}
                <FormSection title="Allergens" icon={<AlertTriangle className="h-4 w-4" />}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2">Contains:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ALLERGEN_OPTIONS.map((allergen) => (
                                    <label
                                        key={allergen}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={data.containsAllergens.includes(allergen)}
                                            onCheckedChange={() => toggleAllergen(allergen, "contains")}
                                        />
                                        {allergen}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm font-medium mb-2">May contain traces of:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ALLERGEN_OPTIONS.map((allergen) => (
                                    <label
                                        key={allergen}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={data.mayContainAllergens.includes(allergen)}
                                            onCheckedChange={() => toggleAllergen(allergen, "mayContain")}
                                        />
                                        {allergen}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </FormSection>

                {/* Nutrition Facts */}
                <FormSection title="Nutrition Facts" icon={<Apple className="h-4 w-4" />}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Enter values per 100g/100ml. Per serving will auto-calculate.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={recalculatePerServing}
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Recalculate
                            </Button>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[30%]">Nutrient</TableHead>
                                        <TableHead className="text-right">Per 100g</TableHead>
                                        <TableHead className="text-right">Per Srv</TableHead>
                                        <TableHead className="w-[15%]">Unit</TableHead>
                                        <TableHead className="w-[10%] text-right">%DV</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.nutritionFacts.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell className={cn("p-2", row.isSubItem && "pl-6")}>
                                                <Input
                                                    value={row.name}
                                                    onChange={(e) => updateNutritionRow(index, "name", e.target.value)}
                                                    className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:bg-muted/50 px-2 font-medium"
                                                    placeholder="Nutrient Name"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={row.per100g || ""}
                                                    onChange={(e) => updateNutritionRow(index, "per100g", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-right border-muted-foreground/20"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    value={row.perServing || ""}
                                                    onChange={(e) => updateNutritionRow(index, "perServing", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-right border-muted-foreground/20"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Select
                                                    value={row.unit}
                                                    onValueChange={(v) => updateNutritionRow(index, "unit", v)}
                                                >
                                                    <SelectTrigger className="h-8 border-muted-foreground/20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="kcal">kcal</SelectItem>
                                                        <SelectItem value="kJ">kJ</SelectItem>
                                                        <SelectItem value="g">g</SelectItem>
                                                        <SelectItem value="mg">mg</SelectItem>
                                                        <SelectItem value="mcg">mcg</SelectItem>
                                                        <SelectItem value="%">%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    value={row.dailyValue || ""}
                                                    onChange={(e) => updateNutritionRow(index, "dailyValue", parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-right border-muted-foreground/20"
                                                    placeholder="%"
                                                />
                                            </TableCell>
                                            <TableCell className="p-2 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-destructive"
                                                    onClick={() => removeNutritionRow(index)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addNutritionRow}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Nutrient Row
                        </Button>
                    </div>
                </FormSection>

                {/* Storage & Usage */}
                <FormSection title="Storage & Usage" icon={<Thermometer className="h-4 w-4" />}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="storageInstructions">Storage Instructions</Label>
                            <Textarea
                                id="storageInstructions"
                                value={data.storageInstructions}
                                onChange={(e) => updateField("storageInstructions", e.target.value)}
                                placeholder="e.g., Store in a cool, dry place. Refrigerate after opening."
                                className="min-h-[60px]"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="usageInstructions">Usage / Preparation Instructions</Label>
                            <Textarea
                                id="usageInstructions"
                                value={data.usageInstructions}
                                onChange={(e) => updateField("usageInstructions", e.target.value)}
                                placeholder="e.g., Serve chilled. Shake well before use."
                                className="min-h-[60px]"
                            />
                        </div>
                    </div>
                </FormSection>

                {/* Dates & Batch */}
                <FormSection title="Dates & Batch" icon={<Calendar className="h-4 w-4" />}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="batchNumber">Batch / Lot Number</Label>
                            <Input
                                id="batchNumber"
                                value={data.batchNumber}
                                onChange={(e) => updateField("batchNumber", e.target.value)}
                                placeholder="e.g., LOT2024001"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="productionDate">Production Date</Label>
                                <Input
                                    id="productionDate"
                                    type="date"
                                    value={data.productionDate}
                                    onChange={(e) => updateField("productionDate", e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="expiryDate">Expiry / Best Before *</Label>
                                <Input
                                    id="expiryDate"
                                    type="date"
                                    value={data.expiryDate}
                                    onChange={(e) => updateField("expiryDate", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </FormSection>

                {/* Certifications */}
                <FormSection title="Certifications" icon={<Award className="h-4 w-4" />} defaultOpen={false}>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                checked={data.halalCertified}
                                onCheckedChange={(checked) => updateField("halalCertified", !!checked)}
                            />
                            <span className="text-sm font-medium">Halal Certified</span>
                        </label>

                        {data.halalCertified && (
                            <div className="grid gap-2">
                                <Label htmlFor="halalCertifier">Certifying Body</Label>
                                <Input
                                    id="halalCertifier"
                                    value={data.halalCertifier}
                                    onChange={(e) => updateField("halalCertifier", e.target.value)}
                                    placeholder="e.g., ESMA, SASO"
                                />
                            </div>
                        )}
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
                                    <Label htmlFor="laborHours" className="text-xs">Hours</Label>
                                    <Input
                                        id="laborHours"
                                        type="number"
                                        step="0.25"
                                        value={data.costing.laborHours || ""}
                                        onChange={(e) => updateCostingField("laborHours", parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="hourlyRate" className="text-xs">Hourly Rate (AED)</Label>
                                    <Input
                                        id="hourlyRate"
                                        type="number"
                                        step="1"
                                        value={data.costing.hourlyRate || ""}
                                        onChange={(e) => updateCostingField("hourlyRate", parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs">Labor Total</Label>
                                    <div className="h-10 px-3 py-2 border rounded-md bg-muted/50 flex items-center">
                                        <span className="text-sm font-medium tabular-nums">AED {calculatedLaborCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Additional Costs */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Additional Costs</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="packagingCost" className="text-xs">Packaging Cost (AED)</Label>
                                    <Input
                                        id="packagingCost"
                                        type="number"
                                        step="0.01"
                                        value={data.costing.packagingCost || ""}
                                        onChange={(e) => updateCostingField("packagingCost", parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="overheadPercent" className="text-xs">Overhead (%)</Label>
                                    <Input
                                        id="overheadPercent"
                                        type="number"
                                        step="1"
                                        value={data.costing.overheadPercent || ""}
                                        onChange={(e) => updateCostingField("overheadPercent", parseFloat(e.target.value) || 0)}
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Cost Summary */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Cost Summary</p>
                            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ingredients Cost</span>
                                    <span className="tabular-nums">AED {totalIngredientsCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Labor Cost</span>
                                    <span className="tabular-nums">AED {calculatedLaborCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Packaging Cost</span>
                                    <span className="tabular-nums">AED {data.costing.packagingCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Overhead ({data.costing.overheadPercent}%)</span>
                                    <span className="tabular-nums">AED {overheadAmount.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Total Recipe Cost</span>
                                    <span className="tabular-nums text-primary">AED {totalRecipeCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Cost Per Serving</span>
                                    <span className="tabular-nums text-primary">
                                        {data.servingsPerContainer > 0 
                                            ? `AED ${costPerServing.toFixed(2)}`
                                            : "Set servings above"
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Pricing Calculator */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Pricing Calculator</p>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="targetMargin" className="text-xs">Target Profit Margin (%)</Label>
                                    <Input
                                        id="targetMargin"
                                        type="number"
                                        step="1"
                                        min="0"
                                        max="99"
                                        value={data.costing.targetMarginPercent || ""}
                                        onChange={(e) => updateCostingField("targetMarginPercent", parseFloat(e.target.value) || 0)}
                                        placeholder="30"
                                    />
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Suggested Selling Price</span>
                                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                            {costPerServing > 0 
                                                ? `AED ${suggestedSellingPrice.toFixed(2)}`
                                                : "—"
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Gross Profit Per Unit</span>
                                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-500 tabular-nums">
                                            {costPerServing > 0 
                                                ? `AED ${grossProfitPerUnit.toFixed(2)}`
                                                : "—"
                                            }
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        Based on cost per serving of AED {costPerServing.toFixed(2)} and {data.costing.targetMarginPercent}% margin
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </FormSection>

                <div className="h-8" /> {/* Bottom spacing */}
            </div>
        </ScrollArea>
    )
}

export { DEFAULT_LABEL_DATA, DEFAULT_NUTRITION_FACTS, DEFAULT_COSTING_DATA }
export type { LabelData, NutritionRow, IngredientItem, CostingData }
