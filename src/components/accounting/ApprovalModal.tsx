'use client'

import { useState } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  expense: any
  action: 'approve' | 'reject'
  onSuccess: () => void
}

export default function ApprovalModal({ isOpen, onClose, expense, action, onSuccess }: ApprovalModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (action === 'reject' && !rejectionReason.trim()) {
        setError('Please provide a reason for rejection')
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/expenses/${expense.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
        onClose()
        setRejectionReason('')
      } else {
        setError(result.error || 'Failed to process expense')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      setError('Failed to process expense. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !expense) return null

  const isApprove = action === 'approve'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isApprove ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {isApprove ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </div>
            <h2 className="text-xl font-semibold text-primary">
              {isApprove ? 'Approve Expense' : 'Reject Expense'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Expense Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-primary mb-3">Expense Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium">{expense.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-red-600">
                  KES {expense.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{expense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(expense.date).toLocaleDateString()}
                </span>
              </div>
              {expense.receiptNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt:</span>
                  <span className="font-medium">{expense.receiptNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className={`p-4 rounded-lg mb-6 ${
            isApprove
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                isApprove ? 'text-green-600' : 'text-red-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  isApprove ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isApprove ? 'Approve this expense?' : 'Reject this expense?'}
                </p>
                <p className={`text-sm mt-1 ${
                  isApprove ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isApprove
                    ? 'This will mark the expense as approved and include it in financial calculations.'
                    : 'This will reject the expense and it will not be included in financial calculations.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Reason (only for reject action) */}
          {!isApprove && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this expense..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
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
              className={`flex-1 ${
                isApprove
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isApprove ? 'Approve Expense' : 'Reject Expense')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}