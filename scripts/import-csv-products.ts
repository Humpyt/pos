import { prisma } from '../src/lib/prisma'
import fs from 'fs'
import path from 'path'

interface ProductCSVRow {
  SKU: string
  Name: string
  Description?: string
  Category: string
  Barcode?: string
  Image?: string
  Price: number
  Cost: number
  Weight?: number
  Volume?: number
  PiecesPerCarton?: number
}

interface BaseProduct {
  baseName: string
  category: string
  description?: string
  variations: ProductCSVRow[]
}

function extractBaseName(name: string): string {
  // Extract base product name by removing size information
  return name
    .replace(/\s+(500ml|1L|2L|1\.5L|330ml|250ml|600ml)$/i, '')
    .replace(/\s+(500\s*ml|1\s*L|2\s*L|1\.5\s*L|330\s*ml|250\s*ml|600\s*ml)$/i, '')
    .replace(/\s+(Family\s+size|Large|Small|Medium)$/i, '')
    .trim()
}

function extractSize(name: string): string {
  // Extract size information from product name
  const match = name.match(/\s+(500ml|1L|2L|1\.5L|330ml|250ml|600ml)$/i)
  if (match) return match[1]

  const volumeMatch = name.match(/(\d+(?:\.\d+)?)\s*L$/i)
  if (volumeMatch) return `${volumeMatch[1]}L`

  const mlMatch = name.match(/(\d+)\s*ml$/i)
  if (mlMatch) return `${mlMatch[1]}ml`

  return 'Standard'
}

function generateVariationName(row: ProductCSVRow): string {
  if (row.Volume) {
    if (row.Volume >= 1) {
      return `${row.Volume}L Bottle`
    } else {
      return `${(row.Volume * 1000)}ml Bottle`
    }
  }
  return extractSize(row.Name) || 'Standard'
}

async function importCSVProducts() {
  try {
    console.log('🚀 Starting CSV product import...')

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'products.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    const products: ProductCSVRow[] = []

    // Parse CSV
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      if (values.length === headers.length) {
        const product: any = {}
        headers.forEach((header, index) => {
          let value = values[index]
          if (['Price', 'Cost', 'Weight', 'Volume', 'PiecesPerCarton'].includes(header)) {
            value = parseFloat(value) || 0
          }
          product[header] = value === '' ? undefined : value
        })
        products.push(product as ProductCSVRow)
      }
    }

    console.log(`📊 Found ${products.length} products in CSV`)

    // Group products by base name
    const baseProductsMap = new Map<string, BaseProduct>()

    products.forEach(product => {
      const baseName = extractBaseName(product.Name)

      if (!baseProductsMap.has(baseName)) {
        baseProductsMap.set(baseName, {
          baseName,
          category: product.Category,
          description: product.Description,
          variations: []
        })
      }

      baseProductsMap.get(baseName)!.variations.push(product)
    })

    console.log(`📦 Found ${baseProductsMap.size} base products with variations`)

    // Create categories
    const categories = Array.from(new Set(products.map(p => p.Category)))
    const categoryMap = new Map<string, string>()

    for (const categoryName of categories) {
      try {
        const category = await prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: {
            name: categoryName,
            description: `${categoryName} products`
          }
        })
        categoryMap.set(categoryName, category.id)
        console.log(`✅ Created/updated category: ${categoryName}`)
      } catch (error) {
        console.error(`❌ Error creating category ${categoryName}:`, error)
      }
    }

    // Create branches if they don't exist
    const branches = await prisma.branch.findMany({
      where: { isActive: true }
    })

    if (branches.length === 0) {
      console.log('🏢 Creating default branches...')
      const defaultBranches = [
        { name: 'Main Store', address: 'Main Location', isActive: true },
        { name: 'Branch 2', address: 'Secondary Location', isActive: true },
        { name: 'Branch 3', address: 'Third Location', isActive: true }
      ]

      for (const branchData of defaultBranches) {
        await prisma.branch.create({ data: branchData })
      }

      const newBranches = await prisma.branch.findMany({
        where: { isActive: true }
      })
      branches.push(...newBranches)
    }

    console.log(`🏪 Using ${branches.length} branches`)

    // Create products with variations
    let totalProducts = 0
    let totalVariations = 0

    for (const [baseName, baseProduct] of baseProductsMap) {
      try {
        const categoryId = categoryMap.get(baseProduct.category)
        if (!categoryId) {
          throw new Error(`Category not found: ${baseProduct.category}`)
        }

        // Use the first variation's SKU for the main product or create a base SKU
        const mainSKU = baseProduct.variations[0].SKU

        // Create the main product
        const product = await prisma.product.create({
          data: {
            sku: mainSKU,
            name: baseName,
            description: baseProduct.description || `${baseName} - ${baseProduct.category}`,
            categoryId,
            barcode: baseProduct.variations[0].Barcode,
            image: baseProduct.variations[0].Image,
            isActive: true,
            variations: {
              create: baseProduct.variations.map(variation => ({
                name: generateVariationName(variation),
                unitPrice: variation.Price,
                costPrice: variation.Cost,
                weight: variation.Weight,
                volume: variation.Volume,
                piecesPerCarton: variation.PiecesPerCarton,
                isActive: true
              }))
            }
          },
          include: {
            variations: true
          }
        })

        console.log(`✅ Created product: ${baseName} with ${baseProduct.variations.length} variations`)
        totalProducts++
        totalVariations += baseProduct.variations.length

        // Create inventory records for each branch
        for (const branch of branches) {
          for (const variation of product.variations) {
            await prisma.inventory.upsert({
              where: {
                productId_branchId_variationId_batchId: {
                  productId: product.id,
                  branchId: branch.id,
                  variationId: variation.id,
                  batchId: null
                }
              },
              update: {},
              create: {
                productId: product.id,
                branchId: branch.id,
                variationId: variation.id,
                batchId: null,
                quantity: Math.floor(Math.random() * 50) + 10, // Random initial stock between 10-60
                minStock: 10,
                reorderPoint: 5,
                lastUpdated: new Date()
              }
            })
          }
        }

      } catch (error) {
        console.error(`❌ Error creating product ${baseName}:`, error)
      }
    }

    console.log('\n🎉 Import completed successfully!')
    console.log(`📈 Summary:`)
    console.log(`   - Base products created: ${totalProducts}`)
    console.log(`   - Total variations: ${totalVariations}`)
    console.log(`   - Categories: ${categories.length}`)
    console.log(`   - Branches: ${branches.length}`)

  } catch (error) {
    console.error('❌ Error during import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importCSVProducts()