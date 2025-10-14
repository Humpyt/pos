import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateSaleNumber } from '@/lib/utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const saleData = await request.json()

    const { saleNumber, items, subtotal, discount, tax, total, paymentMethod, customer, branchId } = saleData

    // Get or create a valid user
    let user = await prisma.user.findUnique({
      where: { email: 'admin@pos-store.com' }
    })

    if (!user) {
      // Create the default user if it doesn't exist
      user = await prisma.user.create({
        data: {
          email: 'admin@pos-store.com',
          name: 'System Administrator',
          password: 'admin123', // In production, this should be hashed
          role: 'ADMIN'
        }
      })
    }

    // Get a valid branch
    let validBranchId = branchId
    if (!validBranchId) {
      const firstBranch = await prisma.branch.findFirst()
      validBranchId = firstBranch?.id || 'default'
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the sale record
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          subtotal,
          discountAmount: discount,
          taxAmount: tax,
          totalAmount: total,
          paymentMethod,
          customerId: customer?.id || null,
          userId: user.id,
          branchId: validBranchId,
          status: 'COMPLETED',
          paymentStatus: 'PAID'
        },
        include: {
          items: true,
          user: {
            select: {
              name: true
            }
          },
          branch: {
            select: {
              name: true
            }
          }
        }
      })

      // Create sale items and update inventory
      for (const item of items) {
        const { product, quantity, totalPrice } = item

        // Create sale item
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity,
            unitPrice: product.price,
            totalPrice,
            costPrice: product.price * 0.7, // Assume 70% cost price per unit
            profit: totalPrice - (product.price * 0.7 * quantity) // Total profit
          }
        })

        // Update inventory
        const inventoryRecord = await tx.inventory.findFirst({
          where: {
            productId: product.id,
            branchId: validBranchId
          }
        })

        if (inventoryRecord) {
          // Decrease stock quantity
          await tx.inventory.update({
            where: { id: inventoryRecord.id },
            data: {
              quantity: {
                decrement: quantity
              },
              lastUpdated: new Date()
            }
          })
        }
      }

      return sale
    })

    // Create update event data for real-time updates
    const updateData = {
      saleNumber: result.saleNumber,
      items: items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subtotal,
      discountAmount: discount,
      taxAmount: tax,
      totalAmount: total,
      paymentMethod,
      branchId: validBranchId,
      customerId: customer?.id,
      userId: user.id,
      createdAt: result.createdAt.toISOString()
    }

    // Trigger real-time update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saleCompleted', { detail: updateData }))
    }

    console.log('Real-time updates triggered for sale:', updateData)

    return NextResponse.json({
      success: true,
      data: {
        sale: result,
        updateData
      }
    })

  } catch (error) {
    console.error('Error processing sale:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process sale' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (branchId && branchId !== 'all') {
      where.branchId = branchId
    }
    if (status && status !== 'all') {
      where.status = status
    }

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
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Transform data to match expected format
    const transformedSales = sales.map(sale => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      customerName: sale.customer?.name,
      customerType: sale.customer?.name ? 'REGULAR' : undefined,
      items: sale.items.map(item => ({
        id: item.id,
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

    return NextResponse.json({
      success: true,
      data: transformedSales
    })

  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}