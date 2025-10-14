import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'week'
    const branchId = searchParams.get('branchId')
    const granularity = searchParams.get('granularity') || 'day' // hour, day, week, month

    // Calculate date range
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
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const where: any = {
      createdAt: {
        gte: start,
        lte: now
      },
      status: 'COMPLETED'
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        branch: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group data based on granularity
    const groupedData = sales.reduce((acc, sale) => {
      let key: string

      switch (granularity) {
        case 'hour':
          key = sale.createdAt.toISOString().slice(0, 13) + ':00'
          break
        case 'day':
          key = sale.createdAt.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(sale.createdAt)
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = sale.createdAt.toISOString().slice(0, 7)
          break
        default:
          key = sale.createdAt.toISOString().split('T')[0]
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          revenue: 0,
          sales: 0,
          customers: new Set(),
          items: 0,
          profit: 0,
          averageOrderValue: 0
        }
      }

      acc[key].revenue += sale.totalAmount
      acc[key].sales += 1
      acc[key].items += sale.items.reduce((sum, item) => sum + item.quantity, 0)
      acc[key].profit += sale.totalAmount * 0.3 // Assuming 30% profit margin
      if (sale.customerId) {
        acc[key].customers.add(sale.customerId)
      }

      return acc
    }, {} as Record<string, any>)

    // Convert to array and calculate averages
    const trendsData = Object.values(groupedData).map((period: any) => ({
      ...period,
      customers: period.customers.size,
      averageOrderValue: period.sales > 0 ? period.revenue / period.sales : 0
    })).sort((a, b) => a.period.localeCompare(b.period))

    return NextResponse.json({
      success: true,
      data: {
        trends: trendsData,
        granularity,
        period: {
          start: start.toISOString(),
          end: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching trends data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trends data' },
      { status: 500 }
    )
  }
}