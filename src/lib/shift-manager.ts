import { formatCurrency, formatDate, formatDateTime } from './utils'
import { CashDrawerTransaction } from './cash-drawer'

export interface Shift {
  id: string
  cashierName: string
  branch: string
  startTime: string
  endTime?: string
  openingBalance: number
  closingBalance?: number
  expectedBalance?: number
  actualBalance?: number
  status: 'OPEN' | 'CLOSED' | 'FORCED_CLOSED'

  // Sales metrics
  totalSales: number
  totalRefunds: number
  netSales: number
  totalTransactions: number

  // Cash metrics
  cashSales: number
  cardSales: number
  mobileMoneySales: number
  otherSales: number

  // Cash movements
  cashInAmount: number
  cashOutAmount: number

  // Performance metrics
  averageOrderValue: number
  itemsSold: number
  topSellingProducts: Array<{
    productName: string
    quantity: number
    revenue: number
  }>

  // Notes and issues
  notes?: string
  issues?: string
  cashierNotes?: string
}

export interface ShiftReport {
  shift: Shift
  cashDrawerTransactions: CashDrawerTransaction[]
  summary: {
    totalRevenue: number
    cashTransactions: number
    cashOverage: number
    cashShortage: number
    totalTransactions: number
    averageOrderValue: number
  }
}

export class ShiftManager {
  private currentShift: Shift | null = null
  private shiftHistory: Shift[] = []
  private readonly OPENING_HOURS = {
    morning: { start: 6, end: 14 },    // 6 AM - 2 PM
    evening: { start: 14, end: 22 },  // 2 PM - 10 PM
    night: { start: 22, end: 6 }     // 10 PM - 6 AM
  }

