'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, User, Trash2 } from 'lucide-react'
import CustomerForm, { CustomerFormData } from './CustomerForm'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  customerType: 'WALK_IN' | 'REGULAR' | 'WHOLESALE' | 'CORPORATE'
  isActive: boolean
  totalSales: number
  totalSpent: number
  averageOrderValue: number
  lastPurchaseDate?: string
  createdAt: string
  branch: string
}

interface CustomerModalsProps {
  showAddModal: boolean
  showEditModal: boolean
  showDeleteModal: boolean
  selectedCustomer: Customer | null
  isLoading: boolean
  onClose: () => void
  onAdd: (data: CustomerFormData) => Promise<void>
  onEdit: (id: string, data: CustomerFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function CustomerModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  selectedCustomer,
  isLoading,
  onClose,
  onAdd,
  onEdit,
  onDelete
}: CustomerModalsProps) {
  const [formLoading, setFormLoading] = useState(false)

  const handleAddSubmit = async (data: CustomerFormData) => {
    setFormLoading(true)
    try {
      await onAdd(data)
      onClose()
    } catch (error) {
      console.error('Error adding customer:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditSubmit = async (data: CustomerFormData) => {
    if (!selectedCustomer) return

    setFormLoading(true)
    try {
      await onEdit(selectedCustomer.id, data)
      onClose()
    } catch (error) {
      console.error('Error editing customer:', error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return

    setFormLoading(true)
    try {
      await onDelete(selectedCustomer.id)
      onClose()
    } catch (error) {
      console.error('Error deleting customer:', error)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <>
      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <CustomerForm
            title="Add New Customer"
            submitButtonText="Add Customer"
            onSubmit={handleAddSubmit}
            onCancel={onClose}
            isLoading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={showEditModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedCustomer && (
            <CustomerForm
              title="Edit Customer"
              submitButtonText="Update Customer"
              initialData={{
                name: selectedCustomer.name,
                email: selectedCustomer.email || '',
                phone: selectedCustomer.phone || '',
                address: selectedCustomer.address || '',
                customerType: selectedCustomer.customerType,
                isActive: selectedCustomer.isActive
              }}
              onSubmit={handleEditSubmit}
              onCancel={onClose}
              isLoading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Customer Modal */}
      <Dialog open={showDeleteModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Delete Customer</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and remove all their data from our servers.
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">{selectedCustomer.name}</h3>
                    <p className="text-sm text-secondary">
                      {selectedCustomer.email || 'No email'} • {selectedCustomer.phone || 'No phone'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning for customers with sales history */}
              {selectedCustomer.totalSales > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This customer has {selectedCustomer.totalSales} previous sale(s)
                    totaling {new Intl.NumberFormat('en-UG', {
                      style: 'currency',
                      currency: 'UGX',
                      minimumFractionDigits: 0
                    }).format(selectedCustomer.totalSpent)}.
                    Deleting this customer will not affect the sales records, but you won't be able to
                    associate these sales with a customer anymore. Consider deactivating the customer
                    instead of deleting them.
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmation */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Are you sure you want to delete {selectedCustomer.name}?</strong>
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Customer'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}