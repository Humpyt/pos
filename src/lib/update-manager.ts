/**
 * Real-time Update Manager for POS System
 * Handles cross-page data synchronization when sales are completed
 */

interface UpdateEvent {
  type: 'sale_completed' | 'inventory_updated' | 'payment_processed'
  timestamp: string
  data: any
}

interface SaleData {
  saleNumber: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  branchId: string
  customerId?: string
  userId: string
  createdAt: string
}

class UpdateManager {
  private listeners: Map<string, Set<(event: UpdateEvent) => void>> = new Map()
  private static instance: UpdateManager

  private constructor() {
    // Listen for custom events from POS page
    if (typeof window !== 'undefined') {
      window.addEventListener('saleCompleted', this.handleSaleCompleted.bind(this))
    }
  }

  static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager()
    }
    return UpdateManager.instance
  }

  // Subscribe to specific update types
  subscribe(eventType: string, callback: (event: UpdateEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    this.listeners.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  // Emit update events
  emit(eventType: string, data: any): void {
    const event: UpdateEvent = {
      type: eventType as UpdateEvent['type'],
      timestamp: new Date().toISOString(),
      data
    }

    // Notify all listeners for this event type
    this.listeners.get(eventType)?.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error(`Error in update listener for ${eventType}:`, error)
      }
    })

    // Also dispatch as custom event for cross-component communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, { detail: event }))
    }
  }

  // Handle sale completion from POS
  private handleSaleCompleted(event: CustomEvent): void {
    const saleData: SaleData = event.detail

    console.log('Sale completed, triggering real-time updates:', saleData)

    // Emit multiple update events for different parts of the system
    this.emit('sale_completed', saleData)
    this.emit('inventory_updated', {
      branchId: saleData.branchId,
      items: saleData.items.map(item => ({
        productId: item.productId,
        quantitySold: item.quantity
      }))
    })
    this.emit('analytics_updated', {
      type: 'sale',
      revenue: saleData.totalAmount,
      itemCount: saleData.items.length,
      branchId: saleData.branchId,
      timestamp: saleData.createdAt
    })
    this.emit('accounting_updated', {
      type: 'sale',
      amount: saleData.totalAmount,
      paymentMethod: saleData.paymentMethod,
      branchId: saleData.branchId,
      timestamp: saleData.createdAt
    })
    this.emit('dashboard_updated', {
      type: 'sale',
      revenue: saleData.totalAmount,
      itemCount: saleData.items.reduce((sum, item) => sum + item.quantity, 0),
      branchId: saleData.branchId
    })
  }

  // Method to manually trigger updates (for testing or external API calls)
  triggerSaleUpdate(saleData: SaleData): void {
    this.handleSaleCompleted(new CustomEvent('saleCompleted', { detail: saleData }))
  }
}

export const updateManager = UpdateManager.getInstance()
export type { UpdateEvent, SaleData }