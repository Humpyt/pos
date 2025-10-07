'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  Calendar,
  Truck,
  Download,
  Plus,
  Eye,
  Edit
} from 'lucide-react'
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState, LoadingState } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, daysUntilExpiry, isExpired, isExpiringSoon } from '@/lib/utils'

interface InventoryItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    category: string
  }
  variation?: {
    id: string
    name: string
  }
  batch?: {
    id: string
    batchNumber: string
    expiryDate: string
    quantity: number
  }
  quantity: number
  minStock: number
  maxStock?: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  branch: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching inventory data
    setTimeout(() => {
      setInventory([
        {
          id: '1',
          product: {
            id: '1',
            name: 'Coca-Cola 1L',
            sku: 'COC-COLA-1L',
            category: 'Beverages'
          },
          variation: {
            id: '1-1',
            name: '1L Bottle'
          },
          batch: {
            id: 'batch-1',
            batchNumber: 'CC2024-001',
            expiryDate: '2024-12-31',
            quantity: 45
          },
          quantity: 45,
          minStock: 10,
          maxStock: 100,
          unitCost: 120,
          totalValue: 5400,
          lastUpdated: '2024-10-05T10:30:00Z',
          branch: 'Main Store'
        },
        {
          id: '2',
          product: {
            id: '2',
            name: 'Coca-Cola 500ml',
            sku: 'COC-COLA-500',
            category: 'Beverages'
          },
          variation: {
            id: '2-1',
            name: '500ml Bottle'
          },
          batch: {
            id: 'batch-2',
            batchNumber: 'CC2024-002',
            expiryDate: '2024-11-15',
            quantity: 8
          },
          quantity: 8,
          minStock: 10,
          maxStock: 50,
          unitCost: 65,
          totalValue: 520,
          lastUpdated: '2024-10-05T09:15:00Z',
          branch: 'Main Store'
        },
        {
          id: '3',
          product: {
            id: '3',
            name: 'Fanta Orange 1L',
            sku: 'FAN-ORNG-1L',
            category: 'Beverages'
          },
          variation: {
            id: '3-1',
            name: '1L Bottle'
          },
          batch: {
            id: 'batch-3',
            batchNumber: 'FO2024-001',
            expiryDate: '2025-01-15',
            quantity: 67
          },
          quantity: 67,
          minStock: 10,
          maxStock: 100,
          unitCost: 110,
          totalValue: 7370,
          lastUpdated: '2024-10-04T16:45:00Z',
          branch: 'Main Store'
        },
        {
          id: '4',
          product: {
            id: '4',
            name: 'Aquafina Water 1L',
            sku: 'AQV-FINA-1L',
            category: 'Water'
          },
          variation: {
            id: '4-1',
            name: '1L Bottle'
          },
          batch: {
            id: 'batch-4',
            batchNumber: 'AQ2024-001',
            expiryDate: '2025-06-30',
            quantity: 120
          },
          quantity: 120,
          minStock: 20,
          maxStock: 200,
          unitCost: 65,
          totalValue: 7800,
          lastUpdated: '2024-10-05T08:00:00Z',
          branch: 'Main Store'
        },
        {
          id: '5',
          product: {
            id: '5',
            name: 'Mountain Dew Extreme 500ml',
            sku: 'MTV-EXCT-500',
            category: 'Energy Drinks'
          },
          variation: {
            id: '5-1',
            name: '500ml Bottle'
          },
          batch: {
            id: 'batch-5',
            batchNumber: 'MD2024-001',
            expiryDate: '2024-10-20',
            quantity: 3
          },
          quantity: 3,
          minStock: 10,
          maxStock: 30,
          unitCost: 95,
          totalValue: 285,
          lastUpdated: '2024-10-05T11:20:00Z',
          branch: 'Main Store'
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.batch?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || item.product?.category === selectedCategory
    const matchesBranch = selectedBranch === 'all' || item.branch === selectedBranch

    return matchesSearch && matchesCategory && matchesBranch
  })

  const categories = Array.from(new Set(inventory.map(item => item.product?.category).filter(Boolean)))
  const branches = Array.from(new Set(inventory.map(item => item.branch)))

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { status: 'Out of Stock', variant: 'destructive' as const, icon: TrendingDown }
    if (quantity <= minStock) return { status: 'Low Stock', variant: 'warning' as const, icon: TrendingDown }
    return { status: 'In Stock', variant: 'success' as const, icon: TrendingUp }
  }

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null

    const expiry = new Date(expiryDate)
    if (isExpired(expiry)) {
      return { status: 'Expired', variant: 'destructive' as const, days: 0 }
    }
    if (isExpiringSoon(expiry)) {
      const days = daysUntilExpiry(expiry)
      return { status: `Expiring in ${days} days`, variant: 'warning' as const, days }
    }
    return null
  }

  const summaryStats = {
    totalItems: inventory.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0),
    lowStockItems: inventory.filter(item => item.quantity <= item.minStock && item.quantity > 0).length,
    outOfStockItems: inventory.filter(item => item.quantity === 0).length,
    expiringItems: inventory.filter(item => {
      if (!item.batch?.expiryDate) return false
      return isExpiringSoon(new Date(item.batch.expiryDate))
    }).length,
    expiredItems: inventory.filter(item => {
      if (!item.batch?.expiryDate) return false
      return isExpired(new Date(item.batch.expiryDate))
    }).length
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Monitor stock levels, track batches, and manage inventory across branches"
      >
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Stock In
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Items"
          value={summaryStats.totalItems.toLocaleString()}
          icon={Package}
          color="bg-blue-500"
          change={`+${inventory.reduce((sum, item) => sum + item.quantity, 0)} units`}
          changeType="neutral"
        />
        <StatCard
          title="Total Value"
          value={formatCurrency(summaryStats.totalValue)}
          icon={Package}
          color="bg-green-500"
          change="+8.2%"
          changeType="positive"
        />
        <StatCard
          title="Low Stock"
          value={summaryStats.lowStockItems}
          icon={AlertTriangle}
          color="bg-yellow-500"
          change={`-${Math.max(0, summaryStats.lowStockItems - 8)}`}
          changeType="negative"
        />
        <StatCard
          title="Out of Stock"
          value={summaryStats.outOfStockItems}
          icon={TrendingDown}
          color="bg-red-500"
          change="Alert"
          changeType="negative"
        />
        <StatCard
          title="Expiring Soon"
          value={summaryStats.expiringItems}
          icon={Calendar}
          color="bg-orange-500"
          change="Check dates"
          changeType="warning"
        />
        <StatCard
          title="Expired"
          value={summaryStats.expiredItems}
          icon={AlertTriangle}
          color="bg-red-500"
          change="Remove"
          changeType="negative"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Inventory Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products, SKU, or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">Inventory Items</h2>
        <p className="text-secondary mb-6">Current stock levels across all branches with batch tracking</p>

        <DataTable
          columns={[
            {
              key: 'product',
              label: 'Product',
              render: (item: InventoryItem) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{item.product?.name || 'Unknown Product'}</span>
                  <span className="text-sm text-secondary">{item.product?.sku || 'No SKU'}</span>
                  {item.variation && (
                    <span className="text-xs text-muted">{item.variation.name}</span>
                  )}
                </div>
              )
            },
            {
              key: 'batch',
              label: 'Batch',
              render: (item: InventoryItem) => (
                item.batch ? (
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-primary">{item.batch.batchNumber}</span>
                    <span className="text-xs text-secondary">Qty: {item.batch.quantity}</span>
                  </div>
                ) : (
                  <span className="text-muted">No batch</span>
                )
              )
            },
            {
              key: 'branch',
              label: 'Branch',
              render: (item: InventoryItem) => (
                <Badge variant="outline">{item.branch || 'Unknown Branch'}</Badge>
              )
            },
            {
              key: 'stock',
              label: 'Stock Level',
              render: (item: InventoryItem) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{item.quantity ?? 0}</span>
                  <span className="text-xs text-secondary">
                    Min: {item.minStock ?? 0}
                    {item.maxStock && ` / Max: ${item.maxStock}`}
                  </span>
                </div>
              )
            },
            {
              key: 'value',
              label: 'Value',
              render: (item: InventoryItem) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{formatCurrency(item.totalValue ?? 0)}</span>
                  <span className="text-xs text-secondary">
                    {formatCurrency(item.unitCost ?? 0)} each
                  </span>
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (item: InventoryItem) => {
                const stockStatus = getStockStatus(item.quantity ?? 0, item.minStock ?? 0)
                return (
                  <StatusBadge
                    status={stockStatus.status === 'In Stock' ? 'active' :
                           stockStatus.status === 'Low Stock' ? 'warning' : 'error'}
                  >
                    <stockStatus.icon className="h-3 w-3 mr-1" />
                    {stockStatus.status}
                  </StatusBadge>
                )
              }
            },
            {
              key: 'expiry',
              label: 'Expiry',
              render: (item: InventoryItem) => {
                const expiryStatus = getExpiryStatus(item.batch?.expiryDate)
                if (expiryStatus) {
                  return (
                    <StatusBadge
                      status={expiryStatus.status.includes('Expired') ? 'error' : 'warning'}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {expiryStatus.status}
                    </StatusBadge>
                  )
                }
                return <span className="text-sm text-secondary">No expiry</span>
              }
            },
            {
              key: 'lastUpdated',
              label: 'Last Updated',
              render: (item: InventoryItem) => (
                <span className="text-sm text-secondary">
                  {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'Unknown'}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (item: InventoryItem) => (
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
          data={filteredInventory}
          empty={{
            title: "No inventory items found",
            description: "Try adjusting your filters or search terms"
          }}
        />
      </div>
    </div>
  )
}