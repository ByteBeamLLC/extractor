'use client'

import * as React from 'react'
import {
    Search,
    Plus,
    Filter,
    LayoutGrid,
    List as ListIcon,
    ChevronRight,
    Home,
    FileText,
    Users,
    Activity,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JobItem, JobItemCard } from './dashboard/JobItemCard'

// Mock Data
const mockRootItems: JobItem[] = [
    { id: 'f1', type: 'folder', name: 'Finance Department', description: 'Invoices and financial reports', itemCount: 5 },
    { id: 'f2', type: 'folder', name: 'HR & Legal', description: 'Employee contracts and policies', itemCount: 3 },
    { id: 'f3', type: 'folder', name: 'Logistics', description: 'Shipping manifests and tracking', itemCount: 8 },
    { id: 'a1', type: 'agent', name: 'Invoice Extractor v2', description: 'Extracts data from PDF invoices', activeJobs: 12, lastRun: '2m ago', status: 'active' },
    { id: 'a2', type: 'agent', name: 'Contract Analyzer', description: 'Identifies key clauses in legal docs', activeJobs: 3, lastRun: '1h ago', status: 'idle' },
]

const mockFinanceItems: JobItem[] = [
    { id: 'a3', type: 'agent', name: 'Receipt Scanner', description: 'Process expense receipts', activeJobs: 45, lastRun: 'Just now', status: 'active' },
    { id: 'a4', type: 'agent', name: 'Tax Form Processor', description: 'W-2 and 1099 extraction', activeJobs: 0, lastRun: '1d ago', status: 'idle' },
]

import { JobDetailView } from './dashboard/JobDetailView'

export function DashboardView() {
    const [currentPath, setCurrentPath] = React.useState<{ id: string, name: string }[]>([])
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
    const [selectedJob, setSelectedJob] = React.useState<JobItem | null>(null)

    // Simple mock navigation logic
    const currentItems = React.useMemo(() => {
        if (currentPath.length === 0) return mockRootItems
        const currentFolderId = currentPath[currentPath.length - 1].id
        if (currentFolderId === 'f1') return mockFinanceItems
        return [] // Empty for other folders in this mock
    }, [currentPath])

    const handleItemClick = (item: JobItem) => {
        if (item.type === 'folder') {
            setCurrentPath([...currentPath, { id: item.id, name: item.name }])
        } else {
            setSelectedJob(item)
        }
    }

    const handleBreadcrumbClick = (index: number) => {
        setSelectedJob(null) // Clear selected job when navigating breadcrumbs
        if (index === -1) {
            setCurrentPath([])
        } else {
            setCurrentPath(currentPath.slice(0, index + 1))
        }
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header / Toolbar */}
            <div className="h-16 border-b flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg">
                        {selectedJob ? selectedJob.name : 'Jobs Gallery'}
                    </h2>
                </div>
                {!selectedJob && (
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search jobs & agents..." className="pl-8 h-9" />
                        </div>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Job
                        </Button>
                    </div>
                )}
            </div>

            {/* Navigation Bar */}
            <div className="h-12 border-b flex items-center justify-between px-6 bg-muted/5 shrink-0">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-muted-foreground">
                    <button
                        onClick={() => handleBreadcrumbClick(-1)}
                        className={`flex items-center hover:text-foreground transition-colors ${currentPath.length === 0 && !selectedJob ? 'text-foreground font-medium' : ''}`}
                    >
                        <Home className="h-4 w-4 mr-1" />
                        Home
                    </button>
                    {currentPath.map((folder, index) => (
                        <React.Fragment key={folder.id}>
                            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`hover:text-foreground transition-colors ${index === currentPath.length - 1 && !selectedJob ? 'text-foreground font-medium' : ''}`}
                            >
                                {folder.name}
                            </button>
                        </React.Fragment>
                    ))}
                    {selectedJob && (
                        <>
                            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                            <span className="text-foreground font-medium">{selectedJob.name}</span>
                        </>
                    )}
                </div>

                {/* View Controls */}
                {!selectedJob && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                            <LayoutGrid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-foreground' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                            <ListIcon className={`h-4 w-4 ${viewMode === 'list' ? 'text-foreground' : 'text-muted-foreground'}`} />
                        </Button>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <Button variant="ghost" size="sm" className="h-8">
                            <Filter className="h-3.5 w-3.5 mr-2" />
                            Filter
                        </Button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            {selectedJob ? (
                <JobDetailView jobName={selectedJob.name} />
            ) : (
                <div className="flex-1 overflow-auto p-6 space-y-8">
                    {/* Analytics Section */}
                    {currentPath.length === 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Documents
                                    </CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">12,345</div>
                                    <p className="text-xs text-muted-foreground">
                                        +20.1% from last month
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Active Users
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">+573</div>
                                    <p className="text-xs text-muted-foreground">
                                        +201 since last hour
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Extractions
                                    </CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">+12,234</div>
                                    <p className="text-xs text-muted-foreground">
                                        +19% from last month
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Success Rate
                                    </CardTitle>
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">98.5%</div>
                                    <p className="text-xs text-muted-foreground">
                                        +1.2% from last week
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Jobs Gallery Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold tracking-tight">
                                {currentPath.length > 0 ? currentPath[currentPath.length - 1].name : 'Jobs & Agents'}
                            </h3>
                        </div>

                        {currentItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {currentItems.map((item) => (
                                    <JobItemCard key={item.id} item={item} onClick={handleItemClick} />
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Search className="h-8 w-8 opacity-20" />
                                </div>
                                <p>No items found in this folder</p>
                                <Button variant="link" className="mt-2">Create a new Agent</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
