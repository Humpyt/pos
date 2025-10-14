import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, rejectionReason } = body // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Must be "approve" or "reject"'
      }, { status: 400 })
    }

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

    // Don't allow approving/rejecting already processed expenses
    if (existingExpense.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: `Expense is already ${existingExpense.status.toLowerCase()}`
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

    // Check if user has permission to approve/reject
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({
        success: false,
        error: 'You do not have permission to approve or reject expenses'
      }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      updatedAt: new Date()
    }

    if (action === 'approve') {
      updateData.approvedBy = user.id
      updateData.approvedAt = new Date()
    } else {
      updateData.rejectedBy = user.id
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason || 'No reason provided'
    }

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

    // Trigger real-time update for accounting page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('expense_updated', {
        detail: {
          type: action === 'approve' ? 'expense_approved' : 'expense_rejected',
          expense,
          timestamp: new Date().toISOString()
        }
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        expense,
        message: `Expense ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      }
    })

  } catch (error) {
    console.error('Error processing expense approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process expense approval' },
      { status: 500 }
    )
  }
}