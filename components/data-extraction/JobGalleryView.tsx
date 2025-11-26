'use client'

import * as React from 'react'
import {
    Search,
    Plus,
    Filter,
    LayoutGrid,
    List as ListIcon,
    FileText,
    Users,
    Activity,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SchemaJobCard } from './SchemaJobCard'
import { SchemaDefinition } from '@/lib/schema'

interface JobGalleryViewProps {
    schemas: SchemaDefinition[]
    isLoading?: boolean
    onSelectSchema: (schema: SchemaDefinition) => void
    onCreateSchema: () => void
    onDeleteSchema?: (schema: SchemaDefinition) => void
    onRenameSchema?: (schema: SchemaDefinition) => void
}

export function JobGalleryView({
    schemas,
    isLoading,
    onSelectSchema,
    onCreateSchema,
    onDeleteSchema,
    onRenameSchema
}: JobGalleryViewProps) {
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredSchemas = React.useMemo(() => {
        if (!searchQuery.trim()) return schemas
        const query = searchQuery.toLowerCase()
        return schemas.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.templateId?.toLowerCase().includes(query)
        )
    }, [schemas, searchQuery])

    // Calculate analytics
    const totalDocs = React.useMemo(() =>
        schemas.reduce((acc, s) => acc + (s.jobs?.length || 0), 0),
        [schemas])

    const activeJobs = React.useMemo(() =>
        schemas.reduce((acc, s) => acc + (s.jobs?.filter(j => j.status === 'processing').length || 0), 0),
        [schemas])

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b bg-muted/5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDocs}</div>
                        <p className="text-xs text-muted-foreground">Across {schemas.length} schemas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeJobs}</div>
                        <p className="text-xs text-muted-foreground">Currently processing</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.9%</div>
                        <p className="text-xs text-muted-foreground">+0.1% from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Active workspace members</p>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search jobs..."
                            className="pl-8 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filter
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" className="h-9" onClick={onCreateSchema}>
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        New Job
                    </Button>
                </div>
            </div>

            {/* Main Content - Jobs Gallery */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-10">
                        {/* Create New Card */}
                        <Card
                            className="flex flex-col items-center justify-center h-[220px] border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group"
                            onClick={onCreateSchema}
                        >
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-medium text-sm group-hover:text-primary transition-colors">Create New Job</h3>
                        </Card>

                        {filteredSchemas.map((schema) => (
                            <SchemaJobCard
                                key={schema.id}
                                schema={schema}
                                onClick={onSelectSchema}
                                onDelete={onDeleteSchema}
                                onRename={onRenameSchema}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
