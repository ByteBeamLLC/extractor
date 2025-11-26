"use client"

import * as React from "react"
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Download,
    RotateCcw,
    Save,
    Eye,
    FileEdit,
    ZoomIn,
    ZoomOut,
    Loader2,
    FolderOpen,
    Plus,
    Clock,
    Tag,
    ChefHat,
    FileText,
} from "lucide-react"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { LabelDataForm, DEFAULT_LABEL_DATA, type LabelData } from "./LabelDataForm"
import { LabelPreview } from "./LabelPreview"
import { RecipeBuilderForm, type RecipeBuilderState } from "./RecipeBuilderForm"
import { cn } from "@/lib/utils"
import {
    getRecipes,
    getRecipe,
    createRecipe,
    updateRecipe,
    getKnowledgeFolders,
    type RecipeListItem
} from "@/lib/label-maker/recipe-actions"

// Mode type for switching between Quick Label and Recipe Builder
type EditorMode = "quick-label" | "recipe-builder"

interface LabelMakerViewProps {
    initialData?: Partial<LabelData>
    initialRecipeId?: string
    onSave?: (data: LabelData) => void
}

export function LabelMakerView({ initialData, initialRecipeId, onSave }: LabelMakerViewProps) {
    // Editor mode state
    const [editorMode, setEditorMode] = React.useState<EditorMode>("quick-label")
    
    const [labelData, setLabelData] = React.useState<LabelData>({
        ...DEFAULT_LABEL_DATA,
        ...initialData
    })
    
    // Recipe builder state
    const [recipeBuilderData, setRecipeBuilderData] = React.useState<RecipeBuilderState | null>(null)
    
    const [previewScale, setPreviewScale] = React.useState(1)
    const [isExporting, setIsExporting] = React.useState(false)
    const labelPreviewRef = React.useRef<HTMLDivElement>(null)
    
    // Recipe management state
    const [currentRecipeId, setCurrentRecipeId] = React.useState<string | null>(initialRecipeId || null)
    const [currentRecipeName, setCurrentRecipeName] = React.useState<string>("")
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
    
    // Dialog state
    const [showSaveDialog, setShowSaveDialog] = React.useState(false)
    const [showLoadDialog, setShowLoadDialog] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    
    // Save dialog form state
    const [saveRecipeName, setSaveRecipeName] = React.useState("")
    const [saveRecipeCategory, setSaveRecipeCategory] = React.useState("")
    const [saveRecipeFolderId, setSaveRecipeFolderId] = React.useState<string>("")
    const [knowledgeFolders, setKnowledgeFolders] = React.useState<Array<{ id: string; name: string }>>([])
    
    // Load dialog state
    const [recipes, setRecipes] = React.useState<RecipeListItem[]>([])
    const [selectedRecipeId, setSelectedRecipeId] = React.useState<string | null>(null)

    // Track unsaved changes
    React.useEffect(() => {
        setHasUnsavedChanges(true)
    }, [labelData])

    const handleReset = () => {
        setLabelData({ ...DEFAULT_LABEL_DATA })
        setCurrentRecipeId(null)
        setCurrentRecipeName("")
        setHasUnsavedChanges(false)
    }

    const handleSave = async () => {
        // Load Knowledge Hub folders for selection
        try {
            const folders = await getKnowledgeFolders()
            setKnowledgeFolders(folders)
        } catch (error) {
            console.error('Failed to load folders:', error)
        }
        
        // If we have a current recipe, open save dialog to update or save as new
        // Otherwise, always open dialog to get a name
        if (currentRecipeId) {
            setSaveRecipeName(currentRecipeName)
        } else {
            setSaveRecipeName(labelData.productName || "")
        }
        setShowSaveDialog(true)
    }

    const handleSaveConfirm = async (saveAsNew: boolean = false) => {
        if (!saveRecipeName.trim()) return
        
        setIsSaving(true)
        try {
            if (currentRecipeId && !saveAsNew) {
                // Update existing recipe
                await updateRecipe(currentRecipeId, {
                    name: saveRecipeName,
                    labelData: labelData,
                    category: saveRecipeCategory || null
                })
                setCurrentRecipeName(saveRecipeName)
            } else {
                // Create new recipe in Knowledge Hub
                const newRecipe = await createRecipe(
                    saveRecipeName,
                    labelData,
                    saveRecipeFolderId || undefined, // Pass folder ID
                    saveRecipeCategory || undefined
                )
                setCurrentRecipeId(newRecipe.id)
                setCurrentRecipeName(saveRecipeName)
            }
            setHasUnsavedChanges(false)
            setShowSaveDialog(false)
            onSave?.(labelData)
        } catch (error) {
            console.error('Failed to save recipe:', error)
            alert('Failed to save recipe. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLoadClick = async () => {
        setIsLoading(true)
        try {
            const loadedRecipes = await getRecipes()
            setRecipes(loadedRecipes)
            setShowLoadDialog(true)
        } catch (error) {
            console.error('Failed to load recipes:', error)
            alert('Failed to load recipes. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLoadConfirm = async () => {
        if (!selectedRecipeId) return
        
        setIsLoading(true)
        try {
            const recipe = await getRecipe(selectedRecipeId)
            if (recipe) {
                setLabelData(recipe.label_data)
                setCurrentRecipeId(recipe.id)
                setCurrentRecipeName(recipe.name)
                setHasUnsavedChanges(false)
            }
            setShowLoadDialog(false)
            setSelectedRecipeId(null)
        } catch (error) {
            console.error('Failed to load recipe:', error)
            alert('Failed to load recipe. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleExportPDF = async () => {
        if (!labelPreviewRef.current) {
            console.error('Label preview ref not found')
            return
        }
        
        setIsExporting(true)
        try {
            // Dynamically import libraries to avoid SSR issues
            const html2canvas = (await import('html2canvas')).default
            const { jsPDF } = await import('jspdf')
            
            const element = labelPreviewRef.current
            
            // Create a wrapper to hold inline styles
            const wrapper = document.createElement('div')
            wrapper.style.position = 'absolute'
            wrapper.style.left = '-9999px'
            wrapper.style.top = '0'
            wrapper.style.backgroundColor = '#ffffff'
            document.body.appendChild(wrapper)
            
            // Clone the element
            const clone = element.cloneNode(true) as HTMLElement
            wrapper.appendChild(clone)
            
            // Function to inline all computed styles and fix oklch colors
            const inlineStyles = (source: HTMLElement, target: HTMLElement) => {
                const computed = window.getComputedStyle(source)
                
                // Key properties to inline for proper rendering
                const importantProps = [
                    'color', 'backgroundColor', 'borderColor', 
                    'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor',
                    'borderWidth', 'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
                    'borderStyle', 'borderTopStyle', 'borderBottomStyle', 'borderLeftStyle', 'borderRightStyle',
                    'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'textAlign', 'textDecoration',
                    'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                    'display', 'flexDirection', 'justifyContent', 'alignItems', 'gap',
                    'width', 'maxWidth', 'minWidth', 'height', 'maxHeight', 'minHeight',
                    'boxSizing', 'overflow', 'whiteSpace', 'wordBreak',
                    'gridTemplateColumns', 'gridColumn'
                ]
                
                importantProps.forEach(prop => {
                    const cssKey = prop.replace(/([A-Z])/g, '-$1').toLowerCase()
                    let value = computed.getPropertyValue(cssKey)
                    
                    // Convert oklch to fallback colors
                    if (value && value.includes('oklch')) {
                        if (prop.toLowerCase().includes('background')) {
                            value = '#ffffff'
                        } else {
                            value = '#000000'
                        }
                    }
                    
                    if (value) {
                        (target.style as any)[prop] = value
                    }
                })
                
                // Ensure borders are visible
                if (computed.borderWidth !== '0px' && computed.borderStyle !== 'none') {
                    target.style.borderColor = target.style.borderColor || '#000000'
                }
                
                // Process children
                const sourceChildren = Array.from(source.children)
                const targetChildren = Array.from(target.children)
                
                sourceChildren.forEach((sourceChild, index) => {
                    if (sourceChild instanceof HTMLElement && targetChildren[index] instanceof HTMLElement) {
                        inlineStyles(sourceChild, targetChildren[index] as HTMLElement)
                    }
                })
            }
            
            inlineStyles(element, clone)
            
            // Capture the cloned element as canvas
            const canvas = await html2canvas(clone, {
                scale: 3, // Higher resolution for print quality
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                onclone: (clonedDoc) => {
                    // Additional cleanup in the cloned document
                    const allElements = clonedDoc.querySelectorAll('*')
                    allElements.forEach((el) => {
                        if (el instanceof HTMLElement) {
                            const style = window.getComputedStyle(el)
                            // Force black text color if oklch detected
                            if (style.color.includes('oklch')) {
                                el.style.color = '#000000'
                            }
                            if (style.backgroundColor.includes('oklch')) {
                                el.style.backgroundColor = '#ffffff'
                            }
                        }
                    })
                }
            })
            
            // Remove the wrapper
            document.body.removeChild(wrapper)

            // Calculate PDF dimensions
            const imgWidth = canvas.width
            const imgHeight = canvas.height
            
            // Convert pixels to mm (scale 3 = 288 effective DPI)
            // 1 inch = 25.4mm, so 1px at 288 DPI = 25.4/288 mm
            const pxToMm = 25.4 / 288
            const pdfWidthMm = imgWidth * pxToMm
            const pdfHeightMm = imgHeight * pxToMm
            
            // Use A4 if the label fits, otherwise custom size
            const a4Width = 210
            const a4Height = 297
            const margin = 15
            
            let pageWidth: number
            let pageHeight: number
            let imgX: number
            let imgY: number
            let finalWidth: number
            let finalHeight: number
            
            if (pdfWidthMm + (margin * 2) <= a4Width && pdfHeightMm + (margin * 2) <= a4Height) {
                // Fits on A4 - center it
                pageWidth = a4Width
                pageHeight = a4Height
                finalWidth = pdfWidthMm
                finalHeight = pdfHeightMm
                imgX = (a4Width - pdfWidthMm) / 2
                imgY = margin
            } else {
                // Custom size with margins
                pageWidth = pdfWidthMm + (margin * 2)
                pageHeight = pdfHeightMm + (margin * 2)
                finalWidth = pdfWidthMm
                finalHeight = pdfHeightMm
                imgX = margin
                imgY = margin
            }
            
            // Create PDF
            const pdf = new jsPDF({
                orientation: pageHeight > pageWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: [pageWidth, pageHeight]
            })

            // Add image to PDF
            const imgData = canvas.toDataURL('image/png', 1.0)
            pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight)

            // Download
            const fileName = `${(labelData.productName || labelData.brandName || 'food-label').replace(/[^a-zA-Z0-9]/g, '-')}-label.pdf`
            pdf.save(fileName)
        } catch (error) {
            console.error('Failed to export PDF:', error)
            alert('Failed to export PDF. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)))
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Toolbar */}
            <div className="h-12 border-b flex items-center justify-between px-4 bg-background shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-sm font-semibold">Label Maker</h1>
                    
                    {/* Mode Switcher */}
                    <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as EditorMode)}>
                        <TabsList className="h-8">
                            <TabsTrigger value="quick-label" className="text-xs h-7 px-3">
                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                Quick Label
                            </TabsTrigger>
                            <TabsTrigger value="recipe-builder" className="text-xs h-7 px-3">
                                <ChefHat className="h-3.5 w-3.5 mr-1.5" />
                                Recipe Builder
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {currentRecipeName && (
                        <>
                            <div className="h-4 w-px bg-border" />
                            <span className="text-sm font-medium text-primary">{currentRecipeName}</span>
                            {hasUnsavedChanges && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">• Unsaved</span>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.1))}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs w-12 text-center">{Math.round(previewScale * 100)}%</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => setPreviewScale(Math.min(2, previewScale + 0.1))}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <Button variant="outline" size="sm" onClick={handleLoadClick} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <FolderOpen className="h-4 w-4 mr-2" />
                        )}
                        Load
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <Plus className="h-4 w-4 mr-2" />
                        New
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                </div>
            </div>

            {/* Main Content - Split Pane */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Left Pane - Label Preview */}
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                        <div className="h-9 border-b flex items-center px-4 text-xs font-medium text-muted-foreground bg-muted/5 justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5" />
                                <span>Label Preview</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                Live Preview
                            </span>
                        </div>
                        <div className="flex-1 bg-neutral-100 overflow-auto flex items-start justify-center p-8">
                            <div style={{ 
                                transform: `scale(${previewScale})`, 
                                transformOrigin: 'top center',
                                marginBottom: `${(previewScale - 1) * 100}%` // Add margin to prevent clipping when scaled up
                            }}>
                                <div ref={labelPreviewRef}>
                                    <LabelPreview data={labelData} />
                                </div>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right Pane - Data Form */}
                <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                        <div className="h-9 border-b flex items-center px-4 text-xs font-medium text-muted-foreground bg-muted/5 justify-between">
                            <div className="flex items-center gap-2">
                                {editorMode === "quick-label" ? (
                                    <>
                                        <FileEdit className="h-3.5 w-3.5" />
                                        <span>Label Data</span>
                                    </>
                                ) : (
                                    <>
                                        <ChefHat className="h-3.5 w-3.5" />
                                        <span>Recipe Builder</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {editorMode === "recipe-builder" && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                        Auto-Calculate
                                    </span>
                                )}
                                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                                    English
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {editorMode === "quick-label" ? (
                                <LabelDataForm data={labelData} onChange={setLabelData} />
                            ) : (
                                <RecipeBuilderForm 
                                    initialData={recipeBuilderData || undefined}
                                    onChange={setRecipeBuilderData}
                                />
                            )}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Save Recipe Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {currentRecipeId ? 'Update Recipe' : 'Save Recipe to Knowledge Hub'}
                        </DialogTitle>
                        <DialogDescription>
                            {currentRecipeId 
                                ? 'Update the existing recipe or save as a new one.'
                                : 'Save your recipe to the Knowledge Hub for easy access later.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="recipeName">Recipe Name</Label>
                            <Input
                                id="recipeName"
                                value={saveRecipeName}
                                onChange={(e) => setSaveRecipeName(e.target.value)}
                                placeholder="e.g., Festive Turkey Dinner"
                            />
                        </div>
                        {!currentRecipeId && (
                            <div className="grid gap-2">
                                <Label htmlFor="recipeFolder">Knowledge Hub Folder</Label>
                                <Select
                                    value={saveRecipeFolderId}
                                    onValueChange={setSaveRecipeFolderId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select folder (default: Recipes)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Recipes (Default)</SelectItem>
                                        {knowledgeFolders.map((folder) => (
                                            <SelectItem key={folder.id} value={folder.id}>
                                                {folder.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Choose where to save in Knowledge Hub
                                </p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="recipeCategory">Category (Optional)</Label>
                            <Input
                                id="recipeCategory"
                                value={saveRecipeCategory}
                                onChange={(e) => setSaveRecipeCategory(e.target.value)}
                                placeholder="e.g., Festive Menu, Meal Box"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {currentRecipeId && (
                            <Button
                                variant="outline"
                                onClick={() => handleSaveConfirm(true)}
                                disabled={isSaving || !saveRecipeName.trim()}
                            >
                                Save as New
                            </Button>
                        )}
                        <Button
                            onClick={() => handleSaveConfirm(false)}
                            disabled={isSaving || !saveRecipeName.trim()}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                currentRecipeId ? 'Update' : 'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Load Recipe Dialog */}
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Load Recipe</DialogTitle>
                        <DialogDescription>
                            Select a saved recipe to load into the editor.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {recipes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No saved recipes yet.</p>
                                <p className="text-sm">Create your first recipe and save it!</p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {recipes.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        className={cn(
                                            "p-3 border rounded-lg cursor-pointer transition-colors",
                                            selectedRecipeId === recipe.id
                                                ? "border-primary bg-primary/5"
                                                : "hover:bg-muted/50"
                                        )}
                                        onClick={() => setSelectedRecipeId(recipe.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-medium">{recipe.name}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(recipe.updated_at)}
                                                    </span>
                                                    {recipe.category && (
                                                        <span className="flex items-center gap-1">
                                                            <Tag className="h-3 w-3" />
                                                            {recipe.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowLoadDialog(false)
                                setSelectedRecipeId(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLoadConfirm}
                            disabled={!selectedRecipeId || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load Recipe'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default LabelMakerView

