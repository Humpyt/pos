import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET single customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get customer metrics
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

    const customerWithMetrics = {
      ...customer,
      totalSales,
      totalSpent,
      averageOrderValue,
      lastPurchaseDate: lastPurchase,
      branch: 'Main Store'
    }

    return NextResponse.json({
      success: true,
      data: customerWithMetrics
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// PUT update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, phone, address, customerType, isActive } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and already exists
    if (email && email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'A customer with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        customerType: customerType || 'WALK_IN',
        isActive: isActive !== undefined ? isActive : existingCustomer.isActive
      }
    })

    // Get updated metrics
    const salesData = await prisma.sale.findMany({
      where: { customerId: updatedCustomer.id },
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

    const customerWithMetrics = {
      ...updatedCustomer,
      totalSales,
      totalSpent,
      averageOrderValue,
      lastPurchaseDate: lastPurchase,
      branch: 'Main Store'
    }

    return NextResponse.json({
      success: true,
      data: customerWithMetrics,
      message: 'Customer updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

// DELETE customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { sales: true }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has sales history
    if (existingCustomer._count.sales > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete customer with sales history. Consider deactivating the customer instead.'
        },
        { status: 400 }
      )
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}