import { prisma } from '@/lib/prisma'
import { ProductWithStock } from './product-service'
import { Sale } from '@prisma/client'

export interface OfflineProduct extends ProductWithStock {
  cachedAt: string
  isDirty: boolean
}

export interface OfflineSale {
  id: string
  saleNumber: string
  customerId?: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    batchId?: string
    variationId?: string
  }>
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  branchId: string
  branchName: string
  cashierName: string
  notes?: string
  createdAt: string
  updatedAt: string
  synced: boolean
  syncAttempts: number
  lastSyncAttempt?: string
  syncError?: string
}

export interface OfflineInventoryChange {
  id: string
  productId: string
  variationId?: string
  batchId?: string
  branchId: string
  quantityChange: number
  reason: 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER'
  reference?: string
  createdAt: string
  synced: boolean
  syncAttempts: number
}

export interface SyncStatus {
  isOnline: boolean
  lastOnlineTime: string
  pendingSales: number
  pendingInventoryChanges: number
  lastSyncTime?: string
  syncInProgress: boolean
  syncError?: string
}

export class OfflineManager {
  private readonly STORAGE_KEYS = {
    PRODUCTS: 'offline_products',
    SALES: 'offline_sales',
    INVENTORY_CHANGES: 'offline_inventory_changes',
    SYNC_STATUS: 'offline_sync_status',
    CACHE_VERSION: 'offline_cache_version'
  }

  private readonly CACHE_VERSION = '1.0.0'
  private readonly MAX_SYNC_ATTEMPTS = 5
  private readonly RETRY_DELAY_MS = 5000 // 5 seconds
  private readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

  private isOnline: boolean = true
  private syncInProgress: boolean = false
  private syncTimer: NodeJS.Timeout | null = null

  constructor() {
    this.initializeConnectionMonitoring()
    this.loadSyncStatus()
    this.startPeriodicSync()
  }

