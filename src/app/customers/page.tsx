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
  Clock
} from 'lucide-react'
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState, LoadingState, ActionCard } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  customerType: 'WALK_IN' | 'REGULAR' | 'WHOLESALE' | 'CORPORATE'
  isActive: boolean
  totalSales: number
  totalSpent: number
  averageOrderValue: number
  lastPurchaseDate?: string
  createdAt: string
  branch: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching customers
    setTimeout(() => {
      setCustomers([
        {
          id: '1',
          name: 'John Mukasa',
          email: 'john.mukasa@email.com',
          phone: '+2567012345678',
          address: '123 Kampala Road, Kampala',
          customerType: 'REGULAR',
          isActive: true,
          totalSales: 45,
          totalSpent: 1542050, // ~15.4M UGX
          averageOrderValue: 34268,
          lastPurchaseDate: '2024-10-04',
          createdAt: '2024-01-15',
          branch: 'Main Store'
        },
        {
          id: '2',
          name: 'Mary Nakato',
          email: 'mary.nakato@email.com',
          phone: '+2567022345679',
          address: '456 Jinja Road, Kampala',
          customerType: 'WHOLESALE',
          isActive: true,
          totalSales: 128,
          totalSpent: 8964075, // ~89.6M UGX
          averageOrderValue: 70032,
          lastPurchaseDate: '2024-10-05',
          createdAt: '2024-02-20',
          branch: 'Main Store'
        },
        {
          id: '3',
          name: 'David Okello',
          email: 'david.okello@email.com',
          phone: '+2567033345680',
          address: '789 Entebbe Road, Entebbe',
          customerType: 'REGULAR',
          isActive: true,
          totalSales: 23,
          totalSpent: 892025, // ~8.9M UGX
          averageOrderValue: 38784,
          lastPurchaseDate: '2024-10-01',
          createdAt: '2024-03-10',
          branch: 'Main Store'
        },
        {
          id: '4',
          name: 'ABC Supermarket Ltd',
          email: 'orders@abcsupermarket.co.ug',
          phone: '+2567044345681',
          address: 'Industrial Area, Kampala',
          customerType: 'CORPORATE',
          isActive: true,
          totalSales: 256,
          totalSpent: 24568000, // ~245.7M UGX
          averageOrderValue: 95969,
          lastPurchaseDate: '2024-10-03',
          createdAt: '2024-01-05',
          branch: 'Main Store'
        },
        {
          id: '5',
          name: 'Grace Namutebi',
          email: 'grace.namutebi@email.com',
          phone: '+2567055345682',
          address: '321 Masaka Road, Mbarara',
          customerType: 'REGULAR',
          isActive: false,
          totalSales: 12,
          totalSpent: 324000, // ~3.2M UGX
          averageOrderValue: 27000,
          lastPurchaseDate: '2024-08-15',
          createdAt: '2024-04-18',
          branch: 'Branch 2 - Mbarara'
        }
      ])
      setIsLoading(false)
    }, 800)
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)

    const matchesType = selectedType === 'all' || customer.customerType === selectedType

    return matchesSearch && matchesType
  })

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
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading customers...</p>
        </div>
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
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
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
          data={filteredCustomers}
          empty={{
            title: "No customers found",
            description: searchTerm || selectedType !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first customer',
            action: {
              label: "Add Customer",
              onClick: () => console.log('Add Customer clicked')
            }
          }}
        />
      </div>
    </div>
  )
}