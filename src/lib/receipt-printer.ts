import { formatCurrency, formatDate, formatDateTime } from './utils'

export interface ReceiptData {
  saleNumber: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  branch: string
  cashierName: string
  createdAt: string
  notes?: string
}

export interface ReceiptSettings {
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  website: string
  taxNumber: string
  receiptHeader: string
  receiptFooter: string
  showTax: boolean
  showCustomerPhone: boolean
  showCustomerEmail: boolean
  showCashier: boolean
  logoUrl?: string
}

export class ReceiptPrinter {
  private settings: ReceiptSettings = {
    storeName: "POS SYSTEM",
    storeAddress: "123 Main Street, Kampala, Uganda",
    storePhone: "+256 700 123 456",
    storeEmail: "info@pos-system.com",
    website: "www.pos-system.com",
    taxNumber: "VAT: UG123456789",
    receiptHeader: "Thank you for shopping with us!",
    receiptFooter: "Please come again soon!",
    showTax: false,
    showCustomerPhone: true,
    showCustomerEmail: false,
    showCashier: true
  }

  updateSettings(settings: Partial<ReceiptSettings>) {
    this.settings = { ...this.settings, ...settings }
  }

  getSettings(): ReceiptSettings {
    return { ...this.settings }
  }

  private getStandardReceiptHTML(data: ReceiptData): string {
    const {
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      website,
      taxNumber,
      receiptHeader,
      receiptFooter,
      showTax,
      showCustomerPhone,
      showCustomerEmail,
      showCashier
    } = this.settings

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${data.saleNumber}</title>
        <style>
          @media print {
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 20px;
              width: 58mm; /* Standard receipt width */
            }
            .receipt {
              max-width: 58mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-info {
              font-size: 10px;
              margin-bottom: 3px;
            }
            .receipt-details {
              margin-bottom: 15px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .items-table {
              margin-bottom: 15px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .item-name {
              flex: 1;
              padding-right: 10px;
            }
            .item-details {
              text-align: right;
              min-width: 80px;
            }
            .totals {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin-bottom: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .grand-total {
              font-weight: bold;
              font-size: 14px;
            }
            .payment-info {
              margin-bottom: 15px;
            }
            .footer {
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .footer-text {
              font-size: 10px;
              margin-bottom: 5px;
            }
            .no-print {
              display: none;
            }
          }

          @media screen {
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: #f5f5f5;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="store-name">${storeName}</div>
            <div class="store-info">${storeAddress}</div>
            <div class="store-info">${storePhone}</div>
            ${storeEmail ? `<div class="store-info">${storeEmail}</div>` : ''}
            ${website ? `<div class="store-info">${website}</div>` : ''}
          </div>

          <div class="receipt-details">
            <div class="detail-row">
              <span>Receipt #:</span>
              <span>${data.saleNumber}</span>
            </div>
            <div class="detail-row">
              <span>Date:</span>
              <span>${formatDate(data.createdAt)}</span>
            </div>
            <div class="detail-row">
              <span>Time:</span>
              <span>${formatDateTime(data.createdAt)}</span>
            </div>
            ${data.customerName ? `
              <div class="detail-row">
                <span>Customer:</span>
                <span>${data.customerName}</span>
              </div>
              ${showCustomerPhone && data.customerPhone ? `
                <div class="detail-row">
                  <span>Phone:</span>
                  <span>${data.customerPhone}</span>
                </div>
              ` : ''}
              ${showCustomerEmail && data.customerEmail ? `
                <div class="detail-row">
                  <span>Email:</span>
                  <span>${data.customerEmail}</span>
                </div>
              ` : ''}
            ` : ''}
            ${showCashier ? `
              <div class="detail-row">
                <span>Cashier:</span>
                <span>${data.cashierName}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span>Branch:</span>
              <span>${data.branch}</span>
            </div>
          </div>

          ${receiptHeader ? `
            <div style="text-align: center; margin-bottom: 15px; font-style: italic; font-size: 11px;">
              ${receiptHeader}
            </div>
          ` : ''}

          <div class="items-table">
            ${data.items.map(item => `
              <div class="item-row">
                <div class="item-name">
                  ${item.name}<br>
                  <span style="font-size: 10px; color: #666;">
                    ${item.quantity} × ${formatCurrency(item.unitPrice)}
                  </span>
                </div>
                <div class="item-details">
                  ${formatCurrency(item.totalPrice)}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            ${data.discountAmount > 0 ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(data.discountAmount)}</span>
              </div>
            ` : ''}
            ${showTax && data.taxAmount > 0 ? `
              <div class="total-row">
                <span>Tax (${taxNumber}):</span>
                <span>${formatCurrency(data.taxAmount)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(data.totalAmount)}</span>
            </div>
          </div>

          <div class="payment-info">
            <div class="detail-row">
              <span>Payment:</span>
              <span>${data.paymentMethod}</span>
            </div>
            <div class="detail-row">
              <span>Status:</span>
              <span>${data.paymentStatus}</span>
            </div>
          </div>

          ${data.notes ? `
            <div style="margin: 15px 0; padding: 10px; border: 1px solid #ddd; background: #f9f9f9;">
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">Notes:</div>
              <div style="font-size: 10px;">${data.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <div class="footer-text">${receiptFooter}</div>
            <div style="font-size: 8px; color: #666; margin-top: 10px;">
              Receipt generated on ${new Date().toLocaleString()}
            </div>
          </div>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Print Receipt
          </button>
          <button onclick="window.close()" style="margin-left: 10px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Close
          </button>
        </div>
      </body>
      </html>
    `
  }

  private getCompactReceiptHTML(data: ReceiptData): string {
    const { storeName, storePhone, receiptFooter } = this.settings

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${data.saleNumber}</title>
        <style>
          @media print {
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              margin: 0;
              padding: 10px;
              width: 48mm;
            }
            .receipt {
              max-width: 48mm;
              margin: 0 auto;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .border-dashed {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 5px 0;
            }
            .item {
              margin-bottom: 3px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center">
            <div class="bold" style="font-size: 14px;">${storeName}</div>
            <div style="font-size: 8px;">${storePhone}</div>
          </div>

          <div class="border-dashed">
            <div class="center">SALE RECEIPT</div>
          </div>

          <div>
            <div>${data.saleNumber}</div>
            <div>${formatDate(data.createdAt)} ${formatDateTime(data.createdAt)}</div>
            ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ''}
          </div>

          <div class="border-dashed">
            ${data.items.map(item => `
              <div class="item">
                <div>${item.name}</div>
                <div>${item.quantity} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}</div>
              </div>
            `).join('')}
          </div>

          <div>
            <div>Subtotal: ${formatCurrency(data.subtotal)}</div>
            ${data.discountAmount > 0 ? `<div>Discount: -${formatCurrency(data.discountAmount)}</div>` : ''}
            <div class="bold">TOTAL: ${formatCurrency(data.totalAmount)}</div>
          </div>

          <div class="border-dashed">
            <div>Payment: ${data.paymentMethod}</div>
            <div>${data.paymentStatus}</div>
          </div>

          <div class="center">
            <div style="font-size: 8px;">${receiptFooter}</div>
          </div>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
            Print
          </button>
        </div>
      </body>
      </html>
    `
  }

  printReceipt(data: ReceiptData, template: 'standard' | 'compact' = 'standard'): void {
    const receiptHTML = template === 'compact'
      ? this.getCompactReceiptHTML(data)
      : this.getStandardReceiptHTML(data)

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()

      // Wait for the content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Close the window after printing (optional)
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }, 500)
      }
    }
  }

  async openReceiptPreview(data: ReceiptData, template: 'standard' | 'compact' = 'standard'): Promise<void> {
    const receiptHTML = template === 'compact'
      ? this.getCompactReceiptHTML(data)
      : this.getStandardReceiptHTML(data)

    const previewWindow = window.open('', '_blank', 'width=500,height=700')
    if (previewWindow) {
      previewWindow.document.write(receiptHTML)
      previewWindow.document.close()
    }
  }

  generateReceiptText(data: ReceiptData): string {
    const { storeName, storeAddress, storePhone, receiptFooter } = this.settings

    let receiptText = '\n' + '='.repeat(30) + '\n'
    receiptText += `${storeName.centered(30)}\n`
    receiptText += `${storeAddress.centered(30)}\n`
    receiptText += `${storePhone.centered(30)}\n`
    receiptText += '='.repeat(30) + '\n'
    receiptText += 'SALE RECEIPT'.centered(30) + '\n'
    receiptText += '='.repeat(30) + '\n\n'

    receiptText += `Receipt #: ${data.saleNumber}\n`
    receiptText += `Date: ${formatDate(data.createdAt)}\n`
    receiptText += `Time: ${formatDateTime(data.createdAt)}\n`

    if (data.customerName) {
      receiptText += `Customer: ${data.customerName}\n`
      if (data.customerPhone) {
        receiptText += `Phone: ${data.customerPhone}\n`
      }
    }

    receiptText += '\n' + '-'.repeat(30) + '\n'

    data.items.forEach(item => {
      receiptText += `${item.name}\n`
      receiptText += `  ${item.quantity} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}\n`
    })

    receiptText += '-'.repeat(30) + '\n'
    receiptText += `Subtotal: ${formatCurrency(data.subtotal).padStart(20)}\n`

    if (data.discountAmount > 0) {
      receiptText += `Discount: -${formatCurrency(data.discountAmount).padStart(18)}\n`
    }

    receiptText += `TOTAL: ${formatCurrency(data.totalAmount).padStart(22)}\n`
    receiptText += '-'.repeat(30) + '\n'
    receiptText += `Payment: ${data.paymentMethod}\n`
    receiptText += `Status: ${data.paymentStatus}\n`
    receiptText += '='.repeat(30) + '\n'
    receiptText += receiptFooter.centered(30) + '\n'
    receiptText += '='.repeat(30) + '\n'

    return receiptText
  }
}

// Helper function for centering text
declare global {
  interface String {
    centered(width: number): string
  }
}

String.prototype.centered = function(width: number): string {
  if (this.length >= width) return this
  const padding = width - this.length
  const leftPad = Math.floor(padding / 2)
  const rightPad = padding - leftPad
  return ' '.repeat(leftPad) + this + ' '.repeat(rightPad)
}

export const receiptPrinter = new ReceiptPrinter()