  private initializeConnectionMonitoring(): void {
    // Monitor online/offline status
    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      this.isOnline = true
      this.updateSyncStatus({ isOnline: true })
      this.triggerSync()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.updateSyncStatus({ isOnline: false, lastOnlineTime: new Date().toISOString() })
    })

    // Periodic connection check
    setInterval(() => {
      this.checkConnection()
    }, 30000) // Check every 30 seconds
  }

  private async checkConnection(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000
      })

      const wasOnline = this.isOnline
      this.isOnline = response.ok

      if (!wasOnline && this.isOnline) {
        this.triggerSync()
      }

      this.updateSyncStatus({ isOnline: this.isOnline })
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false
        this.updateSyncStatus({
          isOnline: false,
          lastOnlineTime: new Date().toISOString()
        })
      }
    }
  }

  private loadSyncStatus(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS)
      if (saved) {
        const status = JSON.parse(saved)
        this.isOnline = status.isOnline ?? navigator.onLine
      }
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    try {
      const currentStatus = this.getSyncStatus()
      const newStatus = { ...currentStatus, ...updates }

      localStorage.setItem(this.STORAGE_KEYS.SYNC_STATUS, JSON.stringify(newStatus))

      // Trigger storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.STORAGE_KEYS.SYNC_STATUS,
        newValue: JSON.stringify(newStatus)
      }))
    } catch (error) {
      console.error('Error updating sync status:', error)
    }
  }

  private startPeriodicSync(): void {
    // Sync every 2 minutes when online
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.triggerSync()
      }
    }, 2 * 60 * 1000)
  }

  // Product Caching
  async cacheProducts(branchId: string): Promise<void> {
    try {
      if (!this.isOnline) return

      const response = await fetch(`/api/products?branchId=${branchId}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const products: ProductWithStock[] = await response.json()

      const offlineProducts: OfflineProduct[] = products.map(product => ({
        ...product,
        cachedAt: new Date().toISOString(),
        isDirty: false
      }))

      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(offlineProducts))
      localStorage.setItem(this.STORAGE_KEYS.CACHE_VERSION, this.CACHE_VERSION)

      console.log(`Cached ${products.length} products for offline use`)
    } catch (error) {
      console.error('Error caching products:', error)
    }
  }

  getCachedProducts(): OfflineProduct[] {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS)
      const version = localStorage.getItem(this.STORAGE_KEYS.CACHE_VERSION)

      if (!cached || version !== this.CACHE_VERSION) {
        return []
      }

      const products: OfflineProduct[] = JSON.parse(cached)
      const now = new Date()

      // Filter expired cache
      return products.filter(product => {
        const cachedAt = new Date(product.cachedAt)
        return now.getTime() - cachedAt.getTime() < this.CACHE_EXPIRY_MS
      })
    } catch (error) {
      console.error('Error loading cached products:', error)
      return []
    }
  }

  searchCachedProducts(query: string, branchId?: string): OfflineProduct[] {
    const products = this.getCachedProducts()
    const lowerQuery = query.toLowerCase()

    return products.filter(product => {
      if (branchId && product.stock.branchId !== branchId) return false

      return (
        product.name.toLowerCase().includes(lowerQuery) ||
        product.sku?.toLowerCase().includes(lowerQuery) ||
        product.barcode?.includes(lowerQuery) ||
        product.category?.toLowerCase().includes(lowerQuery)
      )
    })
  }

  // Offline Sales
  saveOfflineSale(saleData: Omit<OfflineSale, 'id' | 'synced' | 'syncAttempts' | 'createdAt'>): OfflineSale {
    const sale: OfflineSale = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...saleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
      syncAttempts: 0
    }

    try {
      const existingSales = this.getOfflineSales()
      existingSales.push(sale)

      localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(existingSales))
      this.updateSyncStatus({
        pendingSales: existingSales.filter(s => !s.synced).length
      })

      console.log('Saved offline sale:', sale.saleNumber)
    } catch (error) {
      console.error('Error saving offline sale:', error)
      throw new Error('Failed to save offline sale')
    }

    return sale
  }

  getOfflineSales(): OfflineSale[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.SALES)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading offline sales:', error)
      return []
    }
  }

  getPendingSales(): OfflineSale[] {
    return this.getOfflineSales().filter(sale => !sale.synced)
  }

  // Offline Inventory Changes
  saveInventoryChange(changeData: Omit<OfflineInventoryChange, 'id' | 'synced' | 'syncAttempts' | 'createdAt'>): OfflineInventoryChange {
    const change: OfflineInventoryChange = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...changeData,
      createdAt: new Date().toISOString(),
      synced: false,
      syncAttempts: 0
    }

    try {
      const existingChanges = this.getInventoryChanges()
      existingChanges.push(change)

      localStorage.setItem(this.STORAGE_KEYS.INVENTORY_CHANGES, JSON.stringify(existingChanges))
      this.updateSyncStatus({
        pendingInventoryChanges: existingChanges.filter(c => !c.synced).length
      })
    } catch (error) {
      console.error('Error saving inventory change:', error)
      throw new Error('Failed to save inventory change')
    }

    return change
  }

  getInventoryChanges(): OfflineInventoryChange[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.INVENTORY_CHANGES)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading inventory changes:', error)
      return []
    }
  }

  getPendingInventoryChanges(): OfflineInventoryChange[] {
    return this.getInventoryChanges().filter(change => !change.synced)
  }

  // Sync Functionality
  async triggerSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return

    this.syncInProgress = true
    this.updateSyncStatus({ syncInProgress: true })

    try {
      // Sync sales first
      await this.syncSales()

      // Then sync inventory changes
      await this.syncInventoryChanges()

      this.updateSyncStatus({
        lastSyncTime: new Date().toISOString(),
        syncError: undefined
      })

      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
      this.updateSyncStatus({
        syncError: error instanceof Error ? error.message : 'Sync failed'
      })
    } finally {
      this.syncInProgress = false
      this.updateSyncStatus({ syncInProgress: false })
    }
  }

  private async syncSales(): Promise<void> {
    const pendingSales = this.getPendingSales()

    for (const sale of pendingSales) {
      if (sale.syncAttempts >= this.MAX_SYNC_ATTEMPTS) {
        console.warn(`Skipping sale ${sale.saleNumber} - max sync attempts reached`)
        continue
      }

      try {
        sale.syncAttempts++
        sale.lastSyncAttempt = new Date().toISOString()

        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Convert offline sale to API format
            customerId: sale.customerId,
            items: sale.items,
            subtotal: sale.subtotal,
            discountAmount: sale.discountAmount,
            taxAmount: sale.taxAmount,
            totalAmount: sale.totalAmount,
            paymentMethod: sale.paymentMethod,
            paymentStatus: sale.paymentStatus,
            branchId: sale.branchId,
            notes: sale.notes,
            // Include offline metadata
            offlineId: sale.id,
            createdAt: sale.createdAt
          })
        })

        if (response.ok) {
          // Mark as synced
          sale.synced = true
          sale.syncError = undefined
          console.log(`Synced sale: ${sale.saleNumber}`)
        } else {
          const errorText = await response.text()
          sale.syncError = errorText
          console.error(`Failed to sync sale ${sale.saleNumber}:`, errorText)
        }
      } catch (error) {
        sale.syncError = error instanceof Error ? error.message : 'Network error'
        console.error(`Error syncing sale ${sale.saleNumber}:`, error)
      }

      // Update stored sale
      this.updateOfflineSale(sale)

      // Small delay between syncs to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Update pending count
    const remainingPending = this.getPendingSales().length
    this.updateSyncStatus({ pendingSales: remainingPending })
  }

  private async syncInventoryChanges(): Promise<void> {
    const pendingChanges = this.getPendingInventoryChanges()

    for (const change of pendingChanges) {
      if (change.syncAttempts >= this.MAX_SYNC_ATTEMPTS) {
        console.warn(`Skipping inventory change ${change.id} - max sync attempts reached`)
        continue
      }

      try {
        change.syncAttempts++
        change.lastSyncAttempt = new Date().toISOString()

        const response = await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: change.productId,
            variationId: change.variationId,
            batchId: change.batchId,
            branchId: change.branchId,
            quantityChange: change.quantityChange,
            reason: change.reason,
            reference: change.reference,
            offlineId: change.id
          })
        })

        if (response.ok) {
          // Mark as synced
          change.synced = true
          change.syncError = undefined
          console.log(`Synced inventory change: ${change.id}`)
        } else {
          const errorText = await response.text()
          change.syncError = errorText
          console.error(`Failed to sync inventory change ${change.id}:`, errorText)
        }
      } catch (error) {
        change.syncError = error instanceof Error ? error.message : 'Network error'
        console.error(`Error syncing inventory change ${change.id}:`, error)
      }

      // Update stored change
      this.updateInventoryChange(change)

      // Small delay between syncs
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Update pending count
    const remainingPending = this.getPendingInventoryChanges().length
    this.updateSyncStatus({ pendingInventoryChanges: remainingPending })
  }

  private updateOfflineSale(updatedSale: OfflineSale): void {
    try {
      const sales = this.getOfflineSales()
      const index = sales.findIndex(s => s.id === updatedSale.id)

      if (index !== -1) {
        sales[index] = updatedSale
        localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(sales))
      }
    } catch (error) {
      console.error('Error updating offline sale:', error)
    }
  }

  private updateInventoryChange(updatedChange: OfflineInventoryChange): void {
    try {
      const changes = this.getInventoryChanges()
      const index = changes.findIndex(c => c.id === updatedChange.id)

      if (index !== -1) {
        changes[index] = updatedChange
        localStorage.setItem(this.STORAGE_KEYS.INVENTORY_CHANGES, JSON.stringify(changes))
      }
    } catch (error) {
      console.error('Error updating inventory change:', error)
    }
  }

  // Status and Utilities
  getSyncStatus(): SyncStatus {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS)
      const baseStatus = saved ? JSON.parse(saved) : {}

      const pendingSales = this.getPendingSales().length
      const pendingChanges = this.getPendingInventoryChanges().length

      return {
        isOnline: this.isOnline,
        lastOnlineTime: baseStatus.lastOnlineTime || new Date().toISOString(),
        pendingSales,
        pendingInventoryChanges: pendingChanges,
        lastSyncTime: baseStatus.lastSyncTime,
        syncInProgress: this.syncInProgress,
        syncError: baseStatus.syncError
      }
    } catch (error) {
      console.error('Error getting sync status:', error)
      return {
        isOnline: this.isOnline,
        lastOnlineTime: new Date().toISOString(),
        pendingSales: 0,
        pendingInventoryChanges: 0,
        syncInProgress: false
      }
    }
  }

  isOfflineMode(): boolean {
    return !this.isOnline
  }

  // Force refresh cached data
  async refreshCache(branchId: string): Promise<void> {
    if (this.isOnline) {
      await this.cacheProducts(branchId)
    }
  }

  // Clear all offline data
  clearOfflineData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      console.log('Cleared all offline data')
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }

  // Get storage usage
  getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      let used = 0
      Object.values(this.STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          used += new Blob([value]).size
        }
      })

      // Estimate available storage (localStorage usually has 5-10MB limit)
      const available = 5 * 1024 * 1024 // 5MB
      const percentage = (used / available) * 100

      return { used, available, percentage }
    } catch (error) {
      console.error('Error calculating storage usage:', error)
      return { used: 0, available: 0, percentage: 0 }
    }
  }

  // Cleanup old data
  cleanupOldData(): void {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Clean up old synced sales
      let sales = this.getOfflineSales()
      sales = sales.filter(sale => {
        return !sale.synced || new Date(sale.createdAt) > weekAgo
      })
      localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(sales))

      // Clean up old synced inventory changes
      let changes = this.getInventoryChanges()
      changes = changes.filter(change => {
        return !change.synced || new Date(change.createdAt) > weekAgo
      })
      localStorage.setItem(this.STORAGE_KEYS.INVENTORY_CHANGES, JSON.stringify(changes))

      console.log('Cleaned up old offline data')
    } catch (error) {
      console.error('Error cleaning up old data:', error)
    }
  }

  // Destroy
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }
}

export const offlineManager = new OfflineManager()