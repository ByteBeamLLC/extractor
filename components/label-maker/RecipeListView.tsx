"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
    ChefHat,
    Plus,
    MoreHorizontal,
    Clock,
    Tag,
    DollarSign,
    Search,
    Loader2,
    Copy,
    Trash2,
    Download,
    Edit
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
    getRecipes,
    getRecipe,
    deleteRecipe,
    duplicateRecipe,
    getRecipeCategories,
    type RecipeListItem,
    type RecipeDocument
} from "@/lib/label-maker/recipe-actions"

interface RecipeListViewProps {
    onSelectRecipe: (recipe: RecipeDocument) => void
    onNewRecipe: () => void
}

export function RecipeListView({ onSelectRecipe, onNewRecipe }: RecipeListViewProps) {
    const [recipes, setRecipes] = React.useState<RecipeListItem[]>([])
    const [categories, setCategories] = React.useState<string[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
    const [deleteId, setDeleteId] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Load recipes and categories on mount
    React.useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [loadedRecipes, loadedCategories] = await Promise.all([
                getRecipes(),
                getRecipeCategories()
            ])
            setRecipes(loadedRecipes)
            setCategories(loadedCategories)
        } catch (error) {
            console.error('Failed to load recipes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = async (recipeId: string) => {
        try {
            const recipe = await getRecipe(recipeId)
            if (recipe) {
                onSelectRecipe(recipe)
            }
        } catch (error) {
            console.error('Failed to load recipe:', error)
        }
    }

    const handleDuplicate = async (recipeId: string) => {
        try {
            await duplicateRecipe(recipeId)
            await loadData()
        } catch (error) {
            console.error('Failed to duplicate recipe:', error)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        
        setIsDeleting(true)
        try {
            await deleteRecipe(deleteId)
            await loadData()
            setDeleteId(null)
        } catch (error) {
            console.error('Failed to delete recipe:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    // Filter recipes based on search and category
    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = searchQuery === "" || 
            recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "all" || 
            recipe.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Loading recipes...</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-semibold">Recipes</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your saved recipes and food labels
                        </p>
                    </div>
                    <Button onClick={onNewRecipe}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Recipe
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search recipes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {filteredRecipes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                            <ChefHat className="h-8 w-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">
                            {recipes.length === 0 ? 'No recipes yet' : 'No recipes found'}
                        </h3>
                        <p className="text-sm max-w-sm mb-4">
                            {recipes.length === 0 
                                ? 'Create your first recipe to start generating food labels.'
                                : 'Try adjusting your search or filter criteria.'}
                        </p>
                        {recipes.length === 0 && (
                            <Button onClick={onNewRecipe}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Recipe
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredRecipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onEdit={() => handleEdit(recipe.id)}
                                onDuplicate={() => handleDuplicate(recipe.id)}
                                onDelete={() => setDeleteId(recipe.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this recipe? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface RecipeCardProps {
    recipe: RecipeListItem
    onEdit: () => void
    onDuplicate: () => void
    onDelete: () => void
}

function RecipeCard({ recipe, onEdit, onDuplicate, onDelete }: RecipeCardProps) {
    return (
        <Card
            className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50 flex flex-col"
            onClick={onEdit}
        >
            {/* Preview Area */}
            <div className="h-32 w-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 flex items-center justify-center">
                <ChefHat className="h-12 w-12 text-emerald-600/50 dark:text-emerald-400/50" />
            </div>

            {/* Content */}
            <CardContent className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={recipe.name}>
                        {recipe.name}
                    </h3>
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDuplicate}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={onDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(recipe.updated_at), { addSuffix: true })}
                    </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                    {recipe.folder_name && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {recipe.folder_name}
                        </Badge>
                    )}
                    {recipe.category && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                            {recipe.category}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default RecipeListView

