import { prisma } from '../src/lib/prisma'

async function clearAllProducts() {
  try {
    console.log('🧹 Clearing all product-related data...')

    // Delete in order of dependencies to avoid foreign key constraints
    const deleteOrder = [
      { name: 'Inventory records', model: prisma.inventory },
      { name: 'Product batches', model: prisma.productBatch },
      { name: 'Product variations', model: prisma.productVariation },
      { name: 'Products', model: prisma.product },
      { name: 'Categories', model: prisma.category }
    ]

    let totalDeleted = 0

    for (const { name, model } of deleteOrder) {
      try {
        const result = await model.deleteMany({})
        console.log(`✅ Deleted ${result.count} ${name.toLowerCase()}`)
        totalDeleted += result.count
      } catch (error) {
        console.error(`❌ Error deleting ${name.toLowerCase()}:`, error)
      }
    }

    console.log(`🎉 Total records deleted: ${totalDeleted}`)

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllProducts()