import { prisma } from '../src/lib/prisma'
import fs from 'fs'
import path from 'path'

interface ProductData {
  name: string
  price: string
  category: string
}

export class CustomProductImportService {
  static async importFromCustomCSV(filePath: string) {
    try {
      console.log('Starting product import from custom CSV format...')

      // Read and parse CSV file
      const csvContent = fs.readFileSync(filePath, 'utf-8')
      const products = this.parseCustomCSV(csvContent)

      console.log(`Found ${products.length} products to import`)

      const results = {
        success: 0,
        errors: 0,
        errorMessages: [] as string[]
      }

      // Group products by category
      const productsByCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = []
        }
        acc[product.category].push(product)
        return acc
      }, {} as Record<string, ProductData[]>)

      // Create categories first
      const categoryMap = new Map<string, string>()
      for (const categoryName of Object.keys(productsByCategory)) {
        try {
          const category = await prisma.category.upsert({
            where: { name: categoryName },
            update: {},
            create: {
              name: categoryName,
              description: `${categoryName} products imported from CSV`
            }
          })
          categoryMap.set(categoryName, category.id)
          console.log(`Created/updated category: ${categoryName}`)
        } catch (error) {
          console.error(`Error creating category ${categoryName}:`, error)
          results.errors++
          results.errorMessages.push(`Failed to create category: ${categoryName}`)
        }
      }

      // Import products
      for (const productRow of products) {
        try {
          const categoryId = categoryMap.get(productRow.category)
          if (!categoryId) {
            throw new Error(`Category not found: ${productRow.category}`)
          }

          // Parse price - handle multiple prices by taking the first one
          const priceStr = productRow.price.split(',')[0].trim()
          const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''))

          if (isNaN(price) || price <= 0) {
            throw new Error(`Invalid price: ${productRow.price}`)
          }

          // Generate SKU
          const sku = this.generateSKU(productRow.category, productRow.name)

          // Create product with variation
          const product = await prisma.product.create({
            data: {
              sku,
              name: productRow.name,
              description: `${productRow.name} - ${productRow.category}`,
              categoryId,
              barcode: null,
              image: null,
              variations: {
                create: {
                  name: 'Standard Unit',
                  unitPrice: price,
                  costPrice: price * 0.7, // Assume 30% margin
                  weight: null,
                  volume: null,
                  piecesPerCarton: null,
                }
              }
            },
            include: {
              variations: true
            }
          })

          console.log(`Created product: ${productRow.name} - KES ${price}`)
          results.success++

        } catch (error) {
          console.error(`Error importing product ${productRow.name}:`, error)
          results.errors++
          results.errorMessages.push(`Failed to import product: ${productRow.name} - ${error}`)
        }
      }

      console.log(`Import completed. Success: ${results.success}, Errors: ${results.errors}`)
      return results

    } catch (error) {
      console.error('Error during CSV import:', error)
      throw new Error(`Failed to import products: ${error}`)
    }
  }

  static parseCustomCSV(csvText: string): ProductData[] {
    const lines = csvText.split('\n').filter(line => line.trim())
    const products: ProductData[] = []
    let currentCategory = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Skip empty lines and headers
      if (!line || line === 'Item,Price' || line === '""' || line === ',') {
        continue
      }

      // Check if this line is a category (ends with comma and no quotes)
      if (line.endsWith(',') && !line.includes('"')) {
        currentCategory = line.replace(/,$/, '').trim()
        // Skip the next empty line if it exists
        if (i + 1 < lines.length && !lines[i + 1].trim()) {
          i++
        }
        continue
      }

      // Check if this line is a product line (should have quoted price)
      if (line.includes(',"') && currentCategory) {
        const match = line.match(/^([^,]+),\s*"([^"]*)"$/)
        if (match) {
          const name = match[1].trim()
          const price = match[2].trim()

          if (name && price) {
            products.push({
              name,
              price,
              category: currentCategory
            })
          }
        }
      }
    }
    return products
  }

  static generateSKU(category: string, productName: string): string {
    const categoryCode = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
    const productCode = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()
    const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase()
    return `${categoryCode}-${productCode}-${timestamp}`
  }

  static async createInventoryForProducts() {
    try {
      const branches = await prisma.branch.findMany()
      const products = await prisma.product.findMany({
        include: { variations: true }
      })

      let inventoryCreated = 0

      for (const branch of branches) {
        for (const product of products) {
          for (const variation of product.variations) {
            try {
              await prisma.inventory.upsert({
                where: {
                  branchId_productId_variationId_batchId: {
                    branchId: branch.id,
                    productId: product.id,
                    variationId: variation.id,
                    batchId: null
                  }
                },
                update: {},
                create: {
                  branchId: branch.id,
                  productId: product.id,
                  variationId: variation.id,
                  batchId: null,
                  quantity: Math.floor(Math.random() * 100) + 10, // Random stock between 10-110
                  minStock: 10,
                  maxStock: 200,
                  reorderPoint: 20
                }
              })
              inventoryCreated++
            } catch (error) {
              console.error(`Error creating inventory for ${product.name}:`, error)
            }
          }
        }
      }

      console.log(`Created ${inventoryCreated} inventory records`)
      return inventoryCreated

    } catch (error) {
      console.error('Error creating inventory:', error)
      throw error
    }
  }

  static async initializeDatabaseWithCustomCSV() {
    try {
      console.log('Initializing database with custom CSV format...')

      // Check if database is accessible
      console.log('📊 Checking database connection...')
      await prisma.$connect()
      console.log('✅ Database connection successful')

      // Create initial branches
      const branches = await this.createInitialBranches()

      // Create default user
      const user = await this.createDefaultUser()

      // Import products from CSV
      const csvPath = path.join(process.cwd(), 'products.csv')
      if (fs.existsSync(csvPath)) {
        const importResult = await this.importFromCustomCSV(csvPath)

        // Create inventory for products
        await this.createInventoryForProducts()

        console.log('Database initialization completed successfully!')

        return {
          success: true,
          branches: branches.length,
          user: user.email,
          products: importResult
        }
      } else {
        console.log('Products CSV file not found. Skipping product import.')
        return {
          success: true,
          branches: branches.length,
          user: user.email,
          products: { success: 0, errors: 0, errorMessages: [] }
        }
      }

    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  static async createInitialBranches() {
    const branches = [
      {
        name: 'Main Branch - Nairobi',
        address: 'Moi Avenue, Nairobi CBD',
        phone: '+254712345678',
        email: 'nairobi@pos-store.com'
      },
      {
        name: 'Branch 2 - Mombasa',
        address: 'Digo Road, Mombasa',
        phone: '+254712345679',
        email: 'mombasa@pos-store.com'
      },
      {
        name: 'Branch 3 - Kisumu',
        address: 'Oginga Odinga Street, Kisumu',
        phone: '+254712345680',
        email: 'kisumu@pos-store.com'
      }
    ]

    const createdBranches = []
    for (const branchData of branches) {
      try {
        const branch = await prisma.branch.create({
          data: branchData
        })
        createdBranches.push(branch)
        console.log(`Created branch: ${branch.name}`)
      } catch (error) {
        console.error(`Error creating branch ${branchData.name}:`, error)
      }
    }

    return createdBranches
  }

  static async createDefaultUser() {
    try {
      const defaultUser = await prisma.user.upsert({
        where: { email: 'admin@pos-store.com' },
        update: {},
        create: {
          email: 'admin@pos-store.com',
          name: 'System Administrator',
          password: 'admin123', // In production, this should be hashed
          role: 'ADMIN'
        }
      })
      console.log(`Created default user: ${defaultUser.email}`)
      return defaultUser
    } catch (error) {
      console.error('Error creating default user:', error)
      throw error
    }
  }
}