'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Users,
  Clock,
  ShoppingCart,
  Pause,
  Play,
  Settings,
  FileText,
  Archive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Package,
  CreditCard
} from 'lucide-react'
import { offlineManager } from '@/lib/offline-manager'
import { shiftManager } from '@/lib/shift-manager'
import { cashDrawer } from '@/lib/cash-drawer'
import { orderHold } from '@/lib/order-hold'
import { receiptPrinter } from '@/lib/receipt-printer'
import { formatCurrency } from '@/lib/utils'

interface POSControlPanelProps {
  currentBranchId: string
  cashierName: string
  onShiftChange?: (shift: any) => void
  onCashDrawerChange?: (state: any) => void
}

export function POSControlPanel({
  currentBranchId,
  cashierName,
  onShiftChange,
  onCashDrawerChange
}: POSControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'shift' | 'cash' | 'orders'>('overview')

  // State for different systems
  const [syncStatus, setSyncStatus] = useState(offlineManager.getSyncStatus())
  const [currentShift, setCurrentShift] = useState(shiftManager.getCurrentShift())
  const [cashDrawerState, setCashDrawerState] = useState(cashDrawer.getState())
  const [heldOrders, setHeldOrders] = useState(orderHold.getHeldOrders('HELD'))
  const [orderHoldStats, setOrderHoldStats] = useState(orderHold.getStatistics())

  // Update states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(offlineManager.getSyncStatus())
      setCurrentShift(shiftManager.getCurrentShift())
      setCashDrawerState(cashDrawer.getState())
      setHeldOrders(orderHold.getHeldOrders('HELD'))
      setOrderHoldStats(orderHold.getStatistics())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleOpenShift = async () => {
    try {
      const openingBalance = prompt('Enter opening balance:', '0')
      if (openingBalance === null) return

      const shift = shiftManager.openShift(
        cashierName,
        `Branch ${currentBranchId}`,
        parseFloat(openingBalance)
      )

      // Open cash drawer
      cashDrawer.openDrawer(parseFloat(openingBalance), cashierName, shift.id)

      setCurrentShift(shift)
      setCashDrawerState(cashDrawer.getState())
      onShiftChange?.(shift)
      onCashDrawerChange?.(cashDrawer.getState())

      alert(`Shift opened successfully!\nShift ID: ${shift.id}\nOpening Balance: ${formatCurrency(parseFloat(openingBalance))}`)
    } catch (error) {
      alert(`Error opening shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCloseShift = async () => {
    if (!currentShift) return

    try {
      const closingBalance = prompt('Enter closing balance:', cashDrawerState.currentBalance.toString())
      if (closingBalance === null) return

      const shift = shiftManager.closeShift(parseFloat(closingBalance))
      cashDrawer.closeDrawer(cashierName, parseFloat(closingBalance))

      setCurrentShift(shiftManager.getCurrentShift())
      setCashDrawerState(cashDrawer.getState())
      onShiftChange?.(shiftManager.getCurrentShift())
      onCashDrawerChange?.(cashDrawer.getState())

      // Generate shift report
      const report = shiftManager.generateShiftReport(shift)
      alert(`Shift closed successfully!\nTotal Sales: ${formatCurrency(report.summary.totalRevenue)}\nTransactions: ${report.summary.totalTransactions}\nCash Overage/Shortage: ${formatCurrency(report.summary.cashOverage)}`)
    } catch (error) {
      alert(`Error closing shift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCashIn = async () => {
    try {
      const amount = prompt('Enter cash in amount:', '0')
      if (!amount) return

      const description = prompt('Enter description:', 'Cash in transaction')
      if (!description) return

      cashDrawer.recordCashIn(parseFloat(amount), description, cashierName)
      setCashDrawerState(cashDrawer.getState())
      onCashDrawerChange?.(cashDrawer.getState())

      alert(`Cash in recorded: ${formatCurrency(parseFloat(amount))}`)
    } catch (error) {
      alert(`Error recording cash in: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCashOut = async () => {
    try {
      const amount = prompt('Enter cash out amount:', '0')
      if (!amount) return

      const description = prompt('Enter description:', 'Cash out transaction')
      if (!description) return

      cashDrawer.recordCashOut(parseFloat(amount), description, cashierName)
      setCashDrawerState(cashDrawer.getState())
      onCashDrawerChange?.(cashDrawer.getState())

      alert(`Cash out recorded: ${formatCurrency(parseFloat(amount))}`)
    } catch (error) {
      alert(`Error recording cash out: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleForceSync = async () => {
    await offlineManager.triggerSync()
    setSyncStatus(offlineManager.getSyncStatus())
  }

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {syncStatus.isOnline ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium text-sm">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <button
          onClick={handleForceSync}
          disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300"
        >
          {syncStatus.syncInProgress ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Pending Sales</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {syncStatus.pendingSales}
          </div>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Archive className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-800">Held Orders</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {orderHoldStats.held}
          </div>
        </div>
      </div>

      {/* Current Shift */}
      <div className="p-3 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Current Shift</span>
          </div>
          {currentShift ? (
            <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
              Active
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded-full">
              Inactive
            </span>
          )}
        </div>
        {currentShift ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-700">Cashier:</span>
              <span className="font-medium text-green-900">{currentShift.cashierName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-700">Sales:</span>
              <span className="font-medium text-green-900">{formatCurrency(currentShift.totalSales)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-700">Transactions:</span>
              <span className="font-medium text-green-900">{currentShift.totalTransactions}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-green-700">No active shift</div>
        )}
      </div>

      {/* Cash Drawer */}
      <div className="p-3 bg-amber-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Cash Drawer</span>
          </div>
          {cashDrawerState.isOpen ? (
            <span className="text-xs px-2 py-1 bg-amber-600 text-white rounded-full">
              Open
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded-full">
              Closed
            </span>
          )}
        </div>
        {cashDrawerState.isOpen ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-amber-700">Balance:</span>
              <span className="font-medium text-amber-900">{formatCurrency(cashDrawerState.currentBalance)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-700">Expected:</span>
              <span className="font-medium text-amber-900">{formatCurrency(cashDrawerState.expectedBalance)}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-700">Cash drawer is closed</div>
        )}
      </div>
    </div>
  )

  const renderShiftTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Shift Management</h3>
        <div className="flex gap-2">
          {currentShift ? (
            <button
              onClick={handleCloseShift}
              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Close Shift
            </button>
          ) : (
            <button
              onClick={handleOpenShift}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Open Shift
            </button>
          )}
        </div>
      </div>

      {currentShift ? (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-2">Shift Details</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-700">ID:</span>
                <span className="font-medium text-blue-900">{currentShift.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Started:</span>
                <span className="font-medium text-blue-900">
                  {new Date(currentShift.startTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Branch:</span>
                <span className="font-medium text-blue-900">{currentShift.branch}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs font-medium text-green-800 mb-1">Sales</div>
              <div className="text-lg font-bold text-green-900">
                {formatCurrency(currentShift.totalSales)}
              </div>
              <div className="text-xs text-green-700">
                {currentShift.totalTransactions} transactions
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs font-medium text-purple-800 mb-1">AOV</div>
              <div className="text-lg font-bold text-purple-900">
                {formatCurrency(currentShift.averageOrderValue)}
              </div>
              <div className="text-xs text-purple-700">
                {currentShift.itemsSold} items sold
              </div>
            </div>
          </div>

          {currentShift.topSellingProducts.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-xs font-medium text-amber-800 mb-2">Top Products</div>
              <div className="space-y-1">
                {currentShift.topSellingProducts.slice(0, 3).map((product, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-amber-700 truncate">{product.productName}</span>
                    <span className="font-medium text-amber-900">
                      {product.quantity} × {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No active shift</p>
          <p className="text-xs text-gray-500 mt-1">Open a shift to start tracking sales</p>
        </div>
      )}
    </div>
  )

  const renderCashTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Cash Management</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCashIn}
            disabled={!cashDrawerState.isOpen}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-300"
          >
            Cash In
          </button>
          <button
            onClick={handleCashOut}
            disabled={!cashDrawerState.isOpen}
            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:bg-gray-300"
          >
            Cash Out
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="text-sm font-medium text-amber-800 mb-2">Cash Drawer Status</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-amber-700">Status:</span>
              <span className={`font-medium ${cashDrawerState.isOpen ? 'text-amber-900' : 'text-gray-600'}`}>
                {cashDrawerState.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Current Balance:</span>
              <span className="font-medium text-amber-900">
                {formatCurrency(cashDrawerState.currentBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Expected Balance:</span>
              <span className="font-medium text-amber-900">
                {formatCurrency(cashDrawerState.expectedBalance)}
              </span>
            </div>
            {cashDrawerState.isOpen && (
              <div className="flex justify-between">
                <span className="text-amber-700">Difference:</span>
                <span className={`font-medium ${
                  cashDrawerState.overage > 0 ? 'text-green-600' :
                  cashDrawerState.shortage > 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatCurrency(cashDrawerState.overage - cashDrawerState.shortage)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">Today's Summary</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-700">Sales:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(cashDrawer.getSalesTotal())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Refunds:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(cashDrawer.getRefundsTotal())}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Cash In:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(cashDrawer.getCashMovementsTotal('IN'))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Cash Out:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(cashDrawer.getCashMovementsTotal('OUT'))}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-sm font-medium text-purple-800 mb-2">Recent Transactions</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {cashDrawer.getTransactions().slice(-5).reverse().map((transaction) => (
              <div key={transaction.id} className="flex justify-between text-xs">
                <span className="text-purple-700 truncate">{transaction.description}</span>
                <span className={`font-medium ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(transaction.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrdersTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Held Orders</h3>
        <div className="text-xs text-gray-500">
          {orderHoldStats.held} active
        </div>
      </div>

      {heldOrders.length > 0 ? (
        <div className="space-y-2">
          {heldOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="p-3 bg-purple-50 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="text-xs font-medium text-purple-800">{order.id}</div>
                  <div className="text-xs text-purple-600">
                    {order.customerName || 'No customer'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-purple-900">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <div className="text-xs text-purple-600">
                    {order.items.length} items
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-700">
                  Expires: {new Date(order.expiresAt).toLocaleTimeString()}
                </span>
                <button
                  className="text-purple-600 hover:text-purple-800 font-medium"
                  onClick={() => alert(`Order ${order.id} ready for resume`)}
                >
                  Resume
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Archive className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">No held orders</p>
          <p className="text-xs text-gray-500 mt-1">Hold orders to process them later</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-3 hover:border-blue-300 transition-all"
      >
        <Settings className="h-5 w-5 text-blue-600" />
        {(syncStatus.pendingSales > 0 || orderHoldStats.held > 0) && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium">
            {syncStatus.pendingSales + orderHoldStats.held}
          </div>
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">POS Control Panel</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-3">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'shift', label: 'Shift', icon: Clock },
                { id: 'cash', label: 'Cash', icon: DollarSign },
                { id: 'orders', label: 'Orders', icon: Archive }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'shift' && renderShiftTab()}
            {activeTab === 'cash' && renderCashTab()}
            {activeTab === 'orders' && renderOrdersTab()}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}