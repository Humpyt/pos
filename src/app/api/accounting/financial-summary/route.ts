import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range
    const now = new Date()
    let start: Date
    let end: Date

    if (startDate) {
      start = new Date(startDate)
    } else {
      // Default to current month
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    if (endDate) {
      end = new Date(endDate)
    } else {
      // Default to current date
      end = now
    }

    // Build where clauses
    const salesWhere: any = {
      createdAt: {
        gte: start,
        lte: end
      },
      status: 'COMPLETED'
    }

    const expensesWhere: any = {
      date: {
        gte: start,
        lte: end
      }
    }

    if (branchId && branchId !== 'all') {
      salesWhere.branchId = branchId
      expensesWhere.branchId = branchId
    }

    // Fetch sales data
    const sales = await prisma.sale.findMany({
      where: salesWhere,
      include: {
        items: true
      }
    })

    // Fetch expense data
    const expenses = await prisma.expense.findMany({
      where: expensesWhere,
      include: {
        branch: true
      }
    })

    // Calculate financial metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Calculate cost of goods sold (COGS)
    const totalCOGS = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0)
    }, 0)

    const grossProfit = totalRevenue - totalCOGS
    const netProfit = grossProfit - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Expense breakdown by category
    const expenseBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Revenue and expenses by branch
    const revenueByBranch = sales.reduce((acc, sale) => {
      const branchName = sale.branchId // We'll need to join with branch table
      acc[branchName] = (acc[branchName] || 0) + sale.totalAmount
      return acc
    }, {} as Record<string, number>)

    const expensesByBranch = expenses.reduce((acc, expense) => {
      const branchName = expense.branchId
      acc[branchName] = (acc[branchName] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Get branch names
    const branches = await prisma.branch.findMany({
      where: branchId && branchId !== 'all' ? { id: branchId } : {},
      select: { id: true, name: true }
    })

    const branchMap = branches.reduce((acc, branch) => {
      acc[branch.id] = branch.name
      return acc
    }, {} as Record<string, string>)

    // Transform branch data with names
    const revenueByBranchWithNames = Object.entries(revenueByBranch).reduce((acc, [branchId, revenue]) => {
      acc[branchMap[branchId] || `Branch ${branchId}`] = revenue
      return acc
    }, {} as Record<string, number>)

    const expensesByBranchWithNames = Object.entries(expensesByBranch).reduce((acc, [branchId, expenses]) => {
      acc[branchMap[branchId] || `Branch ${branchId}`] = expenses
      return acc
    }, {} as Record<string, number>)

    // Get expense summary by status
    const expensesByStatus = expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalExpenseAmount = expenses.reduce((sum, expense) =>
      expense.status === 'APPROVED' ? sum + expense.amount : sum, 0
    )

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses: totalExpenseAmount,
        grossProfit,
        netProfit,
        profitMargin,
        totalCOGS,
        expenseBreakdown,
        revenueByBranch: revenueByBranchWithNames,
        expensesByBranch: expensesByBranchWithNames,
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        summary: {
          totalSales: sales.length,
          totalExpensesCount: expenses.length,
          pendingExpenses: expensesByStatus.PENDING || 0,
          approvedExpenses: expensesByStatus.APPROVED || 0,
          rejectedExpenses: expensesByStatus.REJECTED || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching financial summary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial summary' },
      { status: 500 }
    )
  }
}