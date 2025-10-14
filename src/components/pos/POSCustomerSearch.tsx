'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, User, Phone, Mail, Star, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

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

interface POSCustomerSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectCustomer: (customer: Customer | null) => void
  selectedCustomer?: Customer | null
}

export default function POSCustomerSearch({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedCustomer
}: POSCustomerSearchProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomers()
    }
  }, [isOpen, selectedType])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadCustomers(searchTerm)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedType])

  const loadCustomers = async (searchQuery?: string) => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }
      params.append('limit', '20') // Limit for POS use

      const response = await fetch(`/api/customers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }

      const result = await response.json()
      if (result.success) {
        setCustomers(result.data)
      } else {
        throw new Error(result.error || 'Failed to load customers')
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
    onClose()
  }

  const handleWalkIn = () => {
    onSelectCustomer(null)
    onClose()
  }

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) return

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickAddName.trim(),
          customerType: 'WALK_IN'
        })
      })

      const result = await response.json()
      if (result.success) {
        const newCustomer = result.data
        handleSelectCustomer(newCustomer)
        setQuickAddName('')
        setShowQuickAdd(false)
      } else {
        throw new Error(result.error || 'Failed to create customer')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Failed to create customer. Please try again.')
    }
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Select Customer</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleWalkIn}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              Walk-in Customer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Add Customer
            </Button>
          </div>

          {/* Quick Add Form */}
          {showQuickAdd && (
            <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-primary">Quick Add Customer</h4>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter customer name..."
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                  className="flex-1"
                />
                <Button onClick={handleQuickAdd} disabled={!quickAddName.trim()}>
                  Add
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowQuickAdd(false)
                  setQuickAddName('')
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-card"
            >
              <option value="all">All Types</option>
              <option value="WALK_IN">Walk-in</option>
              <option value="REGULAR">Regular</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-secondary">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No customers found</p>
                <p className="text-sm">Try adjusting your search or add a new customer</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((customer) => {
                  const tier = getCustomerTier(customer.totalSpent)
                  const typeDisplay = getCustomerTypeDisplay(customer.customerType)
                  const isSelected = selectedCustomer?.id === customer.id

                  return (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`p-4 border border-border rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                        isSelected ? 'border-primary bg-primary/10' : 'bg-card'
                      } ${!customer.isActive ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-primary">{customer.name}</span>
                              <span className="text-lg">{tier.icon}</span>
                              <span className={`text-xs font-medium ${tier.color}`}>{tier.tier}</span>
                            </div>
                            <Badge variant={typeDisplay.variant}>
                              {typeDisplay.label}
                            </Badge>
                            {!customer.isActive && (
                              <Badge variant="outline" className="text-gray-500">
                                Inactive
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-secondary mb-2">
                            {customer.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {customer.phone}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-secondary">
                                  {customer.totalSales} sales
                                </span>
                              </div>
                              <div className="text-secondary">
                                Avg: {formatCurrency(customer.averageOrderValue)}
                              </div>
                            </div>
                            <div className="font-medium text-primary">
                              {formatCurrency(customer.totalSpent)}
                            </div>
                          </div>

                          {customer.lastPurchaseDate && (
                            <div className="text-xs text-secondary mt-1">
                              Last purchase: {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="ml-3">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}