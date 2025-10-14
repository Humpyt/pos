'use client'

import { useState, useEffect } from 'react'
import { X, Upload, FileText, Calendar, DollarSign, Building2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense?: any // For editing existing expense
  onSuccess: () => void
  branches: Array<{ id: string; name: string }>
}

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Supplies',
  'Transportation',
  'Insurance',
  'Maintenance',
  'Equipment',
  'Software',
  'Professional Services',
  'Taxes',
  'Bank Fees',
  'Training',
  'Other'
]

export default function ExpenseModal({ isOpen, onClose, expense, onSuccess, branches }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    branchId: '',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (expense) {
      setIsEditing(true)
      setFormData({
        branchId: expense.branchId || '',
        category: expense.category || '',
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        receiptNumber: expense.receiptNumber || '',
        notes: expense.notes || ''
      })
    } else {
      setIsEditing(false)
      setFormData({
        branchId: '',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receiptNumber: '',
        notes: ''
      })
    }
    setError(null)
  }, [expense, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      const requiredFields = ['branchId', 'category', 'description', 'amount', 'date']
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])

      if (missingFields.length > 0) {
        setError('Please fill in all required fields')
        setIsLoading(false)
        return
      }

      // Validate amount
      const amountValue = parseFloat(formData.amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount greater than 0')
        setIsLoading(false)
        return
      }

      const url = isEditing ? `/api/expenses/${expense.id}` : '/api/expenses'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          branchId: '',
          category: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          receiptNumber: '',
          notes: ''
        })
      } else {
        setError(result.error || 'Failed to save expense')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      setError('Failed to save expense. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">
            {isEditing ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch *
            </label>
            <select
              value={formData.branchId}
              onChange={(e) => handleInputChange('branchId', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <Input
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter expense description"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (KES) *
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Number
            </label>
            <Input
              value={formData.receiptNumber}
              onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
              placeholder="Optional receipt number"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Expense' : 'Add Expense')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}