'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import {
  StatCard,
  PageHeader,
  Card,
  EmptyState,
  LoadingState,
  ActionCard,
  StatusBadge
} from '@/components/shared/DesignSystem'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    category: string
  }
  variation: {
    id: string
    name: string
    unitPrice: number
  } | null
  branch: {
    id: string
    name: string
  }
  batch: {
    id: string
    batchNumber: string
    expiryDate: string | null
  } | null
  quantity: number
  minStock: number
  maxStock: number
  lastUpdated: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInventory()

    // Listen for inventory updates from POS transactions
    const handleInventoryUpdate = (event: CustomEvent) => {
      console.log('Inventory update received:', event.detail)

      // Reload inventory to get the latest data
      loadInventory(selectedBranch)
    }

    // Add event listener
    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener)

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener)
    }
  }, [])

  const loadInventory = async (branchId?: string, lowStock?: boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (branchId && branchId !== 'all') {
        params.append('branchId', branchId)
      }
      if (lowStock) {
        params.append('lowStock', 'true')
      }

      const response = await fetch(`/api/inventory?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data = await response.json()
      setInventory(data.success ? data.data : [])
    } catch (error) {
      console.error('Error loading inventory:', error)
      setError('Failed to load inventory. Please try again.')
      setInventory([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        // Filter locally for search term since we don't have search in inventory API yet
        const filtered = inventory.filter(item =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setInventory(filtered)
      } else {
        // Reload full inventory if search is cleared
        loadInventory(selectedBranch)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (selectedBranch !== 'all') {
      loadInventory(selectedBranch)
    }
  }, [selectedBranch])

  // Calculate summary stats
  const summaryStats = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(item => item.quantity <= item.minStock).length,
    expiringItems: 0, // TODO: Calculate based on batch expiry dates
    expiredItems: 0, // TODO: Calculate based on batch expiry dates
    totalValue: inventory.reduce((sum, item) => sum + (item.quantity * (item.variation?.unitPrice || 0)), 0)
  }

  // Get unique categories
  const categories = Array.from(new Set(inventory.map(item => item.product.category)))

  // Get unique branches
  const branches = Array.from(new Set(inventory.map(item => JSON.stringify(item.branch))))
    .map(branchStr => JSON.parse(branchStr))

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm ||
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || item.product.category === selectedCategory

    const matchesBranch = selectedBranch === 'all' || item.branch.id === selectedBranch

    return matchesSearch && matchesCategory && matchesBranch
  })

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Manage stock levels across all branches"
      >
        <div className="flex space-x-3">
          <ActionCard
            title="Stock Adjustments"
            icon={BarChart3}
            color="bg-blue-500"
            description="View stock history"
          />
          <ActionCard
            title="Transfer Stock"
            icon={Package}
            color="bg-purple-500"
            description="Move between branches"
          />
          <ActionCard
            title="Batch Management"
            icon={Plus}
            color="bg-emerald-500"
            description="Manage batches"
          />
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={summaryStats.totalItems.toLocaleString()}
          icon={Package}
          color="bg-blue-500"
          change="Across all branches"
          changeType="neutral"
        />

        <StatCard
          title="Low Stock Items"
          value={summaryStats.lowStockItems.toLocaleString()}
          icon={AlertTriangle}
          color="bg-yellow-500"
          change={summaryStats.lowStockItems > 0 ? "Needs attention" : "Well stocked"}
          changeType={summaryStats.lowStockItems > 0 ? "warning" : "positive"}
        />

        <StatCard
          title="Expiring Soon"
          value={summaryStats.expiringItems.toLocaleString()}
          icon={Calendar}
          color="bg-orange-500"
          change={summaryStats.expiringItems > 0 ? "Check expiry dates" : "No expiry concerns"}
          changeType={summaryStats.expiringItems > 0 ? "warning" : "positive"}
        />

        <StatCard
          title="Total Value"
          value={formatCurrency(summaryStats.totalValue)}
          icon={TrendingUp}
          color="bg-emerald-500"
          change="Current inventory value"
          changeType="neutral"
        />
      </div>

      {/* Search and Filter */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary mb-2">Inventory Items</h2>
          <p className="text-secondary text-sm">
            Manage stock levels, track inventory across branches, and monitor low stock alerts
          </p>
        </div>
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input rounded-lg border border-input-border focus:border-primary focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:bg-surface transition-colors"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <button className="flex items-center px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:bg-surface transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingState />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <EmptyState
                        icon={Package}
                        title="No inventory items found"
                        description={searchTerm || selectedCategory !== 'all' || selectedBranch !== 'all' ? 'Try adjusting your filters or search terms' : 'Inventory will appear here when products are added'}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{item.product.name}</span>
                          {item.variation?.name && (
                            <span className="text-sm text-secondary">{item.variation.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{item.product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-surface border border-border">
                          {item.product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{item.branch.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-medium ${item.quantity <= item.minStock ? 'text-red-600' : 'text-primary'}`}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-secondary">Min: {item.minStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={item.quantity <= item.minStock ? (item.quantity === 0 ? 'error' : 'warning') : 'success'}
                        >
                          {item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.minStock ? 'Low Stock' : 'In Stock'}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {formatCurrency(item.variation?.unitPrice || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {formatCurrency(item.quantity * (item.variation?.unitPrice || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 bg-card border border-border rounded hover:bg-surface transition-colors">
                            <Eye className="h-4 w-4 text-secondary" />
                          </button>
                          <button className="p-2 bg-card border border-border rounded hover:bg-surface transition-colors">
                            <Edit className="h-4 w-4 text-secondary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}