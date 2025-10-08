import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const lowStock = searchParams.get('lowStock') === 'true'

    // If no branchId provided, get the first active branch
    let selectedBranchId = branchId
    if (!selectedBranchId) {
      const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
      selectedBranchId = branches.length > 0 ? branches[0].id : 'default'
    }

    let inventory

    if (lowStock) {
      // Get only low stock items
      inventory = await prisma.inventory.findMany({
        where: {
          branchId: selectedBranchId,
          quantity: {
            lte: prisma.inventory.fields.minStock
          }
        },
        include: {
          product: {
            include: {
              category: true,
              variations: {
                where: {
                  isActive: true
                },
                select: {
                  id: true,
                  name: true,
                  unitPrice: true,
                  costPrice: true
                }
              }
            }
          },
          variation: true,
          batch: true,
          branch: true
        },
        orderBy: {
          quantity: 'asc'
        }
      })
    } else {
      // Get all inventory items
      inventory = await prisma.inventory.findMany({
        where: {
          branchId: selectedBranchId
        },
        include: {
          product: {
            include: {
              category: true,
              variations: {
                where: {
                  isActive: true
                },
                select: {
                  id: true,
                  name: true,
                  unitPrice: true,
                  costPrice: true
                }
              }
            }
          },
          variation: true,
          batch: true,
          branch: true
        },
        orderBy: {
          lastUpdated: 'desc'
        }
      })
    }

    // Transform the data to match the expected interface
    const transformedInventory = inventory.map(item => {
      const mainVariation = item.product.variations[0]

      return {
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          category: item.product.category.name
        },
        variation: item.variation ? {
          id: item.variation.id,
          name: item.variation.name
        } : null,
        batch: item.batch ? {
          id: item.batch.id,
          batchNumber: item.batch.batchNumber,
          expiryDate: item.batch.expiryDate?.toISOString(),
          quantity: item.batch.quantity
        } : null,
        quantity: item.quantity,
        minStock: item.minStock,
        maxStock: item.maxStock,
        unitCost: mainVariation?.costPrice || 0,
        totalValue: item.quantity * (mainVariation?.costPrice || 0),
        lastUpdated: item.lastUpdated.toISOString(),
        branch: item.branch.name
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedInventory,
      branchId: selectedBranchId
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, branchId, quantityChange, batchId, variationId } = body

    if (!productId || !branchId || typeof quantityChange !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update inventory quantity
    const inventory = await prisma.inventory.upsert({
      where: {
        productId_branchId_variationId_batchId: {
          productId,
          branchId,
          variationId: variationId || null,
          batchId: batchId || null
        }
      },
      update: {
        quantity: {
          increment: quantityChange
        },
        lastUpdated: new Date()
      },
      create: {
        productId,
        branchId,
        variationId: variationId || null,
        batchId: batchId || null,
        quantity: Math.max(0, quantityChange),
        minStock: 10,
        reorderPoint: 5,
        lastUpdated: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: inventory
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}