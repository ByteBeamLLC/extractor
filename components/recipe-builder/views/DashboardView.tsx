'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ClipboardList,
  Package,
  FileText,
  Calendar,
  Users,
  Settings,
} from 'lucide-react'
import { useRecipes, useRecipeBuilderNavigation } from '../context/RecipeBuilderContext'

/**
 * Recipe Builder Dashboard View
 *
 * Displays business overview, statistics, and quick actions.
 */

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  className?: string
}

function StatCard({ icon, value, label, className = '' }: StatCardProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border bg-card ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function DashboardView() {
  const { stats, loading } = useRecipes()
  const { navigateTo } = useRecipeBuilderNavigation()

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recipe Builder Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your recipes, ingredients, and nutrition labels
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Manage Business
        </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="w-6 h-6" />}
          value={loading ? '...' : stats.recipesCount}
          label="Recipes Created"
        />
        <StatCard
          icon={<FileText className="w-6 h-6" />}
          value={loading ? '...' : stats.subRecipesCount}
          label="Sub Recipes"
        />
        <StatCard
          icon={<Package className="w-6 h-6" />}
          value={loading ? '...' : stats.ingredientsCount}
          label="Ingredients Added"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          value={loading ? '...' : stats.menusCount}
          label="Menus Created"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Business Details</CardTitle>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                B
              </div>
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Business Name:</span>
                  <span className="font-medium">Your Business</span>
                  <span className="text-muted-foreground">User Name:</span>
                  <span>chef.user</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>user@business.com</span>
                  <span className="text-muted-foreground">Joined:</span>
                  <span>Jan 01, 2024</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Plan:</span>
                <span className="font-medium">Free Trial</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Billing Cycle:</span>
                <span>Monthly</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires On:</span>
                <span>--</span>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Report */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Activity Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard
              icon={<ClipboardList className="w-5 h-5" />}
              value={loading ? '...' : stats.recipesCount}
              label="Recipes Created"
            />
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              value={loading ? '...' : stats.subRecipesCount}
              label="Sub Recipes Created"
            />
            <StatCard
              icon={<Package className="w-5 h-5" />}
              value={loading ? '...' : stats.ingredientsCount}
              label="Ingredients Added"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              value={loading ? '...' : stats.menusCount}
              label="Menus Created"
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              value={0}
              label="Meal Plans Created"
            />
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-4">Staff Report</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={1}
                label="Total Staff"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={1}
                label="Active Staff"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                value={0}
                label="Inactive Staff"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigateTo('recipes')}>
              <ClipboardList className="w-4 h-4 mr-2" />
              View Recipes
            </Button>
            <Button variant="outline" onClick={() => navigateTo('ingredients')}>
              <Package className="w-4 h-4 mr-2" />
              Manage Ingredients
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
