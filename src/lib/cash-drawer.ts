import { formatCurrency } from './utils'

export interface CashDrawerTransaction {
  id: string
  type: 'OPENING' | 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT' | 'CLOSING'
  amount: number
  description: string
  timestamp: string
  cashierName: string
  shiftId?: string
  reference?: string // Sale number or other reference
}

export interface CashDrawerState {
  isOpen: boolean
  openingBalance: number
  currentBalance: number
  expectedBalance: number
  actualBalance: number
  overage: number
  shortage: number
  transactions: CashDrawerTransaction[]
  lastClosedAt?: string
  currentShift?: {
    id: string
    cashierName: string
    startTime: string
    endTime?: string
    openingBalance: number
  }
}

export class CashDrawerManager {
  private state: CashDrawerState = {
    isOpen: false,
    openingBalance: 0,
    currentBalance: 0,
    expectedBalance: 0,
    actualBalance: 0,
    overage: 0,
    shortage: 0,
    transactions: []
  }

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('cashDrawerState')
      if (saved) {
        this.state = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading cash drawer state:', error)
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('cashDrawerState', JSON.stringify(this.state))
    } catch (error) {
      console.error('Error saving cash drawer state:', error)
    }
  }

  openDrawer(openingBalance: number, cashierName: string, shiftId?: string): void {
    if (this.state.isOpen) {
      throw new Error('Cash drawer is already open')
    }

    this.state = {
      ...this.state,
      isOpen: true,
      openingBalance,
      currentBalance: openingBalance,
      expectedBalance: openingBalance,
      actualBalance: openingBalance,
      overage: 0,
      shortage: 0,
      transactions: [
        {
          id: this.generateTransactionId(),
          type: 'OPENING',
          amount: openingBalance,
          description: 'Opening balance',
          timestamp: new Date().toISOString(),
          cashierName,
          shiftId
        }
      ],
      currentShift: {
        id: shiftId || this.generateShiftId(),
        cashierName,
        startTime: new Date().toISOString()
      }
    }

    this.saveToStorage()
  }

  closeDrawer(cashierName: string, finalCashCount?: number): void {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer is not open')
    }

    const closingBalance = finalCashCount || this.state.currentBalance
    const expectedBalance = this.state.expectedBalance

    const closingTransaction: CashDrawerTransaction = {
      id: this.generateTransactionId(),
      type: 'CLOSING',
      amount: closingBalance,
      description: 'Closing balance',
      timestamp: new Date().toISOString(),
      cashierName,
      shiftId: this.state.currentShift?.id
    }

    this.state = {
      ...this.state,
      isOpen: false,
      currentBalance: closingBalance,
      actualBalance: closingBalance,
      overage: closingBalance - expectedBalance,
      shortage: expectedBalance - closingBalance,
      transactions: [...this.state.transactions, closingTransaction],
      lastClosedAt: new Date().toISOString(),
      currentShift: this.state.currentShift ? {
        ...this.state.currentShift,
        endTime: new Date().toISOString()
      } : undefined
    }

    this.saveToStorage()
  }

  recordSale(amount: number, cashierName: string, saleNumber: string): void {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer must be open to record sales')
    }

    const transaction: CashDrawerTransaction = {
      id: this.generateTransactionId(),
      type: 'SALE',
      amount,
      description: `Sale ${saleNumber}`,
      timestamp: new Date().toISOString(),
      cashierName,
      reference: saleNumber
    }

    this.state = {
      ...this.state,
      currentBalance: this.state.currentBalance + amount,
      expectedBalance: this.state.expectedBalance + amount,
      transactions: [...this.state.transactions, transaction]
    }

    this.saveToStorage()
  }

  recordRefund(amount: number, cashierName: string, saleNumber: string): void {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer must be open to record refunds')
    }

    const transaction: CashDrawerTransaction = {
      id: this.generateTransactionId(),
      type: 'REFUND',
      amount: -amount,
      description: `Refund ${saleNumber}`,
      timestamp: new Date().toISOString(),
      cashierName,
      reference: saleNumber
    }

    this.state = {
      ...this.state,
      currentBalance: this.state.currentBalance - amount,
      expectedBalance: this.state.expectedBalance - amount,
      transactions: [...this.state.transactions, transaction]
    }

    this.saveToStorage()
  }

  recordCashIn(amount: number, description: string, cashierName: string): void {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer must be open to record cash in')
    }

    const transaction: CashDrawerTransaction = {
      id: this.generateTransactionId(),
      type: 'CASH_IN',
      amount,
      description,
      timestamp: new Date().toISOString(),
      cashierName
    }

    this.state = {
      ...this.state,
      currentBalance: this.state.currentBalance + amount,
      expectedBalance: this.state.expectedBalance + amount,
      transactions: [...this.state.transactions, transaction]
    }

    this.saveToStorage()
  }

  recordCashOut(amount: number, description: string, cashierName: string): void {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer must be open to record cash out')
    }

    const transaction: CashDrawerTransaction = {
      id: this.generateTransactionId(),
      type: 'CASH_OUT',
      amount: -amount,
      description,
      timestamp: new Date().toISOString(),
      cashierName
    }

    this.state = {
      ...this.state,
      currentBalance: this.state.currentBalance - amount,
      expectedBalance: this.state.expectedBalance - amount,
      transactions: [...this.state.transactions, transaction]
    }

    this.saveToStorage()
  }

  getState(): CashDrawerState {
    return { ...this.state }
  }

  getTransactions(type?: CashDrawerTransaction['type']): CashDrawerTransaction[] {
    if (type) {
      return this.state.transactions.filter(t => t.type === type)
    }
    return [...this.state.transactions]
  }

  getSalesTotal(): number {
    return this.state.transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  getRefundsTotal(): number {
    return this.state.transactions
      .filter(t => t.type === 'REFUND')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }

  getCashMovementsTotal(type: 'IN' | 'OUT'): number {
    const transactionType = type === 'IN' ? 'CASH_IN' : 'CASH_OUT'
    return this.state.transactions
      .filter(t => t.type === transactionType)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }

  generateDailyReport(date: string = new Date().toISOString().split('T')[0]): {
    transactions: CashDrawerTransaction[]
    totalSales: number
    totalRefunds: number
    netSales: number
    cashIn: number
    cashOut: number
    netCash: number
  } {
    const dayTransactions = this.state.transactions.filter(t =>
      t.timestamp.startsWith(date)
    )

    return {
      transactions: dayTransactions,
      totalSales: dayTransactions
        .filter(t => t.type === 'SALE')
        .reduce((sum, t) => sum + t.amount, 0),
      totalRefunds: dayTransactions
        .filter(t => t.type === 'REFUND')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      netSales: dayTransactions
        .filter(t => t.type === 'SALE')
        .reduce((sum, t) => sum + t.amount, 0) -
        dayTransactions
        .filter(t => t.type === 'REFUND')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      cashIn: dayTransactions
        .filter(t => t.type === 'CASH_IN')
        .reduce((sum, t) => sum + t.amount, 0),
      cashOut: dayTransactions
        .filter(t => t.type === 'CASH_OUT')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      netCash: dayTransactions
        .filter(t => ['SALE', 'CASH_IN'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0) -
        dayTransactions
        .filter(t => ['REFUND', 'CASH_OUT'].includes(t.type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    }
  }

  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }

  private generateShiftId(): string {
    return `SHIFT-${Date.now()}`
  }

  // Quick balance check
  quickBalanceCheck(): {
    currentBalance: number
    expectedBalance: number
    salesCount: number
    refundsCount: number
  } {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer is not open')
    }
    return {
      currentBalance: this.state.currentBalance,
      expectedBalance: this.state.expectedBalance,
      salesCount: this.state.transactions.filter(t => t.type === 'SALE').length,
      refundsCount: this.state.transactions.filter(t => t.type === 'REFUND').length
    }
  }

  // Validate cash count
  validateCashCount(countedCash: number): {
    expected: number
    counted: number
    difference: number
    isOver: boolean
    isShort: boolean
  } {
    if (!this.state.isOpen) {
      throw new Error('Cash drawer is not open')
    }

    const expected = this.state.expectedBalance
    const difference = countedCash - expected

    return {
      expected,
      counted: countedCash,
      difference,
      isOver: difference > 0,
      isShort: difference < 0
    }
  }

  // Reset drawer (for emergency situations)
  resetDrawer(): void {
    this.state = {
      isOpen: false,
      openingBalance: 0,
      currentBalance: 0,
      expectedBalance: 0,
      actualBalance: 0,
      overage: 0,
      shortage: 0,
      transactions: [],
      currentShift: undefined
    }
    this.saveToStorage()
  }
}

export const cashDrawer = new CashDrawerManager()