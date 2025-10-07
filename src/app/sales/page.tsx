'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Building2
} from 'lucide-react'
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState, LoadingState } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodDisplay, getSaleStatusDisplay } from '@/lib/utils'

interface Sale {
  id: string
  saleNumber: string
  customerName?: string
  customerType?: string
  items: SaleItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  branch: string
  cashierName: string
  createdAt: string
  notes?: string
}

interface SaleItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState('all')
  const [dateRange, setDateRange] = useState('today')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching sales data
    setTimeout(() => {
      setSales([
        {
          id: '1',
          saleNumber: 'SALE-20241005-001',
          customerName: 'John Kamau',
          customerType: 'REGULAR',
          items: [
            {
              id: '1-1',
              productName: 'Coca-Cola 1L',
              quantity: 2,
              unitPrice: 150,
              totalPrice: 300
            },
            {
              id: '1-2',
              productName: 'Fanta Orange 1L',
              quantity: 1,
              unitPrice: 140,
              totalPrice: 140
            }
          ],
          subtotal: 440,
          taxAmount: 70.40,
          discountAmount: 0,
          totalAmount: 510.40,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          branch: 'Main Store',
          cashierName: 'Admin User',
          createdAt: '2024-10-05T09:15:00Z',
          notes: 'Customer requested carrier bag'
        },
        {
          id: '2',
          saleNumber: 'SALE-20241005-002',
          customerName: 'Mary Wanjiku',
          customerType: 'WHOLESALE',
          items: [
            {
              id: '2-1',
              productName: 'Coca-Cola 500ml',
              quantity: 24,
              unitPrice: 80,
              totalPrice: 1920
            },
            {
              id: '2-2',
              productName: 'Aquafina Water 1L',
              quantity: 12,
              unitPrice: 80,
              totalPrice: 960
            }
          ],
          subtotal: 2880,
          taxAmount: 460.80,
          discountAmount: 288, // 10% discount
          totalAmount: 3052.80,
          paymentMethod: 'MOBILE_MONEY',
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          branch: 'Main Store',
          cashierName: 'Admin User',
          createdAt: '2024-10-05T10:30:00Z'
        },
        {
          id: '3',
          saleNumber: 'SALE-20241005-003',
          customerName: 'ABC Supermarket Ltd',
          customerType: 'CORPORATE',
          items: [
            {
              id: '3-1',
              productName: 'Mountain Dew Extreme 500ml',
              quantity: 48,
              unitPrice: 120,
              totalPrice: 5760
            },
            {
              id: '3-2',
              productName: 'Fresh Apple Juice 1L',
              quantity: 24,
              unitPrice: 160,
              totalPrice: 3840
            }
          ],
          subtotal: 9600,
          taxAmount: 1536,
          discountAmount: 960, // 10% discount
          totalAmount: 10176,
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
          status: 'PENDING',
          branch: 'Main Store',
          cashierName: 'Admin User',
          createdAt: '2024-10-05T11:45:00Z',
          notes: 'Payment expected in 2-3 business days'
        },
        {
          id: '4',
          saleNumber: 'SALE-20241004-015',
          customerName: 'David Ochieng',
          customerType: 'REGULAR',
          items: [
            {
              id: '4-1',
              productName: 'Fanta Orange 1L',
              quantity: 1,
              unitPrice: 140,
              totalPrice: 140
            }
          ],
          subtotal: 140,
          taxAmount: 22.40,
          discountAmount: 0,
          totalAmount: 162.40,
          paymentMethod: 'CARD',
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          branch: 'Main Store',
          cashierName: 'Admin User',
          createdAt: '2024-10-04T16:20:00Z'
        },
        {
          id: '5',
          saleNumber: 'SALE-20241004-014',
          items: [
            {
              id: '5-1',
              productName: 'Aquafina Water 1L',
              quantity: 2,
              unitPrice: 80,
              totalPrice: 160
            }
          ],
          subtotal: 160,
          taxAmount: 25.60,
          discountAmount: 0,
          totalAmount: 185.60,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          branch: 'Main Store',
          cashierName: 'Admin User',
          createdAt: '2024-10-04T14:30:00Z'
        }
      ])
      setIsLoading(false)
    }, 800)
  }, [])

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus
    const matchesPayment = selectedPayment === 'all' || sale.paymentMethod === selectedPayment

    // Simple date filtering for demo
    const saleDate = new Date(sale.createdAt).toDateString()
    const today = new Date().toDateString()
    const matchesDate = dateRange === 'today' ? saleDate === today : true

    return matchesSearch && matchesStatus && matchesPayment && matchesDate
  })

  const getPaymentIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      'CASH': <DollarSign className="h-4 w-4" />,
      'CARD': <CreditCard className="h-4 w-4" />,
      'MOBILE_MONEY': <Smartphone className="h-4 w-4" />,
      'BANK_TRANSFER': <Building2 className="h-4 w-4" />
    }
    return icons[method] || <DollarSign className="h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'COMPLETED': 'text-green-600',
      'PENDING': 'text-yellow-600',
      'CANCELLED': 'text-red-600',
      'REFUNDED': 'text-gray-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PAID': 'text-green-600',
      'PENDING': 'text-yellow-600',
      'PARTIAL': 'text-orange-600',
      'REFUNDED': 'text-red-600',
      'CANCELLED': 'text-gray-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const summaryStats = {
    totalSales: sales.filter(s => s.status === 'COMPLETED').length,
    totalRevenue: sales.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + s.totalAmount, 0),
    pendingSales: sales.filter(s => s.status === 'PENDING').length,
    pendingRevenue: sales.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.totalAmount, 0),
    averageOrderValue: sales.length > 0 ? sales.reduce((sum, s) => sum + s.totalAmount, 0) / sales.length : 0,
    totalItems: sales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Sales History"
        subtitle="View and manage all sales transactions"
      >
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Receipt className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Sales"
          value={summaryStats.totalSales}
          icon={ShoppingBag}
          color="bg-blue-500"
          change="+15.3%"
          changeType="positive"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(summaryStats.totalRevenue)}
          icon={TrendingUp}
          color="bg-green-500"
          change="+22.1%"
          changeType="positive"
        />
        <StatCard
          title="Pending"
          value={summaryStats.pendingSales}
          icon={Calendar}
          color="bg-yellow-500"
          change="Awaiting"
          changeType="warning"
        />
        <StatCard
          title="Pending Revenue"
          value={formatCurrency(summaryStats.pendingRevenue)}
          icon={TrendingDown}
          color="bg-orange-500"
          change="Collect"
          changeType="warning"
        />
        <StatCard
          title="Avg Order"
          value={formatCurrency(summaryStats.averageOrderValue)}
          icon={DollarSign}
          color="bg-blue-500"
          change="+8.7%"
          changeType="positive"
        />
        <StatCard
          title="Items Sold"
          value={summaryStats.totalItems}
          icon={ShoppingBag}
          color="bg-purple-500"
          change="+124"
          changeType="positive"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Sales Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by sale number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-card"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
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

      {/* Sales Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">Sales Transactions</h2>
        <p className="text-secondary mb-6">Complete history of all sales transactions with detailed information</p>

        <DataTable
          columns={[
            {
              key: 'saleNumber',
              label: 'Sale #',
              render: (sale: Sale) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{sale.saleNumber}</span>
                  <span className="text-xs text-secondary">By {sale.cashierName}</span>
                </div>
              )
            },
            {
              key: 'dateTime',
              label: 'Date & Time',
              render: (sale: Sale) => (
                <div className="flex flex-col">
                  <span className="text-sm text-primary">{formatDate(sale.createdAt)}</span>
                  <span className="text-xs text-secondary">{formatDateTime(sale.createdAt)}</span>
                </div>
              )
            },
            {
              key: 'customer',
              label: 'Customer',
              render: (sale: Sale) => (
                sale.customerName ? (
                  <div className="flex flex-col">
                    <span className="font-medium text-primary">{sale.customerName}</span>
                    {sale.customerType && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {sale.customerType}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted">Walk-in</span>
                )
              )
            },
            {
              key: 'items',
              label: 'Items',
              render: (sale: Sale) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{sale.items.length} items</span>
                  <span className="text-xs text-secondary">
                    {sale.items.reduce((sum, item) => sum + item.quantity, 0)} units
                  </span>
                </div>
              )
            },
            {
              key: 'total',
              label: 'Total',
              render: (sale: Sale) => (
                <div className="flex flex-col">
                  <span className="font-bold text-primary">{formatCurrency(sale.totalAmount)}</span>
                  {sale.discountAmount > 0 && (
                    <span className="text-xs text-emerald-600">
                      -{formatCurrency(sale.discountAmount)} discount
                    </span>
                  )}
                </div>
              )
            },
            {
              key: 'payment',
              label: 'Payment',
              render: (sale: Sale) => (
                <div className="flex items-center space-x-2">
                  {getPaymentIcon(sale.paymentMethod)}
                  <div className="flex flex-col">
                    <span className="text-sm text-primary">{getPaymentMethodDisplay(sale.paymentMethod)}</span>
                    <span className={`text-xs font-medium ${getPaymentStatusColor(sale.paymentStatus)}`}>
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (sale: Sale) => (
                <StatusBadge
                  status={sale.status === 'COMPLETED' ? 'success' :
                         sale.status === 'PENDING' ? 'warning' : 'error'}
                >
                  {getSaleStatusDisplay(sale.status)}
                </StatusBadge>
              )
            },
            {
              key: 'branch',
              label: 'Branch',
              render: (sale: Sale) => (
                <Badge variant="outline">{sale.branch}</Badge>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (sale: Sale) => (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
          data={filteredSales}
          empty={{
            title: "No sales found",
            description: "Try adjusting your filters or search terms"
          }}
        />
      </div>
    </div>
  )
}