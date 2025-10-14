'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  Store,
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { PageHeader, StatCard, LoadingState, StatusBadge } from '@/components/shared/DesignSystem'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateManager } from '@/lib/update-manager'

// Recharts imports for interactive charts
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface SalesData {
  date: string
  sales: number
  revenue: number
  profit: number
  customers: number
}

interface TopProduct {
  id: string
  name: string
  category: string
  quantitySold: number
  revenue: number
  profit: number
  growth: number
}

interface BranchPerformance {
  id: string
  name: string
  sales: number
  revenue: number
  profit: number
  customers: number
  growth: number
}

interface CategoryPerformance {
  category: string
  sales: number
  revenue: number
  profit: number
  growth: number
}

// API Response Types
interface AnalyticsResponse {
  summaryStats: {
    totalRevenue: number
    totalSales: number
    totalProfit: number
    totalCustomers: number
    averageOrderValue: number
    profitMargin: number
    customerGrowth: number
    revenueGrowth: number
  }
  salesData: SalesData[]
  topProducts: TopProduct[]
  categoryPerformance: CategoryPerformance[]
  branchPerformance: BranchPerformance[]
  period: {
    start: string
    end: string
    timeRange: string
  }
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshAnalytics = async () => {
    setRefreshTrigger(prev => prev + 1)
    await fetchAnalyticsData()
  }

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('timeRange', timeRange)
      if (selectedBranch !== 'all') {
        params.append('branchId', selectedBranch)
      }

      const response = await fetch(`/api/analytics?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()

      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, selectedBranch, refreshTrigger])

  // Listen for real-time analytics updates
  useEffect(() => {
    const unsubscribe = updateManager.subscribe('analytics_updated', (event) => {
      console.log('Analytics page: Update received', event.data)
      refreshAnalytics()
    })

    // Also listen for sales completion events
    const unsubscribeSales = updateManager.subscribe('sale_completed', (event) => {
      console.log('Analytics page: Sale completed, refreshing data', event.data)
      refreshAnalytics()
    })

    return () => {
      unsubscribe()
      unsubscribeSales()
    }
  }, [timeRange, selectedBranch])

  // Use real data or fallback to empty state
  const summaryStats = analyticsData?.summaryStats || {
    totalRevenue: 0,
    totalSales: 0,
    totalProfit: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    profitMargin: 0,
    customerGrowth: 0,
    revenueGrowth: 0
  }

  const salesData = analyticsData?.salesData || []
  const topProducts = analyticsData?.topProducts || []
  const categoryPerformance = analyticsData?.categoryPerformance || []
  const branchPerformance = analyticsData?.branchPerformance || []

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="font-medium">+{growth}%</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="font-medium">{growth}%</span>
        </div>
      )
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analytics</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive insights into your business performance"
      >
        <div className="flex space-x-3">
          {/* Branch Selector */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Branches</option>
            <option value="cmgq8tx590000lras30r8autd">Main Store - Nairobi</option>
            <option value="cmgq8u3j90001lras30r8b5qg">Branch 2 - Mombasa</option>
            <option value="cmgq8v9h00002lras30r8h8xw">Branch 3 - Kisumu</option>
          </select>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-2 bg-card border border-border rounded-md p-1">
            {['day', 'week', 'month', 'quarter', 'year'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="capitalize"
              >
                {range}
              </Button>
            ))}
          </div>

          <Button variant="outline" onClick={refreshAnalytics} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Revenue"
          value={formatCurrency(summaryStats.totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          change={`+${summaryStats.revenueGrowth}%`}
          changeType="positive"
        />
        <StatCard
          title="Sales"
          value={summaryStats.totalSales}
          icon={ShoppingCart}
          color="bg-blue-500"
          change="+18.2%"
          changeType="positive"
        />
        <StatCard
          title="Profit"
          value={formatCurrency(summaryStats.totalProfit)}
          icon={Target}
          color="bg-purple-500"
          change="+14.8%"
          changeType="positive"
        />
        <StatCard
          title="Customers"
          value={summaryStats.totalCustomers}
          icon={Users}
          color="bg-orange-500"
          change={`+${summaryStats.customerGrowth}%`}
          changeType="positive"
        />
        <StatCard
          title="Avg Order"
          value={formatCurrency(summaryStats.averageOrderValue)}
          icon={Zap}
          color="bg-indigo-500"
          change="+5.3%"
          changeType="positive"
        />
        <StatCard
          title="Profit Margin"
          value={`${summaryStats.profitMargin.toFixed(1)}%`}
          icon={PieChart}
          color="bg-pink-500"
          change="-2.1%"
          changeType="negative"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Sales Trend
          </h2>
          <p className="text-secondary mb-6">Daily sales performance over the selected period</p>
          <div className="h-64">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Sales'
                    ]}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center h-full flex items-center justify-center">
                <div>
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-secondary">No sales data available for the selected period</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Revenue by Category
          </h2>
          <p className="text-secondary mb-6">Distribution of revenue across product categories</p>
          <div className="h-64">
            {categoryPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center h-full flex items-center justify-center">
                <div>
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-secondary">No category data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products and Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Top Products
          </h2>
          <p className="text-secondary mb-6">Best performing products by revenue and growth</p>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-primary">{product.name}</p>
                    <p className="text-sm text-secondary">{product.category} • {product.quantitySold} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">{formatCurrency(product.revenue)}</p>
                  {getGrowthIndicator(product.growth)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <Store className="h-5 w-5 mr-2" />
            Branch Performance
          </h2>
          <p className="text-secondary mb-6">Sales and revenue comparison across branches</p>
          <div className="space-y-4">
            {branchPerformance.map((branch) => (
              <div key={branch.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{branch.name}</p>
                    <p className="text-sm text-secondary">{branch.sales} sales • {branch.customers} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">{formatCurrency(branch.revenue)}</p>
                  {getGrowthIndicator(branch.growth)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">Performance Summary</h2>
        <p className="text-secondary mb-6">Detailed breakdown of business metrics and performance indicators</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-3 flex items-center text-primary">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sales Metrics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Total Transactions:</span>
                <span className="font-medium text-primary">{summaryStats.totalSales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Revenue per Transaction:</span>
                <span className="font-medium text-primary">{formatCurrency(summaryStats.averageOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Items per Transaction:</span>
                <span className="font-medium text-primary">3.2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Conversion Rate:</span>
                <span className="font-medium text-primary">68.5%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 flex items-center text-primary">
              <Users className="h-4 w-4 mr-2" />
              Customer Metrics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Unique Customers:</span>
                <span className="font-medium text-primary">{summaryStats.totalCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">New Customers:</span>
                <span className="font-medium text-primary">67 (23.1%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Returning Customers:</span>
                <span className="font-medium text-primary">223 (76.9%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Customer Retention:</span>
                <span className="font-medium text-primary">84.2%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 flex items-center text-primary">
              <Target className="h-4 w-4 mr-2" />
              Financial Metrics
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Total Revenue:</span>
                <span className="font-medium text-primary">{formatCurrency(summaryStats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Total Profit:</span>
                <span className="font-medium text-primary">{formatCurrency(summaryStats.totalProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Profit Margin:</span>
                <span className="font-medium text-primary">{summaryStats.profitMargin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Cost of Goods Sold:</span>
                <span className="font-medium text-primary">{formatCurrency(summaryStats.totalRevenue - summaryStats.totalProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}