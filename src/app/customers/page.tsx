'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Users,
  ShoppingBag,
  Star,
  TrendingUp,
  Award,
  Clock,
  RefreshCw
} from 'lucide-react'
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState, LoadingState, ActionCard } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notifications } from '@/lib/notifications-simple'
import CustomerModals, { Customer } from '@/components/customers/CustomerModals'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Load customers from API
  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }

      const response = await fetch(`/api/customers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const result = await response.json()
      if (result.success) {
        setCustomers(result.data)
      } else {
        throw new Error(result.error || 'Failed to load customers')
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setError('Failed to load customers. Please try again.')
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [searchTerm, selectedType])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadCustomers()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // CRUD operations
  const handleAddCustomer = async (data: any) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (result.success) {
        notifications.success('Success', 'Customer created successfully')
        await loadCustomers()
      } else {
        throw new Error(result.error || 'Failed to create customer')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      notifications.error('Error', error instanceof Error ? error.message : 'Failed to create customer')
      throw error
    }
  }

  const handleEditCustomer = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (result.success) {
        notifications.success('Success', 'Customer updated successfully')
        await loadCustomers()
      } else {
        throw new Error(result.error || 'Failed to update customer')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      notifications.error('Error', error instanceof Error ? error.message : 'Failed to update customer')
      throw error
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        notifications.success('Success', 'Customer deleted successfully')
        await loadCustomers()
      } else {
        throw new Error(result.error || 'Failed to delete customer')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      notifications.error('Error', error instanceof Error ? error.message : 'Failed to delete customer')
      throw error
    }
  }

  // Modal handlers
  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowEditModal(true)
  }

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDeleteModal(true)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowDeleteModal(false)
    setSelectedCustomer(null)
  }

  // Export functionality
  const handleExport = async () => {
    try {
      const response = await fetch('/api/customers/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        notifications.success('Success', 'Customers exported successfully')
      } else {
        throw new Error('Failed to export customers')
      }
    } catch (error) {
      console.error('Error exporting customers:', error)
      notifications.error('Error', 'Failed to export customers')
    }
  }

  const getCustomerTypeDisplay = (type: string) => {
    const types: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'WALK_IN': { label: 'Walk-in', variant: 'outline' },
      'REGULAR': { label: 'Regular', variant: 'default' },
      'WHOLESALE': { label: 'Wholesale', variant: 'secondary' },
      'CORPORATE': { label: 'Corporate', variant: 'destructive' }
    }
    return types[type] || { label: type, variant: 'outline' }
  }

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 200000000) return { tier: 'Platinum', color: 'text-purple-600', icon: '💎' }
    if (totalSpent >= 100000000) return { tier: 'Gold', color: 'text-yellow-600', icon: '🏆' }
    if (totalSpent >= 50000000) return { tier: 'Silver', color: 'text-gray-600', icon: '🥈' }
    if (totalSpent >= 10000000) return { tier: 'Bronze', color: 'text-orange-600', icon: '🥉' }
    return { tier: 'Regular', color: 'text-blue-600', icon: '⭐' }
  }

  const summaryStats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.isActive).length,
    corporateCustomers: customers.filter(c => c.customerType === 'CORPORATE').length,
    wholesaleCustomers: customers.filter(c => c.customerType === 'WHOLESALE').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    averageCustomerValue: customers.length > 0 ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0
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
          icon={Users}
          title="Error Loading Customers"
          description={error}
          action={{
            label: "Try Again",
            onClick: loadCustomers
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Customer Management"
        subtitle="Manage customer relationships and track purchasing patterns"
      >
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Customers"
          value={summaryStats.totalCustomers}
          icon={Users}
          color="bg-blue-500"
          change="+12.5%"
          changeType="positive"
        />
        <StatCard
          title="Active"
          value={summaryStats.activeCustomers}
          icon={User}
          color="bg-green-500"
          change="+3 this week"
          changeType="positive"
        />
        <StatCard
          title="Corporate"
          value={summaryStats.corporateCustomers}
          icon={ShoppingBag}
          color="bg-blue-500"
          change="+2 new"
          changeType="positive"
        />
        <StatCard
          title="Wholesale"
          value={summaryStats.wholesaleCustomers}
          icon={ShoppingBag}
          color="bg-purple-500"
          change="+1 new"
          changeType="positive"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summaryStats.totalRevenue)}
          icon={Star}
          color="bg-yellow-500"
          change="+18.2%"
          changeType="positive"
        />
        <StatCard
          title="Avg Value"
          value={formatCurrency(summaryStats.averageCustomerValue)}
          icon={Star}
          color="bg-emerald-500"
          change="+8.4%"
          changeType="positive"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Customer Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Customer Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Types</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="REGULAR">Regular</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="CORPORATE">Corporate</option>
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

      {/* Customers Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">Customer Directory</h2>
        <p className="text-secondary mb-6">Complete customer database with purchase history and analytics</p>

        <DataTable
          columns={[
            {
              key: 'customer',
              label: 'Customer',
              render: (customer: Customer) => {
                const tier = getCustomerTier(customer.totalSpent)
                return (
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-primary">{customer.name}</span>
                      <span className="text-lg">{tier.icon}</span>
                    </div>
                    <span className={`text-xs font-medium ${tier.color}`}>{tier.tier}</span>
                    <span className="text-xs text-muted">Since {formatDate(customer.createdAt)}</span>
                  </div>
                )
              }
            },
            {
              key: 'contact',
              label: 'Contact',
              render: (customer: Customer) => (
                <div className="space-y-1">
                  {customer.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-1 text-gray-400" />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-3 w-3 mr-1 text-gray-400" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                      {customer.address}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'type',
              label: 'Type',
              render: (customer: Customer) => {
                const typeDisplay = getCustomerTypeDisplay(customer.customerType)
                return (
                  <Badge variant={typeDisplay.variant}>
                    {typeDisplay.label}
                  </Badge>
                )
              }
            },
            {
              key: 'purchases',
              label: 'Purchases',
              render: (customer: Customer) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{customer.totalSales}</span>
                  {customer.lastPurchaseDate && (
                    <span className="text-xs text-secondary">
                      Last: {formatDate(customer.lastPurchaseDate)}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'totalSpent',
              label: 'Total Spent',
              render: (customer: Customer) => (
                <span className="font-medium text-primary">{formatCurrency(customer.totalSpent)}</span>
              )
            },
            {
              key: 'avgOrder',
              label: 'Avg Order',
              render: (customer: Customer) => (
                <span className="font-medium text-primary">{formatCurrency(customer.averageOrderValue)}</span>
              )
            },
            {
              key: 'branch',
              label: 'Branch',
              render: (customer: Customer) => (
                <Badge variant="outline">{customer.branch}</Badge>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (customer: Customer) => (
                <StatusBadge status={customer.isActive ? 'active' : 'inactive'}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </StatusBadge>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (customer: Customer) => (
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => openDeleteModal(customer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
          data={customers}
          empty={{
            title: "No customers found",
            description: searchTerm || selectedType !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first customer',
            action: {
              label: "Add Customer",
              onClick: () => setShowAddModal(true)
            }
          }}
        />
      </div>

      {/* Customer Modals */}
      <CustomerModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        selectedCustomer={selectedCustomer}
        isLoading={modalLoading}
        onClose={closeModals}
        onAdd={handleAddCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />
    </div>
  )
}