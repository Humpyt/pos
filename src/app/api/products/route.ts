import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/product-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const search = searchParams.get('search')

    // If no branchId provided, get the first active branch
    let selectedBranchId = branchId
    if (!selectedBranchId) {
      const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      })
      selectedBranchId = branches.length > 0 ? branches[0].id : 'default'
    }

    let products
    if (search) {
      products = await ProductService.searchProducts(search, selectedBranchId)
    } else {
      products = await ProductService.getProductsForPOS(selectedBranchId)
    }

    return NextResponse.json({
      success: true,
      data: products,
      branchId: selectedBranchId
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}