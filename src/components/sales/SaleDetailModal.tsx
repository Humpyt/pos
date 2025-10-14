'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Receipt,
  Download,
  Printer,
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Building2,
  MapPin,
  Mail,
  Phone,
  RotateCcw,
  X
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime, getPaymentMethodDisplay, getSaleStatusDisplay } from '@/lib/utils'

interface SaleItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Sale {
  id: string
  saleNumber: string
  customerName?: string
  customerType?: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
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

interface SaleDetailModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  onPrintReceipt?: (sale: Sale) => void
  onExportSale?: (sale: Sale) => void
  onProcessReturn?: (sale: Sale) => void
}

export default function SaleDetailModal({
  sale,
  isOpen,
  onClose,
  onPrintReceipt,
  onExportSale,
  onProcessReturn
}: SaleDetailModalProps) {
  if (!sale) return null

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
    const colors: Record<string, { bg: string; text: string }> = {
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800' },
      'REFUNDED': { bg: 'bg-gray-100', text: 'text-gray-800' }
    }
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'PAID': { bg: 'bg-green-100', text: 'text-green-800' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'PARTIAL': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'REFUNDED': { bg: 'bg-red-100', text: 'text-red-800' }
    }
    return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  }

  const statusColors = getStatusColor(sale.status)
  const paymentStatusColors = getPaymentStatusColor(sale.paymentStatus)

  const handlePrint = () => {
    if (onPrintReceipt) {
      onPrintReceipt(sale)
    } else {
      // Default print behavior
      window.print()
    }
  }

  const handleExport = () => {
    if (onExportSale) {
      onExportSale(sale)
    }
  }

  const handleReturn = () => {
    if (onProcessReturn) {
      onProcessReturn(sale)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <Receipt className="h-5 w-5" />
            <DialogTitle className="text-lg">Sale Details</DialogTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${statusColors.bg} ${statusColors.text}`}>
              {getSaleStatusDisplay(sale.status)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Sale Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-3">Sale Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary">Sale Number:</span>
                    <span className="font-medium">{sale.saleNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary">Date:</span>
                    <span className="font-medium">{formatDate(sale.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary">Time:</span>
                    <span className="font-medium">{formatDateTime(sale.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary">Cashier:</span>
                    <span className="font-medium">{sale.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary">Branch:</span>
                    <Badge variant="outline">{sale.branch}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-3">Customer Information</h3>
                {sale.customerName ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-secondary" />
                      <span className="font-medium">{sale.customerName}</span>
                      {sale.customerType && (
                        <Badge variant="outline" className="text-xs">
                          {sale.customerType}
                        </Badge>
                      )}
                    </div>
                    {sale.customerEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-secondary" />
                        <span className="text-sm">{sale.customerEmail}</span>
                      </div>
                    )}
                    {sale.customerPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-secondary" />
                        <span className="text-sm">{sale.customerPhone}</span>
                      </div>
                    )}
                    {sale.customerAddress && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-secondary" />
                        <span className="text-sm">{sale.customerAddress}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-muted">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Walk-in Customer</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-primary mb-3">Items Purchased</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-medium text-primary">Product</th>
                    <th className="px-4 py-3 font-medium text-primary text-center">Quantity</th>
                    <th className="px-4 py-3 font-medium text-primary text-right">Unit Price</th>
                    <th className="px-4 py-3 font-medium text-primary text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sale.items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-surface/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-primary">{item.productName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment and Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Payment Information */}
            <div>
              <h3 className="font-semibold text-primary mb-3">Payment Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <div className="flex items-center space-x-2">
                    {getPaymentIcon(sale.paymentMethod)}
                    <span className="font-medium">{getPaymentMethodDisplay(sale.paymentMethod)}</span>
                  </div>
                  <Badge className={`${paymentStatusColors.bg} ${paymentStatusColors.text}`}>
                    {sale.paymentStatus}
                  </Badge>
                </div>
                {sale.notes && (
                  <div className="p-3 bg-surface rounded-lg">
                    <div className="text-sm text-secondary mb-1">Notes:</div>
                    <div className="text-sm">{sale.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold text-primary mb-3">Order Summary</h3>
              <div className="space-y-2 p-4 bg-surface rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="text-sm">Discount:</span>
                    <span className="font-medium">-{formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}
                {sale.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary">Tax:</span>
                    <span className="font-medium">{formatCurrency(sale.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-primary">Total:</span>
                    <span className="font-bold text-lg text-primary">{formatCurrency(sale.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            {sale.status === 'COMPLETED' && (
              <Button variant="outline" onClick={handleReturn} className="text-orange-600 hover:text-orange-700">
                <RotateCcw className="h-4 w-4 mr-2" />
                Process Return
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}