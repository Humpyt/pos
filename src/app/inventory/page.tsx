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
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  MoreHorizontal,
  FileDown,
  FileUp,
  Printer,
  Mail
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
import { updateManager } from '@/lib/update-manager'
import { notifications } from '@/lib/notifications-simple'
import {
  EditInventoryModal,
  DeleteInventoryModal,
  ImportModal,
  ExportModal
} from '@/components/inventory/InventoryModals'

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
  const [selectedBranch, setSelectedBranch] = useState('cmgq8tx590000lras30r8autd') // Default to Branch A (Main Branch - Nairobi)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(40)

  // Export/Import state
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isModalLoading, setIsModalLoading] = useState(false)

  useEffect(() => {
    loadInventory()

    // Listen for inventory updates from both the old system and new update manager
    const handleInventoryUpdate = (event: CustomEvent) => {
      console.log('Inventory update received (old system):', event.detail)
      loadInventory(selectedBranch)
    }

    // Subscribe to new update manager events
    const unsubscribeInventory = updateManager.subscribe('inventory_updated', (event) => {
      console.log('Inventory update received (new system):', event.data)
      loadInventory(selectedBranch)
    })

    // Subscribe to sale completed events as they also affect inventory
    const unsubscribeSales = updateManager.subscribe('sale_completed', (event) => {
      console.log('Sale completed, reloading inventory:', event.data)
      loadInventory(selectedBranch)
    })

    // Keep old event listener for backward compatibility
    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener)

    // Cleanup all event listeners on unmount
    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener)
      unsubscribeInventory()
      unsubscribeSales()
    }
  }, [])

  const loadInventory = async (branchId?: string, lowStock?: boolean, page?: number) => {
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
      if (page) {
        params.append('page', page.toString())
        params.append('limit', itemsPerPage.toString())
      }

      const response = await fetch(`/api/inventory?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data = await response.json()
      if (data.success) {
        setInventory(data.data || [])
        setTotalItems(data.total || data.data?.length || 0)
      } else {
        setInventory([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error loading inventory:', error)
      setError('Failed to load inventory. Please try again.')
      setInventory([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Export functionality
  const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      params.append('branchId', selectedBranch)
      params.append('category', selectedCategory)

      const response = await fetch(`/api/inventory/export?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to export inventory')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setShowExportModal(false)
    } catch (error) {
      console.error('Error exporting inventory:', error)
      alert('Failed to export inventory. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Import functionality
  const handleImport = async (file: File) => {
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('branchId', selectedBranch)

      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        alert(`Successfully imported ${result.importedCount || 0} products`)
        setShowImportModal(false)
        loadInventory(selectedBranch)
      } else {
        throw new Error(result.error || 'Failed to import products')
      }
    } catch (error) {
      console.error('Error importing inventory:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to import products'}`)
    } finally {
      setIsImporting(false)
    }
  }

  // Pagination helpers
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedInventory = inventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadInventory(selectedBranch, false, page)
  }

  // CRUD operations
  const handleEditItem = async (item: InventoryItem & { batchNumber?: string }) => {
    setIsModalLoading(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: item.quantity,
          minStock: item.minStock,
          maxStock: item.maxStock,
          unitPrice: item.variation?.unitPrice || 0,
          batchNumber: item.batchNumber
        })
      })

      if (response.ok) {
        loadInventory(selectedBranch)
      } else {
        throw new Error('Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      throw error
    } finally {
      setIsModalLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    setIsModalLoading(true)
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadInventory(selectedBranch)
      } else {
        throw new Error('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      throw error
    } finally {
      setIsModalLoading(false)
    }
  }

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedItems.length === paginatedInventory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(paginatedInventory.map(item => item.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedItems.length} inventory items?`)) {
      return
    }

    try {
      const response = await fetch('/api/inventory/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedItems })
      })

      const result = await response.json()
      if (result.success) {
        setSelectedItems([])
        loadInventory(selectedBranch)
        notifications.success('Success', `Successfully deleted ${selectedItems.length} items`)
      } else {
        throw new Error(result.error || 'Failed to delete items')
      }
    } catch (error) {
      console.error('Error deleting items:', error)
      notifications.error('Error', 'Failed to delete items. Please try again.')
    }
  }

  const closeModal = () => {
    setShowEditModal(false)
    setShowDeleteModal(false)
    setShowImportModal(false)
    setShowExportModal(false)
    setSelectedItem(null)
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

  // Apply pagination to filtered results
  const paginatedFilteredInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => loadInventory(selectedBranch)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
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

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-primary">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Selected</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Selected</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedItems.length === paginatedInventory.length && paginatedInventory.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Batch Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {paginatedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8">
                      <EmptyState
                        icon={Package}
                        title="No inventory items found"
                        description={searchTerm || selectedCategory !== 'all' || selectedBranch !== 'all' ? 'Try adjusting your filters or search terms' : 'Inventory will appear here when products are added'}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-surface transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap w-12">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id])
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id))
                            }
                          }}
                        />
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        {item.batch?.batchNumber || 'DEFAULT'}
                      </td>
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
                          <button
                            className="p-2 bg-card border border-border rounded hover:bg-surface transition-colors"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowEditModal(true)
                            }}
                            title="Edit Item"
                          >
                            <Edit className="h-4 w-4 text-secondary" />
                          </button>
                          <button
                            className="p-2 bg-card border border-border rounded hover:bg-surface transition-colors text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedItem(item)
                              setShowDeleteModal(true)
                            }}
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Pagination Controls */}
        {!isLoading && filteredInventory.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-sm text-secondary">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Modals */}
      <EditInventoryModal
        selectedItem={selectedItem}
        showEditModal={showEditModal}
        onClose={closeModal}
        onEdit={handleEditItem}
        isLoading={isModalLoading}
      />

      <DeleteInventoryModal
        selectedItem={selectedItem}
        showDeleteModal={showDeleteModal}
        onClose={closeModal}
        onDelete={handleDeleteItem}
        isLoading={isModalLoading}
      />

      <ImportModal
        showImportModal={showImportModal}
        onClose={closeModal}
        onImport={handleImport}
        isLoading={isImporting}
      />

      <ExportModal
        showExportModal={showExportModal}
        onClose={closeModal}
        onExport={handleExport}
        isLoading={isExporting}
      />
    </div>
  )
}