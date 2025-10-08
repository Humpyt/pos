import { prisma } from '../src/lib/prisma'

async function createSimpleInventory() {
  try {
    console.log('📦 Creating simple inventory records...')

    // Get all active products and branches
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variations: {
          where: { isActive: true }
        }
      }
    })

    const branches = await prisma.branch.findMany({
      where: { isActive: true }
    })

    console.log(`Found ${products.length} products and ${branches.length} branches`)

    // Create a generic batch for each product
    for (const product of products) {
      const mainVariation = product.variations[0] // Use first variation's cost price
      const batch = await prisma.productBatch.create({
        data: {
          productId: product.id,
          batchNumber: `DEFAULT-${product.sku}`,
          quantity: 9999, // Large number
          costPrice: mainVariation?.costPrice || 0,
          manufactureDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          supplier: 'Default Supplier'
        }
      })

      // Create inventory for each variation and branch
      for (const variation of product.variations) {
        for (const branch of branches) {
          await prisma.inventory.create({
            data: {
              branchId: branch.id,
              productId: product.id,
              variationId: variation.id,
              batchId: batch.id,
              quantity: Math.floor(Math.random() * 100) + 10, // Random stock between 10-110
              minStock: 10,
              reorderPoint: 5,
              lastUpdated: new Date()
            }
          })
        }
      }
    }

    // Create a default user if none exists
    const existingUsers = await prisma.user.findMany()
    if (existingUsers.length === 0) {
      const mainBranch = branches[0]
      await prisma.user.create({
        data: {
          email: 'admin@pos-store.com',
          name: 'Admin User',
          role: 'ADMIN',
          password: 'admin123', // In production, this should be hashed
          branchId: mainBranch.id,
          isActive: true
        }
      })
      console.log('✅ Created default admin user')
    }

    console.log('✅ Simple inventory created successfully!')

  } catch (error) {
    console.error('❌ Error creating inventory:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSimpleInventory()