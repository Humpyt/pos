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
import { updateManager } from '@/lib/update-manager'
import SaleDetailModal from '@/components/sales/SaleDetailModal'

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
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const loadSales = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (selectedPayment !== 'all') {
        params.append('paymentMethod', selectedPayment)
      }

      const response = await fetch(`/api/sales?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSales(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSales()
  }, [selectedStatus, selectedPayment])

  // Listen for real-time sale updates
  useEffect(() => {
    const unsubscribe = updateManager.subscribe('sale_completed', (event) => {
      console.log('Sales page: New sale received', event.data)
      // Reload sales data to include the new sale
      loadSales()
    })

    return unsubscribe
  }, [])

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus
    const matchesPayment = selectedPayment === 'all' || sale.paymentMethod === selectedPayment

    // Enhanced date filtering
    const saleDate = new Date(sale.createdAt)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let matchesDate = true
    switch (dateRange) {
      case 'today':
        matchesDate = saleDate >= today
        break
      case 'yesterday':
        matchesDate = saleDate >= yesterday && saleDate < today
        break
      case 'week':
        matchesDate = saleDate >= weekStart
        break
      case 'month':
        matchesDate = saleDate >= monthStart
        break
      case 'all':
      default:
        matchesDate = true
        break
    }

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

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setShowDetailModal(true)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (selectedPayment !== 'all') {
        params.append('paymentMethod', selectedPayment)
      }
      if (dateRange !== 'all') {
        params.append('dateRange', dateRange)
      }
      params.append('format', 'csv')

      const response = await fetch(`/api/sales/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to export sales')
      }
    } catch (error) {
      console.error('Error exporting sales:', error)
      alert('Failed to export sales. Please try again.')
    }
  }

  const handleExportSingleSale = async (sale: Sale) => {
    try {
      const response = await fetch(`/api/sales/export?format=json&saleId=${sale.id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const dataStr = JSON.stringify(result.data, null, 2)
          const blob = new Blob([dataStr], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `sale-${sale.saleNumber}-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error('Error exporting sale:', error)
      alert('Failed to export sale. Please try again.')
    }
  }

  const handlePrintReceipt = (sale: Sale) => {
    // Create a printable receipt
    const receiptContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">SALES RECEIPT</h2>
          <p style="margin: 5px 0;">${sale.branch}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Sale #:</strong> ${sale.saleNumber}</p>
          <p><strong>Date:</strong> ${formatDate(sale.createdAt)}</p>
          <p><strong>Time:</strong> ${formatDateTime(sale.createdAt)}</p>
          <p><strong>Cashier:</strong> ${sale.cashierName}</p>
        </div>

        ${sale.customerName ? `
        <div style="margin-bottom: 20px;">
          <p><strong>Customer:</strong> ${sale.customerName}</p>
          ${sale.customerPhone ? `<p><strong>Phone:</strong> ${sale.customerPhone}</p>` : ''}
        </div>
        ` : ''}

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0;">Items:</h4>
          ${sale.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>${item.productName} x ${item.quantity}</span>
              <span>${formatCurrency(item.totalPrice)}</span>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 1px solid #ccc; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Subtotal:</span>
            <span>${formatCurrency(sale.subtotal)}</span>
          </div>
          ${sale.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Discount:</span>
              <span>-${formatCurrency(sale.discountAmount)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px;">
            <span>Total:</span>
            <span>${formatCurrency(sale.totalAmount)}</span>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center;">
          <p><strong>Payment:</strong> ${getPaymentMethodDisplay(sale.paymentMethod)}</p>
          <p><strong>Status:</strong> ${getSaleStatusDisplay(sale.status)}</p>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  const handleProcessReturn = async (sale: Sale) => {
    const reason = prompt(`Please enter the reason for returning sale ${sale.saleNumber}:`)
    if (!reason) return

    const confirmRefund = confirm(
      `Are you sure you want to refund ${formatCurrency(sale.totalAmount)} for sale ${sale.saleNumber}?\n\nReason: ${reason}`
    )

    if (!confirmRefund) return

    try {
      // Create a return sale record (simplified version)
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleNumber: `RETURN-${sale.saleNumber}`,
          items: sale.items.map(item => ({
            product: { id: item.id, name: item.productName, price: item.unitPrice, stock: 999 },
            quantity: -item.quantity, // Negative quantity for returns
            unitPrice: item.unitPrice,
            totalPrice: -item.totalPrice
          })),
          subtotal: -sale.subtotal,
          discount: -sale.discountAmount,
          tax: -sale.taxAmount,
          total: -sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          customer: sale.customerName ? {
            id: 'return-customer',
            name: sale.customerName,
            customerType: sale.customerType
          } : null,
          branchId: 'default',
          notes: `RETURN: ${reason} (Original: ${sale.saleNumber})`
        })
      })

      if (response.ok) {
        alert(`Sale ${sale.saleNumber} has been refunded successfully.\nAmount: ${formatCurrency(sale.totalAmount)}\nReason: ${reason}`)
        setShowDetailModal(false)
        await loadSales()
      } else {
        throw new Error('Failed to process return')
      }
    } catch (error) {
      console.error('Error processing return:', error)
      alert('Failed to process return. Please try again.')
    }
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => window.location.href = '/pos'}>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewSale(sale)}
                    title="View sale details"
                  >
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

      {/* Sale Detail Modal */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onPrintReceipt={handlePrintReceipt}
        onExportSale={handleExportSingleSale}
        onProcessReturn={handleProcessReturn}
      />
    </div>
  )
}