import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { expense }
    })

  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      category,
      description,
      amount,
      date,
      receiptNumber,
      notes
    } = body

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Don't allow editing approved or rejected expenses
    if (existingExpense.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit expense that has been approved or rejected' },
        { status: 400 }
      )
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0'
      }, { status: 400 })
    }

    const updateData: any = {}
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (date !== undefined) updateData.date = new Date(date)
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber || null
    if (notes !== undefined) updateData.notes = notes || null

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
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
        message: 'Expense updated successfully'
      }
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting approved or rejected expenses
    if (existingExpense.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete expense that has been approved or rejected' },
        { status: 400 }
      )
    }

    await prisma.expense.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Expense deleted successfully'
      }
    })

  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}