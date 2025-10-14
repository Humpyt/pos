import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number, currency = 'UGX'): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format date
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj)
}

// Format date and time
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Generate unique sale number
export function generateSaleNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SALE-${timestamp}-${random}`
}

// Calculate tax
export function calculateTax(amount: number, taxRate = 0.16): number {
  return amount * taxRate
}

// Calculate discount
export function calculateDiscount(amount: number, discountPercent: number): number {
  return (amount * discountPercent) / 100
}

// Generate SKU
export function generateSKU(category: string, productName: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase()
  const productCode = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()
  const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase()
  return `${categoryCode}-${productCode}-${timestamp}`
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number (Uganda)
export function isValidUgandanPhone(phone: string): boolean {
  const phoneRegex = /^(?:\+256|0)?[7]\d{8}$/
  return phoneRegex.test(phone)
}

// Format phone number
export function formatUgandanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+256${cleaned.substring(1)}`
  } else if (cleaned.length === 9) {
    return `+256${cleaned}`
  }
  return phone
}

// Calculate days until expiry
export function daysUntilExpiry(expiryDate: Date): number {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Check if product is expiring soon (within 30 days)
export function isExpiringSoon(expiryDate: Date): boolean {
  return daysUntilExpiry(expiryDate) <= 30 && daysUntilExpiry(expiryDate) > 0
}

// Check if product is expired
export function isExpired(expiryDate: Date): boolean {
  return daysUntilExpiry(expiryDate) <= 0
}

// Generate color based on stock level
export function getStockColor(quantity: number, minStock: number): string {
  if (quantity === 0) return 'text-red-600'
  if (quantity <= minStock) return 'text-yellow-600'
  return 'text-green-600'
}

// Parse CSV data
export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: any = {}

    headers.forEach((header, index) => {
      const value = values[index] || ''
      // Try to parse as number (remove commas first)
      const cleanValue = value.replace(/,/g, '')
      const numValue = parseFloat(cleanValue)
      obj[header] = isNaN(numValue) ? value : numValue
    })

    return obj as T
  })
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Calculate profit margin
export function calculateProfitMargin(sellingPrice: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return ((sellingPrice - costPrice) / costPrice) * 100
}

// Get payment method display name
export function getPaymentMethodDisplay(method: string): string {
  const methods: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    MOBILE_MONEY: 'Mobile Money',
    BANK_TRANSFER: 'Bank Transfer',
    CREDIT: 'Credit',
  }
  return methods[method] || method
}

// Get sale status display name
export function getSaleStatusDisplay(status: string): string {
  const statuses: Record<string, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
  }
  return statuses[status] || status
}

// Get customer type display name
export function getCustomerTypeDisplay(type: string): string {
  const types: Record<string, string> = {
    WALK_IN: 'Walk-in Customer',
    REGULAR: 'Regular Customer',
    WHOLESALE: 'Wholesale',
    CORPORATE: 'Corporate',
  }
  return types[type] || type
}