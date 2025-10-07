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
  Zap
} from 'lucide-react'
import { PageHeader, StatCard, LoadingState, StatusBadge } from '@/components/shared/DesignSystem'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching analytics data
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [timeRange])

  // Mock data for demonstration
  const salesData: SalesData[] = [
    { date: '2024-09-30', sales: 45, revenue: 12450, profit: 3735, customers: 38 },
    { date: '2024-10-01', sales: 52, revenue: 15680, profit: 4704, customers: 42 },
    { date: '2024-10-02', sales: 48, revenue: 14240, profit: 4272, customers: 39 },
    { date: '2024-10-03', sales: 61, revenue: 18920, profit: 5676, customers: 48 },
    { date: '2024-10-04', sales: 55, revenue: 16890, profit: 5067, customers: 44 },
    { date: '2024-10-05', sales: 67, revenue: 20150, profit: 6045, customers: 52 },
  ]

  const topProducts: TopProduct[] = [
    {
      id: '1',
      name: 'Coca-Cola 1L',
      category: 'Beverages',
      quantitySold: 245,
      revenue: 36750,
      profit: 7350,
      growth: 12.5
    },
    {
      id: '2',
      name: 'Aquafina Water 1L',
      category: 'Water',
      quantitySold: 189,
      revenue: 15120,
      profit: 2835,
      growth: 8.3
    },
    {
      id: '3',
      name: 'Fanta Orange 1L',
      category: 'Beverages',
      quantitySold: 167,
      revenue: 23380,
      profit: 5014,
      growth: -2.1
    },
    {
      id: '4',
      name: 'Mountain Dew Extreme 500ml',
      category: 'Energy Drinks',
      quantitySold: 134,
      revenue: 16080,
      profit: 3354,
      growth: 24.7
    },
    {
      id: '5',
      name: 'Fresh Apple Juice 1L',
      category: 'Juices',
      quantitySold: 98,
      revenue: 15680,
      profit: 3920,
      growth: 15.2
    }
  ]

  const branchPerformance: BranchPerformance[] = [
    {
      id: '1',
      name: 'Main Store - Nairobi',
      sales: 328,
      revenue: 98410,
      profit: 29523,
      customers: 263,
      growth: 18.7
    },
    {
      id: '2',
      name: 'Branch 2 - Mombasa',
      sales: 156,
      revenue: 46820,
      profit: 14046,
      customers: 125,
      growth: 12.3
    },
    {
      id: '3',
      name: 'Branch 3 - Kisumu',
      sales: 98,
      revenue: 29440,
      profit: 8832,
      customers: 78,
      growth: -5.2
    }
  ]

  const categoryPerformance: CategoryPerformance[] = [
    { category: 'Beverages', sales: 412, revenue: 60130, profit: 12364, growth: 8.7 },
    { category: 'Water', sales: 189, revenue: 15120, profit: 2835, growth: 12.1 },
    { category: 'Energy Drinks', sales: 134, revenue: 16080, profit: 3354, growth: 24.7 },
    { category: 'Juices', sales: 98, revenue: 15680, profit: 3920, growth: 15.2 },
    { category: 'Dairy', sales: 67, revenue: 8920, profit: 2230, growth: 6.3 }
  ]

  const summaryStats = {
    totalRevenue: salesData.reduce((sum, day) => sum + day.revenue, 0),
    totalSales: salesData.reduce((sum, day) => sum + day.sales, 0),
    totalProfit: salesData.reduce((sum, day) => sum + day.profit, 0),
    totalCustomers: salesData.reduce((sum, day) => sum + day.customers, 0),
    averageOrderValue: salesData.reduce((sum, day) => sum + day.revenue, 0) / salesData.reduce((sum, day) => sum + day.sales, 0),
    profitMargin: (salesData.reduce((sum, day) => sum + day.profit, 0) / salesData.reduce((sum, day) => sum + day.revenue, 0)) * 100,
    customerGrowth: 15.3,
    revenueGrowth: 22.1
  }

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive insights into your business performance"
      >
        <div className="flex space-x-3">
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
          <Button variant="outline">
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
          <div className="h-64 bg-surface rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-secondary mb-4">Sales trend chart will be displayed here</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-secondary">Peak Day</p>
                  <p className="font-medium text-primary">Oct 5, 2024</p>
                  <p className="text-emerald-600">67 sales</p>
                </div>
                <div>
                  <p className="text-secondary">Avg Daily</p>
                  <p className="font-medium text-primary">54.7 sales</p>
                  <p className="text-blue-600">+15.3%</p>
                </div>
                <div>
                  <p className="text-secondary">Total Revenue</p>
                  <p className="font-medium text-primary">{formatCurrency(summaryStats.totalRevenue)}</p>
                  <p className="text-emerald-600">+22.1%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Revenue by Category
          </h2>
          <p className="text-secondary mb-6">Distribution of revenue across product categories</p>
          <div className="h-64 bg-surface rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-secondary mb-4">Revenue breakdown chart will be displayed here</p>
              <div className="space-y-2 text-sm text-left">
                {categoryPerformance.slice(0, 4).map((category, index) => (
                  <div key={category.category} className="flex justify-between items-center p-2 bg-card rounded">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="font-medium text-primary">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-primary">{formatCurrency(category.revenue)}</span>
                      <span className="text-xs text-secondary ml-2">({((category.revenue / summaryStats.totalRevenue) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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