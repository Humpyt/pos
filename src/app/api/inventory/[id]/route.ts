import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        variation: true,
        branch: true,
        batch: true
      }
    })

    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inventoryItem
    })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

// PUT update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { quantity, minStock, maxStock, unitPrice, batchNumber } = body

    // Validate required fields
    if (quantity === undefined || minStock === undefined || maxStock === undefined || unitPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the inventory item first
    const existingItem = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: { variation: true, batch: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Handle batch number update
    let batchId = existingItem.batchId
    if (batchNumber && batchNumber !== 'DEFAULT') {
      if (existingItem.batch && existingItem.batch.batchNumber !== batchNumber) {
        // Update existing batch
        await prisma.productBatch.update({
          where: { id: existingItem.batchId },
          data: { batchNumber: batchNumber }
        })
      } else if (!existingItem.batch) {
        // Create new batch
        const newBatch = await prisma.productBatch.create({
          data: {
            batchNumber: batchNumber,
            productId: existingItem.productId,
            manufactureDate: new Date(),
            expiryDate: null,
            quantity: parseInt(quantity),
            costPrice: unitPrice,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        batchId = newBatch.id
      }
    }

    // Update inventory item
    const updatedItem = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        quantity: parseInt(quantity),
        minStock: parseInt(minStock),
        maxStock: parseInt(maxStock),
        batchId: batchId
      },
      include: {
        product: true,
        variation: true,
        branch: true,
        batch: true
      }
    })

    // Update variation unit price if provided
    if (existingItem.variation && unitPrice !== undefined) {
      await prisma.productVariation.update({
        where: { id: existingItem.variationId },
        data: { unitPrice: parseFloat(unitPrice) }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedItem
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

// DELETE inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if inventory item exists
    const existingItem = await prisma.inventory.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Delete the inventory item
    await prisma.inventory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}