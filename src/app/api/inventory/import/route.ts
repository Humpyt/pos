import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const branchId = formData.get('branchId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let data: any[] = []

    // Parse file based on extension
    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8')
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

      data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    } else if (file.name.endsWith('.json')) {
      const text = buffer.toString('utf-8')
      data = JSON.parse(text)
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format' },
        { status: 400 }
      )
    }

    let importedCount = 0
    const errors: string[] = []

    // Process each row
    for (const [index, row] of data.entries()) {
      try {
        // Extract product information
        const productName = row['Product Name'] || row['productName'] || row['name']
        const sku = row['SKU'] || row['sku'] || ''
        const category = row['Category'] || row['category'] || 'Uncategorized'
        const variationName = row['Variation'] || row['variation'] || 'Default'
        const unitPrice = parseFloat(row['Unit Price'] || row['unitPrice'] || row['price'] || '0')
        const quantity = parseInt(row['Quantity'] || row['quantity'] || '0')
        const minStock = parseInt(row['Min Stock'] || row['minStock'] || '0')
        const maxStock = parseInt(row['Max Stock'] || row['maxStock'] || '1000')
        const batchNumber = row['Batch Number'] || row['batchNumber'] || null

        if (!productName) {
          errors.push(`Row ${index + 1}: Product name is required`)
          continue
        }

        // Find or create product
        let product = await prisma.product.findFirst({
          where: { sku: sku || `AUTO-${Date.now()}-${index}` }
        })

        if (!product) {
          product = await prisma.product.create({
            data: {
              name: productName,
              sku: sku || `AUTO-${Date.now()}-${index}`,
              category: category,
              barcode: '',
              description: '',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }

        // Find or create variation
        let variation = await prisma.productVariation.findFirst({
          where: {
            productId: product.id,
            name: variationName
          }
        })

        if (!variation) {
          variation = await prisma.productVariation.create({
            data: {
              productId: product.id,
              name: variationName,
              unitPrice: unitPrice,
              sellingPrice: unitPrice,
              sku: `${product.sku}-${variationName.toLowerCase().replace(/\s+/g, '-')}`,
              barcode: '',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }

        // Find batch if provided
        let batch = null
        if (batchNumber) {
          batch = await prisma.batch.findFirst({
            where: { batchNumber: batchNumber }
          })

          if (!batch) {
            batch = await prisma.batch.create({
              data: {
                batchNumber: batchNumber,
                productId: product.id,
                manufactureDate: new Date(),
                expiryDate: null,
                initialQuantity: quantity,
                currentQuantity: quantity,
                cost: unitPrice,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          }
        }

        // Get branch
        const targetBranchId = branchId && branchId !== 'all' ? branchId : (await prisma.branch.findFirst())?.id

        if (!targetBranchId) {
          errors.push(`Row ${index + 1}: No branch found`)
          continue
        }

        // Create or update inventory
        const existingInventory = await prisma.inventory.findFirst({
          where: {
            productId: product.id,
            variationId: variation.id,
            branchId: targetBranchId,
            batchId: batch?.id
          }
        })

        if (existingInventory) {
          await prisma.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: quantity,
              minStock: minStock,
              maxStock: maxStock,
              lastUpdated: new Date()
            }
          })
        } else {
          await prisma.inventory.create({
            data: {
              productId: product.id,
              variationId: variation.id,
              branchId: targetBranchId,
              batchId: batch?.id,
              quantity: quantity,
              minStock: minStock,
              maxStock: maxStock,
              lastUpdated: new Date()
            }
          })
        }

        importedCount++
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error)
        errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      totalRows: data.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import inventory' },
      { status: 500 }
    )
  }
}