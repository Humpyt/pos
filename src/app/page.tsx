'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  BarChart3,
  Store,
  FileText
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { StatCard, PageHeader, QuickAction, ActivityItem, EmptyState } from '@/components/shared/DesignSystem'
import { updateManager } from '@/lib/update-manager'
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { useAuth } from "@/lib/use-auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalSales: number
  totalRevenue: number
  totalProducts: number
  lowStockProducts: number
  todaySales: number
  todayRevenue: number
  activeCustomers: number
  pendingOrders: number
}

export default function Dashboard() {
  const { userName, userEmail } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    todaySales: 0,
    todayRevenue: 0,
    activeCustomers: 0,
    pendingOrders: 0
  })

  const updateStats = (newSaleData?: any) => {
    setStats(prev => {
      const updated = { ...prev }

      if (newSaleData) {
        // Update based on new sale
        updated.totalSales += 1
        updated.totalRevenue += newSaleData.totalAmount || 0
        updated.todaySales += 1
        updated.todayRevenue += newSaleData.totalAmount || 0
        updated.activeCustomers = Math.max(updated.activeCustomers, prev.activeCustomers + 1)
      } else {
        // Initial stats
        updated.totalSales = 1456
        updated.totalRevenue = 9870000
        updated.totalProducts = 67
        updated.lowStockProducts = 5
        updated.todaySales = 23
        updated.todayRevenue = 485000
        updated.activeCustomers = 234
        updated.pendingOrders = 3
      }

      return updated
    })
  }

  useEffect(() => {
    // Initialize dashboard data
    updateStats()
  }, [])

  // Listen for real-time dashboard updates
  useEffect(() => {
    const unsubscribe = updateManager.subscribe('dashboard_updated', (event) => {
      console.log('Dashboard: Update received', event.data)
      updateStats(event.data)
    })

    // Also listen for sales completion events
    const unsubscribeSales = updateManager.subscribe('sale_completed', (event) => {
      console.log('Dashboard: Sale completed, updating metrics', event.data)
      updateStats(event.data)
    })

    return () => {
      unsubscribe()
      unsubscribeSales()
    }
  }, [])

  const statCards = [
    {
      title: 'Total Sales',
      value: stats.totalSales.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8.2%',
      changeType: 'positive'
    },
    {
      title: 'Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: 'bg-purple-500',
      change: '+2 new',
      changeType: 'neutral'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts.toLocaleString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-3',
      changeType: 'negative'
    },
    {
      title: 'Today Sales',
      value: stats.todaySales.toLocaleString(),
      icon: BarChart3,
      color: 'bg-indigo-500',
      change: '+5',
      changeType: 'positive'
    },
    {
      title: 'Today Revenue',
      value: formatCurrency(stats.todayRevenue),
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+18.7%',
      changeType: 'positive'
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toLocaleString(),
      icon: Users,
      color: 'bg-orange-500',
      change: '+12',
      changeType: 'positive'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toLocaleString(),
      icon: Activity,
      color: 'bg-yellow-500',
      change: '-2',
      changeType: 'positive'
    }
  ]

  return (
    <>
      <SignedIn>
        <div className="space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Dashboard"
            subtitle={`Welcome back, ${userName || 'User'}! Here's what's happening with your store today.`}
          />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="New Sale"
              icon={ShoppingCart}
              variant="primary"
              onClick={() => console.log('New Sale clicked')}
            />
            <QuickAction
              title="Generate Report"
              icon={FileText}
              variant="success"
              onClick={() => console.log('Generate Report clicked')}
            />
            <QuickAction
              title="Add Customer"
              icon={Users}
              variant="secondary"
              onClick={() => console.log('Add Customer clicked')}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              icon={() => (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              iconColor="bg-emerald-500"
              title="New sale completed"
              description="Order #SALE-UG789 - UGX 125,000"
              timestamp="2 minutes ago"
            />
            <ActivityItem
              icon={() => (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              iconColor="bg-yellow-500"
              title="Low stock alert"
              description="Coca-Cola 1L - 5 units remaining"
              timestamp="15 minutes ago"
            />
            <ActivityItem
              icon={() => (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              )}
              iconColor="bg-blue-500"
              title="New customer registered"
              description="John Doe - john@example.com"
              timestamp="1 hour ago"
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Sales Trend</h2>
          <div className="h-64 bg-surface rounded-lg flex items-center justify-center">
            <EmptyState
              icon={TrendingUp}
              title="No sales data yet"
              description="Sales trends will appear here once you start making sales."
              action={{
                label: "Start Selling",
                onClick: () => console.log('Start Selling clicked')
              }}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Top Products</h2>
          <div className="h-64 bg-surface rounded-lg flex items-center justify-center">
            <EmptyState
              icon={BarChart3}
              title="No product data yet"
              description="Top performing products will appear here once you have sales data."
            />
          </div>
        </div>
      </div>
    </div>
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
