import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No inventory IDs provided' },
        { status: 400 }
      )
    }

    // Delete inventory items
    const deleteResult = await prisma.inventory.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} inventory items`
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete inventory items' },
      { status: 500 }
    )
  }
}