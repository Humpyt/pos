'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Package,
  User,
  DollarSign,
  Smartphone,
  Percent,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause
} from 'lucide-react'
import { PageHeader, StatusBadge, EmptyState, LoadingState } from '@/components/shared/DesignSystem'
import { formatCurrency, generateSaleNumber } from '@/lib/utils'
import { ProductWithStock } from '@/lib/product-service'
import { updateManager } from '@/lib/update-manager'
import POSCustomerSearch from '@/components/pos/POSCustomerSearch'
import { POSControlPanel } from '@/components/pos/POSControlPanel'
import { OfflineStatus } from '@/components/pos/OfflineStatus'
import { offlineManager } from '@/lib/offline-manager'
import { shiftManager } from '@/lib/shift-manager'
import { cashDrawer } from '@/lib/cash-drawer'
import { orderHold } from '@/lib/order-hold'
import { receiptPrinter } from '@/lib/receipt-printer'

// Use ProductWithStock from product-service instead of local interface

interface CartItem {
  product: ProductWithStock
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  customerType: 'WALK_IN' | 'REGULAR' | 'WHOLESALE' | 'CORPORATE'
  totalSpent: number
  totalSales: number
  averageOrderValue: number
  lastPurchaseDate?: string
  isActive: boolean
}

export default function POSPage() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState('cmgq8tx590000lras30r8autd') // Default to Branch A (Main Branch - Nairobi)
  const [categories, setCategories] = useState<string[]>(['All'])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)

  // New POS functionality state
  const [currentShift, setCurrentShift] = useState(shiftManager.getCurrentShift())
  const [cashDrawerState, setCashDrawerState] = useState(cashDrawer.getState())
  const [offlineStatus, setOfflineStatus] = useState(offlineManager.getSyncStatus())
  const [showHoldOrderDialog, setShowHoldOrderDialog] = useState(false)
  const [holdOrderNotes, setHoldOrderNotes] = useState('')

  useEffect(() => {
    loadProducts()
    loadCategories()

    // Initialize POS systems
    initializePOSSystems()

    // Set up periodic status updates
    const statusInterval = setInterval(() => {
      setCurrentShift(shiftManager.getCurrentShift())
      setCashDrawerState(cashDrawer.getState())
      setOfflineStatus(offlineManager.getSyncStatus())
    }, 1000)

    return () => clearInterval(statusInterval)
  }, [selectedBranch])

  const initializePOSSystems = async () => {
    // Cache products for offline use
    await offlineManager.cacheProducts(selectedBranch)

    // Check if shift needs to be opened
    const activeShift = shiftManager.getCurrentShift()
    if (!activeShift) {
      console.log('No active shift found - ready to open new shift')
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCategories(['All', ...result.data])
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async (searchQuery?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Try online API first
      if (offlineStatus.isOnline) {
        try {
          const params = new URLSearchParams()
          if (searchQuery) {
            params.append('search', searchQuery)
          }
          if (selectedBranch && selectedBranch !== 'default') {
            params.append('branchId', selectedBranch)
          }

          const response = await fetch(`/api/products?${params.toString()}`)

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              setProducts(result.data)
              if (result.branchId && result.branchId !== selectedBranch) {
                setSelectedBranch(result.branchId)
              }
              return
            }
          }
        } catch (apiError) {
          console.log('API failed, falling back to offline mode')
        }
      }

      // Fallback to offline mode
      console.log('Loading products from offline cache')
      const cachedProducts = searchQuery
        ? offlineManager.searchCachedProducts(searchQuery, selectedBranch)
        : offlineManager.getCachedProducts().filter(p =>
            !selectedBranch || selectedBranch === 'default' || p.stock.branchId === selectedBranch
          )

      setProducts(cachedProducts)
      if (cachedProducts.length === 0) {
        setError('No products available. Please check your connection.')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products. Please try again.')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        loadProducts(searchTerm)
      } else {
        loadProducts()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedBranch])

  // Filter products by selected category
  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'All') return true
    return product.category === selectedCategory
  })

  const addToCart = (product: ProductWithStock) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return prevCart
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      } else {
        return [...prevCart, { product, quantity: 1, unitPrice: product.price, totalPrice: product.price }]
      }
    })
  }

  const updateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              unitPrice: newPrice,
              totalPrice: item.quantity * newPrice
            }
          : item
      )
    )
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(newQuantity, item.product.stock),
              totalPrice: Math.min(newQuantity, item.product.stock) * item.unitPrice
            }
          : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount = subtotal * (discount / 100)
  // Tax deactivated - setting tax to 0
  const taxAmount = 0
  const total = subtotal - discountAmount

  const handleHoldOrder = () => {
    if (cart.length === 0) {
      alert('Cannot hold an empty cart')
      return
    }

    setShowHoldOrderDialog(true)
  }

  const confirmHoldOrder = () => {
    try {
      const heldOrderItems = cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))

      const heldOrder = orderHold.holdOrder(
        heldOrderItems,
        selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email
        } : undefined,
        {
          paymentMethod,
          notes: holdOrderNotes,
          createdBy: 'Admin', // In real app, get from auth
          branch: `Branch ${selectedBranch}`
        }
      )

      alert(`Order held successfully!\nOrder ID: ${heldOrder.id}\nExpires: ${new Date(heldOrder.expiresAt).toLocaleString()}`)

      // Reset cart
      setCart([])
      setDiscount(0)
      setPaymentMethod('CASH')
      setSelectedCustomer(null)
      setHoldOrderNotes('')
      setShowHoldOrderDialog(false)
    } catch (error) {
      alert(`Error holding order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    const saleData = {
      saleNumber: generateSaleNumber(),
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod,
      customer: selectedCustomer,
      branchId: selectedBranch
    }

    try {
      let result: any

      // Try online API first, fallback to offline mode
      if (offlineStatus.isOnline) {
        try {
          const response = await fetch('/api/sales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
          })

          result = await response.json()

          if (!result.success) {
            throw new Error(result.error || 'Failed to process sale online')
          }
        } catch (onlineError) {
          console.log('Online checkout failed, switching to offline mode')
          result = { success: true, offline: true, saleNumber: saleData.saleNumber }
        }
      } else {
        // Offline mode
        result = { success: true, offline: true, saleNumber: saleData.saleNumber }
      }

      if (result.success) {
        // Update shift metrics
        if (currentShift) {
          shiftManager.updateShiftMetrics({
            totalAmount: total,
            paymentMethod,
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
            items: cart.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.unitPrice
            }))
          })
        }

        // Update cash drawer
        if (cashDrawerState.isOpen && paymentMethod === 'CASH') {
          cashDrawer.recordSale(total, 'Admin', saleData.saleNumber)
          setCashDrawerState(cashDrawer.getState())
        }

        // Save offline sale if needed
        if (result.offline) {
          offlineManager.saveOfflineSale({
            saleNumber: saleData.saleNumber,
            customerId: selectedCustomer?.id,
            items: cart.map(item => ({
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            })),
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount: total,
            paymentMethod,
            paymentStatus: 'PAID',
            branchId: selectedBranch,
            branchName: `Branch ${selectedBranch}`,
            cashierName: 'Admin',
            notes: ''
          })
        }

        // Print receipt
        try {
          receiptPrinter.printReceipt({
            saleNumber: saleData.saleNumber,
            customerName: selectedCustomer?.name,
            customerPhone: selectedCustomer?.phone,
            customerEmail: selectedCustomer?.email,
            items: cart.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            })),
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount: total,
            paymentMethod,
            paymentStatus: 'PAID',
            branch: `Branch ${selectedBranch}`,
            cashierName: 'Admin',
            createdAt: new Date().toISOString()
          })
        } catch (receiptError) {
          console.error('Error printing receipt:', receiptError)
        }

        // Show success message
        alert(`Sale completed successfully!\nSale Number: ${saleData.saleNumber}\nTotal: ${formatCurrency(total)}${result.offline ? ' (Saved offline)' : ''}`)

        // Reset cart
        setCart([])
        setDiscount(0)
        setPaymentMethod('CASH')
        setSelectedCustomer(null)

        // Reload products to get updated inventory
        await loadProducts()

        // Trigger comprehensive real-time updates
        const updateData = {
          saleNumber: saleData.saleNumber,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          subtotal,
          discountAmount: discountAmount,
          taxAmount: taxAmount,
          totalAmount: total,
          paymentMethod,
          branchId: selectedBranch,
          userId: 'admin@pos-store.com', // In real app, get from auth
          createdAt: new Date().toISOString(),
          offline: result.offline
        }

        // Use the update manager to trigger real-time updates across all pages
        updateManager.triggerSaleUpdate(updateData)

        // Also trigger the old inventory event for backward compatibility
        window.dispatchEvent(new CustomEvent('inventoryUpdate', {
          detail: {
            type: 'sale_completed',
            timestamp: new Date().toISOString(),
            items: cart.map(item => ({
              productId: item.product.id,
              quantitySold: item.quantity
            }))
          }
        }))
      } else {
        throw new Error(result.error || 'Failed to process sale')
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to process sale'}`)
    }
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
          icon={AlertTriangle}
          title="Error Loading Products"
          description={error}
          action={{
            label: "Try Again",
            onClick: () => loadProducts()
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Point of Sale</h1>
            <p className="text-sm text-secondary">Select products and complete sales transactions</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${offlineStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-secondary">{offlineStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Shift Status */}
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="text-secondary">
                {currentShift ? `Shift Active (${currentShift.totalTransactions} sales)` : 'No Shift'}
              </span>
            </div>

            {/* Cash Drawer Status */}
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-4 w-4 text-secondary" />
              <span className="text-secondary">
                {cashDrawerState.isOpen ? `Drawer: ${formatCurrency(cashDrawerState.currentBalance)}` : 'Drawer Closed'}
              </span>
            </div>

            <div className="text-sm">
              <span className="text-secondary">Cashier: </span>
              <span className="font-medium text-primary">Admin</span>
            </div>
            <div className="text-sm">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                🇺🇬 Uganda
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products (70%) */}
        <div className="w-full lg:w-9/12 border-r border-border bg-white">
          <div className="h-full flex flex-col">
            {/* Search and Categories */}
            <div className="p-4 border-b border-border bg-surface">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search products or scan barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 input rounded-lg border border-input-border focus:border-primary focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border border-border hover:bg-primary hover:text-primary-foreground'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <EmptyState
                    icon={Package}
                    title="No products found"
                    description={searchTerm ? "Try adjusting your search terms" : "No products available in inventory"}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-card border border-border rounded-lg p-2 cursor-pointer transition-all hover:border-primary hover:shadow-sm ${
                        cart.find(item => item.product.id === product.id) ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex flex-col h-full">
                        <h4 className="font-medium text-xs text-primary mb-1 truncate leading-tight">{product.name}</h4>
                        <p className="text-sm font-bold text-primary mb-2">{formatCurrency(product.price)}</p>
                        <div className="mt-auto">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              product.stock <= 5
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {product.stock}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                              className="p-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Order Details (30%) */}
        <div className="w-full lg:w-3/12 bg-gradient-to-b from-indigo-50 to-purple-50 border-l border-purple-200 flex flex-col">
          {/* Customer Info */}
          <div className="p-4 border-b border-purple-200 bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-primary">Customer</h3>
              <button
                className="text-xs text-primary hover:text-primary/80 transition-colors"
                onClick={() => setShowCustomerSearch(true)}
              >
                {selectedCustomer ? 'Change' : 'Select'}
              </button>
            </div>
            {selectedCustomer ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted" />
                    <span className="text-primary font-medium">{selectedCustomer.name}</span>
                  </div>
                  <button
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary">
                  <span>{selectedCustomer.customerType.replace('_', ' ')}</span>
                  <span>{selectedCustomer.totalSales} sales</span>
                </div>
                {selectedCustomer.email && (
                  <div className="text-xs text-secondary truncate">{selectedCustomer.email}</div>
                )}
                {selectedCustomer.phone && (
                  <div className="text-xs text-secondary">{selectedCustomer.phone}</div>
                )}
              </div>
            ) : (
              <div className="flex items-center text-sm text-secondary">
                <User className="h-4 w-4 mr-2 text-muted" />
                <span>Walk-in Customer</span>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-primary mb-3">Order Items</h3>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-8 w-8 text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted">No items in cart</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-primary">{item.product.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted">Price:</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(item.product.id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-1 py-0.5 text-xs border border-input-border rounded focus:border-primary focus:ring-1 focus:ring-primary"
                              min="0"
                              step="100"
                            />
                            <span className="text-xs text-muted">× {item.quantity}</span>
                          </div>
                        </div>
                        <button
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <button
                            className="p-1 bg-surface border border-border rounded hover:bg-card transition-colors"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            className="p-1 bg-surface border border-border rounded hover:bg-card transition-colors"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-bold text-sm text-primary">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                      {item.unitPrice !== item.product.price && (
                        <div className="mt-2 text-xs text-amber-600">
                          Original price: {formatCurrency(item.product.price)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white/90 backdrop-blur-sm border-t border-purple-200 p-4 space-y-3 mt-auto">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Subtotal:</span>
                <span className="text-primary">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Percent className="h-3 w-3 text-muted" />
                <input
                  type="number"
                  placeholder="Discount %"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 input rounded border border-input-border focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  min="0"
                  max="100"
                />
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {/* Tax deactivated */}
              {/* <div className="flex justify-between text-sm">
                <span className="text-secondary">Tax (16%):</span>
                <span className="text-primary">{formatCurrency(taxAmount)}</span>
              </div> */}

              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-primary">Total:</span>
                  <span className="text-primary text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-indigo-700">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CASH', icon: DollarSign, label: 'Cash', color: 'green' },
                  { id: 'MOBILE_MONEY', icon: Smartphone, label: 'Mobile Money', color: 'blue' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      paymentMethod === method.id
                        ? method.color === 'green'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg transform scale-105'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-lg transform scale-105'
                        : 'bg-white/70 backdrop-blur-sm border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md'
                    }`}
                  >
                    <method.icon className="h-5 w-5 mb-1" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Hold Order Button */}
              <button
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                className={`w-full py-3 px-6 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center ${
                  cart.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-transparent'
                }`}
              >
                <Pause className="h-4 w-4 mr-2" />
                Hold Order
              </button>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-4 px-6 text-sm font-bold rounded-2xl transition-all duration-300 flex items-center justify-center relative overflow-hidden group ${
                  cart.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-transparent'
                }`}
              >
                {/* Animated background effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  cart.length === 0 ? 'hidden' : ''
                }`}></div>

                {/* Button content */}
                <div className="relative flex items-center justify-center w-full">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      cart.length === 0 ? 'bg-gray-300' : 'bg-white/20 backdrop-blur-sm'
                    }`}>
                      <CheckCircle className={`h-5 w-5 ${
                        cart.length === 0 ? 'text-gray-400' : 'text-white'
                      }`} />
                    </div>

                    <div className="text-left">
                      <div className={`text-sm font-bold ${
                        cart.length === 0 ? 'text-gray-400' : 'text-white'
                      }`}>
                        {cart.length === 0 ? 'Add Items to Cart' : 'Complete Sale'}
                      </div>
                      {cart.length > 0 && (
                        <div className="text-xs text-white/80">
                          {cart.length} {cart.length === 1 ? 'item' : 'items'}
                        </div>
                      )}
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <div className="ml-auto">
                      <div className="text-lg font-bold text-white">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtle pulse animation for active state */}
                {cart.length > 0 && (
                  <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-20"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      <POSCustomerSearch
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelectCustomer={setSelectedCustomer}
        selectedCustomer={selectedCustomer}
      />

      {/* POS Control Panel */}
      <POSControlPanel
        currentBranchId={selectedBranch}
        cashierName="Admin"
        onShiftChange={setCurrentShift}
        onCashDrawerChange={setCashDrawerState}
      />

      {/* Offline Status Indicator */}
      <OfflineStatus />

      {/* Hold Order Dialog */}
      {showHoldOrderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Hold Order</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Details
                </label>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Items:</span>
                    <span className="font-medium">{cart.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  {selectedCustomer && (
                    <div className="mt-2 pt-2 border-t">
                      <div>Customer: {selectedCustomer.name}</div>
                      {selectedCustomer.phone && <div>Phone: {selectedCustomer.phone}</div>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={holdOrderNotes}
                  onChange={(e) => setHoldOrderNotes(e.target.value)}
                  placeholder="Add any special notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowHoldOrderDialog(false)
                    setHoldOrderNotes('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmHoldOrder}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Hold Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}