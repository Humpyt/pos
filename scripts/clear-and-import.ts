import { prisma } from '../src/lib/prisma'
import { ProductImportService } from '../src/lib/import'

async function clearAndImport() {
  try {
    console.log('🧹 Clearing existing data...')

    // Delete in order of dependencies
    await prisma.inventory.deleteMany({})
    await prisma.productBatch.deleteMany({})
    await prisma.productVariation.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.category.deleteMany({})

    console.log('✅ Cleared existing data')

    console.log('📦 Importing products from CSV...')
    const result = await ProductImportService.importFromCSV('./products.csv')

    console.log(`✅ Import completed!`)
    console.log(`   - Success: ${result.success}`)
    console.log(`   - Errors: ${result.errors}`)

    if (result.errorMessages.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      result.errorMessages.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`)
      })
      if (result.errorMessages.length > 5) {
        console.log(`   ... and ${result.errorMessages.length - 5} more`)
      }
    }

  } catch (error) {
    console.error('❌ Error during clear and import:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAndImport()