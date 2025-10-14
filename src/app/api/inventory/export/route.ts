import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')

    // Build where clause
    const where: any = {}

    if (branchId && branchId !== 'all') {
      where.branchId = branchId
    }

    if (category && category !== 'all') {
      where.product = {
        category: category
      }
    }

    // Fetch inventory data
    const inventoryItems = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        },
        variation: true,
        branch: true,
        batch: true
      },
      orderBy: [
        { branch: { name: 'asc' } },
        { product: { name: 'asc' } }
      ]
    })

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'Product Name',
        'SKU',
        'Category',
        'Branch',
        'Variation',
        'Batch Number',
        'Quantity',
        'Min Stock',
        'Max Stock',
        'Unit Price',
        'Total Value',
        'Last Updated'
      ]

      const csvRows = [
        headers.join(','),
        ...inventoryItems.map(item => [
          `"${item.product.name}"`,
          `"${item.product.sku}"`,
          `"${item.product.category}"`,
          `"${item.branch.name}"`,
          `"${item.variation?.name || ''}"`,
          `"${item.batch?.batchNumber || ''}"`,
          item.quantity,
          item.minStock,
          item.maxStock,
          item.variation?.unitPrice || 0,
          item.quantity * (item.variation?.unitPrice || 0),
          `"${item.lastUpdated.toISOString()}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(inventoryItems, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

    // For other formats, return JSON
    return NextResponse.json({
      success: true,
      data: inventoryItems,
      total: inventoryItems.length
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export inventory' },
      { status: 500 }
    )
  }
}