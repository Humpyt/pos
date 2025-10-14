import { formatCurrency, formatDate, formatDateTime } from './utils'
import { ProductWithStock } from './product-service'

export interface HeldOrderItem {
  product: ProductWithStock
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface HeldOrder {
  id: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  items: HeldOrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod?: string
  notes?: string
  status: 'HELD' | 'RESUMED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
  resumedAt?: string
  createdBy: string
  resumedBy?: string
  branch: string
  holdDuration: number // in hours
}

export class OrderHoldManager {
  private heldOrders: HeldOrder[] = []
  private readonly DEFAULT_HOLD_DURATION = 24 // 24 hours
  private readonly MAX_HELD_ORDERS = 50

  constructor() {
    this.loadFromStorage()
    this.cleanupExpiredOrders()
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('heldOrders')
      if (saved) {
        this.heldOrders = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading held orders:', error)
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('heldOrders', JSON.stringify(this.heldOrders))
    } catch (error) {
      console.error('Error saving held orders:', error)
    }
  }

  private cleanupExpiredOrders(): void {
    const now = new Date()
    this.heldOrders = this.heldOrders.filter(order => {
      const expiresAt = new Date(order.expiresAt)
      if (expiresAt < now) {
        order.status = 'EXPIRED'
        return false
      }
      return true
    })
    this.saveToStorage()
  }

  holdOrder(
    items: HeldOrderItem[],
    customerInfo?: {
      name?: string
      phone?: string
      email?: string
    },
    options?: {
      paymentMethod?: string
      notes?: string
      holdDuration?: number
      createdBy?: string
      branch?: string
    }
  ): HeldOrder {
    // Check limit
    if (this.heldOrders.length >= this.MAX_HELD_ORDERS) {
      throw new Error(`Maximum ${this.MAX_HELD_ORDERS} orders can be held at once`)
    }

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const discountAmount = 0 // Can be extended to support discounts
    const taxAmount = 0 // Tax is currently disabled
    const totalAmount = subtotal - discountAmount + taxAmount

    const holdDuration = options?.holdDuration || this.DEFAULT_HOLD_DURATION
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (holdDuration * 60 * 60 * 1000))

    const heldOrder: HeldOrder = {
      id: this.generateOrderId(),
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
      customerEmail: customerInfo?.email,
      items: items.map(item => ({
        ...item,
        product: {
          ...item.product,
          // Don't store the full product object, just essential info
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          stock: item.product.stock,
          category: item.product.category
        } as ProductWithStock
      })),
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod: options?.paymentMethod,
      notes: options?.notes,
      status: 'HELD',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdBy: options?.createdBy || 'Unknown',
      branch: options?.branch || 'Main Store',
      holdDuration
    }

    this.heldOrders.push(heldOrder)
    this.saveToStorage()
    return heldOrder
  }

  resumeOrder(orderId: string, resumedBy: string): HeldOrder {
    const orderIndex = this.heldOrders.findIndex(order => order.id === orderId)

    if (orderIndex === -1) {
      throw new Error('Order not found')
    }

    const order = this.heldOrders[orderIndex]

    // Check if expired
    if (order.status === 'EXPIRED') {
      throw new Error('Order has expired')
    }

    if (order.status === 'RESUMED') {
      throw new Error('Order has already been resumed')
    }

    // Update order status
    order.status = 'RESUMED'
    order.resumedAt = new Date().toISOString()
    order.resumedBy = resumedBy

    // Move to end of array (most recent first)
    this.heldOrders.splice(orderIndex, 1)
    this.heldOrders.push(order)

    this.saveToStorage()
    return order
  }

  cancelOrder(orderId: string, reason?: string): HeldOrder {
    const orderIndex = this.heldOrders.findIndex(order => order.id === orderId)

    if (orderIndex === -1) {
      throw new Error('Order not found')
    }

    const order = this.heldOrders[orderIndex]

    if (order.status === 'RESUMED') {
      throw new Error('Cannot cancel a resumed order')
    }

    // Update status and add reason
    order.status = 'EXPIRED'
    if (reason) {
      order.notes = order.notes ? `${order.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`
    }

    this.saveToStorage()
    return order
  }

