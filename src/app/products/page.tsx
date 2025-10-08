'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle
} from 'lucide-react'
import { PageHeader, DataTable, StatusBadge, EmptyState, LoadingState, ActionCard, StatCard } from '@/components/shared/DesignSystem'
import { formatCurrency } from '@/lib/utils'
import { ProductWithStock } from '@/lib/product-service'

// Use ProductWithStock from product-service instead of local interface

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async (searchQuery?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
      } else {
        throw new Error(result.error || 'Failed to load products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products. Please try again.')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredProducts = products // Already filtered by API

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { status: 'Out of Stock', variant: 'destructive' as const }
    if (stock <= minStock) return { status: 'Low Stock', variant: 'warning' as const }
    return { status: 'In Stock', variant: 'success' as const }
  }

  const getProfitMargin = (price: number, cost: number): string => {
    if (cost === 0) return "0.0"
    return ((price - cost) / cost * 100).toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingState />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <EmptyState
          icon={AlertTriangle}
          title="Error Loading Products"
          description={error}
          action={{
            label: "Try Again",
            onClick: () => loadProducts()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and inventory"
      >
        <div className="flex space-x-3">
          <ActionCard
            title="Export"
            icon={Download}
            color="bg-gray-500"
            description="Download product data"
          />
          <ActionCard
            title="Add Product"
            icon={Plus}
            color="bg-emerald-500"
            description="Create new product"
          />
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={products.length.toLocaleString()}
          icon={Package}
          color="bg-blue-500"
          change="+2 from last month"
          changeType="neutral"
        />

        <StatCard
          title="Low Stock Items"
          value={products.filter(p => p.stock <= p.minStock && p.stock > 0).length.toLocaleString()}
          icon={AlertTriangle}
          color="bg-yellow-500"
          change="Needs attention"
          changeType="warning"
        />

        <StatCard
          title="Out of Stock"
          value={products.filter(p => p.stock === 0).length.toLocaleString()}
          icon={AlertTriangle}
          color="bg-red-500"
          change="Cannot sell"
          changeType="negative"
        />

        <StatCard
          title="Total Value"
          value={formatCurrency(products.reduce((acc, p) => acc + (p.stock * p.price), 0))}
          icon={Package}
          color="bg-emerald-500"
          change="Current inventory value"
          changeType="neutral"
        />
      </div>

      {/* Search and Filter */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-primary mb-2">Product Catalog</h2>
          <p className="text-secondary text-sm">
            Manage your products, track inventory, and update pricing
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
          <button className="flex items-center px-4 py-2 bg-card border border-border rounded-lg hover:border-primary hover:bg-surface transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

          {/* Products Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.minStock)
                  const profitMargin = getProfitMargin(product.price, product.cost)

                  return (
                    <tr key={product.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{product.name}</span>
                          <span className="text-sm text-secondary">{product.sku}</span>
                          {product.barcode && (
                            <span className="text-xs text-muted">{product.barcode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-surface border border-border">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">{formatCurrency(product.cost)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${
                          parseFloat(profitMargin) >= 20 ? 'text-emerald-600' :
                          parseFloat(profitMargin) >= 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {profitMargin}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{product.stock}</span>
                          <span className="text-xs text-secondary">Min: {product.minStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={
                            stockStatus.variant === 'destructive' ? 'error' :
                            stockStatus.variant === 'warning' ? 'warning' : 'success'
                          }
                        >
                          {stockStatus.status}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 bg-card border border-border rounded hover:bg-surface transition-colors">
                            <Eye className="h-4 w-4 text-secondary" />
                          </button>
                          <button className="p-2 bg-card border border-border rounded hover:bg-surface transition-colors">
                            <Edit className="h-4 w-4 text-secondary" />
                          </button>
                          <button className="p-2 bg-card border border-border rounded hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
          <EmptyState
            icon={Package}
            title="No products found"
            description={searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
            action={
              !searchTerm ? {
                label: "Add Product",
                onClick: () => console.log('Add Product clicked')
              } : undefined
            }
          />
        )}
      </div>
    </div>
  )
}