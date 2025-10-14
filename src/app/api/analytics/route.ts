import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'week'
    const branchId = searchParams.get('branchId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range based on timeRange
    const now = new Date()
    let start: Date

    switch (timeRange) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      default:
        if (startDate) {
          start = new Date(startDate)
        } else {
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
    }

    const end = endDate ? new Date(endDate) : now

    // Build where clause
    const where: any = {
      createdAt: {
        gte: start,
        lte: end
      },
      status: 'COMPLETED'
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId
    }

    // Fetch sales data
    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        branch: true,
        customer: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate summary statistics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalSales = sales.length
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.totalAmount * 0.3), 0) // Assuming 30% profit margin
    const uniqueCustomers = new Set(sales.map(sale => sale.customerId)).size
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    // Calculate sales trend data (grouped by day)
    const salesByDay = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          sales: 0,
          revenue: 0,
          profit: 0,
          customers: new Set()
        }
      }
      acc[date].sales += 1
      acc[date].revenue += sale.totalAmount
      acc[date].profit += sale.totalAmount * 0.3
      if (sale.customerId) {
        acc[date].customers.add(sale.customerId)
      }
      return acc
    }, {} as Record<string, any>)

    const salesData = Object.values(salesByDay).map((day: any) => ({
      date: day.date,
      sales: day.sales,
      revenue: day.revenue,
      profit: day.profit,
      customers: day.customers.size
    }))

    // Calculate top products
    const productSales = sales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const key = item.product.id
        if (!acc[key]) {
          acc[key] = {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category?.name || 'Unknown',
            quantitySold: 0,
            revenue: 0,
            profit: 0
          }
        }
        acc[key].quantitySold += item.quantity
        acc[key].revenue += item.totalPrice
        acc[key].profit += item.totalPrice * 0.3
      })
      return acc
    }, {} as Record<string, any>)

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((product: any, index) => ({
        ...product,
        growth: Math.random() * 30 - 5 // Mock growth data for now
      }))

    // Calculate category performance
    const categorySales = sales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const category = item.product.category?.name || 'Unknown'
        if (!acc[category]) {
          acc[category] = {
            category,
            sales: 0,
            revenue: 0,
            profit: 0
          }
        }
        acc[category].sales += 1
        acc[category].revenue += item.totalPrice
        acc[category].profit += item.totalPrice * 0.3
      })
      return acc
    }, {} as Record<string, any>)

    const categoryPerformance = Object.values(categorySales).map((cat: any) => ({
      ...cat,
      growth: Math.random() * 25 - 5 // Mock growth data
    }))

    // Calculate branch performance
    const branchSales = sales.reduce((acc, sale) => {
      const branchId = sale.branchId
      if (!acc[branchId]) {
        acc[branchId] = {
          id: branchId,
          name: sale.branch?.name || `Branch ${branchId}`,
          sales: 0,
          revenue: 0,
          profit: 0,
          customers: new Set()
        }
      }
      acc[branchId].sales += 1
      acc[branchId].revenue += sale.totalAmount
      acc[branchId].profit += sale.totalAmount * 0.3
      if (sale.customerId) {
        acc[branchId].customers.add(sale.customerId)
      }
      return acc
    }, {} as Record<string, any>)

    const branchPerformance = Object.values(branchSales).map((branch: any) => ({
      ...branch,
      customers: branch.customers.size,
      growth: Math.random() * 20 - 5 // Mock growth data
    }))

    // Calculate growth metrics (compare with previous period)
    const previousPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    const previousSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lte: start
        },
        status: 'COMPLETED',
        ...(branchId && branchId !== 'all' && { branchId })
      }
    })

    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const customerGrowth = previousSales.length > 0 ? ((uniqueCustomers - new Set(previousSales.map(s => s.customerId)).size) / new Set(previousSales.map(s => s.customerId)).size) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        summaryStats: {
          totalRevenue,
          totalSales,
          totalProfit,
          totalCustomers: uniqueCustomers,
          averageOrderValue,
          profitMargin,
          customerGrowth,
          revenueGrowth
        },
        salesData,
        topProducts,
        categoryPerformance,
        branchPerformance,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          timeRange
        }
      }
    })

  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}