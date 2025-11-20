'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Star, Download } from 'lucide-react'

export function AgentMarketplace() {
    const marketplaceAgents = [
        {
            id: 1,
            name: 'Invoice Parser Pro',
            description: 'Advanced invoice parsing with multi-language support',
            rating: 4.8,
            downloads: 1234,
            category: 'Document Processing'
        },
        {
            id: 2,
            name: 'Receipt Analyzer',
            description: 'Extract data from receipts with high accuracy',
            rating: 4.6,
            downloads: 856,
            category: 'Finance'
        },
        {
            id: 3,
            name: 'Contract Reviewer',
            description: 'Automated contract analysis and key term extraction',
            rating: 4.9,
            downloads: 2341,
            category: 'Legal'
        },
        {
            id: 4,
            name: 'Form Filler',
            description: 'Intelligent form data extraction and population',
            rating: 4.5,
            downloads: 678,
            category: 'Automation'
        },
        {
            id: 5,
            name: 'ID Verifier',
            description: 'Verify and extract information from identity documents',
            rating: 4.7,
            downloads: 1567,
            category: 'Verification'
        },
        {
            id: 6,
            name: 'Medical Record Parser',
            description: 'Extract structured data from medical documents',
            rating: 4.8,
            downloads: 432,
            category: 'Healthcare'
        },
    ]

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Agent Hub</h2>
                <p className="text-muted-foreground">
                    Discover and install pre-built AI agents
                </p>
            </div>

            <div className="flex gap-2">
                <input
                    type="search"
                    placeholder="Search agents..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-sm"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {marketplaceAgents.map((agent) => (
                    <Card key={agent.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-2 rounded-md bg-primary/10">
                                    <Bot className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{agent.rating}</span>
                                </div>
                            </div>
                            <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
                            <CardDescription>{agent.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span className="px-2 py-1 bg-muted rounded-md text-xs">
                                        {agent.category}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Download className="h-3 w-3" />
                                        <span>{agent.downloads.toLocaleString()}</span>
                                    </div>
                                </div>
                                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                    Install Agent
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
