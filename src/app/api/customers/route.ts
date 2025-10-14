import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all customers with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type && type !== 'all') {
      where.customerType = type
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { sales: true }
          }
        }
      }),
      prisma.customer.count({ where })
    ])

    // Calculate additional metrics for each customer
    const customersWithMetrics = await Promise.all(
      customers.map(async (customer) => {
        const salesData = await prisma.sale.findMany({
          where: { customerId: customer.id },
          include: {
            items: true
          }
        })

        const totalSales = salesData.length
        const totalSpent = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0)
        const averageOrderValue = totalSales > 0 ? totalSpent / totalSales : 0
        const lastPurchase = salesData.length > 0
          ? salesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null

        return {
          ...customer,
          totalSales,
          totalSpent,
          averageOrderValue,
          lastPurchaseDate: lastPurchase,
          branch: 'Main Store' // Default branch - you might want to track this differently
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: customersWithMetrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address, customerType } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    if (email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'A customer with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        customerType: customerType || 'WALK_IN',
        isActive: true
      }
    })

    // Return customer with default metrics
    const customerWithMetrics = {
      ...customer,
      totalSales: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastPurchaseDate: null,
      branch: 'Main Store'
    }

    return NextResponse.json({
      success: true,
      data: customerWithMetrics,
      message: 'Customer created successfully'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}