  constructor() {
    this.loadFromStorage()
    this.checkShiftStatus()
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('shiftData')
      if (saved) {
        const data = JSON.parse(saved)
        this.currentShift = data.currentShift
        this.shiftHistory = data.shiftHistory || []
      }
    } catch (error) {
      console.error('Error loading shift data:', error)
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('shiftData', JSON.stringify({
        currentShift: this.currentShift,
        shiftHistory: this.shiftHistory
      }))
    } catch (error) {
      console.error('Error saving shift data:', error)
    }
  }

  private checkShiftStatus(): void {
    if (this.currentShift && this.currentShift.status === 'OPEN') {
      const now = new Date()
      const shiftEnd = this.getCurrentShiftEndTime()

      // Auto-close shift if it's significantly past end time (30 minutes grace period)
      if (shiftEnd && now > new Date(shiftEnd.getTime() + 30 * 60 * 1000)) {
        this.forceCloseShift('Auto-closed due to time limit')
      }
    }
  }

  private getCurrentShiftStartTime(): Date {
    const now = new Date()
    const hour = now.getHours()

    if (hour >= 6 && hour < 14) {
      // Morning shift
      const start = new Date(now)
      start.setHours(6, 0, 0, 0)
      return start
    } else if (hour >= 14 && hour < 22) {
      // Evening shift
      const start = new Date(now)
      start.setHours(14, 0, 0, 0)
      return start
    } else {
      // Night shift
      const start = new Date(now)
      if (hour >= 22) {
        start.setHours(22, 0, 0, 0)
        start.setDate(start.getDate() + 1) // Next day
      } else {
        start.setHours(22, 0, 0, 0)
        start.setDate(start.getDate() - 1) // Previous day
      }
      return start
    }
  }

  private getCurrentShiftEndTime(): Date {
    const now = new Date()
    const hour = now.getHours()

    if (hour >= 6 && hour < 14) {
      // Morning shift ends at 2 PM
      const end = new Date(now)
      end.setHours(14, 0, 0, 0)
      return end
    } else if (hour >= 14 && hour < 22) {
      // Evening shift ends at 10 PM
      const end = new Date(now)
      end.setHours(22, 0, 0, 0)
      return end
    } else {
      // Night shift ends at 6 AM
      const end = new Date(now)
      if (hour >= 22) {
        end.setHours(6, 0, 0, 0)
        end.setDate(end.getDate() + 1)
      } else {
        end.setHours(6, 0, 0, 0)
      }
      return end
    }
  }

  getCurrentShiftName(): string {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 14) return 'Morning'
    if (hour >= 14 && hour < 22) return 'Evening'
    return 'Night'
  }

  openShift(
    cashierName: string,
    branch: string,
    openingBalance: number,
    options?: {
      customStartTime?: Date
      notes?: string
    }
  ): Shift {
    if (this.currentShift && this.currentShift.status === 'OPEN') {
      throw new Error('A shift is already open')
    }

    const startTime = options?.customStartTime || this.getCurrentShiftStartTime()
    const shiftName = this.getCurrentShiftName()

    const newShift: Shift = {
      id: this.generateShiftId(),
      cashierName,
      branch,
      startTime: startTime.toISOString(),
      openingBalance,
      status: 'OPEN',
      totalSales: 0,
      totalRefunds: 0,
      netSales: 0,
      totalTransactions: 0,
      cashSales: 0,
      cardSales: 0,
      mobileMoneySales: 0,
      otherSales: 0,
      cashInAmount: 0,
      cashOutAmount: 0,
      averageOrderValue: 0,
      itemsSold: 0,
      topSellingProducts: [],
      notes: options?.notes
        ? `${shiftName} shift started`
        : `${shiftName} shift (6 AM - 2 PM)`
    }

    this.currentShift = newShift
    this.saveToStorage()

    return newShift
  }

  closeShift(
    closingBalance?: number,
    options?: {
      notes?: string
      issues?: string
      cashierNotes?: string
      forced?: boolean
    }
  ): Shift {
    if (!this.currentShift) {
      throw new Error('No active shift to close')
    }

    if (this.currentShift.status === 'CLOSED') {
      throw new Error('Shift is already closed')
    }

    const endTime = new Date()
    const actualBalance = closingBalance || this.currentShift.openingBalance

    this.currentShift = {
      ...this.currentShift,
      endTime: endTime.toISOString(),
      closingBalance: actualBalance,
      expectedBalance: this.currentShift.openingBalance + this.currentShift.netSales,
      actualBalance,
      status: options?.forced ? 'FORCED_CLOSED' : 'CLOSED',
      notes: options?.notes || this.currentShift.notes,
      issues: options?.issues,
      cashierNotes: options?.cashierNotes
    }

    // Add to history
    this.shiftHistory.push({ ...this.currentShift })

    // Clear current shift
    const closedShift = { ...this.currentShift }
    this.currentShift = null

    this.saveToStorage()
    return closedShift
  }

  forceCloseShift(reason: string): Shift {
    return this.closeShift(undefined, {
      forced: true,
      notes: `Force closed: ${reason}`,
      issues: reason
    })
  }

  getCurrentShift(): Shift | null {
    this.checkShiftStatus()
    return this.currentShift
  }

  updateShiftMetrics(saleData: {
    totalAmount: number
    paymentMethod: string
    itemCount: number
    items: Array<{ name: string; quantity: number; price: number }>
  }): void {
    if (!this.currentShift || this.currentShift.status !== 'OPEN') {
      return
    }

    // Update basic metrics
    this.currentShift.totalTransactions++
    this.currentShift.totalSales += saleData.totalAmount
    this.currentShift.itemsSold += saleData.itemCount

    // Update payment method breakdown
    switch (saleData.paymentMethod) {
      case 'CASH':
        this.currentShift.cashSales += saleData.totalAmount
        break
      case 'CARD':
        this.currentShift.cardSales += saleData.totalAmount
        break
      case 'MOBILE_MONEY':
        this.currentShift.mobileMoneySales += saleData.totalAmount
        break
      default:
        this.currentShift.otherSales += saleData.totalAmount
        break
    }

    // Calculate average order value
    if (this.currentShift.totalTransactions > 0) {
      this.currentShift.averageOrderValue = this.currentShift.totalSales / this.currentShift.totalTransactions
    }

    // Update top selling products
    saleData.items.forEach(item => {
      const existing = this.currentShift.topSellingProducts.find(p => p.productName === item.name)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
      } else {
        this.currentShift.topSellingProducts.push({
          productName: item.name,
          quantity: item.quantity,
          revenue: item.price * item.quantity
        })
      }
    })

    // Sort top products by revenue
    this.currentShift.topSellingProducts.sort((a, b) => b.revenue - a.revenue)
    this.currentShift.topSellingProducts = this.currentShift.topSellingProducts.slice(0, 10)

    this.saveToStorage()
  }

  recordRefund(refundAmount: number): void {
    if (!this.currentShift || this.currentShift.status !== 'OPEN') {
      return
    }

    this.currentShift.totalRefunds += refundAmount
    this.currentShift.netSales = this.currentShift.totalSales - this.currentShift.totalRefunds

    // Recalculate average order value
    if (this.currentShift.totalTransactions > 0) {
      this.currentShift.averageOrderValue = this.currentShift.netSales / this.currentShift.totalTransactions
    }

    this.saveToStorage()
  }

  recordCashMovement(amount: number, type: 'IN' | 'OUT'): void {
    if (!this.currentShift || this.currentShift.status !== 'OPEN') {
      return
    }

    if (type === 'IN') {
      this.currentShift.cashInAmount += amount
    } else {
      this.currentShift.cashOutAmount += amount
    }

    this.saveToStorage()
  }

  getShiftHistory(date?: string): Shift[] {
    if (date) {
      return this.shiftHistory.filter(shift =>
        shift.startTime.startsWith(date)
      )
    }
    return [...this.shiftHistory].sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )
  }

  getShiftById(shiftId: string): Shift | null {
    if (this.currentShift && this.currentShift.id === shiftId) {
      return this.currentShift
    }
    return this.shiftHistory.find(shift => shift.id === shiftId) || null
  }

  getShiftSummary(shift?: Shift): {
    shift: Shift
    summary: {
      totalRevenue: number
      cashTransactions: number
      cashOverage: number
      cashShortage: number
      totalTransactions: number
      averageOrderValue: number
    }
  } | null {
    const targetShift = shift || this.currentShift
    if (!targetShift) {
      return null
    }

    const cashOverage = targetShift.actualBalance
      ? targetShift.actualBalance - (targetShift.openingBalance + targetShift.netSales)
      : 0

    return {
      shift: targetShift,
      summary: {
        totalRevenue: targetShift.netSales,
        cashTransactions: targetShift.totalTransactions,
        cashOverage,
        cashShortage: cashOverage < 0 ? Math.abs(cashOverage) : 0,
        totalTransactions: targetShift.totalTransactions,
        averageOrderValue: targetShift.averageOrderValue
      }
    }
  }

  getDailySummary(date: string): {
    shifts: Shift[]
    totalRevenue: number
    totalTransactions: number
    totalRefunds: number
    cashOverage: number
    cashShortage: number
    topPerformers: Array<{
      cashierName: string
      revenue: number
      transactions: number
    }>
  } {
    const dayShifts = this.shiftHistory.filter(shift =>
      shift.startTime.startsWith(date)
    )

    if (this.currentShift &&
        this.currentShift.startTime.startsWith(date) &&
        this.currentShift.status === 'OPEN') {
      dayShifts.push(this.currentShift)
    }

    const totalRevenue = dayShifts.reduce((sum, shift) => sum + shift.netSales, 0)
    const totalTransactions = dayShifts.reduce((sum, shift) => sum + shift.totalTransactions, 0)
    const totalRefunds = dayShifts.reduce((sum, shift) => sum + shift.totalRefunds, 0)

    // Calculate total cash overage/shortage
    const cashOverage = dayShifts.reduce((sum, shift) => {
      return sum + (shift.actualBalance ? shift.actualBalance - (shift.openingBalance + shift.netSales) : 0)
    }, 0)

    // Group by cashier for performance metrics
    const cashierPerformance = dayShifts.reduce((acc, shift) => {
      const existing = acc.find(c => c.cashierName === shift.cashierName)
      if (existing) {
        existing.revenue += shift.netSales
        existing.transactions += shift.totalTransactions
      } else {
        acc.push({
          cashierName: shift.cashierName,
          revenue: shift.netSales,
          transactions: shift.totalTransactions
        })
      }
      return acc
    }, [] as Array<{ cashierName: string; revenue: number; transactions: number }>)

    return {
      shifts: dayShifts,
      totalRevenue,
      totalTransactions,
      totalRefunds,
      cashOverage,
      cashShortage: cashOverage < 0 ? Math.abs(cashOverage) : 0,
      topPerformers: cashierPerformance
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    }
  }

  getWeeklySummary(weekStart: Date): {
  shifts: Shift[]
    totalRevenue: number
    totalTransactions: number
    cashOverage: number
    cashShortage: number
  } {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weekShifts = this.shiftHistory.filter(shift => {
      const shiftDate = new Date(shift.startTime)
      return shiftDate >= weekStart && shiftDate < weekEnd
    })

    const totalRevenue = weekShifts.reduce((sum, shift) => sum + shift.netSales, 0)
    const totalTransactions = weekShifts.reduce((sum, shift) => sum + shift.totalTransactions, 0)

    const cashOverage = weekShifts.reduce((sum, shift) => {
      return sum + (shift.actualBalance ? shift.actualBalance - (shift.openingBalance + shift.netSales) : 0)
    }, 0)

    return {
      shifts: weekShifts,
      totalRevenue,
      totalTransactions,
      cashOverage,
      cashShortage: cashOverage < 0 ? Math.abs(cashOverage) : 0
    }
  }

  getActiveShifts(): Shift[] {
    if (this.currentShift && this.currentShift.status === 'OPEN') {
      return [this.currentShift]
    }
    return []
  }

  generateShiftReport(shift: Shift): ShiftReport {
    // This would be expanded to include cash drawer transactions
    return {
      shift,
      cashDrawerTransactions: [], // Would fetch from cash drawer
      summary: {
        totalRevenue: shift.netSales,
        cashTransactions: shift.totalTransactions,
        cashOverage: shift.actualBalance
          ? shift.actualBalance - (shift.openingBalance + shift.netSales)
          : 0,
        cashShortage: 0,
        totalTransactions: shift.totalTransactions,
        averageOrderValue: shift.averageOrderValue
      }
    }
  }

  private generateShiftId(): string {
    return `SHIFT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  // Export/Import functionality
  exportShifts(): string {
    return JSON.stringify({
      currentShift: this.currentShift,
      shiftHistory: this.shiftHistory
    }, null, 2)
  }

  importShifts(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      this.currentShift = data.currentShift
      this.shiftHistory = data.shiftHistory || []
      this.saveToStorage()
    } catch (error) {
      console.error('Error importing shifts:', error)
      throw new Error('Invalid shift data')
    }
  }
}

export const shiftManager = new ShiftManager()