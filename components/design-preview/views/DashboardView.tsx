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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { JobItemCard } from './dashboard/JobItemCard'
import { JobDetailView } from './dashboard/JobDetailView'
import { useWorkspaceStore } from '@/components/workspace/WorkspaceStoreProvider'
import { formatDistanceToNow } from 'date-fns'

export function DashboardView() {
    const { schemas, isLoadingSchemas } = useWorkspaceStore()
    const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null)

    // If a job is selected, show the detail view
    if (selectedJobId) {
        const job = schemas.find(s => s.id === selectedJobId)
        return (
            <div className="h-full flex flex-col">
                <div className="h-10 border-b flex items-center px-4 bg-background shrink-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#" onClick={() => setSelectedJobId(null)}>Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{job?.name || 'Job Detail'}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <JobDetailView jobName={job?.name || 'Job Detail'} schemaId={job?.id} />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Analytics Cards - Only show on root dashboard */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b bg-muted/5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{schemas.length}</div>
                        <p className="text-xs text-muted-foreground">+2 from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">+201 since last hour</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Extractions</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,234</div>
                        <p className="text-xs text-muted-foreground">+19% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">99.9%</div>
                        <p className="text-xs text-muted-foreground">+0.1% from last week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search jobs..." className="pl-8 h-9" />
                    </div>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        Filter
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" className="h-9">
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        New Job
                    </Button>
                </div>
            </div>

            {/* Main Content - Jobs Gallery */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                {/* Breadcrumbs for Folder Navigation */}
                <div className="mb-4 flex items-center text-sm text-muted-foreground">
                    <button className="hover:text-foreground transition-colors">Home</button>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="font-medium text-foreground">Jobs</span>
                </div>

                {isLoadingSchemas ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {schemas.map((schema) => (
                            <JobItemCard
                                key={schema.id}
                                item={{
                                    id: schema.id,
                                    type: 'agent',
                                    name: schema.name,
                                    description: schema.agentType === 'pharma' ? 'Pharma Extraction' : 'Standard Extraction',
                                    activeJobs: 0, // Count not available in summary
                                    status: 'active', // Status not available in summary
                                    lastRun: schema.lastModified ? formatDistanceToNow(new Date(schema.lastModified), { addSuffix: true }) : 'Unknown'
                                }}
                                onClick={(item) => setSelectedJobId(item.id)}
                            />
                        ))}
                        {/* Add New Card */}
                        <Card className="flex flex-col items-center justify-center h-[200px] border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-sm">Create New Job</h3>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
