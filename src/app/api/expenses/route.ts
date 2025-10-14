import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (branchId && branchId !== 'all') {
      where.branchId = branchId
    }
    if (category && category !== 'all') {
      where.category = category
    }
    if (status && status !== 'all') {
      where.status = status
    }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        rejecter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const total = await prisma.expense.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        expenses,
        total,
        hasMore: offset + expenses.length < total
      }
    })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      branchId,
      category,
      description,
      amount,
      date,
      receiptNumber,
      notes
    } = body

    // Validate required fields
    if (!branchId || !category || !description || !amount || !date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: branchId, category, description, amount, date'
      }, { status: 400 })
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0'
      }, { status: 400 })
    }

    // Mock user since auth is not fully implemented
    const userEmail = 'admin@pos-store.com'
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId }
    })

    if (!branch) {
      return NextResponse.json({
        success: false,
        error: 'Branch not found'
      }, { status: 404 })
    }

    const expense = await prisma.expense.create({
      data: {
        branchId,
        category,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        receiptNumber: receiptNumber || null,
        notes: notes || null,
        status: 'PENDING',
        createdBy: user.id
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        expense,
        message: 'Expense created successfully and is pending approval'
      }
    })

  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}