import { prisma } from './prisma'
import { parseCSV } from './utils'
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

export class ProductImportService {
  static async importFromCSV(filePath: string) {
    try {
      console.log('Starting product import from CSV...')

      // Read and parse CSV file
      const csvContent = fs.readFileSync(filePath, 'utf-8')
      const products = parseCSV<ProductCSVRow>(csvContent)

      console.log(`Found ${products.length} products to import`)

      const results = {
        success: 0,
        errors: 0,
        errorMessages: [] as string[]
      }

      // Group products by category
      const productsByCategory = products.reduce((acc, product) => {
        if (!acc[product.Category]) {
          acc[product.Category] = []
        }
        acc[product.Category].push(product)
        return acc
      }, {} as Record<string, ProductCSVRow[]>)

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
          const categoryId = categoryMap.get(productRow.Category)
          if (!categoryId) {
            throw new Error(`Category not found: ${productRow.Category}`)
          }

          // Create product with variation
          const product = await prisma.product.create({
            data: {
              sku: String(productRow.SKU),
              name: String(productRow.Name),
              description: productRow.Description || `${productRow.Name} - ${productRow.Category}`,
              categoryId,
              barcode: productRow.Barcode ? String(productRow.Barcode) : null,
              image: productRow.Image,
              variations: {
                create: {
                  name: this.generateVariationName(productRow),
                  unitPrice: productRow.Price,
                  costPrice: productRow.Cost,
                  weight: productRow.Weight,
                  volume: productRow.Volume,
                  piecesPerCarton: productRow.PiecesPerCarton,
                }
              }
            },
            include: {
              variations: true
            }
          })

          console.log(`Created product: ${productRow.Name}`)
          results.success++

        } catch (error) {
          console.error(`Error importing product ${productRow.Name}:`, error)
          results.errors++
          results.errorMessages.push(`Failed to import product: ${productRow.Name} - ${error}`)
        }
      }

      console.log(`Import completed. Success: ${results.success}, Errors: ${results.errors}`)
      return results

    } catch (error) {
      console.error('Error during CSV import:', error)
      throw new Error(`Failed to import products: ${error}`)
    }
  }

  static generateVariationName(productRow: ProductCSVRow): string {
    if (productRow.Volume && productRow.Volume >= 1) {
      return `${productRow.Volume}L Bottle`
    } else if (productRow.Volume && productRow.Volume < 1) {
      return `${(productRow.Volume * 1000)}ml Bottle`
    } else if (productRow.Weight && productRow.Weight >= 1) {
      return `${productRow.Weight}kg Package`
    } else if (productRow.Weight && productRow.Weight < 1) {
      return `${(productRow.Weight * 1000)}g Package`
    } else {
      return 'Standard Package'
    }
  }

  static async validateCSV(filePath: string) {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8')
      const products = parseCSV<ProductCSVRow>(csvContent)

      const validationResults = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        totalRows: products.length
      }

      // Check required fields
      const requiredFields = ['SKU', 'Name', 'Category', 'Price', 'Cost']

      products.forEach((product, index) => {
        const rowNumber = index + 2 // CSV rows are 1-based, plus header

        // Check required fields
        requiredFields.forEach(field => {
          if (!product[field as keyof ProductCSVRow]) {
            validationResults.isValid = false
            validationResults.errors.push(`Row ${rowNumber}: Missing required field '${field}'`)
          }
        })

        // Check for valid prices
        if (product.Price && (product.Price <= 0 || isNaN(product.Price))) {
          validationResults.isValid = false
          validationResults.errors.push(`Row ${rowNumber}: Invalid price value`)
        }

        if (product.Cost && (product.Cost <= 0 || isNaN(product.Cost))) {
          validationResults.isValid = false
          validationResults.errors.push(`Row ${rowNumber}: Invalid cost value`)
        }

        // Check for negative cost
        if (product.Cost && product.Price && product.Cost > product.Price) {
          validationResults.warnings.push(`Row ${rowNumber}: Cost price (${product.Cost}) is higher than selling price (${product.Price})`)
        }

        // Check for duplicate SKUs
        const duplicateSku = products.filter((p, i) => p.SKU === product.SKU && i !== index)
        if (duplicateSku.length > 0) {
          validationResults.isValid = false
          validationResults.errors.push(`Row ${rowNumber}: Duplicate SKU '${product.SKU}'`)
        }
      })

      return validationResults

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to read or parse CSV file: ${error}`],
        warnings: [],
        totalRows: 0
      }
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

  static async initializeDatabase() {
    try {
      console.log('Initializing database...')

      // Create initial branches
      const branches = await this.createInitialBranches()

      // Create default user
      const user = await this.createDefaultUser()

      // Import products from CSV
      const csvPath = path.join(process.cwd(), 'products.csv')
      if (fs.existsSync(csvPath)) {
        const importResult = await this.importFromCSV(csvPath)
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
    }
  }
}

// CLI utility for manual imports
export async function importProductsCLI() {
  try {
    const result = await ProductImportService.initializeDatabase()
    console.log('Import Results:', result)
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}