  getHeldOrders(status?: HeldOrder['status']): HeldOrder[] {
    this.cleanupExpiredOrders()

    if (status) {
      return this.heldOrders.filter(order => order.status === status)
    }

    return [...this.heldOrders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  getHeldOrder(orderId: string): HeldOrder | null {
    return this.heldOrders.find(order => order.id === orderId) || null
  }

  updateHeldOrder(
    orderId: string,
    updates: Partial<{
      customerName: string
      customerPhone: string
      customerEmail: string
      items: HeldOrderItem[]
      notes: string
      paymentMethod: string
      holdDuration: number
    }>
  ): HeldOrder {
    const order = this.getHeldOrder(orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    if (order.status !== 'HELD') {
      throw new Error('Can only update held orders')
    }

    // Apply updates
    Object.assign(order, updates)

    // Recalculate totals if items changed
    if (updates.items) {
      order.subtotal = updates.items.reduce((sum, item) => sum + item.totalPrice, 0)
      order.totalAmount = order.subtotal - order.discountAmount + order.taxAmount
    }

    // Update expiry time if duration changed
    if (updates.holdDuration) {
      const now = new Date()
      order.expiresAt = new Date(now.getTime() + (updates.holdDuration * 60 * 60 * 1000)).toISOString()
    }

    this.saveToStorage()
    return order
  }

  extendOrder(orderId: string, additionalHours: number): HeldOrder {
    const order = this.getHeldOrder(orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    if (order.status !== 'HELD') {
      throw new Error('Can only extend held orders')
    }

    const newExpiresAt = new Date(new Date(order.expiresAt).getTime() + (additionalHours * 60 * 60 * 1000))
    order.expiresAt = newExpiresAt.toISOString()
    order.holdDuration += additionalHours

    this.saveToStorage()
    return order
  }

  getOrdersByCustomer(customerInfo: {
    name?: string
    phone?: string
    email?: string
  }): HeldOrder[] {
    return this.heldOrders.filter(order => {
      if (customerInfo.name && order.customerName !== customerInfo.name) return false
      if (customerInfo.phone && order.customerPhone !== customerInfo.phone) return false
      if (customerInfo.email && order.customerEmail !== customerInfo.email) return false
      return true
    })
  }

  searchOrders(query: string): HeldOrder[] {
    const lowerQuery = query.toLowerCase()
    return this.heldOrders.filter(order =>
      order.id.toLowerCase().includes(lowerQuery) ||
      (order.customerName && order.customerName.toLowerCase().includes(lowerQuery)) ||
      (order.customerPhone && order.customerPhone.toLowerCase().includes(lowerQuery)) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(lowerQuery)) ||
      (order.notes && order.notes.toLowerCase().includes(lowerQuery)) ||
      order.items.some(item => item.product.name.toLowerCase().includes(lowerQuery))
    )
  }

  getStatistics(): {
    total: number
    held: number
    resumed: number
    expired: number
    totalValue: number
    averageHoldTime: number
  } {
    const now = new Date()
    const total = this.heldOrders.length
    const held = this.heldOrders.filter(o => o.status === 'HELD').length
    const resumed = this.heldOrders.filter(o => o.status === 'RESUMED').length
    const expired = this.heldOrders.filter(o => o.status === 'EXPIRED').length

    const totalValue = this.heldOrders.reduce((sum, order) => {
      if (order.status !== 'EXPIRED') {
        return sum + order.totalAmount
      }
      return sum
    }, 0)

    // Calculate average hold time for resumed orders
    const resumedOrders = this.heldOrders.filter(o => o.status === 'RESUMED')
    const averageHoldTime = resumedOrders.length > 0
      ? resumedOrders.reduce((sum, order) => {
          const created = new Date(order.createdAt)
          const resumed = new Date(order.resumedAt!)
          return sum + (resumed.getTime() - created.getTime())
        }, 0) / resumedOrders.length / (1000 * 60) // Convert to minutes
      : 0

    return {
      total,
      held,
      resumed,
      expired,
      totalValue,
      averageHoldTime
    }
  }

  // Clean up old orders (older than 7 days)
  cleanup(): void {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    this.heldOrders = this.heldOrders.filter(order => {
      const created = new Date(order.createdAt)
      return created > weekAgo
    })

    this.saveToStorage()
  }

  // Export orders to JSON
  exportOrders(): string {
    return JSON.stringify(this.heldOrders, null, 2)
  }

  // Import orders from JSON
  importOrders(jsonData: string): number {
    try {
      const orders = JSON.parse(jsonData) as HeldOrder[]
      let imported = 0

      orders.forEach(order => {
        // Validate order structure
        if (this.validateOrder(order)) {
          // Check for duplicates
          if (!this.heldOrders.find(o => o.id === order.id)) {
            this.heldOrders.push(order)
            imported++
          }
        }
      })

      this.saveToStorage()
      return imported
    } catch (error) {
      console.error('Error importing orders:', error)
      throw new Error('Invalid order data')
    }
  }

  private validateOrder(order: any): order is HeldOrder {
    return (
      typeof order === 'object' &&
      order.id &&
      typeof order.items === 'object' &&
      Array.isArray(order.items) &&
      typeof order.totalAmount === 'number' &&
      typeof order.createdAt === 'string' &&
      ['HELD', 'RESUMED', 'EXPIRED'].includes(order.status)
    )
  }

  private generateOrderId(): string {
    return `HOLD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  // Get orders expiring soon (within 2 hours)
  getOrdersExpiringSoon(): HeldOrder[] {
    const twoHoursFromNow = new Date()
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2)

    return this.heldOrders.filter(order => {
      if (order.status !== 'HELD') return false
      const expiresAt = new Date(order.expiresAt)
      return expiresAt <= twoHoursFromNow
    })
  }

  // Quick hold check - check if we can hold the current cart
  canHoldOrder(itemCount: number): boolean {
    this.cleanupExpiredOrders()
    return this.heldOrders.length < this.MAX_HELD_ORDERS
  }
}

export const orderHold = new OrderHoldManager()