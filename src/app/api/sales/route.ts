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

    // Broadcast inventory update to connected clients
    // This will be used for real-time updates
    const broadcastUpdate = {
      type: 'inventory_update',
      timestamp: new Date().toISOString(),
      branchId: validBranchId,
      items: items.map(item => ({
        productId: item.product.id,
        quantitySold: item.quantity
      }))
    }

    // In a real implementation, you would use WebSocket or SSE
    // For now, we'll just return the success response
    console.log('Inventory update broadcast:', broadcastUpdate)

    return NextResponse.json({
      success: true,
      data: {
        sale: result,
        inventoryUpdates: broadcastUpdate
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