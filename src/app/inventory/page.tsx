'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  }
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
    totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.variation.unitPrice), 0)
  }

  // Get unique categories
  const categories = Array.from(new Set(inventory.map(item => item.product.category)))

  // Get unique branches
  const branches = Array.from(new Set(inventory.map(item => ({ id: item.branch.id, name: item.branch.name }))))

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inventory Management</h1>
          <p className="text-muted-foreground">Manage stock levels across all branches</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/adjustments">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Stock Adjustments
            </Button>
          </Link>
          <Link href="/inventory/transfer">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Transfer Stock
            </Button>
          </Link>
          <Link href="/inventory/batches">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Batch Management
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Across all branches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{summaryStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{summaryStats.expiringItems}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {summaryStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
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
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No inventory items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{item.product.name}</div>
                            <div className="text-sm text-muted-foreground">{item.variation.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.product.sku}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.product.category}</Badge>
                        </TableCell>
                        <TableCell>{item.branch.name}</TableCell>
                        <TableCell>
                          <div className={item.quantity <= item.minStock ? 'text-red-600 font-semibold' : ''}>
                            {item.quantity}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity <= item.minStock ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="default">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>KES {item.variation.unitPrice.toLocaleString()}</TableCell>
                        <TableCell>KES {(item.quantity * item.variation.unitPrice).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}