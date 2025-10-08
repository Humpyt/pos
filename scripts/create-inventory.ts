import { prisma } from '../src/lib/prisma'

async function createInventory() {
  try {
    console.log('📦 Creating inventory records...')

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

    let inventoryCount = 0

    // Create inventory for each product variation and branch
    for (const product of products) {
      for (const variation of product.variations) {
        for (const branch of branches) {
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
                reorderPoint: 5,
                lastUpdated: new Date()
              }
            })
            inventoryCount++
          } catch (error) {
            console.error(`❌ Error creating inventory for ${product.name} - ${variation.name}:`, error)
          }
        }
      }
    }

    console.log(`✅ Created ${inventoryCount} inventory records`)

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

  } catch (error) {
    console.error('❌ Error creating inventory:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createInventory()