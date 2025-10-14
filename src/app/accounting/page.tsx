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
  Filter
} from 'lucide-react'
import { PageHeader, StatCard, LoadingState, DataTable, StatusBadge } from '@/components/shared/DesignSystem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { updateManager } from '@/lib/update-manager'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  receiptNumber?: string
  notes?: string
  branch: string
  approvedBy?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  expenseBreakdown: Record<string, number>
  revenueByBranch: Record<string, number>
  expensesByBranch: Record<string, number>
}

export default function AccountingPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedBranch, setSelectedBranch] = useState('Main Store') // Default to Branch A (Main Store)
  const [isLoading, setIsLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(174670) // Will be updated with real data

  useEffect(() => {
    // Simulate fetching accounting data
    setTimeout(() => {
      setExpenses([
        {
          id: '1',
          category: 'Rent',
          description: 'Monthly rent for Main Store',
          amount: 45000,
          date: '2024-10-01',
          receiptNumber: 'RENT-001',
          branch: 'Main Store',
          approvedBy: 'John Manager',
          status: 'APPROVED',
          createdAt: '2024-10-01T09:00:00Z'
        },
        {
          id: '2',
          category: 'Utilities',
          description: 'Electricity and water bills',
          amount: 8500,
          date: '2024-10-03',
          receiptNumber: 'UTIL-001',
          branch: 'Main Store',
          approvedBy: 'John Manager',
          status: 'APPROVED',
          createdAt: '2024-10-03T14:30:00Z'
        },
        {
          id: '3',
          category: 'Salaries',
          description: 'Staff salaries for September 2024',
          amount: 125000,
          date: '2024-10-05',
          receiptNumber: 'SAL-001',
          notes: '5 employees including overtime',
          branch: 'Main Store',
          status: 'APPROVED',
          createdAt: '2024-10-05T11:00:00Z'
        },
        {
          id: '4',
          category: 'Marketing',
          description: 'Social media advertising campaign',
          amount: 15000,
          date: '2024-10-04',
          receiptNumber: 'MKT-001',
          branch: 'Main Store',
          status: 'PENDING',
          createdAt: '2024-10-04T16:45:00Z'
        },
        {
          id: '5',
          category: 'Supplies',
          description: 'Office supplies and cleaning materials',
          amount: 3500,
          date: '2024-10-02',
          receiptNumber: 'SUP-001',
          branch: 'Branch 2 - Mombasa',
          approvedBy: 'Mary Manager',
          status: 'APPROVED',
          createdAt: '2024-10-02T10:15:00Z'
        },
        {
          id: '6',
          category: 'Transportation',
          description: 'Delivery vehicle fuel and maintenance',
          amount: 12000,
          date: '2024-10-05',
          receiptNumber: 'TRANS-001',
          branch: 'Branch 2 - Mombasa',
          status: 'PENDING',
          createdAt: '2024-10-05T13:20:00Z'
        }
      ])
      setIsLoading(false)
    }, 800)
  }, [])

  // Listen for real-time accounting updates
  useEffect(() => {
    const unsubscribe = updateManager.subscribe('accounting_updated', (event) => {
      console.log('Accounting page: Update received', event.data)
      if (event.data.type === 'sale' && event.data.amount) {
        // Update total revenue when new sales are made
        setTotalRevenue(prev => prev + event.data.amount)
      }
    })

    // Also listen for sales completion events
    const unsubscribeSales = updateManager.subscribe('sale_completed', (event) => {
      console.log('Accounting page: Sale completed, updating financial data', event.data)
      if (event.data.totalAmount) {
        setTotalRevenue(prev => prev + event.data.totalAmount)
      }
    })

    return () => {
      unsubscribe()
      unsubscribeSales()
    }
  }, [])

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || expense.status === selectedStatus
    const matchesBranch = selectedBranch === 'all' || expense.branch === selectedBranch

    return matchesSearch && matchesCategory && matchesStatus && matchesBranch
  })

  const categories = Array.from(new Set(expenses.map(expense => expense.category)))
  const branches = Array.from(new Set(expenses.map(expense => expense.branch)))

  // Mock financial summary (now with dynamic revenue)
  const financialSummary: FinancialSummary = {
    totalRevenue: totalRevenue,
    totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    grossProfit: 0, // Will be calculated
    netProfit: 0, // Will be calculated
    profitMargin: 0, // Will be calculated
    expenseBreakdown: expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>),
    revenueByBranch: {
      'Main Store': Math.round(totalRevenue * 0.6),
      'Branch 2 - Mombasa': Math.round(totalRevenue * 0.25),
      'Branch 3 - Kisumu': Math.round(totalRevenue * 0.15)
    },
    expensesByBranch: expenses.reduce((acc, expense) => {
      acc[expense.branch] = (acc[expense.branch] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }

  financialSummary.grossProfit = financialSummary.totalRevenue
  financialSummary.netProfit = financialSummary.grossProfit - financialSummary.totalExpenses
  financialSummary.profitMargin = (financialSummary.netProfit / financialSummary.totalRevenue) * 100

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </PageHeader>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(financialSummary.totalRevenue)}
          icon={TrendingUp}
          color="bg-green-500"
          change="This month"
          changeType="neutral"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(financialSummary.totalExpenses)}
          icon={TrendingDown}
          color="bg-red-500"
          change="This month"
          changeType="neutral"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(financialSummary.grossProfit)}
          icon={DollarSign}
          color="bg-blue-500"
          change="Revenue - COGS"
          changeType="neutral"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(financialSummary.netProfit)}
          icon={Calculator}
          color={financialSummary.netProfit >= 0 ? "bg-green-500" : "bg-red-500"}
          change="After expenses"
          changeType="neutral"
        />
        <StatCard
          title="Profit Margin"
          value={`${financialSummary.profitMargin.toFixed(1)}%`}
          icon={FileText}
          color={financialSummary.profitMargin >= 0 ? "bg-green-500" : "bg-red-500"}
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
          <p className="text-secondary mb-6">Expenses by category for this month</p>
          <div className="space-y-3">
            {Object.entries(financialSummary.expenseBreakdown).map(([category, amount]) => {
              const percentage = (amount / financialSummary.totalExpenses) * 100
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
        </div>

        {/* Branch Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-primary mb-2 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Branch Performance
          </h2>
          <p className="text-secondary mb-6">Revenue vs expenses by branch</p>
          <div className="space-y-3">
            {Object.entries(financialSummary.revenueByBranch).map(([branch, revenue]) => {
              const expenses = financialSummary.expensesByBranch[branch] || 0
              const profit = revenue - expenses
              const profitMargin = (profit / revenue) * 100

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
                  <option key={branch} value={branch}>{branch}</option>
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
              render: (expense: Expense) => (
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
              render: (expense: Expense) => (
                <Badge variant="outline">{expense.category}</Badge>
              )
            },
            {
              key: 'description',
              label: 'Description',
              render: (expense: Expense) => (
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
              render: (expense: Expense) => (
                <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
              )
            },
            {
              key: 'branch',
              label: 'Branch',
              render: (expense: Expense) => (
                <Badge variant="outline">{expense.branch}</Badge>
              )
            },
            {
              key: 'receipt',
              label: 'Receipt',
              render: (expense: Expense) => (
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
              render: (expense: Expense) => (
                <StatusBadge
                  status={expense.status === 'APPROVED' ? 'success' :
                         expense.status === 'PENDING' ? 'warning' : 'error'}
                >
                  {expense.status}
                </StatusBadge>
              )
            },
            {
              key: 'approvedBy',
              label: 'Approved By',
              render: (expense: Expense) => (
                expense.approvedBy ? (
                  <span className="text-sm text-primary">{expense.approvedBy}</span>
                ) : (
                  <span className="text-muted">-</span>
                )
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (expense: Expense) => (
                <div className="flex justify-end space-x-2">
                  {expense.status === 'PENDING' && (
                    <Button variant="ghost" size="sm" className="text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
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
              onClick: () => console.log('Add Expense clicked')
            }
          }}
        />
      </div>
    </div>
  )
}