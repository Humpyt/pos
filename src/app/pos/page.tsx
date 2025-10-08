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
  CreditCard,
  DollarSign,
  Smartphone,
  Building2,
  Percent,
  Receipt,
  AlertTriangle
} from 'lucide-react'
import { PageHeader, StatusBadge, EmptyState, LoadingState } from '@/components/shared/DesignSystem'
import { formatCurrency, generateSaleNumber } from '@/lib/utils'
import { ProductWithStock } from '@/lib/product-service'

// Use ProductWithStock from product-service instead of local interface

interface CartItem {
  product: ProductWithStock
  quantity: number
  totalPrice: number
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  customerType: string
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
  const [selectedBranch, setSelectedBranch] = useState('default') // Default to first branch
  const [categories, setCategories] = useState<string[]>(['All'])
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [selectedBranch])

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

      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (selectedBranch && selectedBranch !== 'default') {
        params.append('branchId', selectedBranch)
      }

      const response = await fetch(`/api/products?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
        if (result.branchId && result.branchId !== selectedBranch) {
          setSelectedBranch(result.branchId)
        }
      } else {
        throw new Error(result.error || 'Failed to load products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products. Please try again.')
      // Fallback to empty products array
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
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * product.price }
            : item
        )
      } else {
        return [...prevCart, { product, quantity: 1, totalPrice: product.price }]
      }
    })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(newQuantity, item.product.stock),
              totalPrice: Math.min(newQuantity, item.product.stock) * item.product.price
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
  const taxAmount = (subtotal - discountAmount) * 0.16
  const total = subtotal - discountAmount + taxAmount

  const handleCheckout = () => {
    if (cart.length === 0) return

    const saleData = {
      saleNumber: generateSaleNumber(),
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod,
      customer: selectedCustomer
    }

    console.log('Processing sale:', saleData)
    alert(`Sale completed successfully!\nTotal: ${formatCurrency(total)}`)

    // Reset cart
    setCart([])
    setDiscount(0)
    setPaymentMethod('CASH')
    setSelectedCustomer(null)
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
        <div className="w-full lg:w-3/12 bg-surface flex flex-col">
          {/* Customer Info */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-primary">Customer</h3>
              <button
                className="text-xs text-primary hover:text-primary/80 transition-colors"
                onClick={() => {
                  const customerName = prompt('Enter customer name:')
                  if (customerName) {
                    setSelectedCustomer({
                      id: '1',
                      name: customerName,
                      customerType: 'WALK_IN'
                    })
                  }
                }}
              >
                {selectedCustomer ? 'Change' : 'Add'}
              </button>
            </div>
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-muted" />
              <span className="text-primary">
                {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
              </span>
            </div>
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
                          <p className="text-xs text-muted">{formatCurrency(item.product.price)} each</p>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border-t border-border p-4 space-y-3">
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

              <div className="flex justify-between text-sm">
                <span className="text-secondary">Tax (16%):</span>
                <span className="text-primary">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-primary">Total:</span>
                  <span className="text-primary text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CASH', icon: DollarSign, label: 'Cash' },
                  { id: 'CARD', icon: CreditCard, label: 'Card' },
                  { id: 'MOBILE_MONEY', icon: Smartphone, label: 'Mobile' },
                  { id: 'BANK_TRANSFER', icon: Building2, label: 'Bank' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center p-2 rounded border transition-all text-xs ${
                      paymentMethod === method.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-surface border-border text-secondary hover:bg-card hover:border-primary'
                    }`}
                  >
                    <method.icon className="h-4 w-4 mb-1" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center ${
                cart.length === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
              }`}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Complete Sale
              {cart.length > 0 && (
                <span className="ml-auto font-bold">
                  {formatCurrency(total)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}