import { prisma } from '../src/lib/prisma'
import fs from 'fs'
import path from 'path'

interface CSVProduct {
  category: string
  name: string
  price: number
  variations?: string[]
}

function parseCSVLine(line: string): CSVProduct | null {
  // Skip empty lines and headers
  if (!line.trim() || line.startsWith(',') || line.includes('Item,Price')) {
    return null
  }

  // Extract category (if it's a standalone line)
  const trimmedLine = line.trim()
  if (trimmedLine.endsWith(',') && !trimmedLine.includes('"')) {
    return null // Skip category lines for now
  }

  // Parse product lines
  const parts = trimmedLine.split(',')
  if (parts.length < 2) return null

  const name = parts[0]?.replace(/"/g, '').trim()
  const priceStr = parts[1]?.replace(/"/g, '').trim()

  if (!name || !priceStr) return null

  // Handle different price formats - first remove quotes
  const cleanPriceStr = priceStr.replace(/"/g, '').trim()

  // Check if it's a range like "65,000 - 25,000" or multiple prices
  if (cleanPriceStr.includes('-') || (cleanPriceStr.match(/,/g) && cleanPriceStr.match(/,/g).length > 1)) {
    // Handle ranges like "65,000 - 25,000" or multiple prices separated by commas
    const priceParts = cleanPriceStr.split(/[-–]/).map(p => p.trim())

    for (const pricePart of priceParts) {
      if (pricePart) {
        // Remove commas and convert to number
        const cleanNumber = pricePart.replace(/,/g, '')
        const numPrice = parseInt(cleanNumber)
        if (!isNaN(numPrice)) {
          prices.push(numPrice)
        }
      }
    }
  } else {
    // Single price with commas (e.g., "45,000" or "1,500,000")
    const cleanNumber = cleanPriceStr.replace(/,/g, '')
    const numPrice = parseInt(cleanNumber)
    if (!isNaN(numPrice)) {
      prices.push(numPrice)
    }
  }

  if (prices.length === 0) return null

  return {
    category: '', // Will be set by tracking the current category
    name,
    price: prices[0], // Use first price as base
    variations: prices.length > 1 ? prices.slice(1) : undefined
  }
}

async function importNewProducts() {
  try {
    console.log('🚀 Starting new product import...')

    // Read CSV file
    const csvPath = path.join(process.cwd(), 'products.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())

    console.log(`📊 Found ${lines.length} lines in CSV`)

    let currentCategory = ''
    const products: CSVProduct[] = []

    // Parse CSV
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines and headers
      if (!line || line === ',' || line.includes('Item,Price')) continue

      // Check if it's a category line (ends with , and has no quotes)
      if (line.endsWith(',') && !line.includes('"')) {
        currentCategory = line.replace(/,/g, '').trim()
        console.log(`📁 Found category: ${currentCategory}`)
        continue
      }

      // Parse product line
      const product = parseCSVLine(line)
      if (product && currentCategory) {
        product.category = currentCategory
        products.push(product)
      }
    }

    console.log(`📦 Found ${products.length} products to import`)

    // Group by category
    const categoriesMap = new Map<string, CSVProduct[]>()
    products.forEach(product => {
      if (!categoriesMap.has(product.category)) {
        categoriesMap.set(product.category, [])
      }
      categoriesMap.get(product.category)!.push(product)
    })

    console.log(`📂 Found ${categoriesMap.size} unique categories`)

    // Create categories
    const categoryMap = new Map<string, string>()
    for (const [categoryName] of categoriesMap) {
      try {
        const category = await prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: {
            name: categoryName,
            description: `${categoryName} products and equipment`
          }
        })
        categoryMap.set(categoryName, category.id)
        console.log(`✅ Created/updated category: ${categoryName}`)
      } catch (error) {
        console.error(`❌ Error creating category ${categoryName}:`, error)
      }
    }

    // Get branches
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

    // Import products
    let totalProducts = 0
    let totalVariations = 0

    for (const [categoryName, categoryProducts] of categoriesMap) {
      const categoryId = categoryMap.get(categoryName)
      if (!categoryId) {
        console.error(`❌ Category not found: ${categoryName}`)
        continue
      }

      for (const csvProduct of categoryProducts) {
        try {
          // Generate SKU from product name
          const sku = csvProduct.name
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 20)

          // Create product
          const product = await prisma.product.create({
            data: {
              sku,
              name: csvProduct.name,
              description: `${csvProduct.name} - ${categoryName}`,
              categoryId,
              isActive: true,
              variations: {
                create: [
                  {
                    name: 'Standard',
                    unitPrice: csvProduct.price,
                    costPrice: Math.round(csvProduct.price * 0.7), // 70% of selling price
                    isActive: true
                  },
                  // Add variations if available
                  ...(csvProduct.variations?.map((price, index) => ({
                    name: `Variant ${index + 1}`,
                    unitPrice: price,
                    costPrice: Math.round(price * 0.7),
                    isActive: true
                  })) || [])
                ]
              }
            },
            include: {
              variations: true
            }
          })

          console.log(`✅ Created product: ${csvProduct.name} with ${product.variations.length} variations`)
          totalProducts++
          totalVariations += product.variations.length

          // Create inventory for each branch
          for (const branch of branches) {
            for (const variation of product.variations) {
              await prisma.inventory.create({
                data: {
                  branchId: branch.id,
                  productId: product.id,
                  variationId: variation.id,
                  batchId: null, // No batch tracking for these products initially
                  quantity: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
                  minStock: 5,
                  maxStock: 100,
                  reorderPoint: 3,
                  lastUpdated: new Date()
                }
              })
            }
          }

        } catch (error) {
          console.error(`❌ Error creating product ${csvProduct.name}:`, error)
        }
      }
    }

    console.log('\n🎉 Import completed successfully!')
    console.log(`📈 Summary:`)
    console.log(`   - Products created: ${totalProducts}`)
    console.log(`   - Total variations: ${totalVariations}`)
    console.log(`   - Categories: ${categoriesMap.size}`)
    console.log(`   - Branches: ${branches.length}`)

  } catch (error) {
    console.error('❌ Error during import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importNewProducts()