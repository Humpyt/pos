import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      productId,
      variationId,
      batchId,
      branchId,
      quantityChange,
      reason,
      reference,
      offlineId
    } = body

    // Validate required fields
    if (!productId || !branchId || !quantityChange || !reason) {
      return NextResponse.json({
        error: 'Missing required fields: productId, branchId, quantityChange, reason'
      }, { status: 400 })
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find existing inventory record
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        productId,
        branchId,
        variationId: variationId || null,
        batchId: batchId || null
      }
    })

    if (!existingInventory) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 })
    }

    // Check if adjustment would result in negative stock
    if (existingInventory.quantity + quantityChange < 0) {
      return NextResponse.json({
        error: 'Insufficient stock for this adjustment'
      }, { status: 400 })
    }

    // Update inventory quantity
    const updatedInventory = await prisma.inventory.update({
      where: { id: existingInventory.id },
      data: {
        quantity: existingInventory.quantity + quantityChange,
        lastUpdated: new Date(),
        updatedBy: user.id
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        },
        branch: {
          select: {
            name: true
          }
        },
        variation: {
          select: {
            name: true,
            sku: true
          }
        },
        batch: {
          select: {
            batchNumber: true,
            expiryDate: true
          }
        }
      }
    })

    // Create inventory log entry
    await prisma.inventoryLog.create({
      data: {
        inventoryId: existingInventory.id,
        productId,
        variationId,
        batchId,
        branchId,
        quantityChange,
        previousQuantity: existingInventory.quantity,
        newQuantity: updatedInventory.quantity,
        reason: reason.toUpperCase(),
        reference: reference || `Offline sync: ${offlineId}`,
        userId: user.id,
        createdAt: new Date()
      }
    })

    // Create inventory transaction for tracking
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: existingInventory.id,
        type: quantityChange > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(quantityChange),
        reference: reference || `Offline sync: ${offlineId}`,
        userId: user.id,
        metadata: {
          reason,
          offlineId,
          previousQuantity: existingInventory.quantity,
          newQuantity: updatedInventory.quantity
        }
      }
    })

    return NextResponse.json({
      success: true,
      inventory: updatedInventory,
      adjustment: {
        productId,
        quantityChange,
        reason,
        reference,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json({
      error: 'Failed to process inventory adjustment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}