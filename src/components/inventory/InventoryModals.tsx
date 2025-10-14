'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { X, Upload, FileText, AlertCircle } from 'lucide-react'
import { notifications } from '@/lib/notifications-simple'

interface InventoryItem {
  id: string
  product: {
    id: string
    name: string
    sku: string
    category: string
  }
  variation: {
    id: string
    name: string
    unitPrice: number
  } | null
  branch: {
    id: string
    name: string
  }
  batch: {
    id: string
    batchNumber: string
    expiryDate: string | null
  } | null
  quantity: number
  minStock: number
  maxStock: number
  lastUpdated: string
}

interface InventoryModalsProps {
  showViewModal: boolean
  showEditModal: boolean
  showDeleteModal: boolean
  showImportModal: boolean
  showExportModal: boolean
  selectedItem: InventoryItem | null
  onClose: () => void
  onEdit: (item: InventoryItem) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onImport: (file: File) => Promise<void>
  onExport: (format: 'csv' | 'excel' | 'pdf') => Promise<void>
  isLoading?: boolean
}

export function ViewInventoryModal({ selectedItem, showViewModal, onClose }: { selectedItem: InventoryItem | null; showViewModal: boolean; onClose: () => void }) {
  if (!selectedItem) return null

  return (
    <Dialog open={showViewModal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Inventory Item Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Product Name</Label>
              <p className="text-lg font-semibold">{selectedItem.product.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">SKU</Label>
              <p className="text-lg">{selectedItem.product.sku}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Category</Label>
              <p className="text-lg">{selectedItem.product.category}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Branch</Label>
              <p className="text-lg">{selectedItem.branch.name}</p>
            </div>
            {selectedItem.variation && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Variation</Label>
                <p className="text-lg">{selectedItem.variation.name}</p>
              </div>
            )}
            {selectedItem.batch && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Batch Number</Label>
                <p className="text-lg">{selectedItem.batch.batchNumber}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-500">Current Stock</Label>
              <p className={`text-lg font-semibold ${selectedItem.quantity <= selectedItem.minStock ? 'text-red-600' : 'text-green-600'}`}>
                {selectedItem.quantity} units
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Minimum Stock</Label>
              <p className="text-lg">{selectedItem.minStock} units</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Maximum Stock</Label>
              <p className="text-lg">{selectedItem.maxStock} units</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Unit Price</Label>
              <p className="text-lg">KES {selectedItem.variation?.unitPrice || 0}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Total Value</Label>
              <p className="text-lg font-semibold">KES {selectedItem.quantity * (selectedItem.variation?.unitPrice || 0)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedItem.quantity === 0
                    ? 'bg-red-100 text-red-800'
                    : selectedItem.quantity <= selectedItem.minStock
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedItem.quantity === 0
                    ? 'Out of Stock'
                    : selectedItem.quantity <= selectedItem.minStock
                    ? 'Low Stock'
                    : 'In Stock'
                  }
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
              <p className="text-lg">{new Date(selectedItem.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditInventoryModal({ selectedItem, showEditModal, onClose, onEdit, isLoading }: {
  selectedItem: InventoryItem | null;
  showEditModal: boolean;
  onClose: () => void;
  onEdit: (item: InventoryItem) => Promise<void>;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    batchNumber: ''
  })

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        quantity: selectedItem.quantity,
        minStock: selectedItem.minStock,
        maxStock: selectedItem.maxStock,
        unitPrice: selectedItem.variation?.unitPrice || 0,
        batchNumber: selectedItem.batch?.batchNumber || 'DEFAULT'
      })
    }
  }, [selectedItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    try {
      const updatedItem = {
        ...selectedItem,
        quantity: formData.quantity,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        variation: selectedItem.variation ? {
          ...selectedItem.variation,
          unitPrice: formData.unitPrice
        } : null,
        batchNumber: formData.batchNumber
      }

      await onEdit(updatedItem)
      notifications.success('Success', 'Inventory item updated successfully')
      onClose()
    } catch (error) {
      notifications.error('Error', 'Failed to update inventory item')
    }
  }

  if (!selectedItem) return null

  return (
    <Dialog open={showEditModal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <p className="text-sm font-medium">{selectedItem.product.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="Enter batch number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Current Stock</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (KES)</Label>
              <Input
                id="unitPrice"
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteInventoryModal({ selectedItem, showDeleteModal, onClose, onDelete, isLoading }: {
  selectedItem: InventoryItem | null;
  showDeleteModal: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}) {
  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      await onDelete(selectedItem.id)
      notifications.success('Success', `${selectedItem.product.name} deleted successfully`)
      onClose()
    } catch (error) {
      notifications.error('Error', 'Failed to delete inventory item')
    }
  }

  if (!selectedItem) return null

  return (
    <Dialog open={showDeleteModal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Delete Inventory Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this inventory item? This action cannot be undone.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Item to be deleted:</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Product:</span> {selectedItem.product.name}</p>
              <p><span className="font-medium">SKU:</span> {selectedItem.product.sku}</p>
              <p><span className="font-medium">Branch:</span> {selectedItem.branch.name}</p>
              <p><span className="font-medium">Current Stock:</span> {selectedItem.quantity} units</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ImportModal({ showImportModal, onClose, onImport, isLoading }: {
  showImportModal: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  isLoading?: boolean;
}) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'text/csv' || droppedFile.type === 'application/vnd.ms-excel' || droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(droppedFile)
      } else {
        notifications.error('Invalid File', 'Please upload a CSV or Excel file')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      notifications.warning('No File', 'Please select a file to import')
      return
    }

    try {
      await onImport(file)
      notifications.success('Import Started', 'Your file is being processed. You will receive a notification when it\'s complete.')
      setFile(null)
      onClose()
    } catch (error) {
      notifications.error('Import Failed', 'Failed to process the import file')
    }
  }

  return (
    <Dialog open={showImportModal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Import Products
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Drop your file here</p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Supports CSV and Excel files
            </p>
          </div>

          {file && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure your file has columns: Name, SKU, Category, Price, Stock</li>
              <li>• First row should contain headers</li>
              <li>• Price should be in numbers (e.g., 1000.50)</li>
              <li>• Stock should be whole numbers</li>
              <li>• Duplicate SKUs will be updated with new values</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isLoading}
          >
            {isLoading ? 'Importing...' : 'Import File'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ExportModal({ showExportModal, onClose, onExport, isLoading }: {
  showExportModal: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => Promise<void>;
  isLoading?: boolean;
}) {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')

  const handleExport = async () => {
    try {
      await onExport(selectedFormat)
      notifications.success('Export Started', `Your ${selectedFormat.toUpperCase()} file is being downloaded.`)
      onClose()
    } catch (error) {
      notifications.error('Export Failed', 'Failed to generate export file')
    }
  }

  return (
    <Dialog open={showExportModal} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Export Inventory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Select Export Format</Label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'csv', label: 'CSV File', description: 'Comma-separated values, compatible with Excel' },
                { value: 'excel', label: 'Excel File', description: 'Microsoft Excel format with formatting' },
                { value: 'pdf', label: 'PDF Report', description: 'Formatted report document' }
              ].map((format) => (
                <div
                  key={format.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(format.value as 'csv' | 'excel' | 'pdf')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={selectedFormat === format.value}
                      onChange={() => setSelectedFormat(format.value as 'csv' | 'excel' | 'pdf')}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">{format.label}</p>
                      <p className="text-sm text-gray-500">{format.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Export Details:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All inventory items with current stock levels</li>
              <li>• Product details and branch information</li>
              <li>• Pricing and valuation data</li>
              <li>• Export date: {new Date().toLocaleDateString()}</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading}
          >
            {isLoading ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}