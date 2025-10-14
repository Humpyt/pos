'use client'

import { useState, useEffect } from 'react'
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Receipt,
  Building2,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Filter,
  X
} from 'lucide-react'
import { PageHeader, StatCard, LoadingState, DataTable, StatusBadge, EmptyState } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateManager } from '@/lib/update-manager'
import ExpenseModal from '@/components/accounting/ExpenseModal'
import ApprovalModal from '@/components/accounting/ApprovalModal'


// API Response Types
interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  totalCOGS: number
  expenseBreakdown: Record<string, number>
  revenueByBranch: Record<string, number>
  expensesByBranch: Record<string, number>
  period: {
    start: string
    end: string
  }
  summary: {
    totalSales: number
    totalExpensesCount: number
    pendingExpenses: number
    approvedExpenses: number
    rejectedExpenses: number
  }
}

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  const fetchExpenses = async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (selectedBranch !== 'all') params.append('branchId', selectedBranch)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/expenses?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setExpenses(result.data.expenses)
      } else {
        throw new Error(result.error || 'Failed to fetch expenses')
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch expenses')
    }
  }

  const fetchFinancialSummary = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBranch !== 'all') params.append('branchId', selectedBranch)

      const response = await fetch(`/api/accounting/financial-summary?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setFinancialSummary(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch financial summary')
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch financial summary')
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBranches(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchExpenses(),
      fetchFinancialSummary(),
      fetchBranches()
    ])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedBranch, selectedCategory, selectedStatus, searchTerm])

  // Listen for real-time accounting updates
  useEffect(() => {
    const unsubscribe = updateManager.subscribe('accounting_updated', (event) => {
      console.log('Accounting page: Update received', event.data)
      loadData()
    })

    // Listen for expense updates
    const unsubscribeExpenses = updateManager.subscribe('expense_updated', (event) => {
      console.log('Accounting page: Expense update received', event.data)
      loadData()
    })

    // Listen for sales completion events
    const unsubscribeSales = updateManager.subscribe('sale_completed', (event) => {
      console.log('Accounting page: Sale completed, updating financial data', event.data)
      fetchFinancialSummary()
    })

    return () => {
      unsubscribe()
      unsubscribeExpenses()
      unsubscribeSales()
    }
  }, [])

  const handleAddExpense = () => {
    setSelectedExpense(null)
    setShowExpenseModal(true)
  }

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense)
    setShowExpenseModal(true)
  }

  const handleApproveReject = (expense: any, action: 'approve' | 'reject') => {
    setSelectedExpense(expense)
    setApprovalAction(action)
    setShowApprovalModal(true)
  }

  const handleDeleteExpense = async (expense: any) => {
    if (!confirm(`Are you sure you want to delete this expense? (${expense.description})`)) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        await loadData()
      } else {
        alert(result.error || 'Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  const onExpenseModalSuccess = () => {
    loadData()
  }

  const onApprovalModalSuccess = () => {
    loadData()
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Accounting Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Use real data or fallback to empty state
  const summaryData = financialSummary || {
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    expenseBreakdown: {},
    revenueByBranch: {},
    expensesByBranch: {}
  }

  const categories = Array.from(new Set(expenses.map(expense => expense.category)))
  const filteredExpenses = expenses // Server-side filtering applied

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'APPROVED': 'text-green-600',
      'PENDING': 'text-yellow-600',
      'REJECTED': 'text-red-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
      'APPROVED': 'success',
      'PENDING': 'warning',
      'REJECTED': 'destructive'
    }
    return variants[status] || 'warning'
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Accounting"
        subtitle="Manage expenses, track financial performance, and generate reports"
      >
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleAddExpense}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </PageHeader>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summaryData.totalRevenue)}
          icon={TrendingUp}
          color="bg-green-500"
          change={financialSummary?.summary?.totalSales ? `${financialSummary.summary.totalSales} sales` : "This month"}
          changeType="neutral"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summaryData.totalExpenses)}
          icon={TrendingDown}
          color="bg-red-500"
          change={financialSummary?.summary?.approvedExpenses ? `${financialSummary.summary.approvedExpenses} approved` : "This month"}
          changeType="neutral"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(summaryData.grossProfit)}
          icon={DollarSign}
          color="bg-blue-500"
          change="Revenue - COGS"
          changeType="neutral"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(summaryData.netProfit)}
          icon={Calculator}
          color={summaryData.netProfit >= 0 ? "bg-green-500" : "bg-red-500"}
          change="After expenses"
          changeType="neutral"
        />
        <StatCard
          title="Profit Margin"
          value={`${summaryData.profitMargin.toFixed(1)}%`}
          icon={FileText}
          color={summaryData.profitMargin >= 0 ? "bg-green-500" : "bg-red-500"}
          change="Net profit %"
          changeType="neutral"
        />
      </div>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Expense Breakdown
          </h2>
          <p className="text-secondary mb-6">Expenses by category for current period</p>
          {Object.keys(summaryData.expenseBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(summaryData.expenseBreakdown).map(([category, amount]) => {
                const percentage = summaryData.totalExpenses > 0 ? (amount / summaryData.totalExpenses) * 100 : 0
                return (
                  <div key={category} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-primary">{category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{formatCurrency(amount)}</p>
                      <p className="text-xs text-secondary">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary">
              No expense data available
            </div>
          )}
        </div>

        {/* Branch Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Branch Performance
          </h2>
          <p className="text-secondary mb-6">Revenue vs expenses by branch</p>
          {Object.keys(summaryData.revenueByBranch).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(summaryData.revenueByBranch).map(([branch, revenue]) => {
                const expenses = summaryData.expensesByBranch[branch] || 0
                const profit = revenue - expenses
                const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

                return (
                  <div key={branch} className="p-3 bg-surface rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-primary">{branch}</span>
                      <span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-secondary">Revenue:</span>
                        <span className="ml-2 font-medium text-primary">{formatCurrency(revenue)}</span>
                      </div>
                      <div>
                        <span className="text-secondary">Expenses:</span>
                        <span className="ml-2 font-medium text-primary">{formatCurrency(expenses)}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-secondary">Margin:</span>
                        <span className={`font-medium ${profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary">
              No branch performance data available
            </div>
          )}
        </div>
      </div>

      {/* Expenses Management */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
          <Receipt className="h-5 w-5 mr-2" />
          Expense Management
        </h2>
        <p className="text-secondary mb-6">Track and manage all business expenses</p>

        {/* Filters */}
        <div className="bg-surface rounded-xl border border-border p-6 mb-6">
          <h3 className="text-md font-medium text-primary mb-4">Expense Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-card"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-card"
              >
                <option value="all">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-card"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <DataTable
          columns={[
            {
              key: 'date',
              label: 'Date',
              render: (expense: any) => (
                <div className="flex flex-col">
                  <span className="font-medium text-primary">{formatDate(expense.date)}</span>
                  <span className="text-xs text-secondary">
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )
            },
            {
              key: 'category',
              label: 'Category',
              render: (expense: any) => (
                <Badge variant="outline">{expense.category}</Badge>
              )
            },
            {
              key: 'description',
              label: 'Description',
              render: (expense: any) => (
                <div className="max-w-xs">
                  <p className="font-medium text-primary">{expense.description}</p>
                  {expense.notes && (
                    <p className="text-xs text-secondary mt-1">{expense.notes}</p>
                  )}
                </div>
              )
            },
            {
              key: 'amount',
              label: 'Amount',
              render: (expense: any) => (
                <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
              )
            },
            {
              key: 'branch',
              label: 'Branch',
              render: (expense: any) => (
                <Badge variant="outline">{expense.branch?.name || 'Unknown'}</Badge>
              )
            },
            {
              key: 'receipt',
              label: 'Receipt',
              render: (expense: any) => (
                expense.receiptNumber ? (
                  <span className="font-mono text-sm text-primary">{expense.receiptNumber}</span>
                ) : (
                  <span className="text-muted">No receipt</span>
                )
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (expense: any) => (
                <StatusBadge
                  status={expense.status === 'APPROVED' ? 'success' :
                         expense.status === 'PENDING' ? 'warning' : 'error'}
                >
                  {expense.status}
                </StatusBadge>
              )
            },
            {
              key: 'createdBy',
              label: 'Created By',
              render: (expense: any) => (
                expense.creator ? (
                  <span className="text-sm text-primary">{expense.creator.name}</span>
                ) : (
                  <span className="text-muted">-</span>
                )
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (expense: any) => (
                <div className="flex justify-end space-x-2">
                  {expense.status === 'PENDING' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600"
                        onClick={() => handleApproveReject(expense, 'approve')}
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleApproveReject(expense, 'reject')}
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditExpense(expense)}
                    title="Edit"
                    disabled={expense.status !== 'PENDING'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDeleteExpense(expense)}
                    title="Delete"
                    disabled={expense.status !== 'PENDING'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
          data={filteredExpenses}
          empty={{
            title: "No expenses found",
            description: searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first expense',
            action: {
              label: "Add Expense",
              onClick: handleAddExpense
            }
          }}
        />
      </div>

      {/* Modals */}
      {showExpenseModal && (
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          expense={selectedExpense}
          onSuccess={onExpenseModalSuccess}
          branches={branches}
        />
      )}

      {showApprovalModal && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          expense={selectedExpense}
          action={approvalAction}
          onSuccess={onApprovalModalSuccess}
        />
      )}
    </div>
  )
}