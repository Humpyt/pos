import { NextResponse } from 'next/server'
import { ProductService } from '@/lib/product-service'

export async function GET() {
  try {
    const categories = await ProductService.getCategories()

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}