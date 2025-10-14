import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const dateRange = searchParams.get('dateRange')
    const branchId = searchParams.get('branchId')
    const format = searchParams.get('format') || 'csv'

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod
    }

    if (branchId && branchId !== 'all') {
      where.branchId = branchId
    }

    // Handle date filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date()
      let startDate: Date | undefined

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          where.createdAt = {
            gte: startDate,
            lt: endDate
          }
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          where.createdAt = {
            gte: startDate
          }
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          where.createdAt = {
            gte: startDate
          }
          break
      }

      if (dateRange === 'today') {
        where.createdAt = {
          gte: startDate
        }
      }
    }

    // Fetch sales data
    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            name: true
          }
        },
        branch: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: sales.map(sale => ({
          id: sale.id,
          saleNumber: sale.saleNumber,
          customerName: sale.customer?.name,
          customerEmail: sale.customer?.email,
          customerPhone: sale.customer?.phone,
          items: sale.items.map(item => ({
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          subtotal: sale.subtotal,
          taxAmount: sale.taxAmount,
          discountAmount: sale.discountAmount,
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          paymentStatus: sale.paymentStatus,
          status: sale.status,
          branch: sale.branch.name,
          cashierName: sale.user.name,
          createdAt: sale.createdAt.toISOString(),
          notes: sale.notes
        }))
      })
    }

    // Generate CSV
    const csvHeaders = [
      'Sale Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items Count',
      'Total Items',
      'Subtotal',
      'Discount',
      'Tax',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Sale Status',
      'Branch',
      'Cashier',
      'Notes'
    ]

    const csvRows = sales.map(sale => {
      const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0)
      const itemsList = sale.items.map(item =>
        `${item.product.name} (${item.quantity} × ${item.unitPrice})`
      ).join('; ')

      return [
        sale.saleNumber,
        sale.createdAt.toISOString().split('T')[0],
        sale.customer?.name || 'Walk-in',
        sale.customer?.email || '',
        sale.customer?.phone || '',
        sale.items.length.toString(),
        totalItems.toString(),
        sale.subtotal.toString(),
        sale.discountAmount.toString(),
        sale.taxAmount.toString(),
        sale.totalAmount.toString(),
        sale.paymentMethod,
        sale.paymentStatus,
        sale.status,
        sale.branch.name,
        sale.user.name,
        (sale.notes || '').replace(/"/g, '""') // Escape quotes in notes
      ]
    })

    // Convert to CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row =>
        row.map(field => `"${field}"`).join(',')
      )
    ].join('\n')

    // Create CSV blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create filename with date
    const filename = `sales-export-${new Date().toISOString().split('T')[0]}.csv`

    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error exporting sales:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export sales' },
      { status: 500 }
    )
  }
}